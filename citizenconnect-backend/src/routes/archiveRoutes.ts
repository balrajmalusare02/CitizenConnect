/*
 * Archive Routes
 * Location: src/routes/archiveRoutes.ts
 * Purpose: Routes for archived/resolved complaints
 */

import express from "express";
import {
  getArchivedComplaints,
  getArchiveStatistics,
  searchArchivedComplaints,
  getTopResolvedComplaints,
} from "../controllers/archiveController";
import { protect } from "../middlewares/authMiddleware";

const router = express.Router();

// All routes require authentication
router.use(protect);

// 📦 Get archived complaints (with pagination and filters)
router.get("/complaints", getArchivedComplaints);

// 📊 Get archive statistics
router.get("/statistics", getArchiveStatistics);

// 🔍 Search archived complaints
router.get("/search", searchArchivedComplaints);

// 🏆 Get top resolved complaints (by rating)
router.get("/top-resolved", getTopResolvedComplaints);

export default router;