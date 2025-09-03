-- AlterTable
ALTER TABLE "public"."ApiKeyRequest" ADD COLUMN     "apiAccessKeyId" TEXT;

-- AddForeignKey
ALTER TABLE "public"."ApiKeyRequest" ADD CONSTRAINT "ApiKeyRequest_apiAccessKeyId_fkey" FOREIGN KEY ("apiAccessKeyId") REFERENCES "public"."ApiKey"("id") ON DELETE SET NULL ON UPDATE CASCADE;
