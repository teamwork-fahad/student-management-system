import { z } from "zod";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { successResponse } from "../../utils/response.js";
import {
  buildCacheKey,
  fetchWithCache,
  clearCachePatterns,
} from "../../utils/cacheHelper.js";
import {
  collectFee,
  getFeeHistory,
  getStudentFeeSummary,
  updateFeePayment,
  deleteFeePayment,
  generateStudentFeeReminderWhatsApp,
} from "./fee.service.js";

const paymentModes = ["CASH", "UPI", "CARD", "BANK_TRANSFER", "CHEQUE"];

const collectFeeSchema = z.object({
  admissionId: z.string().trim().optional(),
  studentId: z.string().trim().optional(),
  amount: z
    .union([z.string(), z.number()])
    .transform((val) => Number(val))
    .refine((val) => val > 0, { message: "Amount must be greater than 0" }),
  paymentMode: z.enum(paymentModes, {
    errorMap: () => ({ message: "Invalid payment mode" }),
  }),
  transactionReference: z.string().trim().optional(),
  paymentDate: z.coerce.date().optional(),
  remarks: z.string().trim().optional(),
}).refine((data) => data.admissionId || data.studentId, {
  message: "Either admissionId or studentId is required",
});

export const collectFeeController = asyncHandler(async (req, res) => {
  const validatedData = collectFeeSchema.parse(req.body);

  const result = await collectFee(validatedData, req.user.id);

  await clearCachePatterns(["sms:fees:*", "sms:students:*", "sms:admissions:*"]);

  return successResponse(
    res,
    "Fee payment collected successfully",
    result,
    201
  );
});

export const getFeeHistoryController = asyncHandler(async (req, res) => {
  const cacheKey = buildCacheKey("sms:fees:history", req.query);
  const result = await fetchWithCache(cacheKey, 60, () => getFeeHistory(req.query));

  return successResponse(
    res,
    "Fee payment history fetched successfully",
    result,
    200
  );
});

export const getStudentFeeSummaryController = asyncHandler(async (req, res) => {
  const cacheKey = `sms:fees:student:${req.params.studentId}`;
  const result = await fetchWithCache(cacheKey, 60, () => getStudentFeeSummary(req.params.studentId));

  return successResponse(
    res,
    "Student fee summary fetched successfully",
    result,
    200
  );
});

export const generateFeeReminderWhatsAppController = asyncHandler(async (req, res) => {
  const result = await generateStudentFeeReminderWhatsApp(req.params.studentId);

  return successResponse(
    res,
    "WhatsApp fee reminder generated successfully",
    result,
    200
  );
});

const updateFeePaymentSchema = z.object({
  amount: z
    .union([z.string(), z.number()])
    .transform((val) => Number(val))
    .refine((val) => val > 0, { message: "Amount must be greater than 0" })
    .optional(),
  paymentMode: z
    .enum(paymentModes, {
      errorMap: () => ({ message: "Invalid payment mode" }),
    })
    .optional(),
  transactionReference: z.string().trim().optional(),
  paymentDate: z.coerce.date().optional(),
  admissionId: z.string().trim().optional(),
  remarks: z.string().trim().optional(),
});

export const updateFeePaymentController = asyncHandler(async (req, res) => {
  const validatedData = updateFeePaymentSchema.parse(req.body);
  const result = await updateFeePayment(req.params.id, validatedData, req.user.id);

  await clearCachePatterns(["sms:fees:*", "sms:students:*", "sms:admissions:*"]);

  return successResponse(
    res,
    "Fee payment details updated successfully",
    result,
    200
  );
});

export const deleteFeePaymentController = asyncHandler(async (req, res) => {
  const result = await deleteFeePayment(req.params.id, req.user.id);

  await clearCachePatterns(["sms:fees:*", "sms:students:*", "sms:admissions:*"]);

  return successResponse(
    res,
    "Fee payment receipt deleted successfully",
    result,
    200
  );
});
