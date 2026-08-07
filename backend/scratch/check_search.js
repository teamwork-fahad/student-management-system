import { getStudentById } from "../src/modules/students/student.service.js";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const targetId = "cmsh5wsjj00mev304eb2m7dar";
  console.log("=== Testing getStudentById for:", targetId, "===");
  
  try {
    const studentData = await getStudentById(targetId);
    console.log("Returned Student Data:");
    console.log("FullName:", studentData.fullName);
    console.log("StudentId:", studentData.studentId);
    console.log("allAdmissions count:", studentData.allAdmissions?.length);
    console.log("allAdmissions:", studentData.allAdmissions);
    console.log("attendanceStats:", studentData.attendanceStats);
  } catch (err) {
    console.error("ERROR in getStudentById:", err);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
