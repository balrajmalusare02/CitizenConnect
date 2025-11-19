import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import { io } from "../app";
import cloudinary from "../config/cloudinaryConfig";
import {
  isValidStatusTransition,
  getNextPossibleStatuses,
  getStatusProgressPercentage,
} from "../utils/statusValidation";
import { createAndEmitNotification } from "../utils/notificationService";

interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    email: string;
    name?: string;
    role?: string;
  };
  file?: Express.Multer.File;
}

const prisma = new PrismaClient();

// ✅ Helper function to get department from domain/category
const getDepartmentFromDomainCategory = async (domain: string, category: string): Promise<string | null> => {
  try {
    const mapping = await prisma.domainCategory.findFirst({
      where: {
        domain,
        category,
      },
    });
    return mapping?.department || null;
  } catch (error) {
    console.error("Error fetching department mapping:", error);
    return null;
  }
};

// ✅ Helper function to find least busy employee in department
const findAvailableEmployee = async (department: string): Promise<number | null> => {
  try {
    // Find all employees in the department
    const employees = await prisma.user.findMany({
      where: {
        department,
        role: {
          in: ["DEPARTMENT_EMPLOYEE", "DEPARTMENT_ADMIN"],
        },
      },
      include: {
        _count: {
          select: {
            assignedComplaints: {
              where: {
                status: {
                  notIn: ["Resolved", "Closed"],
                },
              },
            },
          },
        },
      },
    });

    if (employees.length === 0) {
      return null;
    }

    // Find employee with least active complaints
    const leastBusyEmployee = employees.reduce((prev, current) => {
      return prev._count.assignedComplaints < current._count.assignedComplaints ? prev : current;
    });

    return leastBusyEmployee.id;
  } catch (error) {
    console.error("Error finding available employee:", error);
    return null;
  }
};

