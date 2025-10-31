/*
 * Status History Routes
 * Location: src/routes/statusHistoryRoutes.ts
 * Purpose: Routes for status tracking and history
 */

import express from "express";
import {
  getComplaintStatusHistory,
  getStatusStatistics,
  getRecentStatusChanges,
} from "../controllers/statusHistoryController";
import { protect } from "../middlewares/authMiddleware";

const router = express.Router();

// All routes require authentication
router.use(protect);

// 📜 Get status history for specific complaint
router.get("/complaint/:id/history", getComplaintStatusHistory);

// 📊 Get overall status statistics
router.get("/statistics", getStatusStatistics);

// 📈 Get recent status changes (activity feed)
router.get("/recent", getRecentStatusChanges);

export default router;