import prisma from "../src/config/prisma.js";
import { completeAdmission } from "../src/modules/admission/admission.service.js";

async function testAdmissionSubmit() {
  const inquiry = await prisma.inquiry.findFirst({
    where: { isActive: true, status: { not: "ADMISSION_DONE" } },
  });

  console.log("Found active inquiry for admission test:", inquiry?.id, inquiry?.fullName);

  if (!inquiry) {
    console.log("No open inquiry found. Creating temporary inquiry...");
    const course = await prisma.course.findFirst({ where: { isActive: true } });
    const leadSource = await prisma.leadSource.findFirst();
    const admin = await prisma.user.findFirst({ where: { role: "SUPER_ADMIN" } });

    const newInq = await prisma.inquiry.create({
      data: {
        inquiryNumber: `INQ-TEST-${Date.now().toString().slice(-4)}`,
        fullName: "Test Admission Student",
        mobile: "9998887776",
        gender: "Male",
        email: `testadm_${Date.now()}@gmail.com`,
        expectedFees: 10000,
        nextFollowUpDate: new Date(),
        courseId: course.id,
        leadSourceId: leadSource.id,
        assignedToId: admin.id,
      },
    });
    console.log("Created temp inquiry:", newInq.id);

    try {
      const res = await completeAdmission({
        inquiryId: newInq.id,
        courseId: course.id,
        studentCategory: "COLLEGE",
        guardianName: "Guardian Test",
        guardianMobile: "9998887776",
        guardianRelation: "FATHER",
        discount: 0,
        studentDetails: {
          fullName: "Test Admission Student",
          gender: "Male",
          mobile: "9998887776",
          email: newInq.email,
        },
        userCredentials: {
          email: newInq.email,
        },
        payments: [],
        admittedBy: admin.id,
      });

      console.log("Admission test successful!", res.id, res.admissionNumber);
    } catch (err) {
      console.error("Admission test failed:", err);
    }
  } else {
    const admin = await prisma.user.findFirst({ where: { role: "SUPER_ADMIN" } });
    try {
      const res = await completeAdmission({
        inquiryId: inquiry.id,
        courseId: inquiry.courseId,
        studentCategory: "COLLEGE",
        guardianName: inquiry.fullName,
        guardianMobile: inquiry.mobile,
        guardianRelation: "FATHER",
        discount: 0,
        studentDetails: {
          fullName: inquiry.fullName,
          gender: inquiry.gender,
          mobile: inquiry.mobile,
          email: inquiry.email || undefined,
        },
        userCredentials: {
          email: inquiry.email || undefined,
        },
        payments: [],
        admittedBy: admin.id,
      });

      console.log("Admission test successful for existing inquiry!", res.id, res.admissionNumber);
    } catch (err) {
      console.error("Admission test failed for existing inquiry:", err);
    }
  }
}

testAdmissionSubmit().finally(() => prisma.$disconnect());
