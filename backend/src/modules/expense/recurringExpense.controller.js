import { z } from "zod";
import {
  getRecurringExpensesService,
  createRecurringExpenseService,
  getRecurringExpenseByIdService,
  updateRecurringExpenseService,
  deleteRecurringExpenseService,
  payRecurringInstanceService,
} from "./recurringExpense.service.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { successResponse, errorResponse } from "../../utils/response.js";
import { clearCachePatterns } from "../../utils/cacheHelper.js";

const createRecurringSchema = z.object({
  title: z.string({ required_error: "Expense title is required" }).trim().min(2, "Title must be at least 2 characters"),
  amount: z.union([z.string(), z.number()]).transform((val) => Number(val)).refine((val) => val > 0, "Amount must be greater than 0"),
  paymentMode: z.string().optional().default("CASH"),
  frequency: z.enum(["DAILY", "WEEKLY", "MONTHLY", "QUARTERLY", "HALF_YEARLY", "YEARLY"]).optional().default("MONTHLY"),
  startDate: z.string().optional(),
  endDate: z.string().nullish(),
  reminderDays: z.union([z.string(), z.number()]).optional().transform((val) => Number(val) || 3),
  description: z.string().trim().nullish(),
  categoryId: z.string().trim().nullish(),
  categoryName: z.string().trim().nullish(),
  partyId: z.string().trim().nullish(),
});

export const getRecurringExpenses = asyncHandler(async (req, res) => {
  const result = await getRecurringExpensesService(req.query);
  return successResponse(res, "Recurring expenses fetched successfully", result, 200);
});

export const createRecurringExpense = asyncHandler(async (req, res) => {
  const validatedData = createRecurringSchema.parse(req.body);
  const recurring = await createRecurringExpenseService({
    ...validatedData,
    createdBy: req.user?.id,
  });
  await clearCachePatterns(["sms:expenses:*"]);
  return successResponse(res, "Recurring expense created successfully", recurring, 201);
});

export const getRecurringExpenseById = asyncHandler(async (req, res) => {
  const result = await getRecurringExpenseByIdService(req.params.id);
  if (!result) {
    return errorResponse(res, "Recurring expense not found", 404);
  }
  return successResponse(res, "Recurring expense details fetched successfully", result, 200);
});

export const updateRecurringExpense = asyncHandler(async (req, res) => {
  const updated = await updateRecurringExpenseService(req.params.id, req.body);
  await clearCachePatterns(["sms:expenses:*"]);
  return successResponse(res, "Recurring expense updated successfully", updated, 200);
});

export const deleteRecurringExpense = asyncHandler(async (req, res) => {
  await deleteRecurringExpenseService(req.params.id);
  await clearCachePatterns(["sms:expenses:*"]);
  return successResponse(res, "Recurring expense deleted successfully", {}, 200);
});

export const payRecurringInstance = asyncHandler(async (req, res) => {
  const instanceId = req.params.instanceId;
  const result = await payRecurringInstanceService(instanceId, {
    ...req.body,
    createdBy: req.user?.id,
  });
  await clearCachePatterns(["sms:expenses:*"]);
  return successResponse(res, "Recurring payment recorded successfully as an expense transaction", result, 200);
});
