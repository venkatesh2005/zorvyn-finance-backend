const express = require("express");
const { body, query } = require("express-validator");
const {
  getAllRecords,
  getRecordById,
  createRecord,
  updateRecord,
  deleteRecord,
} = require("../controllers/record.controller");
const { protect, authorize } = require("../middleware/auth.middleware");
const { validate } = require("../middleware/error.middleware");
const { CATEGORIES, TYPES } = require("../models/record.model");
const { ALLOWED_RECORD_SORT_KEYS } = require("../utils/queryHelpers");

const router = express.Router();

// All record routes require authentication
router.use(protect);

// GET /api/records - all roles
router.get(
  "/",
  [
    query("type").optional().isIn(TYPES).withMessage(`Type must be one of: ${TYPES.join(", ")}`),
    query("category").optional().isIn(CATEGORIES).withMessage(`Category must be one of: ${CATEGORIES.join(", ")}`),
    query("startDate").optional().isISO8601().withMessage("startDate must be a valid date (ISO 8601)."),
    query("endDate").optional().isISO8601().withMessage("endDate must be a valid date (ISO 8601)."),
    query("minAmount").optional().isFloat({ min: 0 }).withMessage("minAmount must be a positive number."),
    query("maxAmount").optional().isFloat({ min: 0 }).withMessage("maxAmount must be a positive number."),
    query("page").optional().isInt({ min: 1 }).withMessage("Page must be >= 1."),
    query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("Limit must be between 1 and 100."),
    query("search")
      .optional()
      .trim()
      .isLength({ min: 1, max: 200 })
      .withMessage("search must be 1–200 characters."),
    query("sort")
      .optional()
      .isIn(ALLOWED_RECORD_SORT_KEYS)
      .withMessage(`sort must be one of: ${ALLOWED_RECORD_SORT_KEYS.join(", ")}`),
  ],
  validate,
  getAllRecords
);

// GET /api/records/:id - all roles
router.get("/:id", getRecordById);

// POST /api/records - admin & analyst only
router.post(
  "/",
  authorize("admin", "analyst"),
  [
    body("amount")
      .notEmpty().withMessage("Amount is required.")
      .isFloat({ min: 0.01 }).withMessage("Amount must be greater than 0."),
    body("type")
      .notEmpty().withMessage("Type is required.")
      .isIn(TYPES).withMessage(`Type must be one of: ${TYPES.join(", ")}`),
    body("category")
      .notEmpty().withMessage("Category is required.")
      .isIn(CATEGORIES).withMessage(`Category must be one of: ${CATEGORIES.join(", ")}`),
    body("date")
      .optional()
      .isISO8601().withMessage("Date must be a valid ISO 8601 date."),
    body("description")
      .optional()
      .isLength({ max: 500 }).withMessage("Description cannot exceed 500 characters."),
  ],
  validate,
  createRecord
);

// PUT /api/records/:id - admin only
router.put(
  "/:id",
  authorize("admin"),
  [
    body("amount")
      .optional()
      .isFloat({ min: 0.01 }).withMessage("Amount must be greater than 0."),
    body("type")
      .optional()
      .isIn(TYPES).withMessage(`Type must be one of: ${TYPES.join(", ")}`),
    body("category")
      .optional()
      .isIn(CATEGORIES).withMessage(`Category must be one of: ${CATEGORIES.join(", ")}`),
    body("date")
      .optional()
      .isISO8601().withMessage("Date must be a valid ISO 8601 date."),
    body("description")
      .optional()
      .isLength({ max: 500 }).withMessage("Description cannot exceed 500 characters."),
  ],
  validate,
  updateRecord
);

// DELETE /api/records/:id - admin only
router.delete("/:id", authorize("admin"), deleteRecord);

module.exports = router;
