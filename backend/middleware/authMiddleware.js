const jwt = require("jsonwebtoken");
const User = require("../models/User");

/**
 * Authentication middleware
 * Verifies JWT token and attaches user info to request
 * Sets req.userId and req.userRole for use with roleMiddleware
 */
async function auth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Not authorized" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Fetch user to verify they still exist and are active
    const user = await User.findById(decoded.id).select("-password");
    
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    // Check if user is deleted or suspended
    if (user.isDeleted) {
      return res.status(401).json({ message: "Account has been deleted" });
    }

    if (user.status === "suspended") {
      return res.status(403).json({ message: "Account is suspended" });
    }

    if (user.active !== 1) {
      return res.status(403).json({ message: "Account is inactive" });
    }

    // Attach user info to request
    req.userId = decoded.id;
    req.userRole = user.role || decoded.role || "user";  // For roleMiddleware
    req.user = user;  // Full user object if needed
    
    next();
  } catch (err) {
    console.error("Auth middleware error:", err);
    return res.status(401).json({ message: "Not authorized" });
  }
}

module.exports = auth;
