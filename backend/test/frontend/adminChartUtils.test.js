const { expect } = require("chai");
const AdminChartUtils = require("../../../frontend/js/admin-chart-utils");

describe("AdminChartUtils", () => {
  it("buildTrendSeries maps labels and values", () => {
    const input = [
      { date: "2026-02-01", total: 2 },
      { date: "2026-02-02", total: 4 }
    ];
    const result = AdminChartUtils.buildTrendSeries(input);
    expect(result.labels).to.deep.equal(["2026-02-01", "2026-02-02"]);
    expect(result.values).to.deep.equal([2, 4]);
  });

  it("buildRatingBuckets maps buckets into 6 ranges", () => {
    const input = [
      { _id: 0, total: 1 },
      { _id: 3, total: 2 },
      { _id: 5, total: 4 }
    ];
    const result = AdminChartUtils.buildRatingBuckets(input);
    expect(result.labels).to.deep.equal(["0-1", "1-2", "2-3", "3-4", "4-5", "5+"]);
    expect(result.values).to.deep.equal([1, 0, 0, 2, 0, 4]);
  });

  it("buildRoleBreakdown maps role labels and totals", () => {
    const input = [
      { role: "admin", total: 1 },
      { role: "user", total: 3 }
    ];
    const result = AdminChartUtils.buildRoleBreakdown(input);
    expect(result.labels).to.deep.equal(["admin", "user"]);
    expect(result.values).to.deep.equal([1, 3]);
  });
});
