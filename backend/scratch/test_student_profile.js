import prisma from "../src/config/prisma.js";
import { getStudentProfileService } from "../src/modules/auth/auth.service.js";

async function testStudentProfile() {
  const ishanUser = await prisma.user.findFirst({
    where: { name: { contains: "Ishan", mode: "insensitive" } },
  });

  console.log("Ishan User ID:", ishanUser?.id, ishanUser?.email);

  if (!ishanUser) return;

  const profile = await getStudentProfileService(ishanUser.id);

  console.log("Student Name:", profile.fullName);
  console.log("Primary Active Course:", profile.admission?.courseNameSnapshot);
  console.log("All Active Admissions Count:", profile.allAdmissions?.length);
  console.log(
    "All Admissions List:",
    profile.allAdmissions?.map((a) => `${a.admissionNumber}: ${a.courseNameSnapshot} (${a.status})`)
  );
}

testStudentProfile().finally(() => prisma.$disconnect());
