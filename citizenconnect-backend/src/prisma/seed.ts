import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const domainData = [
    // --- ELECTRICAL ---
    {
      domain: "Electrical",
      category: "Street Light Not Working",
      department: "Electrical Department",
    },
    {
      domain: "Electrical",
      category: "Frequent Power Cuts",
      department: "Electrical Department",
    },
    {
      domain: "Electrical",
      category: "Exposed/Loose Wires",
      department: "Electrical Department",
    },
    {
      domain: "Electrical",
      category: "Transformer Sparking/Issue",
      department: "Electrical Department",
    },
    {
      domain: "Electrical",
      category: "Electric Pole Damaged",
      department: "Electrical Department",
    },

    // --- WATER ---
    {
      domain: "Water",
      category: "Pipe Leakage",
      department: "Water Department",
    },
    {
      domain: "Water",
      category: "No Water Supply",
      department: "Water Department",
    },
    {
      domain: "Water",
      category: "Contaminated/Dirty Water",
      department: "Water Department",
    },
    {
      domain: "Water",
      category: "Low Water Pressure",
      department: "Water Department",
    },
    {
      domain: "Water",
      category: "Open Manhole",
      department: "Water Department",
    },

    // --- WASTE ---
    {
      domain: "Waste",
      category: "Garbage Overflow",
      department: "Sanitation Department",
    },
    {
      domain: "Waste",
      category: "Missed Garbage Pickup",
      department: "Sanitation Department",
    },
    {
      domain: "Waste",
      category: "Dead Animal Removal",
      department: "Sanitation Department",
    },
    {
      domain: "Waste",
      category: "Public Dustbin Damaged",
      department: "Sanitation Department",
    },
    {
      domain: "Waste",
      category: "Burning of Garbage",
      department: "Sanitation Department",
    },

    // --- ROADS ---
    {
      domain: "Roads",
      category: "Pothole Repair",
      department: "Public Works Department",
    },
    {
      domain: "Roads",
      category: "Waterlogging on Road",
      department: "Public Works Department",
    },
    {
      domain: "Roads",
      category: "Damaged Sidewalk/Footpath",
      department: "Public Works Department",
    },
    {
      domain: "Roads",
      category: "Illegal Encroachment",
      department: "Public Works Department",
    },
    {
      domain: "Roads",
      category: "Speed Breaker Required/Damaged",
      department: "Public Works Department",
    },

    // --- HEALTH ---
    {
      domain: "Health",
      category: "Mosquito Breeding Area",
      department: "Health Department",
    },
    {
      domain: "Health",
      category: "Stray Dog Menace",
      department: "Health Department",
    },
    {
      domain: "Health",
      category: "Unsanitary Public Toilet",
      department: "Health Department",
    },
    {
      domain: "Health",
      category: "Food Adulteration",
      department: "Health Department",
    },
    {
      domain: "Health",
      category: "Illegal Dumping of Medical Waste",
      department: "Health Department",
    },
  ];

  console.log(`🌱 Seeding ${domainData.length} categories...`);

  for (const item of domainData) {
    await prisma.domainCategory.upsert({
      where: {
        domain_category_unique: {
          domain: item.domain,
          category: item.category,
        },
      },
      update: {
        // This ensures if we change the department mapping, it updates
        department: item.department, 
      },
      create: item,
    });
  }

  console.log("✅ DomainCategory data seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });