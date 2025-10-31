/*
 * Assignment Controller
 * Location: src/controllers/assignmentController.ts
 * Purpose: Handle complaint assignment to departments and employees
 */

import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { io } from "../app";

// ✅ FIX: Proper interface extending Express Request
interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    email: string;
    name: string;
    role: string;
    department?: string;
  };
}

const prisma = new PrismaClient();

// 📌 Assign Complaint to Employee
export const assignComplaint = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { assignedToId, department } = req.body;
    const admin = req.user;

    if (!admin) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Only admins can assign complaints
    if (!["CITY_ADMIN", "SUPER_ADMIN", "DEPARTMENT_ADMIN"].includes(admin.role)) {
      return res.status(403).json({ 
        message: "Access denied - Only admins can assign complaints" 
      });
    }

    // Validate required fields
    if (!assignedToId) {
      return res.status(400).json({ 
        message: "assignedToId is required" 
      });
    }

    // Check if complaint exists
    const complaint = await prisma.complaint.findUnique({
      where: { id: parseInt(id) },
      include: { user: true },
    });

    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    // Check if assigned user exists
    const assignedUser = await prisma.user.findUnique({
      where: { id: parseInt(assignedToId) },
      select: { id: true, name: true, email: true, department: true }
    });

    if (!assignedUser) {
      return res.status(404).json({ message: "Assigned user not found" });
    }

    // Department admins can only assign within their department
    if (admin.role === "DEPARTMENT_ADMIN") {
      if (assignedUser.department !== admin.department) {
        return res.status(403).json({ 
          message: "You can only assign complaints to employees in your department" 
        });
      }
    }

    // Update complaint with assignment
    const updatedComplaint = await prisma.complaint.update({
      where: { id: parseInt(id) },
      data: {
        assignedTo: { connect: { id: parseInt(assignedToId) } },
        assignedBy: { connect: { id: admin.id } },
        assignedAt: new Date(),
        department: department || assignedUser.department || complaint.department,
        status: complaint.status === "Raised" ? "Acknowledged" : complaint.status,
        statusUpdates: {
          create: {
            status: complaint.status === "Raised" ? "Acknowledged" : complaint.status,
            remarks: `Assigned to ${assignedUser.name} by ${admin.name}`,
          },
        },
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        assignedTo: { select: { id: true, name: true, email: true, department: true } },
        assignedBy: { select: { id: true, name: true, email: true } },
        statusUpdates: true,
      },
    });

    // ✅ Emit socket notification to assigned employee
    io.to(`user:${assignedToId}`).emit("complaint-assigned", {
      message: `You have been assigned a new complaint: "${complaint.title}"`,
      complaint: updatedComplaint,
      assignedBy: admin.name,
      timestamp: new Date(),
    });

    // ✅ Notify complaint creator
    io.to(`user:${complaint.userId}`).emit("complaint-status-updated", {
      message: `Your complaint has been assigned to ${assignedUser.name}`,
      complaint: updatedComplaint,
      timestamp: new Date(),
    });

    console.log(`📢 Complaint #${id} assigned to user ${assignedToId}`);

    return res.status(200).json({
      message: `Complaint assigned to ${assignedUser.name} successfully`,
      complaint: updatedComplaint,
    });
  } catch (error) {
    console.error("Error assigning complaint:", error);
    return res.status(500).json({ message: "Failed to assign complaint" });
  }
};

// 📋 Get Complaints Assigned to Current User
export const getMyAssignedComplaints = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const complaints = await prisma.complaint.findMany({
      where: { assignedToId: user.id },
      include: {
        user: { select: { id: true, name: true, email: true } },
        assignedBy: { select: { id: true, name: true, email: true } },
        statusUpdates: true,
      },
      orderBy: { assignedAt: "desc" },
    });

    return res.status(200).json({
      message: "Assigned complaints fetched successfully",
      count: complaints.length,
      complaints,
    });
  } catch (error) {
    console.error("Error fetching assigned complaints:", error);
    return res.status(500).json({ message: "Failed to fetch assigned complaints" });
  }
};

// 🔄 Reassign Complaint to Another Employee
export const reassignComplaint = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { newAssignedToId } = req.body;
    const admin = req.user;

    if (!admin) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Only admins can reassign
    if (!["CITY_ADMIN", "SUPER_ADMIN", "DEPARTMENT_ADMIN"].includes(admin.role)) {
      return res.status(403).json({ 
        message: "Access denied - Only admins can reassign complaints" 
      });
    }

    if (!newAssignedToId) {
      return res.status(400).json({ message: "newAssignedToId is required" });
    }

    // Check if complaint exists
    const complaint = await prisma.complaint.findUnique({
      where: { id: parseInt(id) },
      include: { assignedTo: true },
    });

    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    // Check if new assigned user exists
    const newAssignedUser = await prisma.user.findUnique({
      where: { id: parseInt(newAssignedToId) },
    });

    if (!newAssignedUser) {
      return res.status(404).json({ message: "New assigned user not found" });
    }

    const oldAssignedTo = complaint.assignedTo;

    // Update assignment
    const updatedComplaint = await prisma.complaint.update({
      where: { id: parseInt(id) },
      data: {
        assignedToId: parseInt(newAssignedToId),
        assignedById: admin.id,
        assignedAt: new Date(),
        statusUpdates: {
          create: {
            status: complaint.status,
            remarks: `Reassigned from ${oldAssignedTo?.name || "unassigned"} to ${newAssignedUser.name}`,
          },
        },
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        assignedTo: { select: { id: true, name: true, email: true, department: true } },
        assignedBy: { select: { id: true, name: true, email: true } },
        statusUpdates: true,
      },
    });

    // ✅ Notify new assignee
    io.to(`user:${newAssignedToId}`).emit("complaint-assigned", {
      message: `You have been assigned complaint: "${complaint.title}"`,
      complaint: updatedComplaint,
      assignedBy: admin.name,
      timestamp: new Date(),
    });

    // ✅ Notify old assignee (if exists)
    if (oldAssignedTo) {
      io.to(`user:${oldAssignedTo.id}`).emit("complaint-unassigned", {
        message: `Complaint "${complaint.title}" has been reassigned`,
        complaintId: complaint.id,
        timestamp: new Date(),
      });
    }

    console.log(`📢 Complaint #${id} reassigned to user ${newAssignedToId}`);

    return res.status(200).json({
      message: `Complaint reassigned to ${newAssignedUser.name} successfully`,
      complaint: updatedComplaint,
    });
  } catch (error) {
    console.error("Error reassigning complaint:", error);
    return res.status(500).json({ message: "Failed to reassign complaint" });
  }
};

// ❌ Unassign Complaint
export const unassignComplaint = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const admin = req.user;

    if (!admin) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Only admins can unassign
    if (!["CITY_ADMIN", "SUPER_ADMIN", "DEPARTMENT_ADMIN"].includes(admin.role)) {
      return res.status(403).json({ 
        message: "Access denied - Only admins can unassign complaints" 
      });
    }

    // Check if complaint exists
    const complaint = await prisma.complaint.findUnique({
      where: { id: parseInt(id) },
      include: { assignedTo: true },
    });

    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    const oldAssignedTo = complaint.assignedTo;

    // Remove assignment
    const updatedComplaint = await prisma.complaint.update({
      where: { id: parseInt(id) },
      data: {
        assignedToId: null,
        assignedById: null,
        assignedAt: null,
        statusUpdates: {
          create: {
            status: complaint.status,
            remarks: `Unassigned by ${admin.name}`,
          },
        },
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        statusUpdates: true,
      },
    });

    // ✅ Notify previous assignee
    if (oldAssignedTo) {
      io.to(`user:${oldAssignedTo.id}`).emit("complaint-unassigned", {
        message: `Complaint "${complaint.title}" has been unassigned from you`,
        complaintId: complaint.id,
        timestamp: new Date(),
      });
    }

    console.log(`📢 Complaint #${id} unassigned`);

    return res.status(200).json({
      message: "Complaint unassigned successfully",
      complaint: updatedComplaint,
    });
  } catch (error) {
    console.error("Error unassigning complaint:", error);
    return res.status(500).json({ message: "Failed to unassign complaint" });
  }
};