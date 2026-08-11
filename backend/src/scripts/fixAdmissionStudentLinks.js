import prisma from "../config/prisma.js";

export async function fixAdmissions() {
  console.log("🔍 Inspecting Admissions and Student link integrity...");

  const admissions = await prisma.admission.findMany({
    where: { deletedAt: null },
    include: {
      student: true,
      inquiry: true,
    },
  });

  console.log(`📋 Total active admissions found: ${admissions.length}`);

  let missingStudentCount = 0;
  let fixedStudentLinkCount = 0;

  for (const adm of admissions) {
    // Check if student object is missing on the admission relation
    if (!adm.student) {
      missingStudentCount++;
      console.log(`⚠️ Admission [${adm.admissionNumber}, ID: ${adm.id}] has no linked Student record. Inquiry Name: "${adm.inquiry?.fullName}", Guardian: "${adm.guardianName}"`);

      // Try finding student by mobile or email or fullName who is NOT YET linked to any admission
      let matchedStudent = null;

      // 1. Check by Inquiry Mobile
      if (adm.inquiry?.mobile) {
        const candidate = await prisma.student.findFirst({
          where: { mobile: adm.inquiry.mobile },
          include: { admission: true },
        });
        if (candidate) matchedStudent = candidate;
      }
      // 2. Check by Inquiry Email
      if (!matchedStudent && adm.inquiry?.email) {
        const candidate = await prisma.student.findFirst({
          where: { email: adm.inquiry.email },
          include: { admission: true },
        });
        if (candidate) matchedStudent = candidate;
      }
      // 3. Check by Inquiry FullName
      if (!matchedStudent && adm.inquiry?.fullName) {
        const candidate = await prisma.student.findFirst({
          where: { fullName: { equals: adm.inquiry.fullName, mode: "insensitive" } },
          include: { admission: true },
        });
        if (candidate) matchedStudent = candidate;
      }

      // Check if matchedStudent can be linked to adm without breaking @unique constraint
      let canLinkMatched = false;
      if (matchedStudent) {
        const existingAdmForStudent = await prisma.admission.findFirst({
          where: { studentId: matchedStudent.id },
        });
        const existingStudentForAdm = await prisma.student.findFirst({
          where: { admissionId: adm.id },
        });
        if (!existingAdmForStudent && !existingStudentForAdm) {
          canLinkMatched = true;
        }
      }

      if (canLinkMatched && matchedStudent) {
        try {
          await prisma.student.update({
            where: { id: matchedStudent.id },
            data: { admissionId: adm.id },
          });
          await prisma.admission.update({
            where: { id: adm.id },
            data: { studentId: matchedStudent.id },
          });
          fixedStudentLinkCount++;
          console.log(`  ✅ Fixed link: Linked existing Student "${matchedStudent.fullName}" (${matchedStudent.studentId}) to Admission ${adm.admissionNumber}`);
          continue;
        } catch (e) {
          console.log(`  ⚠️ Could not link matched student directly due to constraint, creating dedicated student record...`);
        }
      }

      // Create a dedicated unique Student record for this admission
      let seqStd = await prisma.sequence.findFirst({ where: { name: "STUDENT" } });
      let stdVal = (seqStd?.currentValue || 100) + 1;
      const yearShort = String(new Date().getFullYear()).slice(-2);
      let stdNum = "";
      while (true) {
        const candidate = `STD${yearShort}${String(stdVal).padStart(4, "0")}`;
        const exists = await prisma.student.findFirst({ where: { studentId: candidate } });
        if (!exists) {
          stdNum = candidate;
          break;
        }
        stdVal++;
      }

      const nameToUse = adm.inquiry?.fullName || matchedStudent?.fullName || adm.guardianName || "Student " + adm.admissionNumber;
      const genderToUse = adm.inquiry?.gender || matchedStudent?.gender || "Female";
      const mobileToUse = adm.inquiry?.mobile || matchedStudent?.mobile || adm.guardianMobile || "0000000000";
      const emailToUse = adm.inquiry?.email || matchedStudent?.email || null;

      const newStudent = await prisma.student.create({
        data: {
          studentId: stdNum,
          admissionId: adm.id,
          fullName: nameToUse,
          gender: genderToUse,
          mobile: mobileToUse,
          email: emailToUse,
          status: adm.status === "COMPLETED" ? "COMPLETED" : "ACTIVE",
          profileCompleted: true,
          joinedDate: adm.admissionDate || new Date(),
        },
      });

      await prisma.admission.update({
        where: { id: adm.id },
        data: { studentId: newStudent.id },
      });

      if (seqStd) {
        await prisma.sequence.update({ where: { id: seqStd.id }, data: { currentValue: stdVal } });
      }

      fixedStudentLinkCount++;
      console.log(`  ✨ Created new Student "${newStudent.fullName}" [${stdNum}] for Admission ${adm.admissionNumber}`);
    }
  }

  console.log("\n==================================================");
  console.log("🎉 ADMISSION STUDENT LINK FIX COMPLETE!");
  console.log("==================================================");
  console.log(`📊 Admissions Without Linked Student: ${missingStudentCount}`);
  console.log(`✅ Admissions Fixed & Linked:         ${fixedStudentLinkCount}`);
  console.log("==================================================");
}

fixAdmissions()
  .catch((err) => {
    console.error("❌ Error fixing admission student links:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
