/*
 * Feedback Routes
 * Location: src/routes/feedbackRoutes.ts
 * Purpose: Routes for complaint feedback and ratings
 */

import express from "express";
import {
  submitFeedback,
  updateFeedback,
  deleteFeedback,
  getFeedbackForComplaint,
  getAverageRatings,
  getTopRatedDepartments,
} from "../controllers/feedbackController";
import { protect } from "../middlewares/authMiddleware";

const router = express.Router();

// ⭐ Submit feedback for a complaint (citizen only)
router.post("/complaint/:complaintId", protect, submitFeedback);

// ✏️ Update feedback
router.put("/complaint/:complaintId", protect, updateFeedback);

// 🗑️ Delete feedback
router.delete("/complaint/:complaintId", protect, deleteFeedback);

// 📊 Get feedback for specific complaint (public)
router.get("/complaint/:complaintId", getFeedbackForComplaint);

// 📈 Get average ratings (with filters)
router.get("/ratings/average", getAverageRatings);

// 🏆 Get top rated departments
router.get("/ratings/top-departments", getTopRatedDepartments);

export default router;