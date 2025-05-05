-- CreateTable
CREATE TABLE "DebateUpvote" (
    "userId" TEXT NOT NULL,
    "debateRoomId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DebateUpvote_pkey" PRIMARY KEY ("userId","debateRoomId")
);

-- CreateTable
CREATE TABLE "ParticipantUpvote" (
    "userId" TEXT NOT NULL,
    "debateRoomId" TEXT NOT NULL,
    "participantUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ParticipantUpvote_pkey" PRIMARY KEY ("userId","debateRoomId","participantUserId")
);

-- CreateIndex
CREATE INDEX "DebateUpvote_debateRoomId_idx" ON "DebateUpvote"("debateRoomId");

-- CreateIndex
CREATE INDEX "ParticipantUpvote_debateRoomId_participantUserId_idx" ON "ParticipantUpvote"("debateRoomId", "participantUserId");

-- CreateIndex
CREATE INDEX "DebateParticipant_debateRoomId_aiScore_idx" ON "DebateParticipant"("debateRoomId", "aiScore");

-- CreateIndex
CREATE INDEX "DebateParticipant_debateRoomId_createdAt_idx" ON "DebateParticipant"("debateRoomId", "createdAt");

-- CreateIndex
CREATE INDEX "DebateParticipant_debateRoomId_upvotes_idx" ON "DebateParticipant"("debateRoomId", "upvotes");

-- AddForeignKey
ALTER TABLE "DebateUpvote" ADD CONSTRAINT "DebateUpvote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DebateUpvote" ADD CONSTRAINT "DebateUpvote_debateRoomId_fkey" FOREIGN KEY ("debateRoomId") REFERENCES "Debate_room"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParticipantUpvote" ADD CONSTRAINT "ParticipantUpvote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParticipantUpvote" ADD CONSTRAINT "ParticipantUpvote_debateRoomId_participantUserId_fkey" FOREIGN KEY ("debateRoomId", "participantUserId") REFERENCES "DebateParticipant"("debateRoomId", "userId") ON DELETE CASCADE ON UPDATE CASCADE;
