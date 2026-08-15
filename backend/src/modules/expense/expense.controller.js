import { z } from "zod";
import {
  getExpensesService,
  createExpenseService,
  deleteExpenseService,
  getExpenseStatsService,
} from "./expense.service.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { successResponse } from "../../utils/response.js";
import {
  buildCacheKey,
  fetchWithCache,
  clearCachePatterns,
} from "../../utils/cacheHelper.js";

const createExpenseSchema = z.object({
  title: z
    .string({ invalid_type_error: "Expense title must be a string", required_error: "Expense title is required" })
    .trim()
    .min(1, "Expense title is required"),
  category: z.string().trim().nullish(),
  categoryId: z.string().trim().nullish(),
  categoryName: z.string().trim().nullish(),
  amount: z
    .union([z.string(), z.number()])
    .transform((val) => Number(val))
    .refine((val) => !isNaN(val) && val > 0, { message: "Amount must be greater than 0" }),
  paymentMode: z.string().trim().nullish(),
  expenseDate: z
    .union([z.string(), z.date()])
    .nullish()
    .transform((val) => {
      if (!val) return new Date();
      const d = new Date(val);
      return isNaN(d.getTime()) ? new Date() : d;
    }),
  paidTo: z.string().trim().nullish(),
  vendorName: z.string().trim().nullish(),
  receiptNumber: z.string().trim().nullish(),
  remarks: z.string().trim().nullish(),
});

export const getExpenses = asyncHandler(async (req, res) => {
  const cacheKey = buildCacheKey("sms:expenses:list", req.query);
  const result = await fetchWithCache(cacheKey, 60, () => getExpensesService(req.query));
  return successResponse(res, "Expenses fetched successfully", result, 200);
});

export const createExpense = asyncHandler(async (req, res) => {
  const validatedData = createExpenseSchema.parse(req.body);
  const expense = await createExpenseService({
    ...validatedData,
    createdBy: req.user?.id,
  });

  await clearCachePatterns(["sms:expenses:*"]);

  return successResponse(res, "Expense recorded successfully", expense, 201);
});

export const deleteExpense = asyncHandler(async (req, res) => {
  await deleteExpenseService(req.params.id);

  await clearCachePatterns(["sms:expenses:*"]);

  return successResponse(res, "Expense deleted successfully", {}, 200);
});

export const getExpenseStats = asyncHandler(async (req, res) => {
  const cacheKey = "sms:expenses:stats";
  const stats = await fetchWithCache(cacheKey, 60, () => getExpenseStatsService());
  return successResponse(res, "Expense statistics fetched successfully", stats, 200);
});
