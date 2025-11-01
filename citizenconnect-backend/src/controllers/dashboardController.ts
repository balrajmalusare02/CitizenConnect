/*
 * Dashboard Controller
 * Location: src/controllers/dashboardController.ts
 * Purpose: Role-based dashboards for all admin types
 */

import { Request, Response } from "express";
import { PrismaClient, ComplaintStatus } from "@prisma/client";

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

// 👷 STEP 5.1: Employee Dashboard
export const getEmployeeDashboard = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Only for employees
    if (user.role !== "DEPARTMENT_EMPLOYEE" && user.role !== "DEPARTMENT_ADMIN") {
      return res.status(403).json({ message: "Access denied - Employee access only" });
    }

    // Get assigned complaints
    const assignedComplaints = await prisma.complaint.findMany({
      where: { assignedToId: user.id },
      include: {
        user: { select: { id: true, name: true, email: true } },
        statusUpdates: { 
          orderBy: { updatedAt: "desc" },
          take: 3 
        },
      },
      orderBy: { assignedAt: "desc" },
    });

    // Stats
    const totalAssigned = assignedComplaints.length;
    const active = assignedComplaints.filter(
      c => c.status !== ComplaintStatus.Resolved && c.status !== ComplaintStatus.Closed
    ).length;
    const resolved = assignedComplaints.filter(
      c => c.status === ComplaintStatus.Resolved || c.status === ComplaintStatus.Closed
    ).length;

    // Status breakdown
    const byStatus = {
      raised: assignedComplaints.filter(c => c.status === ComplaintStatus.Raised).length,
      acknowledged: assignedComplaints.filter(c => c.status === ComplaintStatus.Acknowledged).length,
      inProgress: assignedComplaints.filter(c => c.status === ComplaintStatus.InProgress).length,
      resolved: assignedComplaints.filter(c => c.status === ComplaintStatus.Resolved).length,
      closed: assignedComplaints.filter(c => c.status === ComplaintStatus.Closed).length,
    };

    // Recent assignments (last 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const recentAssignments = assignedComplaints.filter(
      c => c.assignedAt && new Date(c.assignedAt) >= weekAgo
    ).length;

    // Calculate resolution rate
    const resolutionRate = totalAssigned > 0 
      ? ((resolved / totalAssigned) * 100).toFixed(2) 
      : "0";

    res.status(200).json({
      employee: {
        id: user.id,
        name: user.name,
        email: user.email,
        department: user.department,
      },
      summary: {
        totalAssigned,
        active,
        resolved,
        resolutionRate: `${resolutionRate}%`,
        recentAssignments,
      },
      statusBreakdown: byStatus,
      complaints: assignedComplaints,
    });
  } catch (error) {
    console.error("Error fetching employee dashboard:", error);
    res.status(500).json({ message: "Failed to fetch employee dashboard" });
  }
};

