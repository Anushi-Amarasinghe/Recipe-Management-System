// backend/middleware/authMiddleware.js
const jwt = require("jsonwebtoken");
const { sendError, ErrorCodes } = require("../utils/errorHandler");

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization || "";

  if (!authHeader.startsWith("Bearer ")) {
    return sendError(
      res,
      401,
      ErrorCodes.UNAUTHORIZED,
      "Not authorized - No token provided"
    );
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.userId = decoded.id;
    req.userRole = decoded.role;

    return next();
  } catch (err) {
    return sendError(
      res,
      401,
      ErrorCodes.UNAUTHORIZED,
      "Not authorized - Invalid or expired token"
    );
  }
};

module.exports = authMiddleware;