// 🆕 Raise a Complaint (with auto-assignment + media upload)
export const raiseComplaint = async (req: AuthenticatedRequest, res: Response) => {
  try {

    // --- DEBUG LOGS (Add these lines) ---
    console.log("🚀 DEPLOYMENT CHECK: v3.0 - Wrapper Fix Is Active"); 
    console.log("📍 Received Location Body:", req.body.location);
    console.log("📍 Type of Location:", typeof req.body.location);
    // ------------------------------------
    const { 
      title, 
      description, 
      domain, 
      category, 
      location,
      latitude,      // ✅ NEW
      longitude,     // ✅ NEW
      ward,          // ✅ NEW
      zone,          // ✅ NEW
      district       // ✅ NEW
    } = req.body;
    const userId = req.user?.id;
    
    // ✅ NEW: Get media URL from uploaded file (if exists)
    const mediaUrl = req.file ? req.file.path : null;

    console.log("User from token:", req.user);
    console.log("User ID:", userId);
    console.log("Media uploaded:", mediaUrl);

    console.log("RECEIVED BODY:", req.body);
    
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized - User not authenticated" });
    }

    if (!title || !description || !domain || !category) {
      return res.status(400).json({ message: "All fields are required!" });
    }

    // ✅ Validate geo-coordinates if provided
    if (latitude && (latitude < -90 || latitude > 90)) {
      return res.status(400).json({ message: "Invalid latitude. Must be between -90 and 90" });
    }
    if (longitude && (longitude < -180 || longitude > 180)) {
      return res.status(400).json({ message: "Invalid longitude. Must be between -180 and 180" });
    }

    // ✅ Auto-determine department from domain/category
    const department = await getDepartmentFromDomainCategory(domain, category);
    
    if (!department) {
      console.warn(`⚠️ No department mapping found for domain: ${domain}, category: ${category}`);
    } else {
      console.log(`✅ Auto-assigned department: ${department}`);
    }

    // ✅ Try to auto-assign to an available employee
    let autoAssignedEmployeeId: number | null = null;
    if (department) {
      autoAssignedEmployeeId = await findAvailableEmployee(department);
      if (autoAssignedEmployeeId) {
        console.log(`✅ Auto-assigned to employee ID: ${autoAssignedEmployeeId}`);
      }
    }

    // Create complaint with auto-assignment
    const complaint = await prisma.complaint.create({
      data: {
        title,
        description,
        domain,
        category,
        mediaUrl,
        location: location ? { address: location } as any : undefined,
        // ✅ NEW: Geo fields
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        ward: ward || null,
        zone: zone || null,
        district: district || null,
        department,
        status: autoAssignedEmployeeId ? "Acknowledged" : "Raised",
        userId,
        assignedToId: autoAssignedEmployeeId,
        assignedAt: autoAssignedEmployeeId ? new Date() : null,
        acknowledgedAt: autoAssignedEmployeeId ? new Date() : null,
        statusUpdates: autoAssignedEmployeeId ? {
          create: {
            status: autoAssignedEmployeeId ? "Acknowledged" : "Raised",
            remarks: autoAssignedEmployeeId ? "Auto-assigned by system" : "Complaint raised by citizen",
          },
        } : undefined,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        assignedTo: { select: { id: true, name: true, email: true, department: true } },
      },
    });

    // ✅ Emit notification to admins
    io.to("role:CITY_ADMIN").emit("new-complaint", {
      message: `New complaint raised by ${req.user?.name}`,
      complaint,
      timestamp: new Date(),
    });

    io.to("role:SUPER_ADMIN").emit("new-complaint", {
      message: `New complaint raised by ${req.user?.name}`,
      complaint,
      timestamp: new Date(),
    });

    // Find all admins to create a notification for them
    const admins = await prisma.user.findMany({
      where: {
        role: { in: ["CITY_ADMIN", "SUPER_ADMIN"] }
      },
      select: { id: true }
    });

    // Create a notification for each admin
    for (const admin of admins) {
      await createAndEmitNotification(
        admin.id,
        `New complaint #${complaint.id} ("${complaint.title}") raised by a citizen.`,
        complaint.id,
        "new-notification" // This will also send the socket alert
      );
    }

    // ✅ If auto-assigned, notify the employee
    if (autoAssignedEmployeeId) {
      io.to(`user:${autoAssignedEmployeeId}`).emit("complaint-assigned", {
        message: `You have been auto-assigned a new complaint: "${title}"`,
        complaint,
        assignedBy: "System (Auto-assignment)",
        timestamp: new Date(),
      });
      console.log(`📢 Notification sent to employee ${autoAssignedEmployeeId}`);
    }

    console.log("📢 Notification sent to admins about new complaint");

    return res.status(201).json({
      message: "Complaint raised successfully ✅",
      complaint,
      autoAssigned: !!autoAssignedEmployeeId,
      department: department || "Not mapped",
      mediaUploaded: !!mediaUrl,
      geoLocationAdded: !!(latitude && longitude),
    });
  } catch (error) {
    console.error("Error raising complaint:", error);
    return res.status(500).json({ message: "Failed to raise complaint" });
  }
};

