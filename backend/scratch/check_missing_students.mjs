import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  // Students who are ACTIVE/REVISION but their admission is NOT ACTIVE
  const missingStudents = await prisma.student.findMany({
    where: {
      deletedAt: null,
      status: { in: ["ACTIVE", "REVISION"] },
      admission: {
        status: { not: "ACTIVE" }
      }
    },
    include: {
      admission: {
        select: { status: true, courseNameSnapshot: true }
      }
    }
  });

  console.log("\n=== STUDENTS ACTIVE BUT ADMISSION STATUS != ACTIVE ===");
  console.log("Total affected:", missingStudents.length);
  console.log("These students were NOT showing in attendance before the fix:\n");
  missingStudents.forEach((s, i) => {
    console.log(
      `${i + 1}. ${s.studentId} - ${s.fullName} | Student: ${s.status} | Admission: ${s.admission?.status} | Course: ${s.admission?.courseNameSnapshot}`
    );
  });

  // Also total active students now (after fix)
  const totalNow = await prisma.student.count({
    where: { deletedAt: null, status: { in: ["ACTIVE", "REVISION"] } }
  });
  const totalBefore = await prisma.student.count({
    where: { deletedAt: null, status: { in: ["ACTIVE", "REVISION"] }, admission: { status: "ACTIVE" } }
  });

  console.log("\n=== COMPARISON ===");
  console.log("Before fix (with admission ACTIVE filter):", totalBefore, "students");
  console.log("After fix  (only student status filter)  :", totalNow, "students");
  console.log("Students RECOVERED:", totalNow - totalBefore);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
