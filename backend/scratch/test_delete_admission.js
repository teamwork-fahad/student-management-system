import prisma from "../src/config/prisma.js";
import { deleteAdmissionService } from "../src/modules/admission/admission.service.js";
import { getStudentById } from "../src/modules/students/student.service.js";

async function testDeleteAdmission() {
  const ishan = await prisma.student.findFirst({
    where: { fullName: { contains: "Ishan", mode: "insensitive" } },
    include: { admission: true },
  });

  console.log("Found Ishan:", ishan?.id, ishan?.studentId);

  const ishanHistoryBefore = await getStudentById(ishan.id);
  console.log("Ishan admissions count BEFORE delete:", ishanHistoryBefore.allAdmissions.length);

  if (ishanHistoryBefore.allAdmissions.length > 1) {
    const toDelete = ishanHistoryBefore.allAdmissions[ishanHistoryBefore.allAdmissions.length - 1];
    console.log("Deleting admission:", toDelete.id, toDelete.admissionNumber, toDelete.courseNameSnapshot);

    const delRes = await deleteAdmissionService(toDelete.id);
    console.log("Delete result:", delRes.id, delRes.deletedAt);

    const ishanHistoryAfter = await getStudentById(ishan.id);
    console.log("Ishan admissions count AFTER delete:", ishanHistoryAfter.allAdmissions.length);
  } else {
    console.log("Only 1 admission present, test completed.");
  }
}

testDeleteAdmission().finally(() => prisma.$disconnect());
