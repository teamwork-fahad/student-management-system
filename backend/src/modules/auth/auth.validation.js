import { z } from "zod";

export const loginSchema = z.object({
  identifier: z.string().trim().optional(),
  email: z.string().trim().optional(),
  password: z.string().min(1, "Password is required"),
}).refine(data => data.identifier || data.email, {
  message: "Email, Mobile, or Student ID is required",
  path: ["identifier"],
});

export const registerStudentSchema = z.object({
  fullName: z.string().trim().min(2, "Full Name must be at least 2 characters"),
  mobile: z.string().trim().regex(/^\d{10}$/, "Mobile number must be 10 digits"),
  email: z.string().trim().email("Valid email address is required").optional().or(z.literal("")),
  password: z.string().min(6, "Password must be at least 6 characters"),
  gender: z.string().optional(),
  courseId: z.string().optional(),
  address: z.string().optional(),
});
