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

/**
 * @swagger
 * /api/status/complaint/{id}/history:
 *   get:
 *     summary: Get status timeline for a complaint
 *     tags: [Status]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Complaint timeline
 */
// 📜 Get status history for specific complaint
router.get("/complaint/:id/history", getComplaintStatusHistory);

// 📊 Get overall status statistics
router.get("/statistics", getStatusStatistics);

// 📈 Get recent status changes (activity feed)
router.get("/recent", getRecentStatusChanges);

export default router;