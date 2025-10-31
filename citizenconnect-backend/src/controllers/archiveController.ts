/*
 * Archive Controller
 * Location: src/controllers/archiveController.ts
 * Purpose: Handle archived/resolved complaints
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

// 📦 Get All Resolved/Closed Complaints (Archive)
export const getArchivedComplaints = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user;
    const { page = 1, limit = 20, domain, category, department, year } = req.query;

    // Build filter
    const whereClause: any = {
      status: { in: [ComplaintStatus.Resolved, ComplaintStatus.Closed] },
    };

    // Role-based filtering
    if (user?.role === "CITIZEN") {
      whereClause.userId = user.id;
    } else if (user?.role === "DEPARTMENT_ADMIN" || user?.role === "DEPARTMENT_EMPLOYEE") {
      whereClause.department = user.department;
    }

    // Additional filters
    if (domain) whereClause.domain = String(domain);
    if (category) whereClause.category = String(category);
    if (department) whereClause.department = String(department);

    // Year filter
    if (year) {
      const yearNum = parseInt(year as string);
      const startDate = new Date(yearNum, 0, 1);
      const endDate = new Date(yearNum + 1, 0, 1);
      whereClause.closedAt = { gte: startDate, lt: endDate };
    }

    // Pagination
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const [complaints, totalCount] = await Promise.all([
      prisma.complaint.findMany({
        where: whereClause,
        include: {
          user: { select: { id: true, name: true, email: true } },
          assignedTo: { select: { id: true, name: true, department: true } },
          statusUpdates: {
            orderBy: { updatedAt: "desc" },
            take: 3,
          },
          feedbacks: {
            select: { rating: true, comment: true, wasResolved: true },
          },
        },
        orderBy: { closedAt: "desc" },
        skip,
        take,
      }),
      prisma.complaint.count({ where: whereClause }),
    ]);

    // Calculate resolution time for each
    const complaintsWithStats = complaints.map(c => {
      const resolutionTime = c.resolvedAt
        ? Math.floor(
            (new Date(c.resolvedAt).getTime() - new Date(c.createdAt).getTime()) /
              (1000 * 60 * 60)
          ) // hours
        : null;

      return {
        ...c,
        resolutionTimeHours: resolutionTime,
        resolutionTimeFormatted: resolutionTime ? formatHours(resolutionTime) : "N/A",
      };
    });

    res.status(200).json({
      complaints: complaintsWithStats,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(totalCount / Number(limit)),
        totalCount,
        limit: Number(limit),
      },
    });
  } catch (error) {
    console.error("Error fetching archived complaints:", error);
    res.status(500).json({ message: "Failed to fetch archived complaints" });
  }
};

// 📊 Get Archive Statistics
export const getArchiveStatistics = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user;

    const whereClause: any = {
      status: { in: [ComplaintStatus.Resolved, ComplaintStatus.Closed] },
    };

    if (user?.role === "CITIZEN") {
      whereClause.userId = user.id;
    } else if (user?.role === "DEPARTMENT_ADMIN" || user?.role === "DEPARTMENT_EMPLOYEE") {
      whereClause.department = user.department;
    }

    const totalArchived = await prisma.complaint.count({ where: whereClause });

    // By year
    const complaints = await prisma.complaint.findMany({
      where: whereClause,
      select: {
        closedAt: true,
        resolvedAt: true,
        createdAt: true,
      },
    });

    // Group by year
    const yearlyBreakdown: { [key: number]: number } = {};
    complaints.forEach(c => {
      const year = c.closedAt?.getFullYear() || c.resolvedAt?.getFullYear();
      if (year) {
        yearlyBreakdown[year] = (yearlyBreakdown[year] || 0) + 1;
      }
    });

    // Calculate average resolution time
    const resolvedComplaints = complaints.filter(c => c.resolvedAt);
    let avgResolutionTime = 0;
    if (resolvedComplaints.length > 0) {
      const totalTime = resolvedComplaints.reduce((sum, c) => {
        const time = new Date(c.resolvedAt!).getTime() - new Date(c.createdAt).getTime();
        return sum + time;
      }, 0);
      avgResolutionTime = Math.floor(totalTime / resolvedComplaints.length / (1000 * 60 * 60));
    }

    const yearlyData = Object.entries(yearlyBreakdown)
      .map(([year, count]) => ({ year: parseInt(year), count }))
      .sort((a, b) => b.year - a.year);

    res.status(200).json({
      totalArchived,
      yearlyBreakdown: yearlyData,
      averageResolutionTimeHours: avgResolutionTime,
      averageResolutionTimeFormatted: formatHours(avgResolutionTime),
    });
  } catch (error) {
    console.error("Error fetching archive statistics:", error);
    res.status(500).json({ message: "Failed to fetch archive statistics" });
  }
};

// 🔍 Search Archived Complaints
export const searchArchivedComplaints = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user;
    const { query, page = 1, limit = 20 } = req.query;

    if (!query) {
      return res.status(400).json({ message: "Search query is required" });
    }

    const whereClause: any = {
      status: { in: [ComplaintStatus.Resolved, ComplaintStatus.Closed] },
      OR: [
        { title: { contains: String(query), mode: "insensitive" } },
        { description: { contains: String(query), mode: "insensitive" } },
        { location: { contains: String(query), mode: "insensitive" } },
      ],
    };

    if (user?.role === "CITIZEN") {
      whereClause.userId = user.id;
    } else if (user?.role === "DEPARTMENT_ADMIN" || user?.role === "DEPARTMENT_EMPLOYEE") {
      whereClause.department = user.department;
    }

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const [complaints, totalCount] = await Promise.all([
      prisma.complaint.findMany({
        where: whereClause,
        include: {
          user: { select: { id: true, name: true } },
          feedbacks: { select: { rating: true } },
        },
        orderBy: { closedAt: "desc" },
        skip,
        take,
      }),
      prisma.complaint.count({ where: whereClause }),
    ]);

    res.status(200).json({
      query: String(query),
      results: complaints,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(totalCount / Number(limit)),
        totalCount,
      },
    });
  } catch (error) {
    console.error("Error searching archived complaints:", error);
    res.status(500).json({ message: "Failed to search archived complaints" });
  }
};

// 🏆 Get Top Resolved Complaints (by rating)
export const getTopResolvedComplaints = async (req: Request, res: Response) => {
  try {
    const { limit = 10 } = req.query;

    const complaints = await prisma.complaint.findMany({
      where: {
        status: ComplaintStatus.Closed,
        feedbacks: {
          isNot: null,
        },
      },
      include: {
        user: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, name: true, department: true } },
        feedbacks: true,
      },
      orderBy: {
        feedbacks: {
          rating: "desc",
        },
      },
      take: Number(limit),
    });

    res.status(200).json({
      topResolvedComplaints: complaints,
      count: complaints.length,
    });
  } catch (error) {
    console.error("Error fetching top resolved complaints:", error);
    res.status(500).json({ message: "Failed to fetch top resolved complaints" });
  }
};

// Helper: Format hours
function formatHours(hours: number): string {
  if (hours < 24) {
    return `${hours} hours`;
  } else {
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return `${days} day${days !== 1 ? "s" : ""}${remainingHours > 0 ? ` ${remainingHours}h` : ""}`;
  }
}