const express = require("express");
const router = express.Router();
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");
const { adminOnly } = require("../middleware/roleMiddleware");
const { sendError, ErrorCodes } = require("../utils/errorHandler");

/**
 * @route   GET /api/admin/users
 * @desc    Get all users (Admin only)
 * @access  Private/Admin
 */
router.get("/users", authMiddleware, adminOnly, async (req, res) => {
  try {
    const users = await User.find()
      .select("-password") // Exclude password from response
      .sort({ created_date: -1 }); // Sort by newest first

    return res.json({
      success: true,
      count: users.length,
      users: users
    });
  } catch (err) {
    console.error("Get users error:", err);
    return sendError(res, 500, ErrorCodes.SERVER_ERROR,
      "Failed to fetch users",
      process.env.NODE_ENV === "development" ? err.message : undefined);
  }
});

/**
 * @route   GET /api/admin/users/:id
 * @desc    Get single user by ID (Admin only)
 * @access  Private/Admin
 */
router.get("/users/:id", authMiddleware, adminOnly, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");

    if (!user) {
      return sendError(res, 404, ErrorCodes.NOT_FOUND, "User not found");
    }

    return res.json({
      success: true,
      user: user
    });
  } catch (err) {
    console.error("Get user error:", err);
    if (err.name === "CastError") {
      return sendError(res, 400, ErrorCodes.VALIDATION_ERROR, "Invalid user ID");
    }
    return sendError(res, 500, ErrorCodes.SERVER_ERROR,
      "Failed to fetch user",
      process.env.NODE_ENV === "development" ? err.message : undefined);
  }
});

/**
 * @route   PUT /api/admin/users/:id/role
 * @desc    Update user role (Admin only)
 * @access  Private/Admin
 */
router.put("/users/:id/role", authMiddleware, adminOnly, async (req, res) => {
  try {
    const { role } = req.body;

    // Validate role
    if (!role || !["user", "admin"].includes(role)) {
      return sendError(res, 400, ErrorCodes.VALIDATION_ERROR,
        "Invalid role. Must be 'user' or 'admin'");
    }

    // Prevent admin from removing their own admin role
    if (req.params.id === req.userId && role === "user") {
      return sendError(res, 403, ErrorCodes.FORBIDDEN,
        "Cannot remove your own admin role");
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role: role },
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) {
      return sendError(res, 404, ErrorCodes.NOT_FOUND, "User not found");
    }

    return res.json({
      success: true,
      message: "User role updated successfully",
      user: user
    });
  } catch (err) {
    console.error("Update user role error:", err);
    if (err.name === "CastError") {
      return sendError(res, 400, ErrorCodes.VALIDATION_ERROR, "Invalid user ID");
    }
    return sendError(res, 500, ErrorCodes.SERVER_ERROR,
      "Failed to update user role",
      process.env.NODE_ENV === "development" ? err.message : undefined);
  }
});

/**
 * @route   PUT /api/admin/users/:id/status
 * @desc    Update user active status (Admin only)
 * @access  Private/Admin
 */
router.put("/users/:id/status", authMiddleware, adminOnly, async (req, res) => {
  try {
    const { active } = req.body;

    // Validate active status
    if (active !== 0 && active !== 1) {
      return sendError(res, 400, ErrorCodes.VALIDATION_ERROR,
        "Invalid status. Must be 0 (inactive) or 1 (active)");
    }

    // Prevent admin from deactivating themselves
    if (req.params.id === req.userId && active === 0) {
      return sendError(res, 403, ErrorCodes.FORBIDDEN,
        "Cannot deactivate your own account");
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { active: active },
      { new: true }
    ).select("-password");

    if (!user) {
      return sendError(res, 404, ErrorCodes.NOT_FOUND, "User not found");
    }

    return res.json({
      success: true,
      message: `User ${active === 1 ? "activated" : "deactivated"} successfully`,
      user: user
    });
  } catch (err) {
    console.error("Update user status error:", err);
    if (err.name === "CastError") {
      return sendError(res, 400, ErrorCodes.VALIDATION_ERROR, "Invalid user ID");
    }
    return sendError(res, 500, ErrorCodes.SERVER_ERROR,
      "Failed to update user status",
      process.env.NODE_ENV === "development" ? err.message : undefined);
  }
});

/**
 * @route   DELETE /api/admin/users/:id
 * @desc    Delete user (Admin only)
 * @access  Private/Admin
 */
router.delete("/users/:id", authMiddleware, adminOnly, async (req, res) => {
  try {
    // Prevent admin from deleting themselves
    if (req.params.id === req.userId) {
      return sendError(res, 403, ErrorCodes.FORBIDDEN,
        "Cannot delete your own account");
    }

    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return sendError(res, 404, ErrorCodes.NOT_FOUND, "User not found");
    }

    return res.json({
      success: true,
      message: "User deleted successfully"
    });
  } catch (err) {
    console.error("Delete user error:", err);
    if (err.name === "CastError") {
      return sendError(res, 400, ErrorCodes.VALIDATION_ERROR, "Invalid user ID");
    }
    return sendError(res, 500, ErrorCodes.SERVER_ERROR,
      "Failed to delete user",
      process.env.NODE_ENV === "development" ? err.message : undefined);
  }
});

/**
 * @route   GET /api/admin/stats
 * @desc    Get admin dashboard statistics (Admin only)
 * @access  Private/Admin
 */
router.get("/stats", authMiddleware, adminOnly, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ active: 1 });
    const adminUsers = await User.countDocuments({ role: "admin" });
    const regularUsers = await User.countDocuments({ role: "user" });

    return res.json({
      success: true,
      stats: {
        totalUsers,
        activeUsers,
        inactiveUsers: totalUsers - activeUsers,
        adminUsers,
        regularUsers
      }
    });
  } catch (err) {
    console.error("Get stats error:", err);
    return sendError(res, 500, ErrorCodes.SERVER_ERROR,
      "Failed to fetch statistics",
      process.env.NODE_ENV === "development" ? err.message : undefined);
  }
});

module.exports = router;

