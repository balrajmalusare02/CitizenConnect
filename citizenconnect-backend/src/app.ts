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
import analyticsRoutes from "./routes/analyticsRoutes";
import archiveRoutes from "./routes/archiveRoutes";
import heatmapRoutes from "./routes/heatmapRoutes";
import dashboardRoutes from "./routes/dashboardRoutes";
import userRoutes from "./routes/userRoutes";

dotenv.config();
const app = express();

// Define an explicit whitelist of allowed origins
const whitelist = [
  //process.env.CORS_ORIGIN, // Your Render Environment Variable (just in case)
  "https://citizenconnect-admin-dashboard.vercel.app", // The Vercel frontend
  "http://localhost:5173", // Your local development environment
];

const corsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    // Check if the incoming origin is in our whitelist OR if it's not a browser (e.g., Postman)
    if (whitelist.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"], // Allow all standard methods
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(logger);

// Temporary base route to test server
app.get("/", (req, res) => {
  res.send("CitizenConnect Backend is running 🚀");
});

// ✅ Create HTTP server and bind Socket.io
const server = http.createServer(app);

export const io = new Server(server, {
  cors: corsOptions,
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
app.use("/api/analytics", analyticsRoutes);
app.use("/api/archive", archiveRoutes);
app.use("/api/heatmap", heatmapRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/users", userRoutes);

// ✅ Start server
//const PORT = process.env.PORT || 4000;
//const HOST = "0.0.0.0";

// Fixed: Correct way to listen on a specific host
//server.listen(Number(PORT), HOST, () => {
//  console.log(`🚀 Server running on http://${HOST}:${PORT}`);
//});

// Global Error Handler (keep this at bottom)
app.use(errorHandler);

export { server, app };
