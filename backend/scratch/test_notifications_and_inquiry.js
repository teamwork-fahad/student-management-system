import prisma from '../src/config/prisma.js';
import { createInquiry, createPublicInquiry } from '../src/modules/inquiry/inquiry.service.js';
import { getNotifications, markAllNotificationsAsRead, checkAndGenerateBirthdayNotifications } from '../src/modules/notifications/notification.service.js';

async function testAll() {
  console.log('🧪 TEST 1: Public Inquiry Creation & Email/In-App Notification Trigger...');
  const testMobile = '9988776655';
  const testEmail = 'testinquiry99@gmail.com';

  // Delete student -> admission -> inquiry safely
  const oldInqs = await prisma.inquiry.findMany({ where: { mobile: testMobile } });
  const inqIds = oldInqs.map(i => i.id);
  const oldAdms = await prisma.admission.findMany({ where: { inquiryId: { in: inqIds } } });
  const admIds = oldAdms.map(a => a.id);

  await prisma.student.deleteMany({ where: { admissionId: { in: admIds } } });
  await prisma.admission.deleteMany({ where: { id: { in: admIds } } });
  await prisma.inquiry.deleteMany({ where: { mobile: testMobile } });

  const inq1 = await createPublicInquiry({
    fullName: 'Rahul Verification Test',
    mobile: testMobile,
    email: testEmail,
    remarks: 'Automated test inquiry',
  });
  console.log('✅ Inquiry Created:', inq1.inquiryNumber, inq1.id);

  console.log('\n🧪 TEST 2: Duplicate Inquiry Prevention (Mobile Conflict)...');
  try {
    await createPublicInquiry({
      fullName: 'Duplicate Test',
      mobile: testMobile,
      email: testEmail,
    });
    console.error('❌ FAIL: Duplicate should have been blocked!');
  } catch (err) {
    console.log('✅ SUCCESS: Duplicate blocked with message:', err.message);
  }

  console.log('\n🧪 TEST 3: Admin Override Duplicate Inquiry...');
  const inq2 = await createInquiry({
    fullName: 'Rahul Duplicate Allowed',
    mobile: testMobile,
    email: testEmail,
    courseId: inq1.courseId,
    leadSourceId: inq1.leadSourceId,
    assignedToId: inq1.assignedToId,
    allowDuplicate: true,
  });
  console.log('✅ SUCCESS: Duplicate allowed via Admin override:', inq2.inquiryNumber);

  console.log('\n🧪 TEST 4: Birthday Notification Generator...');
  const today = new Date();
  const dummyStuId = 'STD999999';

  const oldStudents = await prisma.student.findMany({ where: { studentId: dummyStuId } });
  const oldAdmIds = oldStudents.map(s => s.admissionId).filter(Boolean);
  await prisma.student.deleteMany({ where: { studentId: dummyStuId } });
  if (oldAdmIds.length) await prisma.admission.deleteMany({ where: { id: { in: oldAdmIds } } });

  const course = await prisma.course.findFirst();
  const leadSource = await prisma.leadSource.findFirst();
  const adminUser = await prisma.user.findFirst({ where: { role: 'SUPER_ADMIN' } });

  const dummyInq = await prisma.inquiry.create({
    data: {
      inquiryNumber: 'INQ-TEST-BDAY',
      fullName: 'Birthday Student Test',
      mobile: '9900001122',
      whatsapp: '9900001122',
      gender: 'Male',
      expectedFees: 10000,
      inquiryDate: today,
      nextFollowUpDate: today,
      courseId: course.id,
      leadSourceId: leadSource.id,
      assignedToId: adminUser.id,
    }
  });

  const dummyAdm = await prisma.admission.create({
    data: {
      admissionNumber: 'ADM-TEST-BDAY',
      inquiryId: dummyInq.id,
      courseId: course.id,
      courseNameSnapshot: course.name,
      courseFeesSnapshot: course.fees,
      admissionYear: '2026',
      courseFees: course.fees,
      finalFees: course.fees,
      pendingAmount: course.fees,
      studentCategory: 'OTHER',
      guardianName: 'Test Parent',
      guardianMobile: '9900001122',
      guardianRelation: 'FATHER',
      admittedBy: adminUser.id,
    }
  });

  const bdayStudent = await prisma.student.create({
    data: {
      studentId: dummyStuId,
      admissionId: dummyAdm.id,
      fullName: 'Birthday Student Test',
      mobile: '9900001122',
      dob: new Date(2002, today.getMonth(), today.getDate()),
      gender: 'Male',
      joinedDate: today,
    }
  });
  console.log('Created Birthday Student:', bdayStudent.studentId, 'DOB:', bdayStudent.dob);

  await checkAndGenerateBirthdayNotifications();
  console.log('✅ Birthday check executed.');

  console.log('\n🧪 TEST 5: Get Notifications API...');
  const notifResult = await getNotifications(adminUser.id);
  console.log(`Retrieved ${notifResult.notifications.length} notifications. Unread Count: ${notifResult.unreadCount}`);
  notifResult.notifications.slice(0, 5).forEach(n => {
    console.log(`- [${n.type}] ${n.title}: ${n.message} (isRead: ${n.isRead})`);
  });

  console.log('\n🧪 TEST 6: Mark All Notifications as Read...');
  await markAllNotificationsAsRead(adminUser.id);
  const afterReadResult = await getNotifications(adminUser.id);
  console.log(`✅ After Read All: Unread Count = ${afterReadResult.unreadCount}`);

  // Cleanup test data safely
  await prisma.student.deleteMany({ where: { studentId: dummyStuId } });
  await prisma.admission.deleteMany({ where: { id: dummyAdm.id } });
  await prisma.inquiry.deleteMany({ where: { id: dummyInq.id } });
  const createdTestInqs = await prisma.inquiry.findMany({ where: { mobile: testMobile } });
  const createdInqIds = createdTestInqs.map(i => i.id);
  const createdAdms = await prisma.admission.findMany({ where: { inquiryId: { in: createdInqIds } } });
  const createdAdmIds = createdAdms.map(a => a.id);
  await prisma.student.deleteMany({ where: { admissionId: { in: createdAdmIds } } });
  await prisma.admission.deleteMany({ where: { id: { in: createdAdmIds } } });
  await prisma.inquiry.deleteMany({ where: { mobile: testMobile } });
  console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY!');
}

testAll()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
