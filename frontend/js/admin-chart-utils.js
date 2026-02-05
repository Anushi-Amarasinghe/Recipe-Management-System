const AdminChartUtils = {
  buildTrendSeries(trends) {
    const safeTrends = Array.isArray(trends) ? trends : [];
    return {
      labels: safeTrends.map((t) => t.date),
      values: safeTrends.map((t) => t.total)
    };
  },

  buildRatingBuckets(buckets) {
    const bucketMap = {};
    const safeBuckets = Array.isArray(buckets) ? buckets : [];
    safeBuckets.forEach((bucket) => {
      bucketMap[bucket._id] = bucket.total;
    });
    const labels = ["0-1", "1-2", "2-3", "3-4", "4-5", "5+"];
    const values = [0, 1, 2, 3, 4, 5].map((value) => bucketMap[value] || 0);
    return { labels, values };
  },

  buildRoleBreakdown(roles) {
    const safeRoles = Array.isArray(roles) ? roles : [];
    return {
      labels: safeRoles.map((r) => r.role || "unknown"),
      values: safeRoles.map((r) => r.total || 0)
    };
  }
};

if (typeof window !== "undefined") {
  window.AdminChartUtils = AdminChartUtils;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = AdminChartUtils;
}
