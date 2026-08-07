import prisma from '../src/config/prisma.js';

async function main() {
  const students = await prisma.student.findMany({
    where: {
      OR: [
        { studentId: 'STD260121' },
        { fullName: { contains: 'Ishan', mode: 'insensitive' } },
        { mobile: '9824645914' }
      ]
    },
    include: {
      admission: true,
      user: true,
      documents: true,
      attendances: true
    }
  });

  console.log('--- ALL MATCHING STUDENTS ---');
  students.forEach(s => {
    console.log(`Student ID: ${s.id} | studentIdStr: ${s.studentId} | Name: ${s.fullName} | Mobile: ${s.mobile} | DeletedAt: ${s.deletedAt}`);
    console.log(`  Admission ID: ${s.admission?.id} | AdmNo: ${s.admission?.admissionNumber} | Course: ${s.admission?.courseNameSnapshot} | DeletedAt: ${s.admission?.deletedAt}`);
    console.log(`  User ID: ${s.user?.id} | Email: ${s.user?.email}`);
    console.log(`  Attendances Count: ${s.attendances.length}`);
  });

  const inquiries = await prisma.inquiry.findMany({
    where: {
      OR: [
        { fullName: { contains: 'Ishan', mode: 'insensitive' } },
        { mobile: '9824645914' }
      ]
    },
    include: {
      admission: true
    }
  });

  console.log('\n--- ALL MATCHING INQUIRIES ---');
  inquiries.forEach(i => {
    console.log(`Inquiry ID: ${i.id} | InqNo: ${i.inquiryNumber} | Name: ${i.fullName} | Status: ${i.status} | CourseId: ${i.courseId}`);
  });
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
