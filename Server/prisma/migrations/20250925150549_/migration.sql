/*
  Warnings:

  - You are about to drop the column `otp` on the `Otp` table. All the data in the column will be lost.
  - The required column `otp_code` was added to the `Otp` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- AlterTable
ALTER TABLE "public"."Otp" DROP COLUMN "otp",
ADD COLUMN     "otp_code" TEXT NOT NULL;
