import prisma from "./prisma.js";

const targetAdmissions = [
  "ADM-2025-068",
  "ADM-2025-072",
  "ADM-2025-069",
  "ADM-2025-071",
  "ADM-2025-070",
  "ADM-2025-066",
  "ADM-2025-067",
  "ADM-2025-083",
  "ADM-2025-062",
  "ADM-2025-061",
  "ADM-2025-059",
  "ADM-2025-057",
  "ADM-2025-054",
  "ADM-2025-052",
  "ADM-2025-050",
  "ADM-2025-042",
  "ADM-2025-013",
];

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

    // Auto-update requested 17 admissions to COMPLETED with 0 pending dues
    for (const admNum of targetAdmissions) {
      const adm = await prisma.admission.findFirst({
        where: { admissionNumber: admNum },
        include: { student: true },
      });

      if (adm && (adm.status !== "COMPLETED" || Number(adm.pendingAmount) > 0 || adm.deletedAt !== null)) {
        const paid = Number(adm.paidAmount || 0);
        const courseF = Number(adm.courseFees || 0);
        const newFinalFees = paid > 0 ? paid : Number(adm.finalFees || 0);
        const newDiscount = Math.max(0, courseF - newFinalFees);

        await prisma.admission.update({
          where: { id: adm.id },
          data: {
            status: "COMPLETED",
            deletedAt: null,
            discount: newDiscount,
            finalFees: newFinalFees,
            pendingAmount: 0,
          },
        });

        if (adm.student) {
          await prisma.student.update({
            where: { id: adm.student.id },
            data: {
              status: "COMPLETED",
              completionDate: adm.student.completionDate || new Date(),
              deletedAt: null,
            },
          });
        }
        console.log(`[DB Auto-Fix] Updated ${admNum} (${adm.student?.fullName || "Student"}) to COMPLETED with 0 pending dues.`);
      }
    }
  } catch (err) {
    console.error("[DB Schema Sync Warning]", err.message);
  }
}
