/*
 * Feedback Controller
 * Location: src/controllers/feedbackController.ts
 * Purpose: Handle complaint feedback and ratings
 */

import { Request, Response } from "express";

import { PrismaClient } from "@prisma/client";
import { io } from "../app";

interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    email: string;
    name: string;
    role: string;
  };
}

const prisma = new PrismaClient();

// ⭐ Submit Feedback for Resolved Complaint
export const submitFeedback = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { complaintId } = req.params;
    const { rating, comment, wasResolved } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ 
        message: "Rating is required and must be between 1 and 5" 
      });
    }

    // Check if complaint exists
    const complaint = await prisma.complaint.findUnique({
      where: { id: parseInt(complaintId) },
      include: { feedbacks: true },
    });

    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    // Only complaint owner can give feedback
    if (complaint.userId !== userId) {
      return res.status(403).json({ 
        message: "You can only give feedback for your own complaints" 
      });
    }

    // Can only give feedback for Resolved or Closed complaints
    if (complaint.status !== "Resolved" && complaint.status !== "Closed") {
      return res.status(400).json({ 
        message: "Feedback can only be submitted for Resolved or Closed complaints",
        currentStatus: complaint.status,
      });
    }

    // Check if feedback already exists
    if (complaint.feedbacks) {
      return res.status(400).json({ 
        message: "Feedback already submitted for this complaint. Use update endpoint to modify." 
      });
    }

    // Create feedback
    const feedback = await prisma.feedback.create({
      data: {
        rating: parseInt(rating),
        comment: comment || null,
        wasResolved: wasResolved !== undefined ? wasResolved : true,
        complaintId: parseInt(complaintId),
        userId,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        complaint: { 
          select: { 
            id: true, 
            title: true, 
            assignedTo: { select: { id: true, name: true } } 
          } 
        },
      },
    });

    // ✅ Notify assigned employee about feedback
    if (complaint.assignedToId) {
      io.to(`user:${complaint.assignedToId}`).emit("feedback-received", {
        message: `New feedback received: ${rating} stars`,
        feedback,
        timestamp: new Date(),
      });
    }

    console.log(`⭐ Feedback submitted: ${rating} stars for complaint #${complaintId}`);

    return res.status(201).json({
      message: "Thank you for your feedback! ✅",
      feedback,
    });
  } catch (error) {
    console.error("Error submitting feedback:", error);
    return res.status(500).json({ message: "Failed to submit feedback" });
  }
};

// ✏️ Update Feedback
export const updateFeedback = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { complaintId } = req.params;
    const { rating, comment, wasResolved } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Validate rating if provided
    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json({ 
        message: "Rating must be between 1 and 5" 
      });
    }

    // Check if feedback exists
    const existingFeedback = await prisma.feedback.findUnique({
      where: { complaintId: parseInt(complaintId) },
    });

    if (!existingFeedback) {
      return res.status(404).json({ message: "Feedback not found" });
    }

    // Only feedback owner can update
    if (existingFeedback.userId !== userId) {
      return res.status(403).json({ 
        message: "You can only update your own feedback" 
      });
    }

    // Update feedback
    const updatedFeedback = await prisma.feedback.update({
      where: { complaintId: parseInt(complaintId) },
      data: {
        ...(rating && { rating: parseInt(rating) }),
        ...(comment !== undefined && { comment }),
        ...(wasResolved !== undefined && { wasResolved }),
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        complaint: { select: { id: true, title: true } },
      },
    });

    return res.status(200).json({
      message: "Feedback updated successfully ✅",
      feedback: updatedFeedback,
    });
  } catch (error) {
    console.error("Error updating feedback:", error);
    return res.status(500).json({ message: "Failed to update feedback" });
  }
};

// 🗑️ Delete Feedback
export const deleteFeedback = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { complaintId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Check if feedback exists
    const existingFeedback = await prisma.feedback.findUnique({
      where: { complaintId: parseInt(complaintId) },
    });

    if (!existingFeedback) {
      return res.status(404).json({ message: "Feedback not found" });
    }

    // Only feedback owner can delete
    if (existingFeedback.userId !== userId) {
      return res.status(403).json({ 
        message: "You can only delete your own feedback" 
      });
    }

    await prisma.feedback.delete({
      where: { complaintId: parseInt(complaintId) },
    });

    return res.status(200).json({
      message: "Feedback deleted successfully ✅",
    });
  } catch (error) {
    console.error("Error deleting feedback:", error);
    return res.status(500).json({ message: "Failed to delete feedback" });
  }
};

