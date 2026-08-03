import prisma from "../config/prisma.js";
import bcrypt from "bcrypt";

async function seedSuperAdmin() {
  try {
    console.log("🌱 Creating Super Admin...");

    // Check if admin already exists
    const existingAdmin = await prisma.user.findUnique({
      where: {
        email: "admin@appxwind.com",
      },
    });

    if (existingAdmin) {
      console.log("✅ Super Admin already exists.");
      return;
    }

    // Hash Password
    const hashedPassword = await bcrypt.hash("AppXwinD@03082026", 10);

    // Create Admin
    await prisma.user.create({
      data: {
        name: "Fahad Sir",
        email: "admin@appxwind.com",
        password: hashedPassword,
        role: "SUPER_ADMIN",
      },
    });

    console.log("🎉 Super Admin Created Successfully!");
    console.log("Email : admin@appxwind.com");
    console.log("Password : Admin@123");
  } catch (error) {
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

seedSuperAdmin();