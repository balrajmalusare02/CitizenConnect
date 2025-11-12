/*
 * Status History Controller
 * Location: src/controllers/statusHistoryController.ts
 * Purpose: Get detailed status update history for complaints
 */

import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { getStatusDisplayName } from "../utils/statusValidation";

const prisma = new PrismaClient();

interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    role: string;
  };
}

// 📜 Get Status History for a Complaint
export const getComplaintStatusHistory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const complaint = await prisma.complaint.findUnique({
      where: { id: parseInt(id) },
      include: {
        statusUpdates: {
          include: {
            updatedBy: {
              select: { id: true, name: true, email: true, role: true },
            },
          },
          orderBy: { updatedAt: "asc" },
        },
        user: {
          select: { id: true, name: true, email: true },
        },
        feedbacks: true,
      },
    });

    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    // Calculate time spent in each status
    const timeline = complaint.statusUpdates.map((update, index) => {
      const nextUpdate = complaint.statusUpdates[index + 1];
      const timeSpent = nextUpdate
        ? Math.floor(
            (new Date(nextUpdate.updatedAt).getTime() -
              new Date(update.updatedAt).getTime()) /
              (1000 * 60)
          ) // minutes
        : null;

      return {
        id: update.id,
        status: update.status,
        statusDisplayName: getStatusDisplayName(update.status),
        remarks: update.remarks,
        updatedBy: update.updatedBy
          ? {
              name: update.updatedBy.name,
              role: update.updatedBy.role,
            }
          : null,
        updatedAt: update.updatedAt,
        timeSpentInMinutes: timeSpent,
        timeSpentFormatted: timeSpent ? formatDuration(timeSpent) : "Current",
      };
    });

    // Calculate total resolution time if closed
    const totalResolutionTime =
      complaint.closedAt && complaint.createdAt
        ? Math.floor(
            (new Date(complaint.closedAt).getTime() -
              new Date(complaint.createdAt).getTime()) /
              (1000 * 60)
          )
        : null;

    res.status(200).json({
      complaintId: complaint.id,
      title: complaint.title,
      currentStatus: complaint.status,
      createdBy: complaint.user,
      createdAt: complaint.createdAt,
      totalResolutionTime: totalResolutionTime
        ? formatDuration(totalResolutionTime)
        : "In Progress",
      hasFeedback: !!complaint.feedbacks,
      timeline,
    });
  } catch (error) {
    console.error("Error fetching status history:", error);
    res.status(500).json({ message: "Failed to fetch status history" });
  }
};

// 📊 Get Status Statistics for All Complaints
export const getStatusStatistics = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user;

    // Build filter based on role
    const whereClause: any = {};
    if (user?.role === "DEPARTMENT_ADMIN" || user?.role === "DEPARTMENT_EMPLOYEE") {
      // Filter by department (you'll need to add department to user)
      whereClause.department = ""; // Add logic based on your needs
    }

    // Get count by status
    const statusCounts = await prisma.complaint.groupBy({
      by: ["status"],
      _count: true,
      where: whereClause,
    });

    // Get average resolution time for closed complaints
    const closedComplaints = await prisma.complaint.findMany({
      where: {
        ...whereClause,
        status: "Closed",
        closedAt: { not: null },
      },
      select: {
        createdAt: true,
        closedAt: true,
      },
    });

    const avgResolutionTime =
      closedComplaints.length > 0
        ? closedComplaints.reduce((sum, complaint) => {
            const time =
              (new Date(complaint.closedAt!).getTime() -
                new Date(complaint.createdAt).getTime()) /
              (1000 * 60);
            return sum + time;
          }, 0) / closedComplaints.length
        : 0;

    // Format status counts
    const formattedCounts = statusCounts.map((item) => ({
      status: item.status,
      statusDisplayName: getStatusDisplayName(item.status),
      count: item._count,
    }));

    res.status(200).json({
      statusBreakdown: formattedCounts,
      totalComplaints: statusCounts.reduce((sum, item) => sum + item._count, 0),
      averageResolutionTime: formatDuration(Math.floor(avgResolutionTime)),
      closedComplaintsCount: closedComplaints.length,
    });
  } catch (error) {
    console.error("Error fetching status statistics:", error);
    res.status(500).json({ message: "Failed to fetch status statistics" });
  }
};

// 📈 Get Recent Status Changes (Activity Feed)
export const getRecentStatusChanges = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const user = req.user;

    // Build filter based on role
    const whereClause: any = {};
    if (user?.role === "CITIZEN") {
      // Show only their complaints
      whereClause.complaint = { userId: user.id };
    }

    const recentUpdates = await prisma.statusUpdate.findMany({
      where: whereClause,
      include: {
        complaint: {
          select: {
            id: true,
            title: true,
            domain: true,
            category: true,
          },
        },
        updatedBy: {
          select: { id: true, name: true, role: true },
        },
      },
      orderBy: { updatedAt: "desc" },
      take: limit,
    });

    const formattedUpdates = recentUpdates.map((update) => ({
      id: update.id,
      complaintId: update.complaint.id,
      complaintTitle: update.complaint.title,
      domain: update.complaint.domain,
      category: update.complaint.category,
      status: update.status,
      statusDisplayName: getStatusDisplayName(update.status),
      remarks: update.remarks,
      updatedBy: update.updatedBy
        ? {
            name: update.updatedBy.name,
            role: update.updatedBy.role,
          }
        : null,
      updatedAt: update.updatedAt,
      timeAgo: getTimeAgo(update.updatedAt),
    }));

    res.status(200).json({
      recentUpdates: formattedUpdates,
      count: formattedUpdates.length,
    });
  } catch (error) {
    console.error("Error fetching recent status changes:", error);
    res.status(500).json({ message: "Failed to fetch recent status changes" });
  }
};

// Helper: Format duration in human-readable format
function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} minute${minutes !== 1 ? "s" : ""}`;
  } else if (minutes < 1440) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours} hour${hours !== 1 ? "s" : ""}${mins > 0 ? ` ${mins} min` : ""}`;
  } else {
    const days = Math.floor(minutes / 1440);
    const hours = Math.floor((minutes % 1440) / 60);
    return `${days} day${days !== 1 ? "s" : ""}${hours > 0 ? ` ${hours} hr` : ""}`;
  }
}

// Helper: Get time ago in human-readable format
function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - new Date(date).getTime()) / (1000 * 60));

  if (diffInMinutes < 1) return "Just now";
  if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes !== 1 ? "s" : ""} ago`;
  if (diffInMinutes < 1440) {
    const hours = Math.floor(diffInMinutes / 60);
    return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
  }
  const days = Math.floor(diffInMinutes / 1440);
  return `${days} day${days !== 1 ? "s" : ""} ago`;
}