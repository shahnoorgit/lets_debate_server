-- AlterTable
ALTER TABLE "DebateParticipant" ADD COLUMN     "aiFlagged" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "aiScore" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "is_aiFeedback" BOOLEAN NOT NULL DEFAULT false;
