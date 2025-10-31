import { defineConfig, env } from "prisma/config";

  //process.env.DATABASE_URL =
  //process.env.DATABASE_URL ||
  //`"postgresql://postgres:postgres@localhost:5432/citizenconnect?schema=public";


export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  engine: "classic",
  datasource: {
    url: env("DATABASE_URL"),
  },
});
