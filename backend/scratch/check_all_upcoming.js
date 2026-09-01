import prisma from '../src/config/prisma.js';

async function checkAllStudentsUpcoming() {
  const allStudents = await prisma.student.findMany({
    where: { deletedAt: null, dob: { not: null } },
    select: {
      id: true,
      studentId: true,
      fullName: true,
      dob: true,
      status: true,
    },
  });

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  console.log(`Checking all ${allStudents.length} students with DOB regardless of status...`);

  const list = [];

  for (const student of allStudents) {
    const dob = new Date(student.dob);
    if (isNaN(dob.getTime())) continue;

    let targetYear = now.getFullYear();
    let nextBday = new Date(targetYear, dob.getMonth(), dob.getDate());
    if (nextBday < startOfToday) {
      targetYear += 1;
      nextBday = new Date(targetYear, dob.getMonth(), dob.getDate());
    }

    const diffTime = nextBday - startOfToday;
    const daysUntil = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (daysUntil <= 30) {
      list.push({
        id: student.studentId,
        name: student.fullName,
        status: student.status,
        dob: dob.toDateString(),
        daysUntil,
        nextBday: nextBday.toDateString(),
      });
    }
  }

  console.log(`Total students with birthday in next 30 days (ALL STATUSES): ${list.length}`);
  console.table(list);

  await prisma.$disconnect();
}

checkAllStudentsUpcoming();
