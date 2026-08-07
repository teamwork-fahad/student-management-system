import prisma from '../src/config/prisma.js';

async function deleteStudentEntry() {
  console.log('🚀 Starting deletion of student STD260121 Ishan Nikulkumar Patel (Flask Python)...');

  // 1. Find target student STD260121 and any related Flask Python entries for Ishan Nikulkumar Patel
  const targetStudents = await prisma.student.findMany({
    where: {
      OR: [
        { studentId: 'STD260121' },
        { studentId: 'STD260122' },
        { studentId: 'STD260123' },
      ],
      fullName: { contains: 'Ishan', mode: 'insensitive' }
    },
    include: {
      admission: true,
      attendances: true,
      documents: true
    }
  });

  console.log(`Found ${targetStudents.length} student record(s) matching target criteria:`);
  targetStudents.forEach(s => {
    console.log(`- ID: ${s.id} | studentId: ${s.studentId} | Name: ${s.fullName} | Status: ${s.status} | AdmissionID: ${s.admissionId}`);
  });

  const studentDbIds = targetStudents.map(s => s.id);
  const admissionIds = targetStudents.map(s => s.admissionId).filter(Boolean);

  // Inquiries associated with Flask Python course and Ishan Nikulkumar Patel
  const flaskCourse = await prisma.course.findFirst({
    where: { name: { contains: 'Flask Python', mode: 'insensitive' } }
  });

  let inquiryIds = [];
  if (flaskCourse) {
    const targetInquiries = await prisma.inquiry.findMany({
      where: {
        courseId: flaskCourse.id,
        fullName: { contains: 'Ishan', mode: 'insensitive' }
      }
    });
    inquiryIds = targetInquiries.map(i => i.id);
    console.log(`Found ${targetInquiries.length} inquiry record(s) for Flask Python:`, inquiryIds);
  }

  // Also include admissions associated with these inquiries if any
  const additionalAdmissions = await prisma.admission.findMany({
    where: {
      inquiryId: { in: inquiryIds }
    }
  });
  additionalAdmissions.forEach(a => {
    if (!admissionIds.includes(a.id)) {
      admissionIds.push(a.id);
    }
  });

  console.log('\n--- EXECUTING TRANSACTION ---');
  const result = await prisma.$transaction(async (tx) => {
    // A. Delete Attendances
    const deletedAttendances = await tx.attendance.deleteMany({
      where: { studentId: { in: studentDbIds } }
    });

    // B. Delete Student Documents
    const deletedDocuments = await tx.studentDocument.deleteMany({
      where: { studentId: { in: studentDbIds } }
    });

    // C. Delete Admission Payments
    const deletedPayments = await tx.admissionPayment.deleteMany({
      where: { admissionId: { in: admissionIds } }
    });

    // D. Delete Student records
    const deletedStudents = await tx.student.deleteMany({
      where: { id: { in: studentDbIds } }
    });

    // E. Delete Admission records
    const deletedAdmissions = await tx.admission.deleteMany({
      where: { id: { in: admissionIds } }
    });

    // F. Delete Inquiry Followups
    const deletedFollowUps = await tx.inquiryFollowUp.deleteMany({
      where: { inquiryId: { in: inquiryIds } }
    });

    // G. Delete Inquiry records
    const deletedInquiries = await tx.inquiry.deleteMany({
      where: { id: { in: inquiryIds } }
    });

    return {
      deletedAttendances: deletedAttendances.count,
      deletedDocuments: deletedDocuments.count,
      deletedPayments: deletedPayments.count,
      deletedStudents: deletedStudents.count,
      deletedAdmissions: deletedAdmissions.count,
      deletedFollowUps: deletedFollowUps.count,
      deletedInquiries: deletedInquiries.count
    };
  });

  console.log('✅ TRANSACTION COMPLETED SUCCESSFULLY:');
  console.log(JSON.stringify(result, null, 2));
}

deleteStudentEntry()
  .catch(err => {
    console.error('❌ Deletion Error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
