//Purpose: Initializes Express, enables JSON & CORS, and defines a basic route.

import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";

import { logger } from "./middlewares/logger";
import { errorHandler } from "./middlewares/errorHandler";
import { socketAuthMiddleware } from "./middlewares/socketAuthMiddleware"; 
import { setupSocketHandlers } from "./sockets/socketHandlers"; 

import authRoutes from "./routes/authRoutes";
import protectedRoutes from "./routes/protectedRoutes";
import adminRoutes from "./routes/adminRoutes";
import domainRoutes from "./routes/domainRoutes";
import complaintRoutes from "./routes/complaintRoutes";
import assignmentRoutes from "./routes/assignmentRoutes";
import statusHistoryRoutes from "./routes/statusHistoryRoutes";
import notificationRoutes from "./routes/notificationRoutes";
import feedbackRoutes from "./routes/feedbackRoutes";

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());
app.use(logger);

// Temporary base route to test server
app.get("/", (req, res) => {
  res.send("CitizenConnect Backend is running 🚀");
});

// ✅ Create HTTP server and bind Socket.io
const server = http.createServer(app);

export const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// ✅ Apply Socket.IO authentication middleware
io.use(socketAuthMiddleware);

// ✅ Setup socket event handlers
setupSocketHandlers(io);

// Auth routes
app.use("/api/auth", authRoutes);

console.log("Auth routes loaded ✅");

// ✅ Make io accessible globally (attach to app)
app.set("io", io);

// Routes
app.use("/api/protected", protectedRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/domains", domainRoutes);
app.use("/api/complaints", complaintRoutes);
app.use("/api/assignments", assignmentRoutes); 
app.use("/api/status", statusHistoryRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/feedback", feedbackRoutes);


// ✅ Start server
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

// Global Error Handler (keep this at bottom)
app.use(errorHandler);

export default app;