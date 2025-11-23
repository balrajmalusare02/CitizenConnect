/*
 * Notification Routes
 * Location: src/routes/notificationRoutes.ts
 */

import express from "express";
import { protect } from "../middlewares/authMiddleware";
import {
  getMyNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "../controllers/notificationController";

const router = express.Router();

// All routes are protected
router.use(protect);

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: Get user notifications
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of notifications
 */
// GET /api/notifications
router.get("/", getMyNotifications);

// PUT /api/notifications/read-all
router.put("/read-all", markAllNotificationsAsRead);

// PUT /api/notifications/:id/read
router.put("/:id/read", markNotificationAsRead);

export default router;