/*
 * Heatmap Routes
 * Location: src/routes/heatmapRoutes.ts
 * Purpose: Routes for geo-location and heatmap visualization
 */

import express from "express";
import {
  getMapData,
  getSeverityZones,
  getComplaintsByArea,
  getComplaintsByIssueType,
  getAreaStatistics,
} from "../controllers/heatmapController";
import { protect } from "../middlewares/authMiddleware";

const router = express.Router();

// All routes require authentication
router.use(protect);

// 🗺️ STEP 4.5: Get real-time map data (all complaints with coordinates)
router.get("/map-data", getMapData);

// 🔥 STEP 4.2: Get severity zones (complaint density - Green to Red)
router.get("/severity-zones", getSeverityZones);

// 📍 STEP 4.3: Get complaints by area (ward/zone/district filters)
router.get("/by-area", getComplaintsByArea);

// 🏷️ STEP 4.4: Get complaints by issue type (domain/category filters)
router.get("/by-issue", getComplaintsByIssueType);

// 📊 Get area statistics (breakdown by ward/zone/district)
router.get("/area-stats", getAreaStatistics);

export default router;