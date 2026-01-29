/**
 * HD Feature: Advanced Analytics Controller
 * 
 * Demonstrates advanced MongoDB aggregation pipelines,
 * complex data analysis, and real-time insights generation.
 */

const User = require("../models/User");
const Recipe = require("../models/recipe");
const Category = require("../models/Category");
const { sendError, ErrorCodes } = require("../utils/errorHandler");

/**
 * GET /api/admin/analytics/overview
 * Get comprehensive overview statistics with growth indicators
 */
async function getOverviewStats(req, res) {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeekStart = new Date(today);
    thisWeekStart.setDate(today.getDate() - 7);
    const lastWeekStart = new Date(thisWeekStart);
    lastWeekStart.setDate(thisWeekStart.getDate() - 7);
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    // Parallel execution of all queries for performance
    const [
      totalUsers,
      totalRecipes,
      totalCategories,
      activeUsers,
      usersThisWeek,
      usersLastWeek,
      recipesThisWeek,
      recipesLastWeek,
      usersThisMonth,
      usersLastMonth,
      recipesThisMonth,
      recipesLastMonth,
      newUsersToday,
      newRecipesToday
    ] = await Promise.all([
      User.countDocuments({ isDeleted: { $ne: true } }),
      Recipe.countDocuments(),
      Category.countDocuments(),
      User.countDocuments({ status: "active", isDeleted: { $ne: true } }),
      User.countDocuments({ created_date: { $gte: thisWeekStart }, isDeleted: { $ne: true } }),
      User.countDocuments({ created_date: { $gte: lastWeekStart, $lt: thisWeekStart }, isDeleted: { $ne: true } }),
      Recipe.countDocuments({ createdAt: { $gte: thisWeekStart } }),
      Recipe.countDocuments({ createdAt: { $gte: lastWeekStart, $lt: thisWeekStart } }),
      User.countDocuments({ created_date: { $gte: thisMonthStart }, isDeleted: { $ne: true } }),
      User.countDocuments({ created_date: { $gte: lastMonthStart, $lt: thisMonthStart }, isDeleted: { $ne: true } }),
      Recipe.countDocuments({ createdAt: { $gte: thisMonthStart } }),
      Recipe.countDocuments({ createdAt: { $gte: lastMonthStart, $lt: thisMonthStart } }),
      User.countDocuments({ created_date: { $gte: today }, isDeleted: { $ne: true } }),
      Recipe.countDocuments({ createdAt: { $gte: today } })
    ]);

    // Calculate growth percentages
    const calculateGrowth = (current, previous) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    const userGrowthWeek = calculateGrowth(usersThisWeek, usersLastWeek);
    const recipeGrowthWeek = calculateGrowth(recipesThisWeek, recipesLastWeek);
    const userGrowthMonth = calculateGrowth(usersThisMonth, usersLastMonth);
    const recipeGrowthMonth = calculateGrowth(recipesThisMonth, recipesLastMonth);

    return res.json({
      success: true,
      data: {
        totals: {
          users: totalUsers,
          recipes: totalRecipes,
          categories: totalCategories,
          activeUsers: activeUsers
        },
        today: {
          newUsers: newUsersToday,
          newRecipes: newRecipesToday
        },
        thisWeek: {
          newUsers: usersThisWeek,
          newRecipes: recipesThisWeek
        },
        growth: {
          usersWeekly: userGrowthWeek,
          recipesWeekly: recipeGrowthWeek,
          usersMonthly: userGrowthMonth,
          recipesMonthly: recipeGrowthMonth
        },
        timestamp: new Date()
      }
    });
  } catch (err) {
    console.error("Overview stats error:", err);
    return sendError(res, 500, ErrorCodes.SERVER_ERROR, "Failed to fetch overview statistics");
  }
}

/**
 * GET /api/admin/analytics/recipes-over-time
 * Get recipe submission trends over the past 30 days
 * Uses MongoDB aggregation pipeline with $group and $dateToString
 */
