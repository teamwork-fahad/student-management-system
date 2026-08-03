import prisma from "../../config/prisma.js";
import bcrypt from "bcrypt";

export const loginService = async (email, password) => {
  const user = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (!user) {
    throw new Error("Invalid email or password");
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    throw new Error("Invalid email or password");
  }

  // Password remove before sending response
  const { password: _, ...userData } = user;

  return userData;
};