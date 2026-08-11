import prisma from "../config/prisma.js";

async function debugAdmissions() {
  console.log("🔍 Debugging ADM-2026-0172, ADM-2026-0171, ADM-2026-0170...");

  const targetAdmNumbers = ["ADM-2026-0172", "ADM-2026-0171", "ADM-2026-0170"];

  const admissions = await prisma.admission.findMany({
    where: {
      admissionNumber: { in: targetAdmNumbers },
    },
    include: {
      student: true,
      inquiry: true,
    },
  });

  console.log(`Found ${admissions.length} admission records:`);
  for (const a of admissions) {
    console.log(`--------------------------------------------------`);
    console.log(`Admission Number: ${a.admissionNumber}`);
    console.log(`Admission ID:     ${a.id}`);
    console.log(`studentId field:  ${a.studentId}`);
    console.log(`inquiryId field:  ${a.inquiryId}`);
    console.log(`guardianName:     ${a.guardianName}`);
    console.log(`student object:  `, a.student);
    console.log(`inquiry object:  `, a.inquiry);
  }
}

debugAdmissions()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
