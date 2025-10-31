/*
  Warnings:

  - A unique constraint covering the columns `[domain,category]` on the table `DomainCategory` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "StatusUpdate" ADD COLUMN     "remarks" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "DomainCategory_domain_category_key" ON "DomainCategory"("domain", "category");
