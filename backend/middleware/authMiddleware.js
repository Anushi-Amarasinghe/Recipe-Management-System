const jwt = require("jsonwebtoken");
const { sendError, ErrorCodes } = require("../utils/errorHandler");

module.exports = function authMiddleware(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : null;

  if (!token) {
    return sendError(
      res,
      401,
      ErrorCodes.UNAUTHORIZED,
      "Not authorized - No token provided"
    );
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);


    req.user = decoded;
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
