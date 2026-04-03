const jwt = require("jsonwebtoken");
const User = require("../models/user.model");

/**
 * Verifies JWT token and attaches user to req.user
 */
const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Access denied. No token provided.",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({ success: false, message: "Token invalid. User not found." });
    }

    if (user.status === "inactive") {
      return res.status(403).json({ success: false, message: "Your account is inactive. Contact an admin." });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: "Token is invalid or expired." });
  }
};

/**
 * Role-based access control
 * Usage: authorize("admin") or authorize("admin", "analyst")
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Not authenticated." });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Your role '${req.user.role}' is not allowed to perform this action.`,
      });
    }

    next();
  };
};

module.exports = { protect, authorize };
