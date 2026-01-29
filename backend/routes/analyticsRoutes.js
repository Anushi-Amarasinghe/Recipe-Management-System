/**
 * HD Feature: Analytics Routes
 * All routes require authentication and admin role
 */

const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const { adminOnly } = require("../middleware/roleMiddleware");
const {
  getOverviewStats,
  getRecipesOverTime,
  getUsersOverTime,
  getDifficultyDistribution,
  getTopContributors,
  getCategoryInsights,
  getCookingTimeAnalysis,
  getRecentActivity,
  getSmartInsights
} = require("../controllers/analyticsController");

// Apply authentication and admin check to ALL routes
router.use(authMiddleware);
router.use(adminOnly);

// Overview & Summary
router.get("/overview", getOverviewStats);
router.get("/insights", getSmartInsights);

// Time-based Trends
router.get("/recipes-over-time", getRecipesOverTime);
router.get("/users-over-time", getUsersOverTime);

// Distribution Analysis
router.get("/difficulty-distribution", getDifficultyDistribution);
router.get("/category-insights", getCategoryInsights);
router.get("/cooking-time-analysis", getCookingTimeAnalysis);

// User Analysis
router.get("/top-contributors", getTopContributors);

// Activity Feed
router.get("/recent-activity", getRecentActivity);

module.exports = router;
