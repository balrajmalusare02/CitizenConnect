import express from "express";
import { getDomains } from "../controllers/domainController";
import { protect } from "../middlewares/authMiddleware";

const router = express.Router();

/**
 * @swagger
 * /api/domains:
 *   get:
 *     summary: Get all domains and categories for dropdowns
 *     tags: [Domains]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of domains
 */
// No role restriction: both citizens & admins can access this for dropdowns
router.get("/", protect, getDomains);

export default router;
