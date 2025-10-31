/*
  Warnings:

  - Added the required column `category` to the `Complaint` table without a default value. This is not possible if the table is not empty.
  - Added the required column `domain` to the `Complaint` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Complaint" ADD COLUMN     "category" TEXT NOT NULL,
ADD COLUMN     "department" TEXT,
ADD COLUMN     "domain" TEXT NOT NULL,
ADD COLUMN     "location" TEXT,
ADD COLUMN     "mediaUrl" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'Raised';

-- CreateTable
CREATE TABLE "DomainCategory" (
    "id" SERIAL NOT NULL,
    "domain" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DomainCategory_pkey" PRIMARY KEY ("id")
);
