import prisma from "../config/prisma.js";

export async function fixStudentStatus() {
  console.log("🔍 Inspecting student Shaikh Abdul Ahad & active student statuses...");

  // Find Shaikh Abdul Ahad or ID cmsh10s4j00dcv3oobt0bmymo
  const students = await prisma.student.findMany({
    where: {
      OR: [
        { id: "cmsh10s4j00dcv3oobt0bmymo" },
        { fullName: { contains: "Shaikh Abdul Ahad", mode: "insensitive" } },
        { fullName: { contains: "Ahad", mode: "insensitive" } },
      ],
    },
    include: {
      admission: true,
    },
  });

  console.log(`Found ${students.length} student record(s) matching Ahad:`);

  for (const s of students) {
    console.log(`- Student ID: ${s.studentId}, Name: "${s.fullName}", Current Status: ${s.status}, Admission Status: ${s.admission?.status}`);
    
    // Update student status to ACTIVE so they appear in Attendance & Active lists
    await prisma.student.update({
      where: { id: s.id },
      data: {
        status: "ACTIVE",
        deletedAt: null,
      },
    });

    if (s.admissionId) {
      await prisma.admission.update({
        where: { id: s.admissionId },
        data: {
          status: "ACTIVE",
          deletedAt: null,
        },
      });
    }

    console.log(`  ✅ Updated "${s.fullName}" (${s.studentId}) status to ACTIVE & Admission to ACTIVE!`);
  }

  // Also check any other students who have an active inquiry or admission but student.status is COMPLETED / DROPPED unintentionally
  const activeAdmissionsWithInactiveStudent = await prisma.admission.findMany({
    where: {
      status: "ACTIVE",
      deletedAt: null,
      student: {
        status: { not: "ACTIVE" },
      },
    },
    include: { student: true },
  });

  console.log(`\nFound ${activeAdmissionsWithInactiveStudent.length} active admission(s) with inactive student status.`);
  for (const adm of activeAdmissionsWithInactiveStudent) {
    if (adm.student) {
      await prisma.student.update({
        where: { id: adm.student.id },
        data: { status: "ACTIVE" },
      });
      console.log(`  ✅ Synced student "${adm.student.fullName}" status to ACTIVE.`);
    }
  }

  console.log("\n==================================================");
  console.log("🎉 STUDENT STATUS SYNCHRONIZATION COMPLETE!");
  console.log("==================================================");
}

fixStudentStatus()
  .catch((err) => {
    console.error("❌ Error fixing student status:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
