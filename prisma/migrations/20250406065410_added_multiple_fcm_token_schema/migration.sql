/*
  Warnings:

  - You are about to drop the column `fcmtoken` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "fcmtoken",
ADD COLUMN     "expoTokens" TEXT[] DEFAULT ARRAY[]::TEXT[];
