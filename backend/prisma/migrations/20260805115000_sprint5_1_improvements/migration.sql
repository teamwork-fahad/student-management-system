-- AlterTable
ALTER TABLE "public"."Admission" DROP COLUMN "createdBy",
ADD COLUMN     "admittedBy" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."AdmissionPayment" ADD COLUMN     "paymentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "public"."Student" ADD COLUMN     "profileCompleted" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "public"."StudentDocument" ADD COLUMN     "isRequired" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "AdmissionPayment_paymentDate_idx" ON "public"."AdmissionPayment"("paymentDate");
