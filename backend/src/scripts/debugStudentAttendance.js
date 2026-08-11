import prisma from "../config/prisma.js";

async function debugStudent() {
  console.log("🔍 Searching for student 'Shaikh Abdul Ahad' or ID 'cmsh10s4j00dcv3oobt0bmymo'...");

  const students = await prisma.student.findMany({
    where: {
      OR: [
        { id: "cmsh10s4j00dcv3oobt0bmymo" },
        { fullName: { contains: "Shaikh Abdul Ahad", mode: "insensitive" } },
        { fullName: { contains: "Ahad", mode: "insensitive" } },
      ],
    },
    include: {
      admission: {
        include: { course: true },
      },
    },
  });

  console.log(`Found ${students.length} student(s):`);
  for (const s of students) {
    console.log(`--------------------------------------------------`);
    console.log(`ID:           ${s.id}`);
    console.log(`Student ID:   ${s.studentId}`);
    console.log(`Full Name:    ${s.fullName}`);
    console.log(`Mobile:       ${s.mobile}`);
    console.log(`Email:        ${s.email}`);
    console.log(`Joined Date:  ${s.joinedDate}`);
    console.log(`Status:       ${s.status}`);
    console.log(`Admission ID: ${s.admissionId}`);
    console.log(`Admission Status: ${s.admission?.status}`);
    console.log(`Course Name:  ${s.admission?.courseNameSnapshot || s.admission?.course?.name}`);
  }

  // Also search admissions with this inquiry / student name
  const admissions = await prisma.admission.findMany({
    where: {
      OR: [
        { inquiry: { fullName: { contains: "Ahad", mode: "insensitive" } } },
        { student: { fullName: { contains: "Ahad", mode: "insensitive" } } },
      ],
    },
    include: {
      student: true,
      course: true,
    },
  });

  console.log(`\nFound ${admissions.length} admission(s) related to Ahad:`);
  for (const a of admissions) {
    console.log(`  - Adm #${a.admissionNumber} [ID: ${a.id}], Course: "${a.courseNameSnapshot}", Adm Status: ${a.status}, Student: "${a.student?.fullName}" (${a.student?.status})`);
  }
}

debugStudent()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