// ✏️ NEW: Update Complaint (citizen can edit before admin review)
export const updateComplaint = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, domain, category, location } = req.body;
    const userId = req.user?.id;
    const mediaUrl = req.file ? req.file.path : undefined;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Check if complaint exists and belongs to user
    const existingComplaint = await prisma.complaint.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingComplaint) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    // Only owner can edit
    if (existingComplaint.userId !== userId) {
      return res.status(403).json({ message: "You can only edit your own complaints" });
    }

    // Can't edit if already reviewed (status changed from "Raised")
    if (existingComplaint.status !== "Raised") {
      return res.status(403).json({ 
        message: "Cannot edit complaint - already under review by admin" 
      });
    }

    // Delete old media from Cloudinary if new media uploaded
    if (mediaUrl && existingComplaint.mediaUrl) {
      try {
        const publicId = existingComplaint.mediaUrl.split("/").pop()?.split(".")[0];
        if (publicId) {
          await cloudinary.uploader.destroy(`citizenconnect/complaints/${publicId}`);
        }
      } catch (error) {
        console.error("Error deleting old media:", error);
      }
    }

    // Update complaint
    const updatedComplaint = await prisma.complaint.update({
      where: { id: parseInt(id) },
      data: {
        ...(title && { title }),
        ...(description && { description }),
        ...(domain && { domain }),
        ...(category && { category }),
        ...(location && { location }),
        ...(mediaUrl && { mediaUrl }),
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    return res.status(200).json({
      message: "Complaint updated successfully ✅",
      complaint: updatedComplaint,
    });
  } catch (error) {
    console.error("Error updating complaint:", error);
    return res.status(500).json({ message: "Failed to update complaint" });
  }
};

// 🗑️ NEW: Delete Complaint (citizen can delete before admin review)
export const deleteComplaint = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Check if complaint exists and belongs to user
    const existingComplaint = await prisma.complaint.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingComplaint) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    // Only owner can delete
    if (existingComplaint.userId !== userId) {
      return res.status(403).json({ message: "You can only delete your own complaints" });
    }

    // Can't delete if already reviewed
    if (existingComplaint.status !== "Raised") {
      return res.status(403).json({ 
        message: "Cannot delete complaint - already under review by admin" 
      });
    }

    // Delete media from Cloudinary if exists
    if (existingComplaint.mediaUrl) {
      try {
        const publicId = existingComplaint.mediaUrl.split("/").pop()?.split(".")[0];
        if (publicId) {
          await cloudinary.uploader.destroy(`citizenconnect/complaints/${publicId}`);
        }
      } catch (error) {
        console.error("Error deleting media:", error);
      }
    }

    // Delete complaint
    await prisma.complaint.delete({
      where: { id: parseInt(id) },
    });

    return res.status(200).json({
      message: "Complaint deleted successfully ✅",
    });
  } catch (error) {
    console.error("Error deleting complaint:", error);
    return res.status(500).json({ message: "Failed to delete complaint" });
  }
};

// 📜 Get All Complaints
export const getAllComplaints = async (req: Request, res: Response) => {
  try {
    const complaints = await prisma.complaint.findMany({
      include: { statusUpdates: true, user: true },
      orderBy: { createdAt: "desc" },
    });

    res.status(200).json(complaints);
  } catch (error) {
    console.error("Error fetching complaints:", error);
    res.status(500).json({ message: "Failed to fetch complaints" });
  }
};

// 🔍 Get Complaint by ID
export const getComplaintById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const complaint = await prisma.complaint.findUnique({
      where: { id: parseInt(id) },
      include: { statusUpdates: true, user: true },
    });

    if (!complaint) return res.status(404).json({ message: "Complaint not found" });

    // ✅ FIXED: Actually include the values in response
    const progressPercentage = getStatusProgressPercentage(complaint.status);
    const nextPossibleStatuses = getNextPossibleStatuses(complaint.status);
    
        res.status(200).json({
      ...complaint,
      progressPercentage,
      nextPossibleStatuses,
    });
  } catch (error) {
    console.error("Error fetching complaint:", error);
    res.status(500).json({ message: "Failed to fetch complaint" });
  }
};

// 🧾 Get Complaints by User Role or Filters
export const getComplaintsByRole = async (req: any, res: Response) => {
  try {
    const user = req.user;
    const { domain, category, status } = req.query;

    // Build filter dynamically
    const whereClause: any = {};
    if (domain) whereClause.domain = String(domain);
    if (category) whereClause.category = String(category);
    if (status) whereClause.status = String(status);

    // Role-based filtering
    if (user.role === "CITIZEN") {
      whereClause.userId = user.id;
    } else if (user.role === "DEPARTMENT_ADMIN" || user.role === "WARD_OFFICER") {
      whereClause.department = user.department || null;
    }
    // CITY_ADMIN, SUPER_ADMIN, MAYOR see all

    const complaints = await prisma.complaint.findMany({
      where: whereClause,
      include: {
        user: { select: { id: true, name: true, email: true } },
        statusUpdates: true,
        feedbacks: true,
        assignedTo: { select: { id: true, name: true } }
      },
      orderBy: { createdAt: "desc" },
    });

    res.status(200).json({
      message: "Complaints fetched successfully",
      count: complaints.length,
      complaints,
    });
  } catch (error) {
    console.error("Error fetching complaints:", error);
    res.status(500).json({ message: "Failed to fetch complaints" });
  }
};

