import prisma from '../src/config/prisma.js';
import { createPublicInquiry } from '../src/modules/inquiry/inquiry.service.js';

async function testSubmit() {
  const sscCourse = await prisma.course.findFirst({
    where: { name: { contains: 'SSC(GUJ)', mode: 'insensitive' } }
  });

  console.log('Found SSC Course:', sscCourse);

  const newInq = await createPublicInquiry({
    fullName: 'Test Student GSEB SSC',
    mobile: '9898989898',
    email: 'testgseb@gmail.com',
    courseId: sscCourse.id,
    remarks: 'Inquiry for SSC GSEB Board',
    allowDuplicate: true,
  });

  console.log('Created Public Inquiry:', newInq.inquiryNumber, newInq.course?.name);

  // Check if Notification was created
  const notif = await prisma.notification.findFirst({
    where: { message: { contains: 'Test Student GSEB SSC' } }
  });

  console.log('Created Notification in DB:', notif);

  // Clean up test inquiry & notification
  if (newInq) await prisma.inquiry.delete({ where: { id: newInq.id } });
  if (notif) await prisma.notification.delete({ where: { id: notif.id } });
}

testSubmit()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
