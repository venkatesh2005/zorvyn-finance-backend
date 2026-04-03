const mongoose = require("mongoose");
const User = require("../models/user.model");

/**
 * GET /api/users
 * Admin only - list all users with optional filters
 */
const getAllUsers = async (req, res, next) => {
  try {
    const { role, status, page = 1, limit = 10 } = req.query;

    const filter = {};
    if (role) filter.role = role;
    if (status) filter.status = status;

    const skip = (Number(page) - 1) * Number(limit);
    const [users, total] = await Promise.all([
      User.find(filter).select("-password").skip(skip).limit(Number(limit)).sort({ createdAt: -1 }),
      User.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/users/:id
 * Admin only
 */
const getUserById = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid user ID." });
    }
    const user = await User.findById(req.params.id).select("-password");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }
    res.json({ success: true, data: { user } });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/users/:id
 * Admin only - update role or status
 */
const updateUser = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid user ID." });
    }

    const { role, status, name } = req.body;

    // Prevent admin from demoting themselves
    if (req.params.id === req.user.id && role && role !== "admin") {
      return res.status(400).json({
        success: false,
        message: "Admins cannot change their own role.",
      });
    }

    const patch = {
      ...(role !== undefined && { role }),
      ...(status !== undefined && { status }),
      ...(name !== undefined && { name }),
    };
    if (Object.keys(patch).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Provide at least one of: name, role, status.",
      });
    }

    const updated = await User.findByIdAndUpdate(req.params.id, patch, {
      new: true,
      runValidators: true,
    }).select("-password");

    if (!updated) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    res.json({ success: true, message: "User updated.", data: { user: updated } });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/users/:id
 * Admin only - soft delete
 */
const deleteUser = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid user ID." });
    }
    if (req.params.id === req.user.id) {
      return res.status(400).json({ success: false, message: "You cannot delete your own account." });
    }

    const user = await User.findByIdAndUpdate(req.params.id, { isDeleted: true }, { new: true });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    res.json({ success: true, message: "User deleted (soft)." });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAllUsers, getUserById, updateUser, deleteUser };
