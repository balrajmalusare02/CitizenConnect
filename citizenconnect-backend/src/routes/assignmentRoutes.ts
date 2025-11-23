/*
 * Assignment Routes
 * Location: src/routes/assignmentRoutes.ts
 * Purpose: Routes for complaint assignment management
 */

import express from "express";
import {
  assignComplaint,
  getMyAssignedComplaints,
  reassignComplaint,
  unassignComplaint,
  getAssignableEmployees
} from "../controllers/assignmentController";
import { protect } from "../middlewares/authMiddleware";

const router = express.Router();

// All routes require authentication
router.use(protect);

/**
 * @swagger
 * /api/assignments/{id}/assign:
 *   put:
 *     summary: Assign a complaint to an employee
 *     tags: [Assignments]
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
 *               - assignedToId
 *             properties:
 *               assignedToId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Complaint assigned successfully
 */
// 📌 Assign complaint to employee
router.put("/:id/assign", assignComplaint);

// 📋 Get my assigned complaints
router.get("/my-assigned", getMyAssignedComplaints);

/**
 * @swagger
 * /api/assignments/employees:
 *   get:
 *     summary: Get list of employees for assignment
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of employees
 */
// 👥 Get list of assignable employee
router.get("/employees", getAssignableEmployees);

// 🔄 Reassign complaint to another employee
router.put("/:id/reassign", reassignComplaint);

// ❌ Unassign complaint
router.put("/:id/unassign", unassignComplaint);

export default router;