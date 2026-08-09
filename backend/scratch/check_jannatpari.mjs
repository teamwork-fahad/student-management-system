import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  // Search for Jannatpari specifically
  const student = await prisma.student.findFirst({
    where: {
      fullName: { contains: "Jannat", mode: "insensitive" }
    },
    include: {
      admission: true
    }
  });

  console.log("\n=== JANNATPARI MANSURI SEARCH ===");
  if (!student) {
    console.log("❌ Student NOT found in DB at all!");
  } else {
    console.log("✅ Found student:");
    console.log("  ID:", student.id);
    console.log("  studentId:", student.studentId);
    console.log("  fullName:", student.fullName);
    console.log("  status:", student.status);
    console.log("  deletedAt:", student.deletedAt);
    console.log("  admissionId:", student.admissionId);
    if (student.admission) {
      console.log("  admission.status:", student.admission.status);
      console.log("  admission.courseId:", student.admission.courseId);
      console.log("  admission.courseNameSnapshot:", student.admission.courseNameSnapshot);
      console.log("  admission.deletedAt:", student.admission.deletedAt);
    } else {
      console.log("  ❌ NO ADMISSION LINKED!");
    }
  }

  // All students with no linked admission
  const noAdmission = await prisma.student.findMany({
    where: {
      deletedAt: null,
      status: { in: ["ACTIVE", "REVISION"] },
      admission: null
    },
    select: { studentId: true, fullName: true, status: true, admissionId: true }
  });

  console.log("\n=== ACTIVE STUDENTS WITH NO LINKED ADMISSION ===");
  console.log("Total:", noAdmission.length);
  noAdmission.forEach((s, i) => {
    console.log(`${i + 1}. ${s.studentId} - ${s.fullName} | status: ${s.status} | admissionId: ${s.admissionId}`);
  });

  // All active students summary
  const allActive = await prisma.student.findMany({
    where: { deletedAt: null, status: { in: ["ACTIVE", "REVISION"] } },
    include: { admission: { select: { status: true, courseNameSnapshot: true, courseId: true } } },
    orderBy: { fullName: "asc" }
  });

  console.log("\n=== ALL ACTIVE/REVISION STUDENTS ===");
  allActive.forEach((s, i) => {
    const admStatus = s.admission?.status || "NO_ADMISSION";
    const courseId = s.admission?.courseId || "NO_COURSE";
    console.log(`${i + 1}. ${s.studentId} - ${s.fullName} | StudentStatus: ${s.status} | AdmStatus: ${admStatus} | CourseId: ${courseId.substring(0,8)}...`);
  });

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
