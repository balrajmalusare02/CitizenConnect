/*
 * Analytics Routes
 * Location: src/routes/analyticsRoutes.ts
 * Purpose: Routes for complaint analytics and statistics
 */

import express from "express";
import {
  getDashboardStats,
  getComplaintsByCategory,
  getComplaintsByDomain,
  getComplaintsByDepartment,
  getComplaintsTrend,
  getEmployeePerformance,
} from "../controllers/analyticsController";
import { protect } from "../middlewares/authMiddleware";
import { restrictTo } from "../middlewares/roleMiddleware";

const router = express.Router();

// All routes require authentication
router.use(protect);

// 📊 Dashboard statistics (admins and officials)
router.get(
  "/dashboard",
  restrictTo("DEPARTMENT_EMPLOYEE", "DEPARTMENT_ADMIN", "CITY_ADMIN", "SUPER_ADMIN"),
  getDashboardStats
);

// 📈 Breakdown by category
router.get(
  "/by-category",
  restrictTo("DEPARTMENT_ADMIN", "CITY_ADMIN", "SUPER_ADMIN"),
  getComplaintsByCategory
);

// 🗺️ Breakdown by domain
router.get(
  "/by-domain",
  restrictTo("DEPARTMENT_ADMIN", "CITY_ADMIN", "SUPER_ADMIN"),
  getComplaintsByDomain
);

// 🏢 Breakdown by department (admins only)
router.get(
  "/by-department",
  restrictTo("CITY_ADMIN", "SUPER_ADMIN"),
  getComplaintsByDepartment
);

// 📅 Time series trend
router.get(
  "/trend",
  restrictTo("DEPARTMENT_ADMIN", "CITY_ADMIN", "SUPER_ADMIN"),
  getComplaintsTrend
);

// 👥 Employee performance (admins only)
router.get(
  "/employee-performance",
  restrictTo("CITY_ADMIN", "SUPER_ADMIN"),
  getEmployeePerformance
);

export default router;