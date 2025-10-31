/* 
 * Socket.IO Authentication Middleware
 * Location: src/middlewares/socketAuthMiddleware.ts
 * Purpose: Verify JWT tokens for Socket.IO connections
 */

import { Socket } from "socket.io";
import jwt from "jsonwebtoken";
import prisma from "../prisma/client";

interface SocketWithUser extends Socket {
  user?: {
    id: number;
    email: string;
    name: string;
    role: string;
  };
}

export const socketAuthMiddleware = async (socket: SocketWithUser, next: any) => {
  try {
    // Get token from handshake auth or query
    const token = socket.handshake.auth.token || socket.handshake.query.token;

    if (!token) {
      return next(new Error("Authentication error: No token provided"));
    }

    // Verify JWT token
    const secret = process.env.JWT_SECRET as string;
    const decoded: any = jwt.verify(token as string, secret);

    // Fetch user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, name: true, role: true },
    });

    if (!user) {
      return next(new Error("Authentication error: User not found"));
    }

    // Attach user to socket
    socket.user = user;
    console.log(`✅ User authenticated via socket: ${user.name} (${user.role})`);
    
    next();
  } catch (error) {
    console.error("Socket authentication error:", error);
    next(new Error("Authentication error: Invalid token"));
  }
};