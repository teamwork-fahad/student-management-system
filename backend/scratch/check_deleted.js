import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  console.log("=== CHECKING RANA KRISH IN DATABASE ===");
  const students = await prisma.student.findMany({
    where: {
      OR: [
        { fullName: { contains: "Rana Krish", mode: "insensitive" } },
        { mobile: { contains: "7874232528" } },
      ],
    },
    include: {
      admission: true,
    },
  });

  console.log("Found students count:", students.length);
  students.forEach((s) => {
    console.log("Student ID:", s.id, "studentId:", s.studentId, "Name:", s.fullName, "mobile:", s.mobile, "deletedAt:", s.deletedAt);
    console.log("Admission linked:", s.admission ? `ID: ${s.admission.id}, status: ${s.admission.status}, deletedAt: ${s.admission.deletedAt}` : "NONE");
  });

  const admissions = await prisma.admission.findMany({
    where: {
      OR: [
        { guardianMobile: "7874232528" },
        { student: { mobile: "7874232528" } },
      ],
    },
  });
  console.log("Found admissions count for mobile 7874232528:", admissions.length);
  admissions.forEach((a) => {
    console.log("Admission ID:", a.id, "Number:", a.admissionNumber, "Course:", a.courseNameSnapshot, "deletedAt:", a.deletedAt);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
