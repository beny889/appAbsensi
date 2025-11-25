/*
  Warnings:

  - You are about to drop the column `latitude` on the `attendances` table. All the data in the column will be lost.
  - You are about to drop the column `locationId` on the `attendances` table. All the data in the column will be lost.
  - You are about to drop the column `longitude` on the `attendances` table. All the data in the column will be lost.
  - You are about to drop the `locations` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "attendances" DROP CONSTRAINT "attendances_locationId_fkey";

-- AlterTable
ALTER TABLE "attendances" DROP COLUMN "latitude",
DROP COLUMN "locationId",
DROP COLUMN "longitude";

-- DropTable
DROP TABLE "locations";
