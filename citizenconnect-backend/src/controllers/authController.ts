/*Purpose:
Handles registerUser and loginUser logic.
Hashes passwords on registration, verifies during login.
Returns JWT token for authenticated sessions. */


import { Request, Response } from "express";
import prisma from "../prisma/client";
import { hashPassword, comparePassword, generateToken } from "../utils/auth";
import { asyncHandler } from "../middlewares/asyncHandler";

// ----------------------
// USER REGISTRATION
// ----------------------
export const registerUser = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password, role } = req.body;

  // Check if user exists
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return res.status(400).json({ success: false, message: "User already exists" });
  }

  // Hash password and create new user
  const hashedPassword = await hashPassword(password);
  const newUser = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role: role || "CITIZEN",
    },
  });

  // Generate JWT token
  const token = generateToken(newUser.id, newUser.role);

  res.status(201).json({
    success: true,
    message: "User registered successfully",
    data: {
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
      token,
    },
  });
});

// ----------------------
// USER LOGIN
// ----------------------
export const loginUser = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  // Find user
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  // Compare password
  const isMatch = await comparePassword(password, user.password);
  if (!isMatch) {
    return res.status(401).json({ success: false, message: "Invalid credentials" });
  }

  // Generate token
  const token = generateToken(user.id, user.role);

  res.status(200).json({
    success: true,
    message: "Login successful",
    data: {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
    },
  });
});
