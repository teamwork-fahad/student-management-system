import prisma from "../config/prisma.js";
import bcrypt from "bcrypt";

async function seedSuperAdminAndSequences() {
  try {
    console.log("🌱 Seeding Super Admin and Sequence counters...");

    // Check if admin already exists
    const existingAdmin = await prisma.user.findUnique({
      where: {
        email: "admin@appxwind.com",
      },
    });

    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash("AppXwinD@03082026", 10);
      await prisma.user.create({
        data: {
          name: "Fahad Sir",
          email: "admin@appxwind.com",
          password: hashedPassword,
          role: "SUPER_ADMIN",
        },
      });
      console.log("🎉 Super Admin Created Successfully! (email: admin@appxwind.com)");
    } else {
      console.log("✅ Super Admin already exists.");
    }

    // Seed required sequences
    const sequences = ["ADMISSION", "STUDENT", "RECEIPT", "CERTIFICATE"];
    for (const seqName of sequences) {
      await prisma.sequence.upsert({
        where: { name: seqName },
        update: {},
        create: {
          name: seqName,
          currentValue: 0,
        },
      });
    }
    console.log("✅ Sequences initialized (ADMISSION, STUDENT, RECEIPT, CERTIFICATE).");

  } catch (error) {
    console.error("❌ Seed Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

seedSuperAdminAndSequences();