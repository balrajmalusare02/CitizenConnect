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

// GET /api/notifications
router.get("/", getMyNotifications);

// PUT /api/notifications/read-all
router.put("/read-all", markAllNotificationsAsRead);

// PUT /api/notifications/:id/read
router.put("/:id/read", markNotificationAsRead);

export default router;