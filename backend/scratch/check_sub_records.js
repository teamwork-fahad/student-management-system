import prisma from '../src/config/prisma.js';

async function main() {
  const targetStudentIds = ['cmshh58no0005v37wlwmlo9gu', 'cmshhgal00006v3ygisvqvmyi', 'cmshhhj3g0005v3lcejhy8dro']; // STD260121, STD260122, STD260123
  const targetAdmissionIds = ['cmshh58js0003v37wgjv8ztks', 'cmshhgahb0004v3ygg7pls4bs', 'cmshhhizl0003v3lc5aikoy3c']; // ADM-2026-0114, ADM-2026-0115, ADM-2026-0116
  const targetInquiryIds = ['cmshh58680001v37wkem1tbis', 'cmshhg9x40002v3yg3k4u570t', 'cmshhhigo0001v3lcyb7kbl19']; // INQ-2026-9999, INQ-2026-0101, INQ-2026-0102

  const attendances = await prisma.attendance.findMany({
    where: { studentId: { in: targetStudentIds } }
  });

  const documents = await prisma.studentDocument.findMany({
    where: { studentId: { in: targetStudentIds } }
  });

  const payments = await prisma.admissionPayment.findMany({
    where: { admissionId: { in: targetAdmissionIds } }
  });

  const followUps = await prisma.inquiryFollowUp.findMany({
    where: { inquiryId: { in: targetInquiryIds } }
  });

  console.log('Attendances to delete:', attendances.length, attendances);
  console.log('Documents to delete:', documents.length, documents);
  console.log('Payments to delete:', payments.length, payments);
  console.log('FollowUps to delete:', followUps.length, followUps);
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
