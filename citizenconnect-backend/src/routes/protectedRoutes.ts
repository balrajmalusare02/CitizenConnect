import express from "express";
import { protect } from "../middlewares/authMiddleware";

const router = express.Router();

router.get("/profile", protect, (req: any, res) => {
  res.json({
    success: true,
    message: "Access granted to protected route",
    user: req.user,
  });
});

export default router;
