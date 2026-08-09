import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  // Simulate the FIXED getAttendanceByDate with no course filter
  const today = new Date().toISOString().split("T")[0];
  const [y, m, d] = today.split("-").map(Number);
  const targetDate = new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));

  console.log("Date being queried:", targetDate.toISOString());

  const where = {
    deletedAt: null,
    status: { in: ["ACTIVE", "REVISION"] },
  };

  const students = await prisma.student.findMany({
    where,
    include: {
      admission: { include: { course: true } },
      attendances: { where: { date: targetDate } }
    },
    orderBy: { fullName: "asc" }
  });

  console.log("\n=== ATTENDANCE LIST (FIXED, no course filter) ===");
  console.log("Total students shown:", students.length);
  students.forEach((s, i) => {
    const found = s.fullName.toLowerCase().includes("jannat");
    const prefix = found ? "🟢 FOUND!" : `${i + 1}.`;
    console.log(`${prefix} ${s.studentId} - ${s.fullName} | admission.courseId: ${s.admission?.courseId?.substring(0, 8) || "NULL"} | course: ${s.admission?.courseNameSnapshot || "N/A"}`);
  });

  // Now simulate OLD broken query
  const whereBroken = {
    deletedAt: null,
    status: { in: ["ACTIVE", "REVISION"] },
    admission: { status: "ACTIVE" }
  };

  const studentsBroken = await prisma.student.findMany({
    where: whereBroken,
    include: {
      admission: { include: { course: true } },
      attendances: { where: { date: targetDate } }
    },
    orderBy: { fullName: "asc" }
  });

  console.log("\n=== OLD BROKEN QUERY RESULT ===");
  console.log("Total students shown:", studentsBroken.length);
  studentsBroken.forEach((s, i) => {
    const found = s.fullName.toLowerCase().includes("jannat");
    const prefix = found ? "🟢 FOUND!" : `${i + 1}.`;
    console.log(`${prefix} ${s.studentId} - ${s.fullName}`);
  });

  // Check all courses in DB
  const allCourses = await prisma.course.findMany({
    select: { id: true, name: true, code: true },
    where: { isActive: true }
  });
  console.log("\n=== ACTIVE COURSES IN DB ===");
  allCourses.forEach(c => console.log(`  ${c.id} - ${c.name} (${c.code})`));

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
