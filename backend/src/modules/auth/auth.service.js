import prisma from "../../config/prisma.js";
import bcrypt from "bcrypt";
import { generateToken } from "../../utils/jwt.js";
import { createHttpError } from "../../utils/httpError.js";

export const loginService = async (email, password) => {
  const user = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (!user) {
    throw createHttpError("Invalid email or password", 401);
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    throw createHttpError("Invalid email or password", 401);
  }

  // Generate JWT Token
  const token = generateToken(user);

  // Remove password from response
  const { password: _, ...userData } = user;

  return {
    user: userData,
    token,
  };
};
