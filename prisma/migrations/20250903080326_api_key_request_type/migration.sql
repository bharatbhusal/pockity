-- CreateEnum
CREATE TYPE "public"."ApiKeyRequestType" AS ENUM ('CREATE', 'UPGRADE');

-- AlterTable
ALTER TABLE "public"."ApiKeyRequest" ADD COLUMN     "requestType" "public"."ApiKeyRequestType" NOT NULL DEFAULT 'CREATE';
