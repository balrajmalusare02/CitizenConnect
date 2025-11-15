// src/routes/userRoutes.ts

import express from "express";
import { changePassword } from "../controllers/userController";
import { protect } from "../middlewares/authMiddleware";

const router = express.Router();

// All routes in this file are protected
router.use(protect);

router.put("/change-password", changePassword);

export default router;