async function getRecipesOverTime(req, res) {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    // Advanced aggregation pipeline
    const recipesTrend = await Recipe.aggregate([
      // Stage 1: Filter by date range
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      // Stage 2: Group by date (day)
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
          },
          count: { $sum: 1 },
          difficulties: {
            $push: "$difficulty"
          }
        }
      },
      // Stage 3: Add difficulty breakdown
      {
        $project: {
          _id: 1,
          count: 1,
          easy: {
            $size: {
              $filter: {
                input: "$difficulties",
                cond: { $eq: ["$$this", "easy"] }
              }
            }
          },
          medium: {
            $size: {
              $filter: {
                input: "$difficulties",
                cond: { $eq: ["$$this", "medium"] }
              }
            }
          },
          hard: {
            $size: {
              $filter: {
                input: "$difficulties",
                cond: { $eq: ["$$this", "hard"] }
              }
            }
          }
        }
      },
      // Stage 4: Sort by date
      {
        $sort: { _id: 1 }
      }
    ]);

    // Fill in missing dates with zero counts
    const filledData = fillMissingDates(recipesTrend, parseInt(days));

    return res.json({
      success: true,
      data: {
        trend: filledData,
        period: `Last ${days} days`,
        totalInPeriod: filledData.reduce((sum, day) => sum + day.count, 0)
      }
    });
  } catch (err) {
    console.error("Recipes over time error:", err);
    return sendError(res, 500, ErrorCodes.SERVER_ERROR, "Failed to fetch recipe trends");
  }
}

/**
 * GET /api/admin/analytics/users-over-time
 * Get user registration trends
 */
