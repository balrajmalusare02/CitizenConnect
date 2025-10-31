/* 
 * Socket.IO Event Handlers
 * Location: src/sockets/socketHandlers.ts
 * Purpose: Handle socket connections, rooms, and events
 */

import { Server, Socket } from "socket.io";

interface SocketWithUser extends Socket {
  user?: {
    id: number;
    email: string;
    name: string;
    role: string;
  };
}

export const setupSocketHandlers = (io: Server) => {
  io.on("connection", (socket: SocketWithUser) => {
    console.log("🟢 New client connected:", socket.id);

    // Join user-specific room
    if (socket.user) {
      const userRoom = `user:${socket.user.id}`;
      socket.join(userRoom);
      console.log(`👤 User ${socket.user.name} joined room: ${userRoom}`);

      // Join role-based rooms
      const roleRoom = `role:${socket.user.role}`;
      socket.join(roleRoom);
      console.log(`👥 User joined role room: ${roleRoom}`);

      // Emit welcome message
      socket.emit("connected", {
        message: "Connected to CitizenConnect notifications",
        userId: socket.user.id,
        role: socket.user.role,
      });
    }

    // Handle joining complaint-specific rooms
    socket.on("join-complaint", (complaintId: number) => {
      const complaintRoom = `complaint:${complaintId}`;
      socket.join(complaintRoom);
      console.log(`📋 Socket ${socket.id} joined complaint room: ${complaintRoom}`);
    });

    // Handle leaving complaint rooms
    socket.on("leave-complaint", (complaintId: number) => {
      const complaintRoom = `complaint:${complaintId}`;
      socket.leave(complaintRoom);
      console.log(`📋 Socket ${socket.id} left complaint room: ${complaintRoom}`);
    });

    // ✅ NEW: Handle watching specific complaints for updates
    socket.on("watch-complaint", (complaintId: number) => {
      const complaintRoom = `complaint:${complaintId}`;
      socket.join(complaintRoom);
      console.log(`👀 Socket ${socket.id} is watching complaint: ${complaintRoom}`);
    });

    // Handle disconnect
    socket.on("disconnect", () => {
      console.log("🔴 Client disconnected:", socket.id);
    });
  });
};

// ✅ Helper function to emit notifications
export const emitNotification = (
  io: Server,
  room: string,
  event: string,
  data: any
) => {
  io.to(room).emit(event, data);
  console.log(`📢 Emitted "${event}" to room "${room}"`);
};