import prisma from "../config/prisma.js";
import bcrypt from "bcrypt";

async function seedInquiryData() {
  try {
    console.log("🌱 Seeding Inquiry CRM Module Data...");

    // 1. Super Admin User
    let admin = await prisma.user.findUnique({
      where: { email: "admin@appxwind.com" },
    });

    if (!admin) {
      const hashedPassword = await bcrypt.hash("AppXwinD@03082026", 10);
      admin = await prisma.user.create({
        data: {
          name: "Fahad Sir",
          email: "admin@appxwind.com",
          password: hashedPassword,
          role: "SUPER_ADMIN",
        },
      });
      console.log("✅ Super Admin created.");
    } else {
      console.log("ℹ️ Super Admin already exists.");
    }

    // 2. Faculty User
    let faculty = await prisma.user.findUnique({
      where: { email: "faculty@appxwind.com" },
    });

    if (!faculty) {
      const hashedPassword = await bcrypt.hash("Faculty@123", 10);
      faculty = await prisma.user.create({
        data: {
          name: "Faculty Counselor",
          email: "faculty@appxwind.com",
          password: hashedPassword,
          role: "FACULTY",
        },
      });
      console.log("✅ Faculty user created.");
    } else {
      console.log("ℹ️ Faculty user already exists.");
    }

    // 3. Sample Course
    let course = await prisma.course.findUnique({
      where: { code: "FULLSTACK-101" },
    });

    if (!course) {
      course = await prisma.course.create({
        data: {
          name: "Full Stack Web Development",
          code: "FULLSTACK-101",
          description: "MERN Stack Development Course",
          duration: 6,
          durationType: "MONTHS",
          fees: "45000.00",
        },
      });
      console.log("✅ Sample Course created.");
    } else {
      console.log("ℹ️ Sample Course already exists.");
    }

    // 4. Sample Lead Sources
    const leadSourceNames = [
      "Website",
      "Walk-in",
      "Social Media",
      "Referral",
      "Phone Call",
    ];

    const leadSources = [];
    for (const name of leadSourceNames) {
      let ls = await prisma.leadSource.findUnique({
        where: { name },
      });
      if (!ls) {
        ls = await prisma.leadSource.create({
          data: {
            name,
            description: `${name} lead source`,
          },
        });
        console.log(`✅ Lead Source created: ${name}`);
      }
      leadSources.push(ls);
    }

    console.log("🎉 Seeding completed successfully!");
  } catch (error) {
    console.error("❌ Seeding failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

seedInquiryData();
