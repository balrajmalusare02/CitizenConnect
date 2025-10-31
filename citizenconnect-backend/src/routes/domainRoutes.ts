import express from "express";
import { getDomains } from "../controllers/domainController";
import { protect } from "../middlewares/authMiddleware";

const router = express.Router();

// No role restriction: both citizens & admins can access this for dropdowns
router.get("/", protect, getDomains);

export default router;
