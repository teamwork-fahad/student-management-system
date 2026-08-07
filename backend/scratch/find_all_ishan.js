import prisma from '../src/config/prisma.js';

async function main() {
  console.log('--- Search all Students with mobile 9824645914 ---');
  const students = await prisma.student.findMany({
    where: { mobile: '9824645914' },
    include: {
      admission: true,
      user: true,
      documents: true,
      attendances: true
    }
  });
  console.log('Students:', JSON.stringify(students, null, 2));

  console.log('--- Search all Admissions with guardianMobile 9824645914 ---');
  const admissions = await prisma.admission.findMany({
    where: {
      OR: [
        { guardianMobile: '9824645914' },
        { studentId: { in: students.map(s => s.id) } }
      ]
    },
    include: {
      payments: true
    }
  });
  console.log('Admissions:', JSON.stringify(admissions, null, 2));
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
