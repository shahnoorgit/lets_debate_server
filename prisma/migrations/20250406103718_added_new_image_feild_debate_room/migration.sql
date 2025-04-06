/*
  Warnings:

  - Added the required column `image` to the `Debate_room` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Debate_room" ADD COLUMN     "image" TEXT NOT NULL;
