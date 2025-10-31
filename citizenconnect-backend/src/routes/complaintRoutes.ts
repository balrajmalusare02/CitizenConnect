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

// 📤 Raise complaint with optional media upload
router.post("/raise", protect, upload.single("media"), raiseComplaint);

// 📋 Get complaints by role/filters
router.get("/view", protect, getComplaintsByRole);

// 📜 Get all complaints
router.get("/", getAllComplaints);

// 🔍 Get complaint by ID
router.get("/:id", getComplaintById);

// ✏️ Update complaint (citizen - before admin review only)
router.put("/:id", protect, upload.single("media"), updateComplaint);

// 🗑️ Delete complaint (citizen - before admin review only)
router.delete("/:id", protect, deleteComplaint);

// ⚙️ Update complaint status (officials only)
router.put(
  "/:id/status",
  protect,
  restrictTo("WARD_OFFICER", "DEPARTMENT_ADMIN", "CITY_ADMIN", "SUPER_ADMIN", "MAYOR"),
  updateComplaintStatus
);

export default router;