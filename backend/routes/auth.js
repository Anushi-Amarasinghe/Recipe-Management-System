// routes/auth.js
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");
const { userOrAdmin, adminOnly } = require("../middleware/roleMiddleware");
const authLimiter = require("../middleware/rateLimiter");
const { validateRegister, validateLogin } = require("../middleware/validation");
const { sendError, ErrorCodes } = require("../utils/errorHandler");

const router = express.Router();

/**
 * Password Policy Validation
 */
function validatePassword(password) {
  const errors = [];

  if (password.length < 8) errors.push("Password must be at least 8 characters long");
  if (!/[A-Z]/.test(password)) errors.push("Password must contain at least one uppercase letter");
  if (!/[a-z]/.test(password)) errors.push("Password must contain at least one lowercase letter");
  if (!/[0-9]/.test(password)) errors.push("Password must contain at least one number");
  if (!/[!@#$%^&*()_+\-=[\]{};':\"\\|,.<>/?]/.test(password))
    errors.push("Password must contain at least one special character");

  return { isValid: errors.length === 0, errors };
}

/**
 * REGISTER
 */
router.post("/register", authLimiter, validateRegister, async (req, res) => {
  try {
    if (!process.env.JWT_SECRET) {
      return sendError(res, 500, ErrorCodes.SERVER_ERROR, "JWT_SECRET missing");
    }

    const { f_name, l_name, email, password, confirm_password } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return sendError(res, 400, ErrorCodes.VALIDATION_ERROR, "Email already exists");
    }

    if (password !== confirm_password) {
      return sendError(res, 400, ErrorCodes.VALIDATION_ERROR, "Passwords do not match");
    }

    const passwordCheck = validatePassword(password);
    if (!passwordCheck.isValid) {
      return sendError(res, 400, ErrorCodes.VALIDATION_ERROR, "Weak password", passwordCheck.errors);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      f_name,
      l_name,
      email: normalizedEmail,
      password: hashedPassword,
      active: 1,
      created_date: new Date()
    });

    const token = jwt.sign(
      { id: newUser._id, role: newUser.role || "user" },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.status(201).json({ message: "Registered successfully", token });

  } catch (err) {
    console.error("Register error:", err);
    return sendError(res, 500, ErrorCodes.SERVER_ERROR, "Server error");
  }
});

/**
 * LOGIN
 */
router.post("/login", authLimiter, validateLogin, async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return sendError(res, 401, ErrorCodes.AUTH_ERROR, "Invalid email or password");
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return sendError(res, 401, ErrorCodes.AUTH_ERROR, "Invalid email or password");
    }

    if (user.active !== 1) {
      return sendError(res, 403, ErrorCodes.FORBIDDEN, "Account inactive");
    }

    const token = jwt.sign(
      { id: user._id, role: user.role || "user" },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.json({ token });

  } catch (err) {
    console.error("Login error:", err);
    return sendError(res, 500, ErrorCodes.SERVER_ERROR, "Server error");
  }
});

/**
 * CURRENT USER
 */
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    if (!user) {
      return sendError(res, 404, ErrorCodes.NOT_FOUND, "User not found");
    }
    res.json(user);
  } catch (err) {
    return sendError(res, 500, ErrorCodes.SERVER_ERROR, "Server error");
  }
});

/**
 * ADMIN INFO
 */
router.get("/admin/me", authMiddleware, adminOnly, async (req, res) => {
  const user = await User.findById(req.userId).select("-password");
  if (!user) return sendError(res, 404, ErrorCodes.NOT_FOUND, "User not found");
  res.json(user);
});

/**
 * LOGOUT
 */
router.post("/logout", authMiddleware, userOrAdmin, (req, res) => {
  res.json({ message: "Logged out successfully" });
});

module.exports = router;