/*
 * Clean Domain Category Setup
 * Location: src/scripts/cleanDomainCategories.ts
 * Run: npx ts-node src/scripts/cleanDomainCategories.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const cleanDomainMappings = [
  // Electrical
  { domain: "Electrical", category: "Streetlight Issue", department: "Electrical Department" },
  { domain: "Electrical", category: "Power Outage", department: "Electrical Department" },
  { domain: "Electrical", category: "Transformer Issue", department: "Electrical Department" },
  
  // Water
  { domain: "Water", category: "Pipe Leakage", department: "Water Department" },
  { domain: "Water", category: "No Water Supply", department: "Water Department" },
  
  // Roads
  { domain: "Roads", category: "Pothole Repair", department: "Public Works Department" },
  { domain: "Roads", category: "Road Damage", department: "Public Works Department" },
  
  // Waste/Sanitation
  { domain: "Waste", category: "Garbage Overflow", department: "Sanitation Department" },
  { domain: "Waste", category: "Garbage Not Collected", department: "Sanitation Department" },
  
  // Health
  { domain: "Health", category: "Mosquito Breeding Area", department: "Health Department" },
  { domain: "Health", category: "Stray Animals", department: "Health Department" },
];

async function cleanAndSeed() {
  try {
    console.log("🗑️  Deleting all existing domain categories...");
    
    // Delete all existing records
    const deleted = await prisma.domainCategory.deleteMany({});
    console.log(`✅ Deleted ${deleted.count} old records`);

    console.log("\n📝 Adding clean domain categories...");

    // Add new clean records
    for (const mapping of cleanDomainMappings) {
      const created = await prisma.domainCategory.create({
        data: {
          domain: mapping.domain.trim(),
          category: mapping.category.trim(),
          department: mapping.department.trim(),
        },
      });
      console.log(`   ✅ Added: ${created.domain} → ${created.category} → ${created.department}`);
    }

    console.log(`\n🎉 Successfully added ${cleanDomainMappings.length} clean mappings!`);
    console.log("\n📋 Summary:");
    console.log("   - Electrical: 3 categories");
    console.log("   - Water: 2 categories");
    console.log("   - Roads: 2 categories");
    console.log("   - Waste: 2 categories");
    console.log("   - Health: 2 categories");
    console.log("\n✅ Domain categories are now clean and ready!");

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanAndSeed();