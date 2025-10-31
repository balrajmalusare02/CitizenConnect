/*
 * Notification Service
 * Location: src/utils/notificationService.ts
 * Purpose: Central function to create and emit notifications
 */

import { io } from "../app"; // Import your exported socket.io instance
import prisma from "../prisma/client"; // Import your prisma client
import { Notification } from "@prisma/client";

// Define the shape of the notification payload
interface NotificationPayload {
  message: string;
  complaintId: number;
}

/**
 * Creates, saves, and emits a notification for a user.
 * @param userId - The ID of the user to notify
 * @param message - The notification message
 * @param complaintId - The ID of the related complaint
 * @param event - The socket event name (e.g., "new-notification")
 */
export const createAndEmitNotification = async (
  userId: number,
  message: string,
  complaintId: number,
  event: string = "new-notification"
): Promise<void> => {
  try {
    // 1. Save the notification to the database
    const notification = await prisma.notification.create({
      data: {
        userId: userId,
        message: message,
        complaintId: complaintId,
      },
    });

    // 2. Emit the real-time notification to the user's personal room
    const userRoom = `user:${userId}`;
    io.to(userRoom).emit(event, {
      notification: notification,
    });
    
    console.log(`📢 Notification created and sent to user ${userId}`);

  } catch (error) {
    console.error("Error in createAndEmitNotification:", error);
  }
};