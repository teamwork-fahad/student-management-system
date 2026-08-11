import prisma from "../config/prisma.js";

export async function mergeCourses() {
  console.log("🔍 Checking existing Internship courses in database...");

  const internshipCourses = await prisma.course.findMany({
    where: {
      OR: [
        { name: { contains: "Internship", mode: "insensitive" } },
        { code: { contains: "INT", mode: "insensitive" } },
        { description: { contains: "Internship", mode: "insensitive" } },
      ],
    },
    include: {
      admissions: {
        where: { deletedAt: null },
      },
      inquiries: true,
    },
  });

  console.log(`📦 Found ${internshipCourses.length} course(s) related to Internship:`);
  for (const c of internshipCourses) {
    console.log(`  - [ID: ${c.id}] Code: "${c.code}", Name: "${c.name}", Active: ${c.isActive}, Admissions: ${c.admissions.length}, Inquiries: ${c.inquiries.length}`);
  }

  // Identify target primary course (CRS-INT-2025 or Internship 2025 (120 Hrs))
  let targetCourse = internshipCourses.find(c => c.code === "CRS-INT-2025");
  if (!targetCourse && internshipCourses.length > 0) {
    targetCourse = internshipCourses[0];
  }

  if (!targetCourse) {
    console.log("⚠️ No target internship course found!");
    return;
  }

  console.log(`\n🎯 Target Primary Course selected: "${targetCourse.name}" [Code: ${targetCourse.code}, ID: ${targetCourse.id}]`);

  // Ensure primary course properties
  const unifiedCourseName = "Internship 2025 (120 Hrs)";
  await prisma.course.update({
    where: { id: targetCourse.id },
    data: {
      name: unifiedCourseName,
      code: "CRS-INT-2025",
      category: "IT Course",
      description: "CRS Internship Program (120 Hours)",
      duration: 120,
      durationType: "DAYS",
      fees: 0.00,
      isActive: true,
    },
  });
  console.log(`✅ Updated target course name to "${unifiedCourseName}" and code to "CRS-INT-2025"`);

  // Merge any other duplicate courses into targetCourse
  let mergedAdmissions = 0;
  let mergedInquiries = 0;
  let deactivatedCourses = 0;

  for (const c of internshipCourses) {
    if (c.id === targetCourse.id) continue;

    console.log(`\n🔄 Merging duplicate course "${c.name}" [${c.code}, ID: ${c.id}] -> Target Course...`);

    // Reassign admissions
    const admResult = await prisma.admission.updateMany({
      where: { courseId: c.id },
      data: {
        courseId: targetCourse.id,
        courseNameSnapshot: unifiedCourseName,
      },
    });
    mergedAdmissions += admResult.count;
    console.log(`  ↳ Reassigned ${admResult.count} admission(s) to target course.`);

    // Reassign inquiries
    const inqResult = await prisma.inquiry.updateMany({
      where: { courseId: c.id },
      data: { courseId: targetCourse.id },
    });
    mergedInquiries += inqResult.count;
    console.log(`  ↳ Reassigned ${inqResult.count} inquiry/inquiries to target course.`);

    // Deactivate duplicate course
    await prisma.course.update({
      where: { id: c.id },
      data: { isActive: false },
    });
    deactivatedCourses++;
    console.log(`  ↳ Deactivated duplicate course "${c.name}".`);
  }

  // Final count check
  const finalAdmissionsCount = await prisma.admission.count({
    where: { courseId: targetCourse.id, deletedAt: null },
  });

  console.log("\n==================================================");
  console.log("🎉 INTERNSHIP COURSES MERGED SUCCESSFULLY!");
  console.log("==================================================");
  console.log(`🎓 Unified Course Name:     "${unifiedCourseName}"`);
  console.log(`🏷️  Unified Course Code:     "CRS-INT-2025"`);
  console.log(`👥 Total Enrolled Students:  ${finalAdmissionsCount}`);
  console.log(`🔀 Merged Admissions:       ${mergedAdmissions}`);
  console.log(`📩 Merged Inquiries:        ${mergedInquiries}`);
  console.log(`🛑 Deactivated Courses:     ${deactivatedCourses}`);
  console.log("==================================================");
}

mergeCourses()
  .catch((err) => {
    console.error("❌ Error merging internship courses:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
