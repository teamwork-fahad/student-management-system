-- AlterEnum
ALTER TYPE "public"."StudentStatus" ADD VALUE IF NOT EXISTS 'REVISION';

-- AlterTable
ALTER TABLE "public"."Student" ADD COLUMN IF NOT EXISTS "completionDate" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "isCertificateEligible" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "certificateUrl" TEXT,
ADD COLUMN IF NOT EXISTS "certificateFileName" TEXT,
ADD COLUMN IF NOT EXISTS "certificateUploadedAt" TIMESTAMP(3);
