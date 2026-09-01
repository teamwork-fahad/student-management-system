import prisma from '../src/config/prisma.js';

async function checkDobs() {
  const allStudents = await prisma.student.findMany({
    where: { deletedAt: null },
    select: {
      id: true,
      studentId: true,
      fullName: true,
      dob: true,
      status: true,
    },
  });

  console.log(`Total non-deleted students in DB: ${allStudents.length}`);

  const activeStudents = allStudents.filter((s) =>
    ["ACTIVE", "REVISION"].includes(s.status)
  );
  console.log(`Active/Revision students: ${activeStudents.length}`);

  const withDob = activeStudents.filter((s) => s.dob !== null);
  console.log(`Active students WITH DOB: ${withDob.length}`);

  const today = new Date();
  console.log(`Today's system date: ${today.toISOString()} (${today.toLocaleDateString()})`);

  console.log('\n--- List of Active Students with DOB ---');
  withDob.forEach((s) => {
    const dob = new Date(s.dob);
    console.log(
      `ID: ${s.studentId} | Name: ${s.fullName} | DOB Raw: ${s.dob} | DOB Parsed: ${dob.toDateString()} | Month: ${dob.getMonth() + 1}, Day: ${dob.getDate()}`
    );
  });

  await prisma.$disconnect();
}

checkDobs();
