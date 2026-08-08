import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const collegeDept = await prisma.department.findFirst({
    where: { name: { contains: "College", mode: "insensitive" } },
  });

  if (!collegeDept) {
    console.error("College department not found");
    return;
  }

  const updates = [
    { match: "BCA", category: "BCA" },
    { match: "B.Sc", category: "B.Sc. IT" },
    { match: "B.E", category: "B.E." },
    { match: "Diploma", category: "Diploma" },
  ];

  for (const item of updates) {
    const courses = await prisma.course.findMany({
      where: {
        departmentId: collegeDept.id,
        name: { contains: item.match, mode: "insensitive" },
      },
    });

    for (const c of courses) {
      await prisma.course.update({
        where: { id: c.id },
        data: { category: item.category },
      });
      console.log(`Updated Course "${c.name}" -> Category: "${item.category}" (Dept: College Syllabus)`);
    }
  }
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
