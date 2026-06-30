CREATE TYPE "GroupRole" AS ENUM ('OWNER', 'MEMBER');

CREATE TYPE "ActivityType" AS ENUM (
  'BOWLING',
  'SCREEN_BASEBALL',
  'ROCK_PAPER_SCISSORS'
);

CREATE TYPE "ExpenseKind" AS ENUM (
  'BETTING_BURDEN',
  'GENERAL_PARTICIPATION',
  'LOCAL_RULE_SOLO',
  'SIDE_BET'
);

CREATE TYPE "RpsHand" AS ENUM ('ROCK', 'PAPER', 'SCISSORS');

CREATE TABLE "User" (
  "id" TEXT NOT NULL,
  "kakaoId" TEXT,
  "nickname" TEXT NOT NULL,
  "profileImageUrl" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Group" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "imageUrl" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Group_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "GroupMember" (
  "id" TEXT NOT NULL,
  "groupId" TEXT NOT NULL,
  "userId" TEXT,
  "displayName" TEXT NOT NULL,
  "profileImageUrl" TEXT,
  "role" "GroupRole" NOT NULL DEFAULT 'MEMBER',
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "claimedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "GroupMember_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "GroupInvitation" (
  "id" TEXT NOT NULL,
  "groupId" TEXT NOT NULL,
  "token" TEXT NOT NULL,
  "createdByUserId" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "GroupInvitation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Session" (
  "id" TEXT NOT NULL,
  "groupId" TEXT NOT NULL,
  "activity" "ActivityType" NOT NULL,
  "title" TEXT NOT NULL,
  "occurredAt" TIMESTAMP(3) NOT NULL,
  "shareToken" TEXT,
  "createdById" TEXT,
  "updatedById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ExpenseItem" (
  "id" TEXT NOT NULL,
  "sessionId" TEXT NOT NULL,
  "payerMemberId" TEXT NOT NULL,
  "kind" "ExpenseKind" NOT NULL,
  "title" TEXT NOT NULL,
  "totalAmount" DECIMAL(12, 2) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ExpenseItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ExpenseAllocation" (
  "id" TEXT NOT NULL,
  "expenseItemId" TEXT NOT NULL,
  "memberId" TEXT NOT NULL,
  "amount" DECIMAL(12, 2) NOT NULL,
  "rankingAmount" DECIMAL(12, 2) NOT NULL,
  "reason" TEXT NOT NULL,

  CONSTRAINT "ExpenseAllocation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "LocalRulePreset" (
  "id" TEXT NOT NULL,
  "groupId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "threshold" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "LocalRulePreset_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RpsRecord" (
  "id" TEXT NOT NULL,
  "sessionId" TEXT NOT NULL,
  "loserMemberId" TEXT NOT NULL,
  "loserHand" "RpsHand" NOT NULL,
  "context" TEXT NOT NULL,
  "memo" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "RpsRecord_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_kakaoId_key" ON "User"("kakaoId");
CREATE INDEX "GroupMember_groupId_idx" ON "GroupMember"("groupId");
CREATE INDEX "GroupMember_userId_idx" ON "GroupMember"("userId");
CREATE UNIQUE INDEX "GroupInvitation_token_key" ON "GroupInvitation"("token");
CREATE INDEX "GroupInvitation_groupId_idx" ON "GroupInvitation"("groupId");
CREATE INDEX "GroupInvitation_createdByUserId_idx" ON "GroupInvitation"("createdByUserId");
CREATE UNIQUE INDEX "Session_shareToken_key" ON "Session"("shareToken");
CREATE INDEX "Session_groupId_occurredAt_idx" ON "Session"("groupId", "occurredAt");
CREATE INDEX "ExpenseItem_sessionId_idx" ON "ExpenseItem"("sessionId");
CREATE INDEX "ExpenseItem_payerMemberId_idx" ON "ExpenseItem"("payerMemberId");
CREATE INDEX "ExpenseAllocation_expenseItemId_idx" ON "ExpenseAllocation"("expenseItemId");
CREATE INDEX "ExpenseAllocation_memberId_idx" ON "ExpenseAllocation"("memberId");
CREATE INDEX "RpsRecord_sessionId_idx" ON "RpsRecord"("sessionId");
CREATE INDEX "RpsRecord_loserMemberId_idx" ON "RpsRecord"("loserMemberId");

ALTER TABLE "GroupMember"
  ADD CONSTRAINT "GroupMember_groupId_fkey"
  FOREIGN KEY ("groupId") REFERENCES "Group"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "GroupMember"
  ADD CONSTRAINT "GroupMember_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "GroupInvitation"
  ADD CONSTRAINT "GroupInvitation_groupId_fkey"
  FOREIGN KEY ("groupId") REFERENCES "Group"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Session"
  ADD CONSTRAINT "Session_groupId_fkey"
  FOREIGN KEY ("groupId") REFERENCES "Group"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ExpenseItem"
  ADD CONSTRAINT "ExpenseItem_sessionId_fkey"
  FOREIGN KEY ("sessionId") REFERENCES "Session"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ExpenseAllocation"
  ADD CONSTRAINT "ExpenseAllocation_expenseItemId_fkey"
  FOREIGN KEY ("expenseItemId") REFERENCES "ExpenseItem"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "LocalRulePreset"
  ADD CONSTRAINT "LocalRulePreset_groupId_fkey"
  FOREIGN KEY ("groupId") REFERENCES "Group"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "RpsRecord"
  ADD CONSTRAINT "RpsRecord_sessionId_fkey"
  FOREIGN KEY ("sessionId") REFERENCES "Session"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
