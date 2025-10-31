/*
 * Notification Controller
 * Location: src/controllers/notificationController.ts
 * Purpose: Get notifications and mark them as read
 */

import { Request, Response } from "express";
import { asyncHandler } from "../middlewares/asyncHandler";
import prisma from "../prisma/client";

// Interface for authenticated request
interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
  };
}

// Get all notifications for the logged-in user (unread first)
export const getMyNotifications = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id;

    const notifications = await prisma.notification.findMany({
      where: { userId: userId },
      orderBy: [
        { isRead: "asc" }, // Unread first
        { createdAt: "desc" }, // Newest first
      ],
      include: {
        // Include basic complaint info
        complaint: {
          select: { id: true, title: true, status: true },
        },
      },
    });

    // Get unread count
    const unreadCount = notifications.filter((n) => !n.isRead).length;

    res.status(200).json({
      success: true,
      count: notifications.length,
      unreadCount: unreadCount,
      notifications: notifications,
    });
  }
);

// Mark a single notification as read
export const markNotificationAsRead = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id;
    const { id } = req.params; // Notification ID

    const notification = await prisma.notification.findUnique({
      where: { id: parseInt(id) },
    });

    // Ensure notification exists and belongs to the user
    if (!notification || notification.userId !== userId) {
      return res
        .status(404)
        .json({ success: false, message: "Notification not found" });
    }

    const updatedNotification = await prisma.notification.update({
      where: { id: parseInt(id) },
      data: { isRead: true },
    });

    res.status(200).json({ success: true, notification: updatedNotification });
  }
);

// Mark all notifications as read
export const markAllNotificationsAsRead = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id;

    await prisma.notification.updateMany({
      where: {
        userId: userId,
        isRead: false,
      },
      data: { isRead: true },
    });

    res
      .status(200)
      .json({ success: true, message: "All notifications marked as read" });
  }
);