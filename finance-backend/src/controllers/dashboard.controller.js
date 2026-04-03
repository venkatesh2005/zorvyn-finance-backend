const Record = require("../models/record.model");

/**
 * GET /api/dashboard/summary
 * Viewer, Analyst, Admin
 * Returns total income, expenses, net balance, category breakdown, recent records
 */
const getSummary = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);

    const matchStage = { isDeleted: false };
    if (startDate || endDate) matchStage.date = dateFilter;

    // Aggregation: totals by type
    const typeTotals = await Record.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: "$type",
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
    ]);

    const income = typeTotals.find((t) => t._id === "income") || { total: 0, count: 0 };
    const expense = typeTotals.find((t) => t._id === "expense") || { total: 0, count: 0 };

    // Aggregation: breakdown by category
    const categoryBreakdown = await Record.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: { type: "$type", category: "$category" },
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: "$_id.type",
          categories: {
            $push: {
              category: "$_id.category",
              total: "$total",
              count: "$count",
            },
          },
        },
      },
    ]);

    // Recent 5 records
    const recentRecords = await Record.find(matchStage.date ? { isDeleted: false, date: matchStage.date } : { isDeleted: false })
      .sort({ date: -1 })
      .limit(5)
      .populate("createdBy", "name email");

    res.json({
      success: true,
      data: {
        overview: {
          totalIncome: income.total,
          totalExpense: expense.total,
          netBalance: income.total - expense.total,
          incomeCount: income.count,
          expenseCount: expense.count,
        },
        categoryBreakdown,
        recentActivity: recentRecords,
      },
    });
  } catch (err) {
    next(err);
  }
};

const incomeExpenseProjection = {
  _id: 0,
  income: {
    $ifNull: [
      {
        $arrayElemAt: [
          {
            $filter: {
              input: "$entries",
              as: "e",
              cond: { $eq: ["$$e.type", "income"] },
            },
          },
          0,
        ],
      },
      { total: 0, count: 0 },
    ],
  },
  expense: {
    $ifNull: [
      {
        $arrayElemAt: [
          {
            $filter: {
              input: "$entries",
              as: "e",
              cond: { $eq: ["$$e.type", "expense"] },
            },
          },
          0,
        ],
      },
      { total: 0, count: 0 },
    ],
  },
};

/**
 * GET /api/dashboard/trends
 * Analyst, Admin
 * Monthly (default) or weekly income vs expense buckets.
 */
const getTrends = async (req, res, next) => {
  try {
    const interval = req.query.interval === "week" ? "week" : "month";

    if (interval === "week") {
      const weeks = Math.min(Number(req.query.weeks) || 12, 52);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - weeks * 7);
      startDate.setHours(0, 0, 0, 0);

      const trends = await Record.aggregate([
        {
          $match: {
            isDeleted: false,
            date: { $gte: startDate },
          },
        },
        {
          $group: {
            _id: {
              isoYear: { $isoWeekYear: "$date" },
              week: { $isoWeek: "$date" },
              type: "$type",
            },
            total: { $sum: "$amount" },
            count: { $sum: 1 },
          },
        },
        {
          $group: {
            _id: { isoYear: "$_id.isoYear", week: "$_id.week" },
            entries: {
              $push: { type: "$_id.type", total: "$total", count: "$count" },
            },
          },
        },
        {
          $project: {
            ...incomeExpenseProjection,
            isoYear: "$_id.isoYear",
            week: "$_id.week",
          },
        },
        { $sort: { isoYear: 1, week: 1 } },
      ]);

      return res.json({
        success: true,
        data: { interval: "week", weeks, trends },
      });
    }

    const months = Math.min(Number(req.query.months) || 6, 24);
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months + 1);
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);

    const trends = await Record.aggregate([
      {
        $match: {
          isDeleted: false,
          date: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$date" },
            month: { $month: "$date" },
            type: "$type",
          },
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: { year: "$_id.year", month: "$_id.month" },
          entries: {
            $push: { type: "$_id.type", total: "$total", count: "$count" },
          },
        },
      },
      {
        $project: {
          ...incomeExpenseProjection,
          year: "$_id.year",
          month: "$_id.month",
        },
      },
      { $sort: { year: 1, month: 1 } },
    ]);

    res.json({
      success: true,
      data: { interval: "month", months, trends },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/dashboard/category-stats
 * Analyst, Admin
 */
const getCategoryStats = async (req, res, next) => {
  try {
    const { type } = req.query;
    const match = { isDeleted: false };
    if (type) match.type = type;

    const stats = await Record.aggregate([
      { $match: match },
      {
        $group: {
          _id: "$category",
          total: { $sum: "$amount" },
          count: { $sum: 1 },
          avgAmount: { $avg: "$amount" },
          minAmount: { $min: "$amount" },
          maxAmount: { $max: "$amount" },
        },
      },
      { $sort: { total: -1 } },
    ]);

    res.json({ success: true, data: { stats } });
  } catch (err) {
    next(err);
  }
};

module.exports = { getSummary, getTrends, getCategoryStats };
