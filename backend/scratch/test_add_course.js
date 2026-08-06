import prisma from "../src/config/prisma.js";
import { addCourseToStudent } from "../src/modules/students/student.service.js";

async function testAddCourse() {
  const student = await prisma.student.findFirst({
    where: { studentId: { contains: "120", mode: "insensitive" } },
  });

  console.log("Found student for 120:", student?.id, student?.studentId, student?.fullName);

  if (!student) {
    console.log("Student 120 not found by studentId, searching by name Ishan...");
    const ishan = await prisma.student.findFirst({
      where: { fullName: { contains: "Ishan", mode: "insensitive" } },
    });
    console.log("Found Ishan:", ishan?.id, ishan?.studentId, ishan?.fullName);
    if (!ishan) return;
  }

  const targetStudent = student || ishan;
  const pythonCourse = await prisma.course.findFirst({
    where: { name: { contains: "Python", mode: "insensitive" } },
  });

  console.log("Target course:", pythonCourse?.id, pythonCourse?.name);

  try {
    const res = await addCourseToStudent(targetStudent.id, {
      courseId: pythonCourse.id,
      courseFees: pythonCourse.fees,
      discount: 0,
      paymentAmount: 0,
    });
    console.log("Add course SUCCESS!", res);
  } catch (err) {
    console.error("Add course FAILED:", err);
  }
}

testAddCourse().finally(() => prisma.$disconnect());
