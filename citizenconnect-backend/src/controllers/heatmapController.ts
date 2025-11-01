/*
 * Heatmap Controller
 * Location: src/controllers/heatmapController.ts
 * Purpose: Provide geo-location and heatmap data for complaints
 */

import { Request, Response } from "express";
import { PrismaClient, ComplaintStatus } from "@prisma/client";

const prisma = new PrismaClient();

interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    role: string;
    department?: string;
  };
}

// 🗺️ STEP 4.5: Get Real-time Map Data (All complaints with coordinates)
export const getMapData = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user;
    const { status, domain, category, ward, zone, district } = req.query;

    // Build filter
    const whereClause: any = {
      latitude: { not: null },
      longitude: { not: null },
    };

    // Role-based filtering
    if (user?.role === "DEPARTMENT_ADMIN" || user?.role === "DEPARTMENT_EMPLOYEE") {
      whereClause.department = user.department;
    }

    // Additional filters
    if (status) whereClause.status = status as ComplaintStatus;
    if (domain) whereClause.domain = String(domain);
    if (category) whereClause.category = String(category);
    if (ward) whereClause.ward = String(ward);
    if (zone) whereClause.zone = String(zone);
    if (district) whereClause.district = String(district);

    const complaints = await prisma.complaint.findMany({
      where: whereClause,
      select: {
        id: true,
        title: true,
        domain: true,
        category: true,
        status: true,
        latitude: true,
        longitude: true,
        ward: true,
        zone: true,
        district: true,
        location: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Format for map rendering
    const mapPoints = complaints.map(c => ({
      id: c.id,
      title: c.title,
      coordinates: {
        lat: c.latitude,
        lng: c.longitude,
      },
      status: c.status,
      domain: c.domain,
      category: c.category,
      ward: c.ward,
      zone: c.zone,
      district: c.district,
      location: c.location,
      createdAt: c.createdAt,
    }));

    res.status(200).json({
      points: mapPoints,
      totalPoints: mapPoints.length,
      filters: {
        status: status || "all",
        domain: domain || "all",
        category: category || "all",
        ward: ward || "all",
        zone: zone || "all",
        district: district || "all",
      },
    });
  } catch (error) {
    console.error("Error fetching map data:", error);
    res.status(500).json({ message: "Failed to fetch map data" });
  }
};

// 🔥 STEP 4.2: Calculate Severity Zones (Complaint Density)
export const getSeverityZones = async (req: Request, res: Response) => {
  try {
    const { gridSize = 0.01 } = req.query; // Grid size in degrees (~1km)

    // Get all complaints with coordinates
    const complaints = await prisma.complaint.findMany({
      where: {
        latitude: { not: null },
        longitude: { not: null },
        status: { notIn: [ComplaintStatus.Closed] }, // Only active complaints
      },
      select: {
        latitude: true,
        longitude: true,
        status: true,
        createdAt: true,
      },
    });

    if (complaints.length === 0) {
      return res.status(200).json({
        message: "No complaints with geo-location found",
        zones: [],
      });
    }

    // Create grid and count complaints
    const grid: { [key: string]: number } = {};

    complaints.forEach(c => {
      // Round to grid cell
      const gridLat = Math.floor(c.latitude! / Number(gridSize)) * Number(gridSize);
      const gridLng = Math.floor(c.longitude! / Number(gridSize)) * Number(gridSize);
      const key = `${gridLat.toFixed(4)},${gridLng.toFixed(4)}`;

      grid[key] = (grid[key] || 0) + 1;
    });

    // Convert to array and calculate severity
    const zones = Object.entries(grid).map(([key, count]) => {
      const [lat, lng] = key.split(",").map(Number);

      // Severity levels (Green → Yellow → Orange → Red)
      let severity: string;
      let severityLevel: number;
      
      if (count <= 2) {
        severity = "green";
        severityLevel = 1;
      } else if (count <= 5) {
        severity = "yellow";
        severityLevel = 2;
      } else if (count <= 10) {
        severity = "orange";
        severityLevel = 3;
      } else {
        severity = "red";
        severityLevel = 4;
      }

      return {
        coordinates: { lat, lng },
        complaintCount: count,
        severity,
        severityLevel,
        radius: Math.min(count * 50, 500), // Radius for circle (in meters)
      };
    });

    // Sort by severity (highest first)
    zones.sort((a, b) => b.complaintCount - a.complaintCount);

    res.status(200).json({
      zones,
      totalZones: zones.length,
      severityDistribution: {
        green: zones.filter(z => z.severity === "green").length,
        yellow: zones.filter(z => z.severity === "yellow").length,
        orange: zones.filter(z => z.severity === "orange").length,
        red: zones.filter(z => z.severity === "red").length,
      },
      gridSizeKm: Number(gridSize) * 111, // Approximate km
    });
  } catch (error) {
    console.error("Error calculating severity zones:", error);
    res.status(500).json({ message: "Failed to calculate severity zones" });
  }
};

// 📍 STEP 4.3: Get Complaints by Area (Ward/Zone/District)
export const getComplaintsByArea = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user;
    const { ward, zone, district } = req.query;

    if (!ward && !zone && !district) {
      return res.status(400).json({ 
        message: "Please provide at least one area filter (ward, zone, or district)" 
      });
    }

    const whereClause: any = {};

    // Role-based filtering
    if (user?.role === "DEPARTMENT_ADMIN" || user?.role === "DEPARTMENT_EMPLOYEE") {
      whereClause.department = user.department;
    }

    // Area filters
    if (ward) whereClause.ward = String(ward);
    if (zone) whereClause.zone = String(zone);
    if (district) whereClause.district = String(district);

    const complaints = await prisma.complaint.findMany({
      where: whereClause,
      include: {
        user: { select: { id: true, name: true, email: true } },
        statusUpdates: { take: 1, orderBy: { updatedAt: "desc" } },
      },
      orderBy: { createdAt: "desc" },
    });

    // Group by status
    const statusBreakdown = {
      raised: complaints.filter(c => c.status === ComplaintStatus.Raised).length,
      acknowledged: complaints.filter(c => c.status === ComplaintStatus.Acknowledged).length,
      inProgress: complaints.filter(c => c.status === ComplaintStatus.InProgress).length,
      resolved: complaints.filter(c => c.status === ComplaintStatus.Resolved).length,
      closed: complaints.filter(c => c.status === ComplaintStatus.Closed).length,
    };

    res.status(200).json({
      area: {
        ward: ward || "all",
        zone: zone || "all",
        district: district || "all",
      },
      complaints,
      totalComplaints: complaints.length,
      statusBreakdown,
    });
  } catch (error) {
    console.error("Error fetching complaints by area:", error);
    res.status(500).json({ message: "Failed to fetch complaints by area" });
  }
};

