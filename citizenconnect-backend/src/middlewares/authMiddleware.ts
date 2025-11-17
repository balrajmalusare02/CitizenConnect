/* What it does
Checks for Authorization: Bearer <token> in headers.
Verifies token using your JWT secret
Loads user from database and attaches to req.user.
Optional authorize() restricts access by role. */



import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import prisma from "../prisma/client";

interface AuthRequest extends Request {
  user?: any;
}

export const protect = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const secret = process.env.JWT_SECRET as string;
    const decoded: any = jwt.verify(token, secret);

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      // Explicitly select the fields we need
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        
      },
    });

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    // --- ADD THIS SECURITY CHECK ---
    // This check is on your server and was causing the crash.
    // Now that 'status' is defined, it will work correctly.
    
    req.user = user; // attach user to request
    next();
  } catch (error) {
    console.error("JWT Error:", error);
    res.status(401).json({ message: "Not authorized, invalid token" });
  }
};
