/*
 * Safe Status Migration Script
 * Location: src/scripts/safeStatusMigration.ts
 * Run: npx ts-node src/scripts/safeStatusMigration.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function migrateStatuses() {
  try {
    console.log("🔍 Checking existing complaints...");

    // Get all complaints
    const complaints = await prisma.$queryRaw<any[]>`
      SELECT id, status FROM "Complaint"
    `;

    console.log(`Found ${complaints.length} complaints to migrate`);

    if (complaints.length === 0) {
      console.log("✅ No complaints to migrate. Safe to proceed with schema change.");
      return;
    }

    // Map old status values to new enum values
    const statusMapping: { [key: string]: string } = {
      'Raised': 'Raised',
      'Pending': 'Raised', // Map old "Pending" to "Raised"
      'Acknowledged': 'Acknowledged',
      'In Progress': 'InProgress',
      'InProgress': 'InProgress',
      'Resolved': 'Resolved',
      'Closed': 'Closed',
    };

    console.log("\n📊 Current status distribution:");
    const statusCounts: { [key: string]: number } = {};
    complaints.forEach(c => {
      statusCounts[c.status] = (statusCounts[c.status] || 0) + 1;
    });
    console.log(statusCounts);

    console.log("\n⚠️  After migration, statuses will be:");
    const newStatusCounts: { [key: string]: number } = {};
    complaints.forEach(c => {
      const newStatus = statusMapping[c.status] || 'Raised';
      newStatusCounts[newStatus] = (newStatusCounts[newStatus] || 0) + 1;
    });
    console.log(newStatusCounts);

    console.log("\n📝 Status mapping:");
    Object.keys(statusCounts).forEach(oldStatus => {
      const newStatus = statusMapping[oldStatus] || 'Raised';
      console.log(`  "${oldStatus}" → "${newStatus}"`);
    });

    console.log("\n✅ Migration plan ready!");
    console.log("\n🔔 IMPORTANT: This is just a preview.");
    console.log("After running 'npx prisma db push', all statuses will be reset.");
    console.log("If you have important data, export it first!");

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

migrateStatuses();