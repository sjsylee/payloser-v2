CREATE TYPE "GroupJoinRequestStatus" AS ENUM (
  'PENDING',
  'APPROVED',
  'REJECTED',
  'CANCELED'
);

CREATE TABLE "GroupJoinRequest" (
  "id" TEXT NOT NULL,
  "groupId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "status" "GroupJoinRequestStatus" NOT NULL DEFAULT 'PENDING',
  "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "resolvedAt" TIMESTAMP(3),
  "resolvedByUserId" TEXT,
  "targetMemberId" TEXT,
  "displayName" TEXT,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "GroupJoinRequest_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "GroupJoinRequest_groupId_status_idx"
  ON "GroupJoinRequest"("groupId", "status");

CREATE INDEX "GroupJoinRequest_userId_idx"
  ON "GroupJoinRequest"("userId");

CREATE INDEX "GroupJoinRequest_targetMemberId_idx"
  ON "GroupJoinRequest"("targetMemberId");

ALTER TABLE "GroupJoinRequest"
  ADD CONSTRAINT "GroupJoinRequest_groupId_fkey"
  FOREIGN KEY ("groupId") REFERENCES "Group"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "GroupJoinRequest"
  ADD CONSTRAINT "GroupJoinRequest_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "GroupJoinRequest"
  ADD CONSTRAINT "GroupJoinRequest_resolvedByUserId_fkey"
  FOREIGN KEY ("resolvedByUserId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "GroupJoinRequest"
  ADD CONSTRAINT "GroupJoinRequest_targetMemberId_fkey"
  FOREIGN KEY ("targetMemberId") REFERENCES "GroupMember"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
