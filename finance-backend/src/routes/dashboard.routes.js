const express = require("express");
const { query } = require("express-validator");
const { getSummary, getTrends, getCategoryStats } = require("../controllers/dashboard.controller");
const { protect, authorize } = require("../middleware/auth.middleware");
const { validate } = require("../middleware/error.middleware");

const router = express.Router();

router.use(protect);

// GET /api/dashboard/summary - all roles
router.get(
  "/summary",
  [
    query("startDate").optional().isISO8601().withMessage("startDate must be a valid ISO 8601 date."),
    query("endDate").optional().isISO8601().withMessage("endDate must be a valid ISO 8601 date."),
  ],
  validate,
  getSummary
);

// GET /api/dashboard/trends - analyst & admin
router.get(
  "/trends",
  authorize("analyst", "admin"),
  [
    query("interval")
      .optional()
      .isIn(["month", "week"])
      .withMessage("interval must be month or week."),
    query("months")
      .optional()
      .isInt({ min: 1, max: 24 }).withMessage("months must be between 1 and 24."),
    query("weeks")
      .optional()
      .isInt({ min: 1, max: 52 }).withMessage("weeks must be between 1 and 52."),
  ],
  validate,
  getTrends
);

// GET /api/dashboard/category-stats - analyst & admin
router.get(
  "/category-stats",
  authorize("analyst", "admin"),
  [
    query("type").optional().isIn(["income", "expense"]).withMessage("type must be income or expense."),
  ],
  validate,
  getCategoryStats
);

module.exports = router;
