/*
  Warnings:

  - You are about to drop the column `authMethod` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `passwordHash` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `Otp` table. If the table is not empty, all the data it contains will be lost.
  - Made the column `googleId` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "public"."User" DROP COLUMN "authMethod",
DROP COLUMN "passwordHash",
ALTER COLUMN "emailVerified" SET DEFAULT true,
ALTER COLUMN "googleId" SET NOT NULL;

-- DropTable
DROP TABLE "public"."Otp";

-- DropEnum
DROP TYPE "public"."AuthMethod";

-- DropEnum
DROP TYPE "public"."OtpPurpose";
