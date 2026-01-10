const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

/**
 * Password Policy Validation
 * Requirements: min 8 chars, uppercase, lowercase, number, special char
 */
function validatePassword(password) {
  const errors = [];
  
  if (password.length < 8) {
    errors.push("Password must be at least 8 characters long");
  }
  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }
  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }
  if (!/[0-9]/.test(password)) {
    errors.push("Password must contain at least one number");
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push("Password must contain at least one special character");
  }
  
  return {
    isValid: errors.length === 0,
    errors: errors
  };
}

/**
 * REGISTER USER
 * POST /api/auth/register
 */
router.post("/register", async (req, res) => {
  try {
    const { f_name, l_name, email, password, confirm_password } = req.body;

    // Validation
    if (!f_name || !l_name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Normalize email to lowercase and trim
    const normalizedEmail = email.toLowerCase().trim();

    // Check existing user
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    // Password mismatch check
    if (password !== confirm_password) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    // Password policy validation
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({ 
        message: "Password does not meet requirements",
        errors: passwordValidation.errors
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user (role defaults to "user" from schema)
    const newUser = await User.create({
      f_name,
      l_name,
      email: normalizedEmail,
      password: hashedPassword,
      active: 1,
      created_date: new Date()
    });

    // Generate JWT token with user id and role, 24-hour expiry
    const token = jwt.sign(
      { 
        id: newUser._id,
        role: newUser.role || "user"
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    return res.status(201).json({ 
      message: "Registered successfully",
      token: token
    });

  } catch (error) {
    console.error("Register error:", error);
    return res.status(500).json({ message: "Server error" });
  }
});

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Normalize email to lowercase and trim
    const normalizedEmail = email.toLowerCase().trim();

    // Find user
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Active user check
    if (user.active !== 1) {
      return res.status(400).json({ message: "Inactive user" });
    }

    // Generate JWT with user id and role, 24-hour expiry
    const token = jwt.sign(
      { 
        id: user._id,
        role: user.role || "user"
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    return res.json({ token });

  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Server error" });
  }
});

// Get current logged-in user
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
