import prisma from '../src/config/prisma.js';

async function main() {
  console.log('--- VERIFICATION ---');
  const student260121 = await prisma.student.findFirst({
    where: {
      OR: [
        { studentId: 'STD260121' },
        { studentId: 'STD260122' },
        { studentId: 'STD260123' },
      ]
    }
  });
  console.log('STD260121 / Flask Python student search result:', student260121 ? 'FOUND (ERROR)' : 'NONE FOUND (DELETED OK)');

  const remainingStudents = await prisma.student.findMany({
    where: {
      fullName: { contains: 'Ishan', mode: 'insensitive' }
    },
    include: {
      admission: true
    }
  });

  console.log('\nRemaining Student Profiles for Ishan:');
  remainingStudents.forEach(s => {
    console.log(`- studentId: ${s.studentId} | Name: ${s.fullName} | Admission: ${s.admission?.admissionNumber} (${s.admission?.courseNameSnapshot})`);
  });

  const remainingInquiries = await prisma.inquiry.findMany({
    where: {
      fullName: { contains: 'Ishan', mode: 'insensitive' }
    },
    include: {
      course: true
    }
  });

  console.log('\nRemaining Inquiries for Ishan:');
  remainingInquiries.forEach(i => {
    console.log(`- InqNo: ${i.inquiryNumber} | Name: ${i.fullName} | Course: ${i.course?.name}`);
  });
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
