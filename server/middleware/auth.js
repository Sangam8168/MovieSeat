import jwt from "jsonwebtoken";
import User from "../models/User.js";

// Verifies the JWT sent in the Authorization header and attaches the user to req.user
export const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ success: false, message: "Not authorized, no token" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);
    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "Not authorized, user not found" });
    }

    req.user = user;
    next();
  } catch (error) {
    return res
      .status(401)
      .json({ success: false, message: "Not authorized, invalid token" });
  }
};

// Requires a valid token AND an admin role
export const protectAdmin = [
  protect,
  (req, res, next) => {
    if (req.user.role !== "admin") {
      return res.json({ success: false, message: "not authorized" });
    }
    next();
  },
];
