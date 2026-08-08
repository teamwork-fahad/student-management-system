import { z } from "zod";
import {
  getExpensesService,
  createExpenseService,
  deleteExpenseService,
  getExpenseStatsService,
} from "./expense.service.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { successResponse } from "../../utils/response.js";

const createExpenseSchema = z.object({
  title: z.string().trim().min(2, "Expense title must be at least 2 characters"),
  category: z.string().trim().min(1, "Category is required"),
  amount: z
    .union([z.string(), z.number()])
    .transform((val) => Number(val))
    .refine((val) => val > 0, { message: "Amount must be greater than 0" }),
  paymentMode: z.string().trim().optional(),
  expenseDate: z.coerce.date().optional(),
  vendorName: z.string().trim().optional(),
  receiptNumber: z.string().trim().optional(),
  remarks: z.string().trim().optional(),
});

export const getExpenses = asyncHandler(async (req, res) => {
  const result = await getExpensesService(req.query);
  return successResponse(res, "Expenses fetched successfully", result, 200);
});

export const createExpense = asyncHandler(async (req, res) => {
  const validatedData = createExpenseSchema.parse(req.body);
  const expense = await createExpenseService({
    ...validatedData,
    createdBy: req.user?.id,
  });
  return successResponse(res, "Expense recorded successfully", expense, 201);
});

export const deleteExpense = asyncHandler(async (req, res) => {
  await deleteExpenseService(req.params.id);
  return successResponse(res, "Expense deleted successfully", {}, 200);
});

export const getExpenseStats = asyncHandler(async (req, res) => {
  const stats = await getExpenseStatsService();
  return successResponse(res, "Expense statistics fetched successfully", stats, 200);
});
