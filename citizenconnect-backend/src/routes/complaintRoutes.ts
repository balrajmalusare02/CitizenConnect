import express from "express";
import {
  raiseComplaint,
  getAllComplaints,
  getComplaintById,
  updateComplaintStatus,
  getComplaintsByRole,
  updateComplaint,
  deleteComplaint,
} from "../controllers/complaintController";
import { protect } from "../middlewares/authMiddleware";
import { restrictTo } from "../middlewares/roleMiddleware";
import { upload } from "../config/cloudinaryConfig";

const router = express.Router();

/**
 * @swagger
 * /api/complaints/raise:
 *   post:
 *     summary: Raise a new complaint
 *     tags: [Complaints]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - domain
 *               - category
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               domain:
 *                 type: string
 *               category:
 *                 type: string
 *               latitude:
 *                 type: number
 *               longitude:
 *                 type: number
 *               media:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Complaint raised successfully
 */
// 📤 Raise complaint with optional media upload
router.post("/raise", protect, upload.single("media"), raiseComplaint);

/**
 * @swagger
 * /api/complaints/view:
 *   get:
 *     summary: Get complaints based on user role
 *     tags: [Complaints]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of complaints
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 complaints:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       title:
 *                         type: string
 *                       status:
 *                         type: string
 */
// 📋 Get complaints by role/filters
router.get("/view", protect, getComplaintsByRole);

// 📜 Get all complaints
router.get("/", getAllComplaints);

/**
 * @swagger
 * /api/complaints/{id}:
 *   get:
 *     summary: Get details of a specific complaint
 *     tags: [Complaints]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Complaint details
 *       404:
 *         description: Complaint not found
 */
// 🔍 Get complaint by ID
router.get("/:id", getComplaintById);

// ✏️ Update complaint (citizen - before admin review only)
router.put("/:id", protect, upload.single("media"), updateComplaint);

// 🗑️ Delete complaint (citizen - before admin review only)
router.delete("/:id", protect, deleteComplaint);

/**
 * @swagger
 * /api/complaints/{id}/status:
 *   put:
 *     summary: Update complaint status (Admin only)
 *     tags: [Complaints]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *               - newStatus
 *             properties:
 *               newStatus:
 *                 type: string
 *                 enum: [Acknowledged, InProgress, Resolved, Closed]
 *               remarks:
 *                 type: string
 *     responses:
 *       200:
 *         description: Status updated successfully
 */
// ⚙️ Update complaint status (officials only)
router.put(
  "/:id/status",
  protect,
  restrictTo("WARD_OFFICER", "DEPARTMENT_ADMIN", "CITY_ADMIN", "SUPER_ADMIN", "MAYOR"),
  updateComplaintStatus
);

export default router;