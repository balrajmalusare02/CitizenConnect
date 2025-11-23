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
  getAllFeedbacks,
} from "../controllers/feedbackController";
import { protect } from "../middlewares/authMiddleware";


const router = express.Router();

/**
 * @swagger
 * /api/feedback/complaint/{complaintId}:
 *   post:
 *     summary: Submit feedback for a resolved complaint
 *     tags: [Feedback]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: complaintId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rating
 *             properties:
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               comment:
 *                 type: string
 *     responses:
 *       201:
 *         description: Feedback submitted successfully
 */
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

// 📋 GET ALL FEEDBACKS (FOR ADMIN PANEL)
router
  .route("/")
  .get(
    protect, // Use only 'protect' for now
    getAllFeedbacks
  );

export default router;