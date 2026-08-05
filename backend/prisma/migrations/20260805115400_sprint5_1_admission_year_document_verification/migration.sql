-- AlterTable
ALTER TABLE "public"."Admission" ADD COLUMN     "admissionYear" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."StudentDocument" ADD COLUMN     "rejectedReason" TEXT,
ADD COLUMN     "verifiedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Admission_admissionYear_idx" ON "public"."Admission"("admissionYear");
