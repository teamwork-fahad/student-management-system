import { z } from "zod";

const studentCategories = [
  "SCHOOL",
  "COLLEGE",
  "WORKING",
  "PROFESSIONAL",
  "OTHER",
];

const guardianRelations = [
  "FATHER",
  "MOTHER",
  "BROTHER",
  "SISTER",
  "SPOUSE",
  "OTHER",
];

const paymentModes = [
  "CASH",
  "UPI",
  "CARD",
  "BANK_TRANSFER",
  "CHEQUE",
];

const documentTypes = [
  "PHOTO",
  "AADHAAR",
  "PAN",
  "MARKSHEET_10",
  "MARKSHEET_12",
  "GRADUATION",
  "ADDRESS_PROOF",
  "OTHER",
];

const optionalStringSchema = z
  .string()
  .trim()
  .optional()
  .transform((val) => val || undefined);

const decimalAmountSchema = z
  .union([z.string(), z.number()])
  .transform((val) => String(val).trim())
  .refine((val) => /^\d+(\.\d{1,2})?$/.test(val), {
    message: "Amount must be a valid decimal amount",
  })
  .refine((val) => Number(val) >= 0, {
    message: "Amount cannot be negative",
  });

const paymentItemSchema = z.object({
  amount: decimalAmountSchema,
  paymentMode: z.enum(paymentModes, {
    errorMap: () => ({ message: "Invalid payment mode" }),
  }),
  transactionReference: optionalStringSchema,
  paymentDate: z.coerce.date().optional(),
  remarks: optionalStringSchema,
});

const documentMetadataSchema = z.object({
  documentType: z.enum(documentTypes, {
    errorMap: () => ({ message: "Invalid document type" }),
  }),
  documentNumber: optionalStringSchema,
  fileName: z.string().trim().min(1, "File name is required"),
  fileUrl: z.string().trim().url("Valid file URL is required"),
  mimeType: z.string().trim().min(1, "MIME type is required"),
  fileSize: z.number().positive("File size must be greater than zero"),
  issueDate: z.coerce.date().optional(),
  expiryDate: z.coerce.date().optional(),
  isRequired: z.boolean().optional(),
  remarks: optionalStringSchema,
});

const studentDetailsSchema = z.object({
  fullName: z.string().trim().min(2, "Full name must be at least 2 characters").optional(),
  fatherName: optionalStringSchema,
  motherName: optionalStringSchema,
  gender: z.string().trim().optional(),
  dob: z.coerce.date().optional(),
  mobile: z
    .string()
    .trim()
    .regex(/^[0-9]{10,15}$/, "Mobile must contain 10 to 15 digits")
    .optional(),
  whatsapp: z
    .string()
    .trim()
    .regex(/^[0-9]{10,15}$/, "WhatsApp must contain 10 to 15 digits")
    .optional(),
  email: z.string().trim().email("Valid email is required").optional(),
  address: optionalStringSchema,
  area: optionalStringSchema,
  city: optionalStringSchema,
  state: optionalStringSchema,
  country: optionalStringSchema,
  pincode: optionalStringSchema,
  qualification: optionalStringSchema,
  schoolCollege: optionalStringSchema,
  bloodGroup: optionalStringSchema,
  aadhaarNumber: optionalStringSchema,
});

/**
 * Zod validation schema for Create Admission
 */
export const createAdmissionSchema = z.object({
  inquiryId: z.string().trim().min(1, "Inquiry ID is required"),
  courseId: optionalStringSchema,
  batchId: optionalStringSchema,
  discount: decimalAmountSchema.optional(),
  remarks: optionalStringSchema,
  referredBy: optionalStringSchema,
  admissionYear: optionalStringSchema,
  admissionDate: z.coerce.date().optional(),
  studentCategory: z.enum(studentCategories, {
    errorMap: () => ({ message: "Valid student category is required" }),
  }),
  guardianName: z.string().trim().min(2, "Guardian name is required"),
  guardianMobile: z
    .string()
    .trim()
    .regex(/^[0-9]{10,15}$/, "Guardian mobile must contain 10 to 15 digits"),
  guardianRelation: z.enum(guardianRelations, {
    errorMap: () => ({ message: "Valid guardian relation is required" }),
  }),
  studentDetails: studentDetailsSchema.optional(),
  createUserAccount: z.boolean().optional(),
  userCredentials: z
    .object({
      email: z.string().trim().email("Valid user account email is required").optional(),
      password: z.string().min(6, "Password must be at least 6 characters").optional(),
    })
    .optional(),
  payments: z.array(paymentItemSchema).optional(),
  documents: z.array(documentMetadataSchema).optional(),
});

/**
 * Zod validation schema for Update Admission
 */
export const updateAdmissionSchema = z
  .object({
    remarks: optionalStringSchema,
    batchId: optionalStringSchema,
    guardianName: z.string().trim().min(2, "Guardian name must be at least 2 characters").optional(),
    guardianMobile: z
      .string()
      .trim()
      .regex(/^[0-9]{10,15}$/, "Guardian mobile must contain 10 to 15 digits")
      .optional(),
    guardianRelation: z.enum(guardianRelations, {
      errorMap: () => ({ message: "Valid guardian relation is required" }),
    }).optional(),
    studentCategory: z.enum(studentCategories, {
      errorMap: () => ({ message: "Valid student category is required" }),
    }).optional(),
    studentDetails: studentDetailsSchema.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one editable field is required to update admission",
  });
