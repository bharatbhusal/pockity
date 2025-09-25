/*
  Warnings:

  - Added the required column `purpose` to the `Otp` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."OtpPurpose" AS ENUM ('REGISTER', 'LOGIN', 'RESET_PASSWORD');

-- AlterTable
ALTER TABLE "public"."Otp" ADD COLUMN     "purpose" "public"."OtpPurpose" NOT NULL;