// 🏷️ STEP 4.4: Get Complaints by Issue Type (Domain/Category)
export const getComplaintsByIssueType = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user;
    const { domain, category } = req.query;

    if (!domain && !category) {
      return res.status(400).json({ 
        message: "Please provide domain or category filter" 
      });
    }

    const whereClause: any = {};

    // Role-based filtering
    if (user?.role === "DEPARTMENT_ADMIN" || user?.role === "DEPARTMENT_EMPLOYEE") {
      whereClause.department = user.department;
    }

    // Issue filters
    if (domain) whereClause.domain = String(domain);
    if (category) whereClause.category = String(category);

    const complaints = await prisma.complaint.findMany({
      where: whereClause,
      include: {
        user: { select: { id: true, name: true, email: true } },
        statusUpdates: { take: 1, orderBy: { updatedAt: "desc" } },
      },
      orderBy: { createdAt: "desc" },
    });

    // Distribution by area
    const areaDistribution: { [key: string]: number } = {};
    complaints.forEach(c => {
      const area = c.ward || c.zone || c.district || "Unknown";
      areaDistribution[area] = (areaDistribution[area] || 0) + 1;
    });

    res.status(200).json({
      issueType: {
        domain: domain || "all",
        category: category || "all",
      },
      complaints,
      totalComplaints: complaints.length,
      areaDistribution,
    });
  } catch (error) {
    console.error("Error fetching complaints by issue type:", error);
    res.status(500).json({ message: "Failed to fetch complaints by issue type" });
  }
};

// 📊 Get Area Statistics (Breakdown by Ward/Zone/District)
export const getAreaStatistics = async (req: Request, res: Response) => {
  try {
    const { groupBy = "ward" } = req.query; // "ward", "zone", or "district"

    const field = groupBy as "ward" | "zone" | "district";

    const complaints = await prisma.complaint.findMany({
      where: {
        [field]: { not: null },
      },
      // ✅ CHANGE THIS PART
      select: {
        ward: true,
        zone: true,
        district: true,
        status: true,
      },
    });

    // Group by area
    const areaStats: { 
      [key: string]: { 
        total: number; 
        active: number; 
        resolved: number; 
        closed: number;
      } 
    } = {};

    complaints.forEach(c => {
      let area: string;
      if (field === "ward") {
        area = c.ward || "Unknown";
      } else if (field === "zone") {
        area = c.zone || "Unknown";
      } else {
        area = c.district || "Unknown";
      }
      if (!areaStats[area]) {
        areaStats[area] = { total: 0, active: 0, resolved: 0, closed: 0 };
      }

      areaStats[area].total += 1;

      if (c.status === ComplaintStatus.Resolved || c.status === ComplaintStatus.Closed) {
        areaStats[area].resolved += 1;
        if (c.status === ComplaintStatus.Closed) {
          areaStats[area].closed += 1;
        }
      } else {
        areaStats[area].active += 1;
      }
    });

    // Convert to array and sort by total
    const statistics = Object.entries(areaStats)
      .map(([area, stats]) => ({
        area,
        ...stats,
        resolutionRate: stats.total > 0 
          ? ((stats.resolved / stats.total) * 100).toFixed(2) + "%"
          : "0%",
      }))
      .sort((a, b) => b.total - a.total);

    res.status(200).json({
      groupedBy: field,
      statistics,
      totalAreas: statistics.length,
    });
  } catch (error) {
    console.error("Error fetching area statistics:", error);
    res.status(500).json({ message: "Failed to fetch area statistics" });
  }
};