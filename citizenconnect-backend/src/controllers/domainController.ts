import { Request, Response } from "express";
import prisma from "../prisma/client";

export const getDomains = async (req: Request, res: Response) => {
  try {
    const domains = await prisma.domainCategory.findMany({
      orderBy: { domain: "asc" },
    });

    // Optional formatting to group categories under each domain
    const grouped = domains.reduce((acc: any, item) => {
      if (!acc[item.domain]) acc[item.domain] = [];
      acc[item.domain].push({
        category: item.category,
        department: item.department,
      });
      return acc;
    }, {});

    res.json({ success: true, data: grouped });
  } catch (error) {
    console.error("Error fetching domains:", error);
    res.status(500).json({ message: "Server error fetching domains" });
  }
};
