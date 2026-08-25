import {
  getDailyExpenseReportService,
  getMonthlyExpenseReportService,
  getYearlyExpenseReportService,
  getCategoryWiseReportService,
  getPartyWiseReportService,
  getPaymentMethodReportService,
  getPendingRecurringReportService,
} from "./expenseReport.service.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { successResponse } from "../../utils/response.js";

export const getDailyReport = asyncHandler(async (req, res) => {
  const result = await getDailyExpenseReportService(req.query);
  return successResponse(res, "Daily expense report generated successfully", result, 200);
});

export const getMonthlyReport = asyncHandler(async (req, res) => {
  const result = await getMonthlyExpenseReportService(req.query);
  return successResponse(res, "Monthly expense report generated successfully", result, 200);
});

export const getYearlyReport = asyncHandler(async (req, res) => {
  const result = await getYearlyExpenseReportService(req.query);
  return successResponse(res, "Yearly expense report generated successfully", result, 200);
});

export const getCategoryWiseReport = asyncHandler(async (req, res) => {
  const result = await getCategoryWiseReportService(req.query);
  return successResponse(res, "Category-wise expense report generated successfully", result, 200);
});

export const getPartyWiseReport = asyncHandler(async (req, res) => {
  const result = await getPartyWiseReportService(req.query);
  return successResponse(res, "Party-wise expense report generated successfully", result, 200);
});

export const getPaymentMethodReport = asyncHandler(async (req, res) => {
  const result = await getPaymentMethodReportService(req.query);
  return successResponse(res, "Payment method report generated successfully", result, 200);
});

export const getPendingRecurringReport = asyncHandler(async (req, res) => {
  const result = await getPendingRecurringReportService();
  return successResponse(res, "Pending recurring expense report generated successfully", result, 200);
});
