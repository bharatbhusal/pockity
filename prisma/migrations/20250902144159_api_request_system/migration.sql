-- CreateEnum
CREATE TYPE "public"."ApiKeyRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "public"."ApiKeyRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "requestedStorage" BIGINT NOT NULL,
    "requestedObjects" INTEGER NOT NULL,
    "reason" TEXT,
    "status" "public"."ApiKeyRequestStatus" NOT NULL DEFAULT 'PENDING',
    "reviewerId" TEXT,
    "reviewerComment" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApiKeyRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ApiKeyRequest_userId_idx" ON "public"."ApiKeyRequest"("userId");

-- CreateIndex
CREATE INDEX "ApiKeyRequest_status_idx" ON "public"."ApiKeyRequest"("status");

-- AddForeignKey
ALTER TABLE "public"."ApiKeyRequest" ADD CONSTRAINT "ApiKeyRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
