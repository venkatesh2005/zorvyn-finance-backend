const express = require("express");
const { body, query } = require("express-validator");
const { getAllUsers, getUserById, updateUser, deleteUser } = require("../controllers/user.controller");
const { protect, authorize } = require("../middleware/auth.middleware");
const { validate } = require("../middleware/error.middleware");

const router = express.Router();

// All user management is admin-only
router.use(protect, authorize("admin"));

// GET /api/users
router.get(
  "/",
  [
    query("role").optional().isIn(["viewer", "analyst", "admin"]).withMessage("Invalid role filter."),
    query("status").optional().isIn(["active", "inactive"]).withMessage("Invalid status filter."),
    query("page").optional().isInt({ min: 1 }).withMessage("Page must be >= 1."),
    query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("Limit must be between 1 and 100."),
  ],
  validate,
  getAllUsers
);

// GET /api/users/:id
router.get("/:id", getUserById);

// PATCH /api/users/:id
router.patch(
  "/:id",
  [
    body("role").optional().isIn(["viewer", "analyst", "admin"]).withMessage("Role must be viewer, analyst, or admin."),
    body("status").optional().isIn(["active", "inactive"]).withMessage("Status must be active or inactive."),
    body("name").optional().trim().isLength({ min: 2 }).withMessage("Name must be at least 2 characters."),
  ],
  validate,
  updateUser
);

// DELETE /api/users/:id
router.delete("/:id", deleteUser);

module.exports = router;
