//Purpose:
//Defines /api/auth/register and /api/auth/login endpoints.


import express from "express";
import { registerUser, loginUser } from "../controllers/authController";
//import { protect, authorize } from "../middlewares/authMiddleware";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
//router.get("/getUsers", getUsers);

export default router;

