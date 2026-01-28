// backend/middleware/authMiddleware.js
const jwt = require("jsonwebtoken");
const { sendError, ErrorCodes } = require("../utils/errorHandler");

<<<<<<< HEAD
function auth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Not authorized" });
=======
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
>>>>>>> main
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
<<<<<<< HEAD
    
    req.user = decoded.id;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Not authorized" });
  }
}
=======
>>>>>>> main


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
