import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  console.log("=== RESTORING RANA KRISH CHETANKUMAR ===");

  const restoredStudent = await prisma.student.updateMany({
    where: {
      OR: [
        { studentId: "STU-2025-126" },
        { mobile: "7874232528" },
      ],
    },
    data: {
      deletedAt: null,
      status: "ACTIVE",
    },
  });

  const restoredAdmission = await prisma.admission.updateMany({
    where: {
      OR: [
        { admissionNumber: "ADM-2025-126" },
        { guardianMobile: "7874232528" },
      ],
    },
    data: {
      deletedAt: null,
      status: "ACTIVE",
    },
  });

  console.log("Restored student rows:", restoredStudent.count);
  console.log("Restored admission rows:", restoredAdmission.count);

  const studentCheck = await prisma.student.findMany({
    where: { mobile: "7874232528" },
    include: { admission: true },
  });
  console.log("\nVerified in DB:", studentCheck);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
