/*
 * Analytics Controller
 * Location: src/controllers/analyticsController.ts
 * Purpose: Provide comprehensive analytics for admins
 */

import { Request, Response } from "express";
import { PrismaClient, ComplaintStatus } from "@prisma/client";

interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    role: string;
    department?: string;
  };
}

const prisma = new PrismaClient();

// 📊 Get Overall Statistics Dashboard
export const getDashboardStats = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user;

    // Build filter based on role
    const whereClause: any = {};
    if (user?.role === "DEPARTMENT_ADMIN" || user?.role === "DEPARTMENT_EMPLOYEE") {
      whereClause.department = user.department;
    }

    // Total complaints
    const totalComplaints = await prisma.complaint.count({ where: whereClause });

    // Complaints by status
    const statusBreakdown = await prisma.complaint.groupBy({
      by: ["status"],
      _count: true,
      where: whereClause,
    });

    const statusStats = {
      raised: statusBreakdown.find(s => s.status === ComplaintStatus.Raised)?._count || 0,
      acknowledged: statusBreakdown.find(s => s.status === ComplaintStatus.Acknowledged)?._count || 0,
      inProgress: statusBreakdown.find(s => s.status === ComplaintStatus.InProgress)?._count || 0,
      resolved: statusBreakdown.find(s => s.status === ComplaintStatus.Resolved)?._count || 0,
      closed: statusBreakdown.find(s => s.status === ComplaintStatus.Closed)?._count || 0,
    };

    // Active complaints (not closed)
    const activeComplaints = totalComplaints - statusStats.closed;

    // Average resolution time
    const resolvedComplaints = await prisma.complaint.findMany({
      where: {
        ...whereClause,
        status: { in: [ComplaintStatus.Resolved, ComplaintStatus.Closed] },
        resolvedAt: { not: null },
      },
      select: {
        createdAt: true,
        resolvedAt: true,
      },
    });

    let avgResolutionTime = 0;
    if (resolvedComplaints.length > 0) {
      const totalTime = resolvedComplaints.reduce((sum, c) => {
        const time = new Date(c.resolvedAt!).getTime() - new Date(c.createdAt).getTime();
        return sum + time;
      }, 0);
      avgResolutionTime = Math.floor(totalTime / resolvedComplaints.length / (1000 * 60 * 60)); // hours
    }

    // Today's complaints
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayComplaints = await prisma.complaint.count({
      where: {
        ...whereClause,
        createdAt: { gte: today },
      },
    });

    // This week's complaints
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);
    const weekComplaints = await prisma.complaint.count({
      where: {
        ...whereClause,
        createdAt: { gte: weekStart },
      },
    });

    // This month's complaints
    const monthStart = new Date();
    monthStart.setDate(1);
    const monthComplaints = await prisma.complaint.count({
      where: {
        ...whereClause,
        createdAt: { gte: monthStart },
      },
    });

    res.status(200).json({
      overview: {
        total: totalComplaints,
        active: activeComplaints,
        closed: statusStats.closed,
        todayNew: todayComplaints,
        thisWeek: weekComplaints,
        thisMonth: monthComplaints,
      },
      statusBreakdown: statusStats,
      averageResolutionTimeHours: avgResolutionTime,
      averageResolutionTimeFormatted: formatHours(avgResolutionTime),
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({ message: "Failed to fetch dashboard statistics" });
  }
};

// 📈 Get Complaints by Category
export const getComplaintsByCategory = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user;

    const whereClause: any = {};
    if (user?.role === "DEPARTMENT_ADMIN" || user?.role === "DEPARTMENT_EMPLOYEE") {
      whereClause.department = user.department;
    }

    const categoryBreakdown = await prisma.complaint.groupBy({
      by: ["category"],
      _count: true,
      where: whereClause,
      orderBy: {
        _count: {
          category: "desc",
        },
      },
    });

    const formattedData = categoryBreakdown.map(item => ({
      category: item.category,
      count: item._count,
    }));

    res.status(200).json({
      categoryBreakdown: formattedData,
      totalCategories: formattedData.length,
    });
  } catch (error) {
    console.error("Error fetching category breakdown:", error);
    res.status(500).json({ message: "Failed to fetch category breakdown" });
  }
};

// 🗺️ Get Complaints by Domain
export const getComplaintsByDomain = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user;

    const whereClause: any = {};
    if (user?.role === "DEPARTMENT_ADMIN" || user?.role === "DEPARTMENT_EMPLOYEE") {
      whereClause.department = user.department;
    }

    const domainBreakdown = await prisma.complaint.groupBy({
      by: ["domain"],
      _count: true,
      where: whereClause,
      orderBy: {
        _count: {
          domain: "desc",
        },
      },
    });

    const formattedData = domainBreakdown.map(item => ({
      domain: item.domain,
      count: item._count,
    }));

    res.status(200).json({
      domainBreakdown: formattedData,
      totalDomains: formattedData.length,
    });
  } catch (error) {
    console.error("Error fetching domain breakdown:", error);
    res.status(500).json({ message: "Failed to fetch domain breakdown" });
  }
};

