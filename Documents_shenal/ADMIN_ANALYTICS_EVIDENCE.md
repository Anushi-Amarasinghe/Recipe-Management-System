# Admin Analytics & Insights Evidence

This file points to the exact code locations that implement HD‑level analytics and dynamic insights.

## 1) Aggregation Pipelines (Backend)

- **Overview + Growth %**
  - File: `backend/routes/adminAnalytics.js`
  - Evidence: `calculateGrowth()` and `/overview` pipeline with `$group`, `$project`
  - Example:
```28:121:backend/routes/adminAnalytics.js
router.get("/overview", authMiddleware, adminOnly, async (req, res) => {
  // ...
  User.aggregate([
    { $group: { total: { $sum: 1 }, active: { $sum: { $cond: [{ $eq: ["$active", 1] }, 1, 0] } } } },
    { $project: { _id: 0 } }
  ])
  // ...
  const insights = {
    userGrowthPct: calculateGrowth(currentUsers, previousUsers),
    recipeGrowthPct: calculateGrowth(currentRecipes, previousRecipes),
    avgRating: Number(recipes.avgRating.toFixed(2))
  };
});
```

- **Time‑based trends**
  - File: `backend/routes/adminAnalytics.js`
  - Evidence: `$dateToString` in `/user-trends` and `/recipe-trends`
```127:165:backend/routes/adminAnalytics.js
User.aggregate([
  { $match: { created_date: { $gte: start, $lte: end } } },
  { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$created_date" } }, total: { $sum: 1 } } },
  { $project: { _id: 0, date: "$_id", total: 1 } },
  { $sort: { date: 1 } }
]);
```

- **Category usage with lookup**
  - File: `backend/routes/adminAnalytics.js`
  - Evidence: `$lookup`, `$unwind`
```171:195:backend/routes/adminAnalytics.js
Recipe.aggregate([
  { $group: { _id: "$category", total: { $sum: 1 } } },
  { $lookup: { from: "categories", localField: "_id", foreignField: "name", as: "category" } },
  { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } }
]);
```

- **Rating distribution buckets**
  - File: `backend/routes/adminAnalytics.js`
  - Evidence: `$bucket`
```204:216:backend/routes/adminAnalytics.js
Recipe.aggregate([
  { $bucket: { groupBy: "$rating", boundaries: [0,1,2,3,4,5,6], default: "unknown", output: { total: { $sum: 1 } } } }
]);
```

- **Tag insights**
  - File: `backend/routes/adminAnalytics.js`
  - Evidence: `$unwind`, `$group`
```221:247:backend/routes/adminAnalytics.js
Recipe.aggregate([
  { $unwind: { path: "$tags", preserveNullAndEmptyArrays: false } },
  { $group: { _id: "$tags", total: { $sum: 1 }, avgRating: { $avg: "$rating" } } }
]);
```

---

## 2) Dynamic Charts (Frontend)

- **Chart rendering + auto refresh**
  - File: `frontend/js/admin-analytics.js`
  - Evidence: `refreshAnalytics()` + Chart.js render calls
```215:247:frontend/js/admin-analytics.js
const refreshAnalytics = async () => {
  await Promise.all([
    fetchOverview(),
    fetchCategoryUsage(),
    fetchTagInsights(),
    fetchTrends(),
    fetchRatingBuckets(),
    fetchRoleBreakdown()
  ]);
};

window.initAdminAnalytics = () => {
  refreshAnalytics();
  window.adminAnalyticsInterval = setInterval(refreshAnalytics, 60000);
};
```

- **Trend/chart data mapping**
  - File: `frontend/js/admin-chart-utils.js`
  - Evidence: `buildTrendSeries`, `buildRatingBuckets`, `buildRoleBreakdown`
```1:33:frontend/js/admin-chart-utils.js
const AdminChartUtils = {
  buildTrendSeries(trends) { /* maps labels + values */ },
  buildRatingBuckets(buckets) { /* maps rating buckets */ },
  buildRoleBreakdown(roles) { /* maps role totals */ }
};
```

- **Chart canvases (layout)**
  - File: `frontend/pages/admin-analytics.html`
  - Evidence: `<canvas id="userTrendChart">`, `<canvas id="recipeTrendChart">`, etc.