// 🏛️ STEP 5.2: Ward Officer Dashboard
export const getWardOfficerDashboard = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user;
    const { ward } = req.query;

    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    let targetWard: string | undefined;

    if (user.role === "WARD_OFFICER") {
      targetWard = (user as any).ward; // A Ward Officer can ONLY see their own ward
    } else if (user.role === "CITY_ADMIN" || user.role === "SUPER_ADMIN") {
      targetWard = ward as string; // Admins can look up any ward
    }

    // Validate ward access
    if (!targetWard) {
      return res.status(400).json({ 
        message: "A ward must be assigned to your user or provided as a 'ward' query parameter." 
      });
    }
    // Get ward complaints
    const wardComplaints = await prisma.complaint.findMany({
      where: { ward: String(ward) },
      include: {
        user: { select: { id: true, name: true, email: true } },
        assignedTo: { select: { id: true, name: true, department: true } },
        statusUpdates: { 
          orderBy: { updatedAt: "desc" },
          take: 1 
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Stats
    const total = wardComplaints.length;
    const active = wardComplaints.filter(
      c => c.status !== ComplaintStatus.Resolved && c.status !== ComplaintStatus.Closed
    ).length;
    const resolved = wardComplaints.filter(
      c => c.status === ComplaintStatus.Resolved || c.status === ComplaintStatus.Closed
    ).length;

    // By status
    const byStatus = {
      raised: wardComplaints.filter(c => c.status === ComplaintStatus.Raised).length,
      acknowledged: wardComplaints.filter(c => c.status === ComplaintStatus.Acknowledged).length,
      inProgress: wardComplaints.filter(c => c.status === ComplaintStatus.InProgress).length,
      resolved: wardComplaints.filter(c => c.status === ComplaintStatus.Resolved).length,
      closed: wardComplaints.filter(c => c.status === ComplaintStatus.Closed).length,
    };

    // By domain
    const byDomain: { [key: string]: number } = {};
    wardComplaints.forEach(c => {
      byDomain[c.domain] = (byDomain[c.domain] || 0) + 1;
    });

    // Recent complaints (last 24 hours)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const recentComplaints = wardComplaints.filter(
      c => new Date(c.createdAt) >= yesterday
    ).length;

    res.status(200).json({
      ward: String(ward),
      officer: {
        name: user.name,
        email: user.email,
      },
      summary: {
        total,
        active,
        resolved,
        recentComplaints,
      },
      statusBreakdown: byStatus,
      domainBreakdown: byDomain,
      complaints: wardComplaints,
    });
  } catch (error) {
    console.error("Error fetching ward officer dashboard:", error);
    res.status(500).json({ message: "Failed to fetch ward officer dashboard" });
  }
};

// 🏢 STEP 5.3: Department Admin Dashboard
export const getDepartmentAdminDashboard = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (user.role !== "DEPARTMENT_ADMIN") {
      return res.status(403).json({ message: "Access denied - Department Admin only" });
    }

    if (!user.department) {
      return res.status(400).json({ message: "Department not assigned to user" });
    }

    // Get department complaints
    const departmentComplaints = await prisma.complaint.findMany({
      where: { department: user.department },
      include: {
        user: { select: { id: true, name: true, email: true } },
        assignedTo: { select: { id: true, name: true } },
        statusUpdates: { 
          orderBy: { updatedAt: "desc" },
          take: 1 
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Get department employees
    const employees = await prisma.user.findMany({
      where: {
        department: user.department,
        role: { in: ["DEPARTMENT_EMPLOYEE", "DEPARTMENT_ADMIN"] },
      },
      include: {
        _count: {
          select: {
            assignedComplaints: true,
          },
        },
      },
    });

    // Employee performance
    const employeeStats = employees.map(emp => {
      const assigned = departmentComplaints.filter(c => c.assignedToId === emp.id).length;
      const resolved = departmentComplaints.filter(
        c => c.assignedToId === emp.id && 
        (c.status === ComplaintStatus.Resolved || c.status === ComplaintStatus.Closed)
      ).length;

      return {
        id: emp.id,
        name: emp.name,
        email: emp.email,
        role: emp.role,
        assignedComplaints: assigned,
        resolvedComplaints: resolved,
        resolutionRate: assigned > 0 ? ((resolved / assigned) * 100).toFixed(2) + "%" : "0%",
      };
    });

    // Department stats
    const total = departmentComplaints.length;
    const active = departmentComplaints.filter(
      c => c.status !== ComplaintStatus.Resolved && c.status !== ComplaintStatus.Closed
    ).length;
    const resolved = departmentComplaints.filter(
      c => c.status === ComplaintStatus.Resolved || c.status === ComplaintStatus.Closed
    ).length;
    const unassigned = departmentComplaints.filter(c => !c.assignedToId).length;

    // By status
    const byStatus = {
      raised: departmentComplaints.filter(c => c.status === ComplaintStatus.Raised).length,
      acknowledged: departmentComplaints.filter(c => c.status === ComplaintStatus.Acknowledged).length,
      inProgress: departmentComplaints.filter(c => c.status === ComplaintStatus.InProgress).length,
      resolved: departmentComplaints.filter(c => c.status === ComplaintStatus.Resolved).length,
      closed: departmentComplaints.filter(c => c.status === ComplaintStatus.Closed).length,
    };

    res.status(200).json({
      department: user.department,
      admin: {
        name: user.name,
        email: user.email,
      },
      summary: {
        total,
        active,
        resolved,
        unassigned,
        totalEmployees: employees.length,
      },
      statusBreakdown: byStatus,
      employees: employeeStats,
      complaints: departmentComplaints,
    });
  } catch (error) {
    console.error("Error fetching department admin dashboard:", error);
    res.status(500).json({ message: "Failed to fetch department admin dashboard" });
  }
};

// 🏙️ STEP 5.4: City Admin Dashboard
export const getCityAdminDashboard = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (user.role !== "CITY_ADMIN" && user.role !== "SUPER_ADMIN") {
      return res.status(403).json({ message: "Access denied - City Admin only" });
    }

    // All complaints
    const allComplaints = await prisma.complaint.findMany({
      include: {
        user: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, name: true, department: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // Overall stats
    const total = allComplaints.length;
    const active = allComplaints.filter(
      c => c.status !== ComplaintStatus.Resolved && c.status !== ComplaintStatus.Closed
    ).length;
    const resolved = allComplaints.filter(
      c => c.status === ComplaintStatus.Resolved || c.status === ComplaintStatus.Closed
    ).length;

    // By status
    const byStatus = {
      raised: allComplaints.filter(c => c.status === ComplaintStatus.Raised).length,
      acknowledged: allComplaints.filter(c => c.status === ComplaintStatus.Acknowledged).length,
      inProgress: allComplaints.filter(c => c.status === ComplaintStatus.InProgress).length,
      resolved: allComplaints.filter(c => c.status === ComplaintStatus.Resolved).length,
      closed: allComplaints.filter(c => c.status === ComplaintStatus.Closed).length,
    };

    // By department
    const byDepartment: { [key: string]: number } = {};
    allComplaints.forEach(c => {
      const dept = c.department || "Unassigned";
      byDepartment[dept] = (byDepartment[dept] || 0) + 1;
    });

    // By domain
    const byDomain: { [key: string]: number } = {};
    allComplaints.forEach(c => {
      byDomain[c.domain] = (byDomain[c.domain] || 0) + 1;
    });

    // Recent activity (last 24 hours)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const recentComplaints = allComplaints.filter(
      c => new Date(c.createdAt) >= yesterday
    ).length;

    // Average resolution time
    const resolvedWithTime = allComplaints.filter(c => c.resolvedAt);
    let avgResolutionHours = 0;
    if (resolvedWithTime.length > 0) {
      const totalTime = resolvedWithTime.reduce((sum, c) => {
        const time = new Date(c.resolvedAt!).getTime() - new Date(c.createdAt).getTime();
        return sum + time;
      }, 0);
      avgResolutionHours = Math.floor(totalTime / resolvedWithTime.length / (1000 * 60 * 60));
    }

    res.status(200).json({
      admin: {
        name: user.name,
        role: user.role,
      },
      summary: {
        total,
        active,
        resolved,
        recentComplaints,
        avgResolutionHours,
      },
      statusBreakdown: byStatus,
      departmentBreakdown: byDepartment,
      domainBreakdown: byDomain,
      complaints: allComplaints.slice(0, 50), // Latest 50 for performance
    });
  } catch (error) {
    console.error("Error fetching city admin dashboard:", error);
    res.status(500).json({ message: "Failed to fetch city admin dashboard" });
  }
};

// 👔 STEP 5.5: Mayor Dashboard (High-level Analytics)
export const getMayorDashboard = async (req: Request, res: Response) => {
  try {
    // High-level city-wide stats
    const total = await prisma.complaint.count();

    // By status
    const byStatus = await prisma.complaint.groupBy({
      by: ["status"],
      _count: true,
    });

    const statusStats = {
      raised: byStatus.find(s => s.status === ComplaintStatus.Raised)?._count || 0,
      acknowledged: byStatus.find(s => s.status === ComplaintStatus.Acknowledged)?._count || 0,
      inProgress: byStatus.find(s => s.status === ComplaintStatus.InProgress)?._count || 0,
      resolved: byStatus.find(s => s.status === ComplaintStatus.Resolved)?._count || 0,
      closed: byStatus.find(s => s.status === ComplaintStatus.Closed)?._count || 0,
    };

    // Department performance
    const byDepartment = await prisma.complaint.groupBy({
      by: ["department"],
      _count: true,
      orderBy: {
        _count: {
          department: "desc",
        },
      },
    });

    const departmentStats = byDepartment.map(d => ({
      department: d.department || "Unassigned",
      count: d._count,
    }));

    // Monthly trend (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyComplaints = await prisma.complaint.findMany({
      where: {
        createdAt: { gte: sixMonthsAgo },
      },
      select: {
        createdAt: true,
        status: true,
      },
    });

    // Group by month
    const monthlyTrend: { [key: string]: { total: number; resolved: number } } = {};
    monthlyComplaints.forEach(c => {
      const month = `${c.createdAt.getFullYear()}-${String(c.createdAt.getMonth() + 1).padStart(2, "0")}`;
      if (!monthlyTrend[month]) {
        monthlyTrend[month] = { total: 0, resolved: 0 };
      }
      monthlyTrend[month].total += 1;
      if (c.status === ComplaintStatus.Resolved || c.status === ComplaintStatus.Closed) {
        monthlyTrend[month].resolved += 1;
      }
    });

    // Citizen satisfaction (average rating)
    const feedbacks = await prisma.feedback.findMany({
      select: { rating: true },
    });

    const avgRating = feedbacks.length > 0
      ? (feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length).toFixed(2)
      : "N/A";

    // Top performing departments (by resolution rate)
    const departmentPerformance = await Promise.all(
      departmentStats.slice(0, 5).map(async dept => {
        const total = await prisma.complaint.count({
          where: { department: dept.department },
        });
        const resolved = await prisma.complaint.count({
          where: {
            department: dept.department,
            status: { in: [ComplaintStatus.Resolved, ComplaintStatus.Closed] },
          },
        });
        return {
          department: dept.department,
          total,
          resolved,
          resolutionRate: total > 0 ? ((resolved / total) * 100).toFixed(2) + "%" : "0%",
        };
      })
    );

    res.status(200).json({
      cityOverview: {
        totalComplaints: total,
        activeComplaints: statusStats.raised + statusStats.acknowledged + statusStats.inProgress,
        resolvedComplaints: statusStats.resolved + statusStats.closed,
        citizenSatisfaction: avgRating,
      },
      statusBreakdown: statusStats,
      departmentStats: departmentStats.slice(0, 10),
      departmentPerformance,
      monthlyTrend: Object.entries(monthlyTrend)
        .map(([month, data]) => ({ month, ...data }))
        .sort((a, b) => a.month.localeCompare(b.month)),
    });
  } catch (error) {
    console.error("Error fetching mayor dashboard:", error);
    res.status(500).json({ message: "Failed to fetch mayor dashboard" });
  }
};