// 🏢 Get Complaints by Department
export const getComplaintsByDepartment = async (req: Request, res: Response) => {
  try {
    const departmentBreakdown = await prisma.complaint.groupBy({
      by: ["department"],
      _count: true,
      orderBy: {
        _count: {
          department: "desc",
        },
      },
    });

    const formattedData = departmentBreakdown.map(item => ({
      department: item.department || "Unassigned",
      count: item._count,
    }));

    res.status(200).json({
      departmentBreakdown: formattedData,
      totalDepartments: formattedData.length,
    });
  } catch (error) {
    console.error("Error fetching department breakdown:", error);
    res.status(500).json({ message: "Failed to fetch department breakdown" });
  }
};

// 📅 Get Complaints Trend (Time Series)
export const getComplaintsTrend = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { period } = req.query; // "week", "month", "year"
    const user = req.user;

    const whereClause: any = {};
    if (user?.role === "DEPARTMENT_ADMIN" || user?.role === "DEPARTMENT_EMPLOYEE") {
      whereClause.department = user.department;
    }

    let startDate = new Date();
    let groupBy = "day";

    switch (period) {
      case "week":
        startDate.setDate(startDate.getDate() - 7);
        groupBy = "day";
        break;
      case "month":
        startDate.setMonth(startDate.getMonth() - 1);
        groupBy = "day";
        break;
      case "year":
        startDate.setFullYear(startDate.getFullYear() - 1);
        groupBy = "month";
        break;
      default:
        startDate.setDate(startDate.getDate() - 30);
        groupBy = "day";
    }

    whereClause.createdAt = { gte: startDate };

    const complaints = await prisma.complaint.findMany({
      where: whereClause,
      select: {
        createdAt: true,
        status: true,
      },
    });

    // Group by date
    const trendData: { [key: string]: { total: number; resolved: number } } = {};

    complaints.forEach(c => {
      const date = groupBy === "day"
        ? c.createdAt.toISOString().split("T")[0]
        : `${c.createdAt.getFullYear()}-${String(c.createdAt.getMonth() + 1).padStart(2, "0")}`;

      if (!trendData[date]) {
        trendData[date] = { total: 0, resolved: 0 };
      }
      trendData[date].total += 1;
      if (c.status === ComplaintStatus.Resolved || c.status === ComplaintStatus.Closed) {
        trendData[date].resolved += 1;
      }
    });

    const formattedTrend = Object.entries(trendData)
      .map(([date, data]) => ({
        date,
        total: data.total,
        resolved: data.resolved,
        pending: data.total - data.resolved,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    res.status(200).json({
      period: period || "month",
      trend: formattedTrend,
    });
  } catch (error) {
    console.error("Error fetching complaints trend:", error);
    res.status(500).json({ message: "Failed to fetch complaints trend" });
  }
};

// 👥 Get Employee Performance
export const getEmployeePerformance = async (req: Request, res: Response) => {
  try {
    const employees = await prisma.user.findMany({
      where: {
        role: { in: ["DEPARTMENT_EMPLOYEE", "DEPARTMENT_ADMIN"] },
      },
      include: {
        _count: {
          select: {
            assignedComplaints: true,
          },
        },
        assignedComplaints: {
          select: {
            status: true,
            createdAt: true,
            resolvedAt: true,
          },
        },
      },
    });

    const performanceData = employees.map(emp => {
      const assigned = emp._count.assignedComplaints;
      const resolved = emp.assignedComplaints.filter(
        c => c.status === ComplaintStatus.Resolved || c.status === ComplaintStatus.Closed
      ).length;
      const active = assigned - resolved;

      // Calculate average resolution time
      const resolvedComplaints = emp.assignedComplaints.filter(c => c.resolvedAt);
      let avgTime = 0;
      if (resolvedComplaints.length > 0) {
        const totalTime = resolvedComplaints.reduce((sum, c) => {
          const time = new Date(c.resolvedAt!).getTime() - new Date(c.createdAt).getTime();
          return sum + time;
        }, 0);
        avgTime = Math.floor(totalTime / resolvedComplaints.length / (1000 * 60 * 60)); // hours
      }

      return {
        employeeId: emp.id,
        name: emp.name,
        email: emp.email,
        department: emp.department,
        role: emp.role,
        assignedComplaints: assigned,
        resolvedComplaints: resolved,
        activeComplaints: active,
        resolutionRate: assigned > 0 ? ((resolved / assigned) * 100).toFixed(2) : "0.00",
        avgResolutionTimeHours: avgTime,
      };
    });

    // Sort by resolution rate
    performanceData.sort((a, b) => parseFloat(b.resolutionRate) - parseFloat(a.resolutionRate));

    res.status(200).json({
      employees: performanceData,
      totalEmployees: performanceData.length,
    });
  } catch (error) {
    console.error("Error fetching employee performance:", error);
    res.status(500).json({ message: "Failed to fetch employee performance" });
  }
};

// Helper: Format hours to human-readable
function formatHours(hours: number): string {
  if (hours < 24) {
    return `${hours} hours`;
  } else {
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return `${days} day${days !== 1 ? "s" : ""}${remainingHours > 0 ? ` ${remainingHours}h` : ""}`;
  }
}