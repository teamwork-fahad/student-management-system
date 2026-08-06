import { markBatchAttendance } from "../src/modules/attendance/attendance.service.js";
import prisma from "../src/config/prisma.js";

async function test() {
  const student = await prisma.student.findFirst({ where: { status: "ACTIVE" } });
  console.log("Found student:", student?.id, student?.fullName);

  if (!student) {
    console.log("No active student found!");
    return;
  }

  try {
    const res = await markBatchAttendance({
      date: new Date().toISOString().split("T")[0],
      records: [{ studentId: student.id, status: "PRESENT" }],
      markedBy: "SUPER_ADMIN",
    });
    console.log("Mark attendance success:", res);
  } catch (err) {
    console.error("Mark attendance error:", err);
  }
}

test().finally(() => prisma.$disconnect());
