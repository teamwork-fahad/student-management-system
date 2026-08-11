import prisma from "./prisma.js";

export async function ensureDbSchema() {
  try {
    await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
          IF NOT EXISTS (
              SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid 
              WHERE t.typname = 'StudentStatus' AND e.enumlabel = 'REVISION'
          ) THEN
              ALTER TYPE "public"."StudentStatus" ADD VALUE 'REVISION';
          END IF;

          IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_name='Student' AND column_name='completionDate'
          ) THEN
              ALTER TABLE "public"."Student" ADD COLUMN "completionDate" TIMESTAMP(3);
          END IF;

          IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_name='Student' AND column_name='isCertificateEligible'
          ) THEN
              ALTER TABLE "public"."Student" ADD COLUMN "isCertificateEligible" BOOLEAN NOT NULL DEFAULT false;
          END IF;

          IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_name='Student' AND column_name='certificateUrl'
          ) THEN
              ALTER TABLE "public"."Student" ADD COLUMN "certificateUrl" TEXT;
          END IF;

          IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_name='Student' AND column_name='certificateFileName'
          ) THEN
              ALTER TABLE "public"."Student" ADD COLUMN "certificateFileName" TEXT;
          END IF;

          IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_name='Student' AND column_name='certificateUploadedAt'
          ) THEN
              ALTER TABLE "public"."Student" ADD COLUMN "certificateUploadedAt" TIMESTAMP(3);
          END IF;
      END $$;
    `);
    console.log("[DB Schema Sync] Student table columns verified and synced.");
  } catch (err) {
    console.error("[DB Schema Sync Warning]", err.message);
  }
}
