// Test NO_CLASS for Ishan on 8th Aug
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  // Find Ishan
  const ishan = await prisma.student.findFirst({
    where: { studentId: "STD260124" },
    select: { id: true, fullName: true, studentId: true }
  });

  if (!ishan) { console.log("Ishan not found!"); process.exit(1); }
  console.log("Found:", ishan.fullName, "(", ishan.id, ")");

  // Try marking NO_CLASS on 8th Aug
  const result = await prisma.attendance.upsert({
    where: {
      studentId_date: {
        studentId: ishan.id,
        date: new Date(Date.UTC(2026, 7, 8, 0, 0, 0, 0)) // Aug 8 UTC
      }
    },
    update: { status: "NO_CLASS", markedBy: "TEST" },
    create: { studentId: ishan.id, date: new Date(Date.UTC(2026, 7, 8, 0, 0, 0, 0)), status: "NO_CLASS", markedBy: "TEST" }
  });
  
  console.log("✅ NO_CLASS saved successfully!", result.status, "on", result.date.toISOString().split("T")[0]);
  await prisma.$disconnect();
}

main().catch(e => { console.error("❌ ERROR:", e.message); process.exit(1); });