// 📊 Get Feedback for a Complaint
export const getFeedbackForComplaint = async (req: Request, res: Response) => {
  try {
    const { complaintId } = req.params;

    const feedback = await prisma.feedback.findUnique({
      where: { complaintId: parseInt(complaintId) },
      include: {
        user: { select: { id: true, name: true, email: true } },
        complaint: { 
          select: { 
            id: true, 
            title: true, 
            status: true,
            resolvedAt: true,
            closedAt: true,
          } 
        },
      },
    });

    if (!feedback) {
      return res.status(404).json({ message: "No feedback found for this complaint" });
    }

    return res.status(200).json(feedback);
  } catch (error) {
    console.error("Error fetching feedback:", error);
    return res.status(500).json({ message: "Failed to fetch feedback" });
  }
};

// 📈 Get Average Rating for Department/Category
export const getAverageRatings = async (req: Request, res: Response) => {
  try {
    const { department, category, domain } = req.query;

    // Build filter
    const whereClause: any = {};
    if (department) whereClause.complaint = { department: String(department) };
    if (category) whereClause.complaint = { ...whereClause.complaint, category: String(category) };
    if (domain) whereClause.complaint = { ...whereClause.complaint, domain: String(domain) };

    // Get all feedback
    const feedbacks = await prisma.feedback.findMany({
      orderBy: {
        createdAt: "desc", // Show newest first
      },
      });

    if (feedbacks.length === 0) {
      return res.status(200).json({
        message: "No feedback data available",
        averageRating: 0,
        totalFeedbacks: 0,
      });
    }

    // Calculate average
    const totalRating = feedbacks.reduce((sum, f) => sum + f.rating, 0);
    const averageRating = (totalRating / feedbacks.length).toFixed(2);

    // Rating distribution
    const ratingDistribution = {
      1: feedbacks.filter(f => f.rating === 1).length,
      2: feedbacks.filter(f => f.rating === 2).length,
      3: feedbacks.filter(f => f.rating === 3).length,
      4: feedbacks.filter(f => f.rating === 4).length,
      5: feedbacks.filter(f => f.rating === 5).length,
    };

    // Resolution satisfaction
    const resolvedCount = feedbacks.filter(f => f.wasResolved).length;
    const satisfactionRate = ((resolvedCount / feedbacks.length) * 100).toFixed(2);

    return res.status(200).json({
      averageRating: parseFloat(averageRating),
      totalFeedbacks: feedbacks.length,
      ratingDistribution,
      satisfactionRate: parseFloat(satisfactionRate),
      filters: {
        department: department || "All",
        category: category || "All",
        domain: domain || "All",
      },
    });
  } catch (error) {
    console.error("Error calculating average ratings:", error);
    return res.status(500).json({ message: "Failed to calculate ratings" });
  }
};

// 🏆 Get Top Rated Departments
export const getTopRatedDepartments = async (req: Request, res: Response) => {
  try {
    const feedbacks = await prisma.feedback.findMany({
      include: {
        complaint: { select: { department: true } },
      },
    });

    // Group by department
    const departmentRatings: { [key: string]: { total: number; count: number } } = {};

    feedbacks.forEach(f => {
      const dept = f.complaint.department || "Unassigned";
      if (!departmentRatings[dept]) {
        departmentRatings[dept] = { total: 0, count: 0 };
      }
      departmentRatings[dept].total += f.rating;
      departmentRatings[dept].count += 1;
    });

    // Calculate averages and sort
    const departmentScores = Object.entries(departmentRatings)
      .map(([department, data]) => ({
        department,
        averageRating: parseFloat((data.total / data.count).toFixed(2)),
        totalFeedbacks: data.count,
      }))
      .sort((a, b) => b.averageRating - a.averageRating);

    return res.status(200).json({
      topRatedDepartments: departmentScores,
    });
  } catch (error) {
    console.error("Error fetching top rated departments:", error);
    return res.status(500).json({ message: "Failed to fetch department ratings" });
  }
};

// 🏆 Get All Feedbacks (For Admin Panel)
export const getAllFeedbacks = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    // We can add a role check here in the future if needed
    // if (req.user?.role !== 'SUPER_ADMIN' && req.user?.role !== 'CITY_ADMIN') {
    //   return res.status(403).json({ message: "Forbidden" });
    // }

    const feedbacks = await prisma.feedback.findMany({
      include: {
        user: {
          select: { name: true, email: true }, // Get user's name
        },
        complaint: {
          select: { id: true }, // Get related complaint ID
        },
      },
      orderBy: {
        createdAt: "desc", // Show newest first
      },
    });

    res.status(200).json({
      success: true,
      count: feedbacks.length,
      data: feedbacks,
    });
  } catch (error) {
    console.error("Error fetching all feedbacks:", error);
    return res.status(500).json({ message: "Failed to fetch feedbacks" });
  }
};