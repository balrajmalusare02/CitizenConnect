/* What it does:
Checks if a user is logged in (req.user is set by JWT middleware).
Compares their role to allowed roles for that route.
Blocks access if they don’t have permission. */ 


import { Request, Response, NextFunction } from "express";

/**
 * restrictTo - Middleware to allow only specific roles to access an endpoint
 * @param roles - Array of allowed roles (e.g. "CITY_ADMIN", "WARD_OFFICER")
 */
export const restrictTo =
  (...roles: string[]) =>
  (req: any, res: Response, next: NextFunction) => {
    try {
      // 1️⃣ Ensure user is logged in
      if (!req.user) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      // 2️⃣ Check if user's role is in allowed list
      if (!roles.includes(req.user.role)) {
        return res
          .status(403)
          .json({ message: `Access denied for role: ${req.user.role}` });
      }

      // 3️⃣ Authorized → move to next controller
      next();
    } catch (error) {
      console.error("Authorization error:", error);
      res.status(500).json({ message: "Internal authorization error" });
    }
  };
