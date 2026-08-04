import { z } from "zod";

const inquiryStatuses = [
  "NEW",
  "FOLLOW_UP",
  "INTERESTED",
  "ADMISSION_DONE",
  "NOT_INTERESTED",
  "CLOSED",
];

const decimalAmountSchema = z
  .union([z.string(), z.number()])
  .transform((value) => String(value).trim())
  .refine((value) => /^\d+(\.\d{1,2})?$/.test(value), {
    message: "Expected fees must be a valid decimal amount",
  })
  .refine((value) => Number(value) > 0, {
    message: "Expected fees must be greater than zero",
  });

const optionalStringSchema = z
  .string()
  .trim()
  .optional()
  .transform((value) => value || undefined);

const dateSchema = z.coerce.date({
  message: "Valid date is required",
});

export const createLeadSourceSchema = z.object({
  name: z.string().trim().min(2, "Lead source name must be at least 2 characters"),
  description: optionalStringSchema,
});

export const updateLeadSourceSchema = createLeadSourceSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  {
    message: "At least one field is required",
  }
);

export const createInquirySchema = z.object({
  fullName: z.string().trim().min(3, "Full name must be at least 3 characters"),
  mobile: z
    .string()
    .trim()
    .regex(/^[0-9]{10,15}$/, "Mobile must contain 10 to 15 digits"),
  whatsapp: z
    .string()
    .trim()
    .regex(/^[0-9]{10,15}$/, "WhatsApp must contain 10 to 15 digits")
    .optional(),
  gender: z.string().trim().min(1, "Gender is required"),
  email: z.string().trim().email("Valid email is required").optional(),
  remarks: optionalStringSchema,
  expectedFees: decimalAmountSchema,
  nextFollowUpDate: dateSchema,
  status: z.enum(inquiryStatuses).optional(),
  courseId: z.string().trim().min(1, "Course is required"),
  leadSourceId: z.string().trim().min(1, "Lead source is required"),
  assignedToId: z.string().trim().min(1, "Assigned user is required"),
});

export const updateInquirySchema = createInquirySchema
  .omit({
    courseId: true,
    leadSourceId: true,
    assignedToId: true,
  })
  .extend({
    courseId: z.string().trim().min(1, "Course is required").optional(),
    leadSourceId: z.string().trim().min(1, "Lead source is required").optional(),
    assignedToId: z.string().trim().min(1, "Assigned user is required").optional(),
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required",
  });

export const addFollowUpSchema = z.object({
  followUpDate: dateSchema.optional(),
  remarks: z.string().trim().min(1, "Follow-up remarks are required"),
  nextFollowUpDate: dateSchema.optional(),
  status: z.enum(["FOLLOW_UP", "INTERESTED", "NOT_INTERESTED", "CLOSED"]).optional(),
});
