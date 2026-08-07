import prisma from '../src/config/prisma.js';

async function checkInquiries() {
  console.log('=== 1. Searching Courses matching SSC / GSEB ===');
  const courses = await prisma.course.findMany({
    where: {
      OR: [
        { name: { contains: 'SSC', mode: 'insensitive' } },
        { name: { contains: 'GSEB', mode: 'insensitive' } },
      ]
    }
  });
  console.log('Courses found:', courses);

  console.log('\n=== 2. Searching ALL Recent Inquiries (last 20) ===');
  const inquiries = await prisma.inquiry.findMany({
    take: 20,
    orderBy: { createdAt: 'desc' },
    include: { course: true, leadSource: true, assignedTo: true }
  });
  console.log(`Total recent inquiries in DB: ${inquiries.length}`);
  inquiries.forEach((inq, idx) => {
    console.log(`${idx+1}. [${inq.inquiryNumber}] Name: "${inq.fullName}" | Course: "${inq.course?.name || 'N/A'}" | Status: ${inq.status} | CreatedAt: ${inq.createdAt}`);
  });

  console.log('\n=== 3. Searching Notifications in DB ===');
  const notifications = await prisma.notification.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' },
  });
  console.log('Notifications found:', notifications);
}

checkInquiries()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
