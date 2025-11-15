// src/controllers/userController.ts

import { Request, Response } from "express";
import prisma from "../prisma/client";
import { hashPassword, comparePassword } from "../utils/auth";
import { asyncHandler } from "../middlewares/asyncHandler";

interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
  };
}

// @desc    Change user password
// @route   PUT /api/users/change-password
// @access  Private
export const changePassword = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user?.id;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: "Please provide old and new passwords" });
    }

    if (!userId) {
      return res.status(401).json({ message: "Not authorized" });
    }

    // 1. Find the user
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // 2. Check if old password matches
    const isMatch = await comparePassword(oldPassword, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials (Old password incorrect)" });
    }

    // 3. Hash and save the new password
    const hashedNewPassword = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword },
    });

    res.status(200).json({ success: true, message: "Password updated successfully" });
  }
);