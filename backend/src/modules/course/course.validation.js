import { z } from "zod";

const durationTypes = ["DAYS", "WEEKS", "MONTHS", "YEARS"];

const decimalStringSchema = z
  .union([z.string(), z.number()])
  .transform((value) => String(value).trim())
  .refine((value) => /^\d+(\.\d{1,2})?$/.test(value), {
    message: "Fees must be a valid decimal amount",
  })
  .refine((value) => Number(value) > 0, {
    message: "Fees must be greater than zero",
  });

export const createCourseSchema = z.object({
  name: z.string().trim().min(3, "Name must be at least 3 characters"),
  code: z
    .string()
    .trim()
    .min(1, "Code is required"),
  category: z.string().trim().optional(),
  departmentId: z.string().trim().nullable().optional(),
  description: z.string().trim().optional(),
  duration: z.coerce
    .number()
    .int("Duration must be an integer")
    .min(1, "Duration must be at least 1"),
  durationType: z.enum(durationTypes),
  fees: decimalStringSchema,
});

export const updateCourseSchema = createCourseSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  {
    message: "At least one field is required",
  }
);
