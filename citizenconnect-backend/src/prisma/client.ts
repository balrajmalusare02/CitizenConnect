import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default prisma;


//Purpose: Makes Prisma available anywhere with a simple import.