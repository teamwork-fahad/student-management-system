import {
  getExpensesService,
  createExpenseService,
  deleteExpenseService,
  getExpenseStatsService,
} from "./expense.service.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { successResponse } from "../../utils/response.js";

export const getExpenses = asyncHandler(async (req, res) => {
  const result = await getExpensesService(req.query);
  return successResponse(res, "Expenses fetched successfully", result, 200);
});

export const createExpense = asyncHandler(async (req, res) => {
  const expense = await createExpenseService({
    ...req.body,
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
