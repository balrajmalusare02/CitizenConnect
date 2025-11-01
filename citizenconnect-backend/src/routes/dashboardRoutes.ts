/*
 * Dashboard Routes
 * Location: src/routes/dashboardRoutes.ts
 * Purpose: Role-based dashboard endpoints with access control
 */

import express from "express";
import {
  getEmployeeDashboard,
  getWardOfficerDashboard,
  getDepartmentAdminDashboard,
  getCityAdminDashboard,
  getMayorDashboard,
} from "../controllers/dashboardController";
import { protect } from "../middlewares/authMiddleware";
import { restrictTo } from "../middlewares/roleMiddleware";

const router = express.Router();

// All routes require authentication
router.use(protect);

// 👷 STEP 5.1: Employee Dashboard
router.get(
  "/employee",
  restrictTo("DEPARTMENT_EMPLOYEE", "DEPARTMENT_ADMIN"),
  getEmployeeDashboard
);

// 🏛️ STEP 5.2: Ward Officer Dashboard
router.get(
  "/ward-officer",
  restrictTo("WARD_OFFICER", "CITY_ADMIN", "SUPER_ADMIN"),
  getWardOfficerDashboard
);

// 🏢 STEP 5.3: Department Admin Dashboard
router.get(
  "/department-admin",
  restrictTo("DEPARTMENT_ADMIN"),
  getDepartmentAdminDashboard
);

// 🏙️ STEP 5.4: City Admin Dashboard
router.get(
  "/city-admin",
  restrictTo("CITY_ADMIN", "SUPER_ADMIN"),
  getCityAdminDashboard
);

// 👔 STEP 5.5: Mayor Dashboard (High-level)
router.get(
  "/mayor",
  restrictTo("SUPER_ADMIN"), // Highest access
  getMayorDashboard
);

export default router;