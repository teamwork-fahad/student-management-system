import prisma from '../config/prisma.js';

const INITIAL_DEPARTMENTS = [
  { name: 'School Course', code: 'SCH', description: 'School level academic courses' },
  { name: 'IT Course', code: 'ITC', description: 'Information Technology and Software development courses' },
  { name: 'AI Related', code: 'AIR', description: 'Artificial Intelligence and Machine Learning courses' },
  { name: 'Basic Course', code: 'BSC', description: 'Basic computer literacy and foundation courses' },
  { name: 'Professional Course', code: 'PRO', description: 'Professional certificate and specialized skill courses' },
  { name: 'Other', code: 'OTH', description: 'General and miscellaneous courses' },
];

export async function seedDepartments() {
  console.log('🌱 Starting Department seeding & course association...');

  const departmentMap = {};

  for (const deptData of INITIAL_DEPARTMENTS) {
    const dept = await prisma.department.upsert({
      where: { name: deptData.name },
      update: {
        description: deptData.description,
        isActive: true,
      },
      create: {
        name: deptData.name,
        code: deptData.code,
        description: deptData.description,
        isActive: true,
      },
    });
    departmentMap[dept.name] = dept.id;
    console.log(`✅ Department ready: ${dept.name} (${dept.id})`);
  }

  // Update existing courses to map category string to departmentId if null
  const courses = await prisma.course.findMany();
  let updatedCount = 0;

  for (const course of courses) {
    let targetDeptId = null;

    if (course.category && departmentMap[course.category]) {
      targetDeptId = departmentMap[course.category];
    } else {
      // Default to IT Course or Other
      targetDeptId = departmentMap['IT Course'] || departmentMap['Other'];
    }

    if (course.departmentId !== targetDeptId) {
      await prisma.course.update({
        where: { id: course.id },
        data: { departmentId: targetDeptId },
      });
      updatedCount++;
    }
  }

  console.log(`🎉 Department seeding complete. Associated ${updatedCount} course(s) with departments.`);
}

// Execute if run directly
if (process.argv[1]?.includes('seedDepartments.js')) {
  seedDepartments()
    .catch((err) => {
      console.error('❌ Error seeding departments:', err);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
