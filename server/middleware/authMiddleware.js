// server/middleware/authMiddleware.js
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: "Authentication required." });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    console.error("authMiddleware error", err);
    return res.status(401).json({ message: "Invalid or expired token." });
  }
}

export function requireRole(...roles) {
  return function roleMiddleware(req, res, next) {
    const role = req.user?.role;

    if (!role || !roles.includes(role)) {
      return res.status(403).json({ message: "Access denied." });
    }

    next();
  };
}

export const requireTourist = requireRole("tourist");
export const requireAgency = requireRole("agency");
export const requireAdmin = requireRole("admin");

export const authRequired = authMiddleware;