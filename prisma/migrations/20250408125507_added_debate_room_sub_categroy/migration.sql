/*
  Warnings:

  - You are about to drop the column `sub_categories` on the `Debate_room` table. All the data in the column will be lost.
  - The primary key for the `Debate_room_Category` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - A unique constraint covering the columns `[debate_roomId,category]` on the table `Debate_room_Category` will be added. If there are existing duplicate values, this will fail.
  - The required column `id` was added to the `Debate_room_Category` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- DropForeignKey
ALTER TABLE "Debate_room_Category" DROP CONSTRAINT "Debate_room_Category_debate_roomId_fkey";

-- AlterTable
ALTER TABLE "Debate_room" DROP COLUMN "sub_categories";

-- AlterTable
ALTER TABLE "Debate_room_Category" DROP CONSTRAINT "Debate_room_Category_pkey",
ADD COLUMN     "id" TEXT NOT NULL,
ADD CONSTRAINT "Debate_room_Category_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "blocked_intrests" SET DEFAULT ARRAY[]::"InterestEnum"[];

-- CreateTable
CREATE TABLE "Debate_room_SubCategory" (
    "id" TEXT NOT NULL,
    "debate_room_categoryId" TEXT NOT NULL,
    "subCategory" "InterestEnum" NOT NULL,

    CONSTRAINT "Debate_room_SubCategory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Debate_room_SubCategory_debate_room_categoryId_subCategory_key" ON "Debate_room_SubCategory"("debate_room_categoryId", "subCategory");

-- CreateIndex
CREATE UNIQUE INDEX "Debate_room_Category_debate_roomId_category_key" ON "Debate_room_Category"("debate_roomId", "category");

-- AddForeignKey
ALTER TABLE "Debate_room_Category" ADD CONSTRAINT "Debate_room_Category_debate_roomId_fkey" FOREIGN KEY ("debate_roomId") REFERENCES "Debate_room"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Debate_room_SubCategory" ADD CONSTRAINT "Debate_room_SubCategory_debate_room_categoryId_fkey" FOREIGN KEY ("debate_room_categoryId") REFERENCES "Debate_room_Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;
