-- CreateEnum
CREATE TYPE "CategoryEnum" AS ENUM ('POLITICS_AND_GOVERNANCE', 'ECONOMY_AND_DEVELOPMENT', 'LAW_AND_JUSTICE', 'EDUCATION', 'ENVIRONMENT_AND_SUSTAINABILITY', 'SOCIAL_ISSUES', 'HEALTH_AND_WELLNESS', 'SCIENCE_AND_TECHNOLOGY', 'ENTERTAINMENT_AND_MEDIA', 'SPORTS_AND_LEISURE');

-- CreateEnum
CREATE TYPE "InterestEnum" AS ENUM ('ELECTIONS', 'POLITICAL_PARTIES', 'GOVERNMENT_POLICIES', 'CORRUPTION', 'INTERNATIONAL_RELATIONS', 'JOBS_AND_EMPLOYMENT', 'ECONOMIC_POLICIES', 'INCOME_INEQUALITY', 'TRADE_AND_COMMERCE', 'TAXATION', 'CRIME_AND_PUNISHMENT', 'LEGAL_REFORMS', 'JUSTICE_SYSTEM', 'POLICING', 'CYBERCRIME', 'SCHOOL_REFORMS', 'HIGHER_EDUCATION', 'ONLINE_LEARNING', 'EDUCATION_POLICIES', 'STUDENT_WELFARE', 'CLIMATE_CHANGE', 'POLLUTION', 'RENEWABLE_ENERGY', 'WILDLIFE_CONSERVATION', 'WASTE_MANAGEMENT', 'CASTE_SYSTEM', 'GENDER_EQUALITY', 'MINORITY_RIGHTS', 'POVERTY', 'HUMAN_RIGHTS', 'LGBTQ_PLUS_RIGHTS', 'PUBLIC_HEALTH', 'MENTAL_HEALTH', 'HEALTHCARE_ACCESS', 'NUTRITION', 'DISEASE_PREVENTION', 'MEDICAL_ETHICS', 'ARTIFICIAL_INTELLIGENCE', 'SPACE_EXPLORATION', 'MEDICAL_SCIENCE', 'ROBOTICS', 'INFORMATION_TECHNOLOGY', 'ENVIRONMENTAL_TECH', 'HOLLYWOOD', 'BOLLYWOOD', 'TV_SHOWS', 'MUSIC', 'GAMING', 'SOCIAL_MEDIA', 'CENSORSHIP', 'CRICKET', 'FOOTBALL', 'HOCKEY', 'TENNIS', 'BASKETBALL', 'MOTORSPORTS');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('DEBATE_INVITE', 'DEBATE_COMMENT', 'UPVOTE', 'MENTION', 'SYSTEM_UPDATE');

-- CreateEnum
CREATE TYPE "BadgeType" AS ENUM ('DEBATE_STARTER', 'FREQUENT_PARTICIPANT', 'TOP_CONTRIBUTOR', 'CONSENSUS_BUILDER');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "clerkId" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "followers" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "following" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "votes" INTEGER NOT NULL DEFAULT 0,
    "about" TEXT,
    "image" TEXT,
    "fcmtoken" TEXT,
    "blocked_intrests" "InterestEnum"[],
    "reputationScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lastActive" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "type" "NotificationType" NOT NULL,
    "content" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserBadge" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "badgeType" "BadgeType" NOT NULL,
    "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserBadge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" SERIAL NOT NULL,
    "name" "CategoryEnum" NOT NULL,
    "weight" INTEGER NOT NULL DEFAULT 0,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Interest" (
    "id" SERIAL NOT NULL,
    "name" "InterestEnum" NOT NULL,
    "weight" INTEGER NOT NULL DEFAULT 0,
    "keywords" TEXT,
    "categoryId" INTEGER NOT NULL,

    CONSTRAINT "Interest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Debate_room" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "duration" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "creator_id" INTEGER NOT NULL,
    "sub_categories" "InterestEnum"[],
    "keywords" TEXT[],
    "upvotes" INTEGER NOT NULL DEFAULT 0,
    "shares" INTEGER NOT NULL DEFAULT 0,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Debate_room_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Debate_room_Category" (
    "debate_roomId" INTEGER NOT NULL,
    "category" "CategoryEnum" NOT NULL,

    CONSTRAINT "Debate_room_Category_pkey" PRIMARY KEY ("debate_roomId","category")
);

-- CreateTable
CREATE TABLE "DebateParticipant" (
    "debateRoomId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "opinion" TEXT,
    "agreed" BOOLEAN,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "upvotes" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "DebateParticipant_pkey" PRIMARY KEY ("debateRoomId","userId")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_phoneNumber_key" ON "User"("phoneNumber");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_clerkId_key" ON "User"("clerkId");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBadge" ADD CONSTRAINT "UserBadge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Interest" ADD CONSTRAINT "Interest_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Debate_room" ADD CONSTRAINT "Debate_room_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Debate_room_Category" ADD CONSTRAINT "Debate_room_Category_debate_roomId_fkey" FOREIGN KEY ("debate_roomId") REFERENCES "Debate_room"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DebateParticipant" ADD CONSTRAINT "DebateParticipant_debateRoomId_fkey" FOREIGN KEY ("debateRoomId") REFERENCES "Debate_room"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DebateParticipant" ADD CONSTRAINT "DebateParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
