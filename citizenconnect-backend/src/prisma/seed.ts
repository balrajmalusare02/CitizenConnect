import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const domainData = [
    {
      domain: "Electrical",
      category: "Street Light Not Working",
      department: "Electrical Department",
    },
    {
      domain: "Water",
      category: "Pipe Leakage",
      department: "Water Department",
    },
    {
      domain: "Waste",
      category: "Garbage Overflow",
      department: "Sanitation Department",
    },
    {
      domain: "Roads",
      category: "Pothole Repair",
      department: "Public Works Department",
    },
    {
      domain: "Health",
      category: "Mosquito Breeding Area",
      department: "Health Department",
    },
  ];

  for (const item of domainData) {
    await prisma.domainCategory.upsert({
      where: {
        domain_category_unique: {
          domain: item.domain,
          category: item.category,
        },
      },
      update: {},
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
