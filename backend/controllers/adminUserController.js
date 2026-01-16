const User = require("../models/User");
const { sendError, ErrorCodes } = require("../utils/errorHandler");

/**
 * US3-T.1: GET /api/admin/users
 * Get all users with pagination and search
 */
async function getAllUsers(req, res) {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search = "",
      role = "all",
      status = "all",
      sortBy = "created_date", 
      sortOrder = "desc"
    } = req.query;

    const query = {};

    // Search filter
    if (search) {
      query.$or = [
        { f_name: { $regex: search, $options: "i" } },
        { l_name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } }
      ];
    }

    // Role filter
    if (role !== "all") {
      query.role = role;
    }

    // Status filter
    if (status === "deleted") {
      query.isDeleted = true;
    } else if (status !== "all") {
      query.status = status;
      query.isDeleted = false;
    } else {
      query.isDeleted = false;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

    const [users, total] = await Promise.all([
      User.find(query)
        .select("-password")
        .populate("deactivatedBy", "f_name l_name")
        .populate("deletedBy", "f_name l_name")
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      User.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    console.error("Get users error:", err);
    return sendError(res, 500, ErrorCodes.SERVER_ERROR, "Failed to fetch users");
  }
}

/**
 * GET /api/admin/users/:id
 * Get single user by ID
 */
async function getUserById(req, res) {
  try {
    const user = await User.findById(req.params.id)
      .select("-password")
      .populate("deactivatedBy", "f_name l_name")
      .populate("deletedBy", "f_name l_name");

    if (!user) {
      return sendError(res, 404, ErrorCodes.NOT_FOUND, "User not found");
    }

    res.json({
      success: true,
      data: user
    });
  } catch (err) {
    console.error("Get user error:", err);
    return sendError(res, 500, ErrorCodes.SERVER_ERROR, "Failed to fetch user");
  }
}

/**
 * US3-T.2: POST /api/admin/users/:id/deactivate
 * Deactivate user (block login/access)
 */
async function deactivateUser(req, res) {
  try {
    const { reason = "" } = req.body;
    
    const user = await User.findById(req.params.id);

    if (!user) {
      return sendError(res, 404, ErrorCodes.NOT_FOUND, "User not found");
    }

    // Cannot deactivate yourself
    if (user._id.toString() === req.userId.toString()) {
      return sendError(res, 400, ErrorCodes.VALIDATION_ERROR, 
        "You cannot deactivate your own account");
    }

    // Cannot deactivate other admins
    if (user.role === "admin") {
      return sendError(res, 403, ErrorCodes.FORBIDDEN, 
        "Cannot deactivate other admin accounts");
    }

    // Already suspended
    if (user.status === "suspended") {
      return sendError(res, 400, ErrorCodes.VALIDATION_ERROR, 
        "User is already suspended");
    }

    // Update user status
    user.status = "suspended";
    user.active = 0;
    user.deactivatedAt = new Date();
    user.deactivatedBy = req.userId;
    user.deactivationReason = reason;
    await user.save();

    res.json({
      success: true,
      message: "User deactivated successfully"
    });
  } catch (err) {
    console.error("Deactivate user error:", err);
    return sendError(res, 500, ErrorCodes.SERVER_ERROR, "Failed to deactivate user");
  }
}

/**
 * POST /api/admin/users/:id/reactivate
 * Reactivate suspended user
 */
async function reactivateUser(req, res) {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return sendError(res, 404, ErrorCodes.NOT_FOUND, "User not found");
    }

    if (user.status !== "suspended") {
      return sendError(res, 400, ErrorCodes.VALIDATION_ERROR, 
        "User is not suspended");
    }

    // Reactivate user
    user.status = "active";
    user.active = 1;
    user.deactivatedAt = null;
    user.deactivatedBy = null;
    user.deactivationReason = null;
    await user.save();

    res.json({
      success: true,
      message: "User reactivated successfully"
    });
  } catch (err) {
    console.error("Reactivate user error:", err);
    return sendError(res, 500, ErrorCodes.SERVER_ERROR, "Failed to reactivate user");
  }
}

/**
 * US3-T.3: DELETE /api/admin/users/:id
 * Delete user (soft delete by default, hard delete with force=true)
 */
async function deleteUser(req, res) {
  try {
    const { force = "false" } = req.query;

    const user = await User.findById(req.params.id);

    if (!user) {
      return sendError(res, 404, ErrorCodes.NOT_FOUND, "User not found");
    }

    // Cannot delete yourself
    if (user._id.toString() === req.userId.toString()) {
      return sendError(res, 400, ErrorCodes.VALIDATION_ERROR, 
        "You cannot delete your own account");
    }

    // Cannot delete other admins
    if (user.role === "admin") {
      return sendError(res, 403, ErrorCodes.FORBIDDEN, 
        "Cannot delete other admin accounts");
    }

    if (force === "true") {
      // Hard delete
      await User.findByIdAndDelete(req.params.id);

      res.json({
        success: true,
        message: "User permanently deleted"
      });
    } else {
      // Soft delete
      user.isDeleted = true;
      user.status = "deleted";
      user.active = 0;
      user.deletedAt = new Date();
      user.deletedBy = req.userId;
      await user.save();

      res.json({
        success: true,
        message: "User deleted (soft delete)"
      });
    }
  } catch (err) {
    console.error("Delete user error:", err);
    return sendError(res, 500, ErrorCodes.SERVER_ERROR, "Failed to delete user");
  }
}

/**
 * POST /api/admin/users/:id/restore
 * Restore soft-deleted user
 */
async function restoreUser(req, res) {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return sendError(res, 404, ErrorCodes.NOT_FOUND, "User not found");
    }

    if (!user.isDeleted) {
      return sendError(res, 400, ErrorCodes.VALIDATION_ERROR, 
        "User is not deleted");
    }

    // Restore user
    user.isDeleted = false;
    user.status = "active";
    user.active = 1;
    user.deletedAt = null;
    user.deletedBy = null;
    await user.save();

    res.json({
      success: true,
      message: "User restored successfully"
    });
  } catch (err) {
    console.error("Restore user error:", err);
    return sendError(res, 500, ErrorCodes.SERVER_ERROR, "Failed to restore user");
  }
}

/**
 * POST /api/admin/users/bulk
 * Bulk user actions
 */
async function bulkUserAction(req, res) {
  try {
    const { ids, action } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return sendError(res, 400, ErrorCodes.VALIDATION_ERROR, 
        "User IDs are required");
    }

    if (!["deactivate", "reactivate", "delete"].includes(action)) {
      return sendError(res, 400, ErrorCodes.VALIDATION_ERROR, 
        "Invalid action. Use: deactivate, reactivate, or delete");
    }

    // Filter out self and other admins
    const filteredIds = [];
    for (const id of ids) {
      if (id === req.userId.toString()) continue;
      const user = await User.findById(id);
      if (user && user.role !== "admin") {
        filteredIds.push(id);
      }
    }

    if (filteredIds.length === 0) {
      return sendError(res, 400, ErrorCodes.VALIDATION_ERROR, 
        "No valid users to process (excluded self and admins)");
    }

    let updateData = {};
    
    if (action === "deactivate") {
      updateData = {
        status: "suspended",
        active: 0,
        deactivatedAt: new Date(),
        deactivatedBy: req.userId
      };
    } else if (action === "reactivate") {
      updateData = {
        status: "active",
        active: 1,
        deactivatedAt: null,
        deactivatedBy: null,
        deactivationReason: null
      };
    } else if (action === "delete") {
      updateData = {
        isDeleted: true,
        status: "deleted",
        active: 0,
        deletedAt: new Date(),
        deletedBy: req.userId
      };
    }

    await User.updateMany(
      { _id: { $in: filteredIds } },
      { $set: updateData }
    );

    res.json({
      success: true,
      message: `${filteredIds.length} users ${action}d successfully`,
      count: filteredIds.length
    });
  } catch (err) {
    console.error("Bulk user action error:", err);
    return sendError(res, 500, ErrorCodes.SERVER_ERROR, "Failed to perform bulk action");
  }
}

/**
 * GET /api/admin/users/stats
 * Get user statistics
 */
async function getUserStats(req, res) {
  try {
    const [total, active, suspended, deleted, admins, users] = await Promise.all([
      User.countDocuments({ isDeleted: false }),
      User.countDocuments({ isDeleted: false, status: "active" }),
      User.countDocuments({ isDeleted: false, status: "suspended" }),
      User.countDocuments({ isDeleted: true }),
      User.countDocuments({ isDeleted: false, role: "admin" }),
      User.countDocuments({ isDeleted: false, role: "user" })
    ]);

    // Recent registrations (last 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const recentRegistrations = await User.countDocuments({
      created_date: { $gte: weekAgo },
      isDeleted: false
    });

    res.json({
      success: true,
      data: {
        total,
        active,
        suspended,
        deleted,
        admins,
        users,
        recentRegistrations
      }
    });
  } catch (err) {
    console.error("Get user stats error:", err);
    return sendError(res, 500, ErrorCodes.SERVER_ERROR, "Failed to fetch user statistics");
  }
}

/**
 * PATCH /api/admin/users/:id/role
 * Change user role
 */
async function changeUserRole(req, res) {
  try {
    const { role } = req.body;

    if (!["user", "admin"].includes(role)) {
      return sendError(res, 400, ErrorCodes.VALIDATION_ERROR, 
        "Invalid role. Use: user or admin");
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return sendError(res, 404, ErrorCodes.NOT_FOUND, "User not found");
    }

    // Cannot change own role
    if (user._id.toString() === req.userId.toString()) {
      return sendError(res, 400, ErrorCodes.VALIDATION_ERROR, 
        "You cannot change your own role");
    }

    user.role = role;
    await user.save();

    res.json({
      success: true,
      message: `User role changed to ${role}`,
      role: user.role
    });
  } catch (err) {
    console.error("Change role error:", err);
    return sendError(res, 500, ErrorCodes.SERVER_ERROR, "Failed to change user role");
  }
}

module.exports = {
  getAllUsers,
  getUserById,
  deactivateUser,
  reactivateUser,
  deleteUser,
  restoreUser,
  bulkUserAction,
  getUserStats,
  changeUserRole
};