async function getUsersOverTime(req, res) {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const usersTrend = await User.aggregate([
      {
        $match: {
          created_date: { $gte: startDate },
          isDeleted: { $ne: true }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$created_date" }
          },
          count: { $sum: 1 },
          roles: { $push: "$role" }
        }
      },
      {
        $project: {
          _id: 1,
          count: 1,
          admins: {
            $size: {
              $filter: {
                input: "$roles",
                cond: { $eq: ["$$this", "admin"] }
              }
            }
          },
          users: {
            $size: {
              $filter: {
                input: "$roles",
                cond: { $eq: ["$$this", "user"] }
              }
            }
          }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    const filledData = fillMissingDates(usersTrend, parseInt(days));

    return res.json({
      success: true,
      data: {
        trend: filledData,
        period: `Last ${days} days`,
        totalInPeriod: filledData.reduce((sum, day) => sum + day.count, 0)
      }
    });
  } catch (err) {
    console.error("Users over time error:", err);
    return sendError(res, 500, ErrorCodes.SERVER_ERROR, "Failed to fetch user trends");
  }
}

/**
 * GET /api/admin/analytics/difficulty-distribution
 * Get recipe distribution by difficulty level
 */
async function getDifficultyDistribution(req, res) {
  try {
    const distribution = await Recipe.aggregate([
      {
        $group: {
          _id: "$difficulty",
          count: { $sum: 1 },
          avgCookingTime: { $avg: "$cookingTime" },
          recipes: { $push: "$title" }
        }
      },
      {
        $project: {
          _id: 1,
          count: 1,
          avgCookingTime: { $round: ["$avgCookingTime", 0] },
          sampleRecipes: { $slice: ["$recipes", 3] }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    const total = distribution.reduce((sum, d) => sum + d.count, 0);
    const withPercentages = distribution.map(d => ({
      difficulty: d._id || "unspecified",
      count: d.count,
      percentage: Math.round((d.count / total) * 100),
      avgCookingTime: d.avgCookingTime,
      sampleRecipes: d.sampleRecipes
    }));

    return res.json({
      success: true,
      data: {
        distribution: withPercentages,
        total
      }
    });
  } catch (err) {
    console.error("Difficulty distribution error:", err);
    return sendError(res, 500, ErrorCodes.SERVER_ERROR, "Failed to fetch difficulty distribution");
  }
}

/**
 * GET /api/admin/analytics/top-contributors
 * Get users who have contributed the most recipes
 */
async function getTopContributors(req, res) {
  try {
    const { limit = 10 } = req.query;

    const topContributors = await Recipe.aggregate([
      // Stage 1: Group by user
      {
        $group: {
          _id: "$user",
          recipeCount: { $sum: 1 },
          recipes: { $push: { title: "$title", difficulty: "$difficulty" } },
          avgCookingTime: { $avg: "$cookingTime" },
          difficulties: { $push: "$difficulty" }
        }
      },
      // Stage 2: Sort by recipe count
      {
        $sort: { recipeCount: -1 }
      },
      // Stage 3: Limit results
      {
        $limit: parseInt(limit)
      },
      // Stage 4: Join with users collection
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "userInfo"
        }
      },
      // Stage 5: Unwind user info
      {
        $unwind: "$userInfo"
      },
      // Stage 6: Project final shape
      {
        $project: {
          _id: 1,
          recipeCount: 1,
          avgCookingTime: { $round: ["$avgCookingTime", 0] },
          recentRecipes: { $slice: ["$recipes", 3] },
          user: {
            name: { $concat: ["$userInfo.f_name", " ", "$userInfo.l_name"] },
            email: "$userInfo.email",
            joinedDate: "$userInfo.created_date"
          },
          difficultyBreakdown: {
            easy: {
              $size: {
                $filter: { input: "$difficulties", cond: { $eq: ["$$this", "easy"] } }
              }
            },
            medium: {
              $size: {
                $filter: { input: "$difficulties", cond: { $eq: ["$$this", "medium"] } }
              }
            },
            hard: {
              $size: {
                $filter: { input: "$difficulties", cond: { $eq: ["$$this", "hard"] } }
              }
            }
          }
        }
      }
    ]);

    // Add rank
    const withRank = topContributors.map((contributor, index) => ({
      rank: index + 1,
      ...contributor
    }));

    return res.json({
      success: true,
      data: {
        contributors: withRank,
        totalContributors: await Recipe.distinct("user").then(users => users.length)
      }
    });
  } catch (err) {
    console.error("Top contributors error:", err);
    return sendError(res, 500, ErrorCodes.SERVER_ERROR, "Failed to fetch top contributors");
  }
}

/**
 * GET /api/admin/analytics/category-insights
 * Get insights about recipe categories
 */
async function getCategoryInsights(req, res) {
  try {
    const categoryStats = await Recipe.aggregate([
      {
        $group: {
          _id: "$category",
          recipeCount: { $sum: 1 },
          avgCookingTime: { $avg: "$cookingTime" },
          difficulties: { $push: "$difficulty" }
        }
      },
      {
        $lookup: {
          from: "categories",
          localField: "_id",
          foreignField: "_id",
          as: "categoryInfo"
        }
      },
      {
        $unwind: {
          path: "$categoryInfo",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          categoryName: { $ifNull: ["$categoryInfo.name", "Uncategorized"] },
          recipeCount: 1,
          avgCookingTime: { $round: ["$avgCookingTime", 0] },
          easyCount: {
            $size: {
              $filter: { input: "$difficulties", cond: { $eq: ["$$this", "easy"] } }
            }
          },
          mediumCount: {
            $size: {
              $filter: { input: "$difficulties", cond: { $eq: ["$$this", "medium"] } }
            }
          },
          hardCount: {
            $size: {
              $filter: { input: "$difficulties", cond: { $eq: ["$$this", "hard"] } }
            }
          }
        }
      },
      {
        $sort: { recipeCount: -1 }
      }
    ]);

    return res.json({
      success: true,
      data: {
        categories: categoryStats,
        totalCategories: await Category.countDocuments()
      }
    });
  } catch (err) {
    console.error("Category insights error:", err);
    return sendError(res, 500, ErrorCodes.SERVER_ERROR, "Failed to fetch category insights");
  }
}

/**
 * GET /api/admin/analytics/cooking-time-analysis
 * Analyze cooking times across recipes
 */
async function getCookingTimeAnalysis(req, res) {
  try {
    const timeAnalysis = await Recipe.aggregate([
      {
        $match: {
          cookingTime: { $exists: true, $ne: null }
        }
      },
      {
        $bucket: {
          groupBy: "$cookingTime",
          boundaries: [0, 15, 30, 60, 120, 999],
          default: "Other",
          output: {
            count: { $sum: 1 },
            recipes: { $push: "$title" },
            avgTime: { $avg: "$cookingTime" }
          }
        }
      }
    ]);

    // Label the time ranges
    const timeRangeLabels = {
      0: "Quick (0-15 min)",
      15: "Short (15-30 min)",
      30: "Medium (30-60 min)",
      60: "Long (1-2 hours)",
      120: "Extended (2+ hours)",
      "Other": "Other"
    };

    const labeledAnalysis = timeAnalysis.map(bucket => ({
      range: timeRangeLabels[bucket._id] || bucket._id,
      count: bucket.count,
      avgTime: Math.round(bucket.avgTime),
      sampleRecipes: bucket.recipes.slice(0, 3)
    }));

    // Overall stats
    const overallStats = await Recipe.aggregate([
      {
        $match: { cookingTime: { $exists: true, $ne: null } }
      },
      {
        $group: {
          _id: null,
          avgTime: { $avg: "$cookingTime" },
          minTime: { $min: "$cookingTime" },
          maxTime: { $max: "$cookingTime" },
          totalRecipes: { $sum: 1 }
        }
      }
    ]);

    return res.json({
      success: true,
      data: {
        distribution: labeledAnalysis,
        overall: overallStats[0] ? {
          avgTime: Math.round(overallStats[0].avgTime),
          minTime: overallStats[0].minTime,
          maxTime: overallStats[0].maxTime,
          totalRecipes: overallStats[0].totalRecipes
        } : null
      }
    });
  } catch (err) {
    console.error("Cooking time analysis error:", err);
    return sendError(res, 500, ErrorCodes.SERVER_ERROR, "Failed to fetch cooking time analysis");
  }
}

/**
 * GET /api/admin/analytics/recent-activity
 * Get recent system activity (new users, recipes, etc.)
 */
async function getRecentActivity(req, res) {
  try {
    const { limit = 20 } = req.query;

    // Get recent users
    const recentUsers = await User.find({ isDeleted: { $ne: true } })
      .select("f_name l_name email role created_date")
      .sort({ created_date: -1 })
      .limit(parseInt(limit) / 2);

    // Get recent recipes
    const recentRecipes = await Recipe.find()
      .populate("user", "f_name l_name")
      .select("title difficulty cookingTime createdAt user")
      .sort({ createdAt: -1 })
      .limit(parseInt(limit) / 2);

    // Combine and format as activity feed
    const activities = [];

    recentUsers.forEach(user => {
      activities.push({
        type: "user_joined",
        icon: "fa-user-plus",
        color: "#4CAF50",
        message: `${user.f_name} ${user.l_name} joined as ${user.role}`,
        email: user.email,
        timestamp: user.created_date
      });
    });

    recentRecipes.forEach(recipe => {
      activities.push({
        type: "recipe_created",
        icon: "fa-utensils",
        color: "#2196F3",
        message: `${recipe.user?.f_name || "Someone"} added "${recipe.title}"`,
        details: `${recipe.difficulty || "easy"} • ${recipe.cookingTime || "?"} min`,
        timestamp: recipe.createdAt
      });
    });

    // Sort by timestamp
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return res.json({
      success: true,
      data: {
        activities: activities.slice(0, parseInt(limit)),
        totalActivities: activities.length
      }
    });
  } catch (err) {
    console.error("Recent activity error:", err);
    return sendError(res, 500, ErrorCodes.SERVER_ERROR, "Failed to fetch recent activity");
  }
}

/**
 * GET /api/admin/analytics/insights
 * Generate smart insights and recommendations
 */
async function getSmartInsights(req, res) {
  try {
    const insights = [];

    // Get various stats for generating insights
    const [
      totalRecipes,
      totalUsers,
      recipesThisWeek,
      usersThisWeek,
      difficultyDist,
      avgCookingTime
    ] = await Promise.all([
      Recipe.countDocuments(),
      User.countDocuments({ isDeleted: { $ne: true } }),
      Recipe.countDocuments({ createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }),
      User.countDocuments({ created_date: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }, isDeleted: { $ne: true } }),
      Recipe.aggregate([{ $group: { _id: "$difficulty", count: { $sum: 1 } } }]),
      Recipe.aggregate([{ $group: { _id: null, avg: { $avg: "$cookingTime" } } }])
    ]);

    // Generate insights based on data
    
    // Insight 1: Recipe activity
    if (recipesThisWeek > 0) {
      const dailyAvg = (recipesThisWeek / 7).toFixed(1);
      insights.push({
        type: "positive",
        icon: "fa-chart-line",
        title: "Recipe Activity",
        message: `${recipesThisWeek} new recipes this week (${dailyAvg}/day average)`,
        metric: recipesThisWeek
      });
    } else {
      insights.push({
        type: "warning",
        icon: "fa-exclamation-triangle",
        title: "Low Activity",
        message: "No new recipes this week. Consider running a recipe contest!",
        metric: 0
      });
    }

    // Insight 2: User growth
    if (usersThisWeek > 0) {
      const growthRate = ((usersThisWeek / totalUsers) * 100).toFixed(1);
      insights.push({
        type: "positive",
        icon: "fa-users",
        title: "User Growth",
        message: `${usersThisWeek} new users this week (${growthRate}% growth)`,
        metric: usersThisWeek
      });
    }

    // Insight 3: Difficulty balance
    const easyCount = difficultyDist.find(d => d._id === "easy")?.count || 0;
    const hardCount = difficultyDist.find(d => d._id === "hard")?.count || 0;
    
    if (hardCount < totalRecipes * 0.1) {
      insights.push({
        type: "info",
        icon: "fa-lightbulb",
        title: "Content Opportunity",
        message: `Only ${hardCount} hard recipes (${((hardCount/totalRecipes)*100).toFixed(0)}%). Consider adding more challenging content.`,
        metric: hardCount
      });
    }

    // Insight 4: Cooking time
    if (avgCookingTime[0]) {
      const avg = Math.round(avgCookingTime[0].avg);
      insights.push({
        type: "info",
        icon: "fa-clock",
        title: "Average Cooking Time",
        message: `Recipes take ${avg} minutes on average to prepare`,
        metric: avg
      });
    }

    // Insight 5: Engagement ratio
    const recipesPerUser = (totalRecipes / totalUsers).toFixed(1);
    insights.push({
      type: totalRecipes / totalUsers > 1 ? "positive" : "warning",
      icon: "fa-balance-scale",
      title: "Engagement Ratio",
      message: `${recipesPerUser} recipes per user on average`,
      metric: parseFloat(recipesPerUser)
    });

    // Most active day of week
    const dayOfWeekStats = await Recipe.aggregate([
      {
        $group: {
          _id: { $dayOfWeek: "$createdAt" },
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 1 }
    ]);

    if (dayOfWeekStats.length > 0) {
      const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      const mostActiveDay = days[dayOfWeekStats[0]._id - 1];
      insights.push({
        type: "info",
        icon: "fa-calendar-day",
        title: "Peak Activity Day",
        message: `${mostActiveDay} is the most active day for recipe submissions`,
        metric: dayOfWeekStats[0].count
      });
    }

    return res.json({
      success: true,
      data: {
        insights,
        generatedAt: new Date()
      }
    });
  } catch (err) {
    console.error("Smart insights error:", err);
    return sendError(res, 500, ErrorCodes.SERVER_ERROR, "Failed to generate insights");
  }
}

/**
 * Helper: Fill missing dates with zero values
 */
function fillMissingDates(data, days) {
  const result = [];
  const dataMap = new Map(data.map(d => [d._id, d]));
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    if (dataMap.has(dateStr)) {
      result.push({
        date: dateStr,
        ...dataMap.get(dateStr),
        _id: undefined
      });
    } else {
      result.push({
        date: dateStr,
        count: 0,
        easy: 0,
        medium: 0,
        hard: 0
      });
    }
  }
  
  return result;
}

module.exports = {
  getOverviewStats,
  getRecipesOverTime,
  getUsersOverTime,
  getDifficultyDistribution,
  getTopContributors,
  getCategoryInsights,
  getCookingTimeAnalysis,
  getRecentActivity,
  getSmartInsights
};
