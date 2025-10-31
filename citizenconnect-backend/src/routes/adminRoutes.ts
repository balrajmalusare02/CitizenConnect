import express from "express";
import { protect } from "../middlewares/authMiddleware";
import { restrictTo } from "../middlewares/roleMiddleware";
import { Roles } from "../config/roles";

const router = express.Router();

router.get(
  "/dashboard",
  protect,
  restrictTo(Roles.CITY_ADMIN, Roles.SUPER_ADMIN, Roles.MAYOR),
  (req: any, res) => {
    res.json({
      message: `Welcome ${req.user.name}! You have admin access.`,
      role: req.user.role,
    });
  }
);

export default router;
