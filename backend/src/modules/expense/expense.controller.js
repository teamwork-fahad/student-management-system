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
  title: z.string().trim().min(2, "Expense title must be at least 2 characters"),
  category: z.string().trim().optional(),
  categoryId: z.string().trim().optional(),
  categoryName: z.string().trim().optional(),
  amount: z
    .union([z.string(), z.number()])
    .transform((val) => Number(val))
    .refine((val) => val > 0, { message: "Amount must be greater than 0" }),
  paymentMode: z.string().trim().optional(),
  expenseDate: z.coerce.date().optional(),
  paidTo: z.string().trim().optional(),
  vendorName: z.string().trim().optional(),
  receiptNumber: z.string().trim().optional(),
  remarks: z.string().trim().optional(),
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
