import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  // Check BCA Sem-5 course and its department
  const bcaSem5 = await prisma.course.findFirst({
    where: { name: { contains: "BCA Sem-5", mode: "insensitive" } },
    include: { department: true }
  });

  console.log("=== BCA Sem-5 COURSE ===");
  console.log(JSON.stringify(bcaSem5, null, 2));

  // Check all courses with their department links
  const coursesNoDept = await prisma.course.findMany({
    where: { isActive: true, departmentId: null },
    select: { id: true, name: true, code: true, departmentId: true }
  });

  console.log("\n=== ACTIVE COURSES WITH NO DEPARTMENT (departmentId = null) ===");
  console.log("Total:", coursesNoDept.length);
  coursesNoDept.forEach(c => console.log(`  ${c.name} (${c.code})`));

  // Check all departments
  const depts = await prisma.department.findMany({
    include: { courses: { select: { id: true, name: true } } }
  });
  console.log("\n=== ALL DEPARTMENTS ===");
  depts.forEach(d => {
    console.log(`\n  ${d.name} (${d.code}) - ${d.courses.length} courses:`);
    d.courses.forEach(c => console.log(`    - ${c.name}`));
  });

  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
