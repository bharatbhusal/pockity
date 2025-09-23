-- AlterTable
ALTER TABLE "public"."ApiKey" ADD COLUMN     "totalObjects" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalStorage" BIGINT NOT NULL DEFAULT 0;
