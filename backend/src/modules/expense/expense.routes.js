import { Router } from "express";
import {
  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
  getExpenseStats,
} from "./expense.controller.js";
import {
  getParties,
  createParty,
  getPartyById,
  updateParty,
  deleteParty,
} from "./party.controller.js";
import {
  getRecurringExpenses,
  createRecurringExpense,
  getRecurringExpenseById,
  updateRecurringExpense,
  deleteRecurringExpense,
  payRecurringInstance,
} from "./recurringExpense.controller.js";
import {
  getDailyReport,
  getMonthlyReport,
  getYearlyReport,
  getCategoryWiseReport,
  getPartyWiseReport,
  getPaymentMethodReport,
  getPendingRecurringReport,
} from "./expenseReport.controller.js";

import { authenticate } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/role.middleware.js";

const router = Router();

router.use(authenticate);
router.use(authorize("SUPER_ADMIN"));

// STATS
router.get("/stats", getExpenseStats);

// PARTY ROUTES
router.get("/parties", getParties);
router.post("/parties", createParty);
router.get("/parties/:id", getPartyById);
router.put("/parties/:id", updateParty);
router.delete("/parties/:id", deleteParty);

// RECURRING EXPENSE ROUTES
router.get("/recurring", getRecurringExpenses);
router.post("/recurring", createRecurringExpense);
router.get("/recurring/:id", getRecurringExpenseById);
router.put("/recurring/:id", updateRecurringExpense);
router.delete("/recurring/:id", deleteRecurringExpense);
router.post("/recurring/instances/:instanceId/pay", payRecurringInstance);

// REPORT ROUTES
router.get("/reports/daily", getDailyReport);
router.get("/reports/monthly", getMonthlyReport);
router.get("/reports/yearly", getYearlyReport);
router.get("/reports/category", getCategoryWiseReport);
router.get("/reports/party", getPartyWiseReport);
router.get("/reports/payment-method", getPaymentMethodReport);
router.get("/reports/pending-recurring", getPendingRecurringReport);

// BASE EXPENSES ROUTES
router.get("/", getExpenses);
router.post("/", createExpense);
router.put("/:id", updateExpense);
router.delete("/:id", deleteExpense);

export default router;
