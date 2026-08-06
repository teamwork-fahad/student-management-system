import prisma from "../src/config/prisma.js";
import bcrypt from "bcrypt";

async function main() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
    },
  });
  console.log("Users in Neon DB:", users);

  const newHash = await bcrypt.hash("AppXwinD@03082025", 10);

  const admin = await prisma.user.findFirst({
    where: {
      email: { equals: "admin@appxwind.com", mode: "insensitive" },
    },
  });

  if (admin) {
    await prisma.user.update({
      where: { id: admin.id },
      data: { password: newHash },
    });
    console.log("Updated password for admin@appxwind.com to AppXwinD@03082025!");
  } else {
    const createdAdmin = await prisma.user.create({
      data: {
        name: "Fahad Sir",
        email: "admin@appxwind.com",
        password: newHash,
        role: "SUPER_ADMIN",
      },
    });
    console.log("Created SUPER_ADMIN user:", createdAdmin);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
