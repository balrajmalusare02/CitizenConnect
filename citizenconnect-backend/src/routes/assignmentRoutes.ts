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

// 📌 Assign complaint to employee
router.put("/:id/assign", assignComplaint);

// 📋 Get my assigned complaints
router.get("/my-assigned", getMyAssignedComplaints);

// 👥 Get list of assignable employee
router.get("/employees", getAssignableEmployees);

// 🔄 Reassign complaint to another employee
router.put("/:id/reassign", reassignComplaint);

// ❌ Unassign complaint
router.put("/:id/unassign", unassignComplaint);

export default router;