// ⚙️ Update Complaint Status (with tracking & remarks)
export const updateComplaintStatus = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { newStatus, remarks } = req.body;
    const user = req.user;

    if (!newStatus) {
      return res.status(400).json({ message: "New status is required" });
    }

    // 🧠 Allow only admins to update complaint status
    if (!["CITY_ADMIN", "SUPER_ADMIN"].includes(user.role)) {
      return res.status(403).json({ message: "Access denied – only admins can update complaint status" });
    }

    // Check if complaint exists
    const existingComplaint = await prisma.complaint.findUnique({ 
      where: { id: parseInt(id) },
      include: { 
        user: true,
        statusUpdates: true, // ✅ Include statusUpdates so we can access it below
      }
    });
    
    if (!existingComplaint) {
      return res.status(404).json({ message: "Complaint not found" });
    }

 // ✅ NEW: Validate status transition
    const validation = isValidStatusTransition(existingComplaint.status, newStatus);
    
    if (!validation.valid) {
      const nextStatuses = getNextPossibleStatuses(existingComplaint.status);
      return res.status(400).json({ 
        message: validation.message,
        currentStatus: existingComplaint.status,
        allowedNextStatuses: nextStatuses,
      });
    }

    // ✅ NEW: Prepare timestamp field based on new status
    const timestampField: any = {};
    // Define ComplaintStatus enum locally if not imported
    enum ComplaintStatus {
      Acknowledged = "Acknowledged",
      InProgress = "InProgress",
      Resolved = "Resolved",
      Closed = "Closed"
    }
    switch (newStatus) {
      case ComplaintStatus.Acknowledged:
        timestampField.acknowledgedAt = new Date();
        break;
      case ComplaintStatus.InProgress:
        timestampField.inProgressAt = new Date();
        break;
      case ComplaintStatus.Resolved:
        timestampField.resolvedAt = new Date();
        break;
      case ComplaintStatus.Closed:
        timestampField.closedAt = new Date();
        break;
    }


// Update complaint status + create a status update log
const updatedComplaint = await prisma.complaint.update({
  where: { id: parseInt(id) },
  data: {
    status: newStatus,
    ...timestampField,  // ✅ This line should already be there from Step 3.1
    statusUpdates: {
      create: {
        status: newStatus,
        remarks: remarks || `${newStatus} updated by ${user.role}`,
        updatedById: user.id,  // ✅ ADD THIS LINE - Track who made update
        timeSpentInPreviousStatus: existingComplaint.statusUpdates.length > 0  // ✅ ADD THIS BLOCK
          ? Math.floor(
              (new Date().getTime() - 
                new Date(existingComplaint.statusUpdates[existingComplaint.statusUpdates.length - 1].updatedAt).getTime()) / 
                (1000 * 60)
            )
          : null,
      },
    },
  },
  include: { 
    statusUpdates: {
      include: {
        updatedBy: { select: { id: true, name: true, role: true } }  // ✅ ADD THIS - Include who made update
      }
    }, 
    user: true 
  },
});
    // ✅ Emit real-time notification to complaint owner
    await createAndEmitNotification(
      existingComplaint.userId,
      `Your complaint status has been updated to "${newStatus}"`,
      existingComplaint.id,
      "complaint-status-updated"
    );

    // ✅ Emit to complaint-specific room
    io.to(`complaint:${id}`).emit("status-changed", {
      complaintId: parseInt(id),
      newStatus,
      remarks,
      updatedBy: user.name,
      timestamp: new Date(),
    });

    console.log(`📢 Notification sent to user ${existingComplaint.userId} about status update`);

    return res.status(200).json({
      message: `Complaint status updated to "${newStatus}"`,
      complaint: updatedComplaint,
    });
  } catch (error) {
    console.error("Error updating complaint status:", error);
    return res.status(500).json({ message: "Failed to update complaint status" });
  }
};

/* What this does:
Handles creation, fetching, and updating complaints
Automatically records every status change in the StatusUpdate model
Uses Prisma ORM for database communication
✅ Auto-assigns department and employee based on domain/category mapping
✅ NEW: Media upload support (Cloudinary)
✅ NEW: Edit/Delete complaints (before admin review) */