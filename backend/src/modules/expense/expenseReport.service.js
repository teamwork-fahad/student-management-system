import prisma from "../../config/prisma.js";
import { syncRecurringInstanceStatuses } from "./recurringExpense.service.js";

// Helper to construct date filter
const buildDateRange = (dateFrom, dateTo) => {
  if (!dateFrom && !dateTo) return undefined;
  const whereDate = {};
  if (dateFrom) {
    whereDate.gte = new Date(`${dateFrom}T00:00:00.000Z`);
  }
  if (dateTo) {
    whereDate.lte = new Date(`${dateTo}T23:59:59.999Z`);
  }
  return whereDate;
};

export const getDailyExpenseReportService = async ({ dateFrom, dateTo, categoryId, partyId, paymentMode }) => {
  const where = {};
  const dateRange = buildDateRange(dateFrom, dateTo);
  if (dateRange) where.expenseDate = dateRange;
  if (categoryId) where.categoryId = categoryId;
  if (partyId) where.partyId = partyId;
  if (paymentMode) where.paymentMode = paymentMode;

  const expenses = await prisma.expense.findMany({
    where,
    orderBy: { expenseDate: "desc" },
    include: { category: true, party: true },
  });

  // Group by day (YYYY-MM-DD)
  const grouped = {};
  let totalAmount = 0;

  expenses.forEach((e) => {
    const dayKey = new Date(e.expenseDate).toISOString().split("T")[0];
    if (!grouped[dayKey]) {
      grouped[dayKey] = { day: dayKey, total: 0, count: 0, items: [] };
    }
    const amt = Number(e.amount || 0);
    grouped[dayKey].total += amt;
    grouped[dayKey].count += 1;
    grouped[dayKey].items.push(e);
    totalAmount += amt;
  });

  const dailyList = Object.values(grouped).sort((a, b) => b.day.localeCompare(a.day));

  return {
    summary: {
      totalAmount,
      totalCount: expenses.length,
      totalDays: dailyList.length,
    },
    report: dailyList,
    expenses,
  };
};

export const getMonthlyExpenseReportService = async ({ year, month, categoryId, partyId, paymentMode }) => {
  const where = {};
  if (categoryId) where.categoryId = categoryId;
  if (partyId) where.partyId = partyId;
  if (paymentMode) where.paymentMode = paymentMode;

  if (year || month) {
    const currentYear = year ? Number(year) : new Date().getFullYear();
    let gteDate, lteDate;

    if (month) {
      const monthIdx = Number(month) - 1;
      gteDate = new Date(currentYear, monthIdx, 1, 0, 0, 0);
      lteDate = new Date(currentYear, monthIdx + 1, 0, 23, 59, 59);
    } else {
      gteDate = new Date(currentYear, 0, 1, 0, 0, 0);
      lteDate = new Date(currentYear, 11, 31, 23, 59, 59);
    }
    where.expenseDate = { gte: gteDate, lte: lteDate };
  }

  const expenses = await prisma.expense.findMany({
    where,
    orderBy: { expenseDate: "desc" },
    include: { category: true, party: true },
  });

  const grouped = {};
  let totalAmount = 0;

  expenses.forEach((e) => {
    const mKey = new Date(e.expenseDate).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
    if (!grouped[mKey]) {
      grouped[mKey] = { month: mKey, total: 0, count: 0 };
    }
    const amt = Number(e.amount || 0);
    grouped[mKey].total += amt;
    grouped[mKey].count += 1;
    totalAmount += amt;
  });

  return {
    summary: {
      totalAmount,
      totalCount: expenses.length,
      monthsCount: Object.keys(grouped).length,
    },
    report: Object.values(grouped),
    expenses,
  };
};

export const getYearlyExpenseReportService = async ({ categoryId, partyId, paymentMode }) => {
  const where = {};
  if (categoryId) where.categoryId = categoryId;
  if (partyId) where.partyId = partyId;
  if (paymentMode) where.paymentMode = paymentMode;

  const expenses = await prisma.expense.findMany({
    where,
    orderBy: { expenseDate: "desc" },
    include: { category: true, party: true },
  });

  const grouped = {};
  let totalAmount = 0;

  expenses.forEach((e) => {
    const yKey = new Date(e.expenseDate).getFullYear().toString();
    if (!grouped[yKey]) {
      grouped[yKey] = { year: yKey, total: 0, count: 0 };
    }
    const amt = Number(e.amount || 0);
    grouped[yKey].total += amt;
    grouped[yKey].count += 1;
    totalAmount += amt;
  });

  return {
    summary: {
      totalAmount,
      totalCount: expenses.length,
      yearsCount: Object.keys(grouped).length,
    },
    report: Object.values(grouped).sort((a, b) => b.year.localeCompare(a.year)),
    expenses,
  };
};

export const getCategoryWiseReportService = async ({ dateFrom, dateTo }) => {
  const where = {};
  const dateRange = buildDateRange(dateFrom, dateTo);
  if (dateRange) where.expenseDate = dateRange;

  const [categories, expenses] = await Promise.all([
    prisma.expenseCategory.findMany({ orderBy: { name: "asc" } }),
    prisma.expense.findMany({ where, include: { category: true } }),
  ]);

  const catMap = {};
  categories.forEach((c) => {
    catMap[c.id] = { id: c.id, name: c.name, total: 0, count: 0 };
  });
  catMap["uncategorized"] = { id: "uncategorized", name: "Uncategorized", total: 0, count: 0 };

  let grandTotal = 0;
  expenses.forEach((e) => {
    const key = e.categoryId && catMap[e.categoryId] ? e.categoryId : "uncategorized";
    const amt = Number(e.amount || 0);
    catMap[key].total += amt;
    catMap[key].count += 1;
    grandTotal += amt;
  });

  const reportList = Object.values(catMap)
    .filter((c) => c.count > 0)
    .map((c) => ({
      ...c,
      percentage: grandTotal > 0 ? Number(((c.total / grandTotal) * 100).toFixed(1)) : 0,
    }))
    .sort((a, b) => b.total - a.total);

  return {
    summary: {
      grandTotal,
      totalCount: expenses.length,
      categoriesCount: reportList.length,
    },
    report: reportList,
  };
};

export const getPartyWiseReportService = async ({ dateFrom, dateTo }) => {
  const where = {};
  const dateRange = buildDateRange(dateFrom, dateTo);
  if (dateRange) where.expenseDate = dateRange;

  const expenses = await prisma.expense.findMany({
    where,
    include: { party: true },
  });

  const partyMap = {};
  let grandTotal = 0;

  expenses.forEach((e) => {
    const key = e.party?.name || e.paidTo || "General Payee / No Party";
    if (!partyMap[key]) {
      partyMap[key] = { partyName: key, total: 0, count: 0, partyId: e.partyId };
    }
    const amt = Number(e.amount || 0);
    partyMap[key].total += amt;
    partyMap[key].count += 1;
    grandTotal += amt;
  });

  const reportList = Object.values(partyMap).sort((a, b) => b.total - a.total);

  return {
    summary: {
      grandTotal,
      totalCount: expenses.length,
      partiesCount: reportList.length,
    },
    report: reportList,
  };
};

export const getPaymentMethodReportService = async ({ dateFrom, dateTo }) => {
  const where = {};
  const dateRange = buildDateRange(dateFrom, dateTo);
  if (dateRange) where.expenseDate = dateRange;

  const expenses = await prisma.expense.findMany({ where });

  const methodMap = {
    CASH: { method: "CASH", total: 0, count: 0 },
    UPI: { method: "UPI", total: 0, count: 0 },
    CARD: { method: "CARD", total: 0, count: 0 },
    BANK_TRANSFER: { method: "BANK_TRANSFER", total: 0, count: 0 },
    CHEQUE: { method: "CHEQUE", total: 0, count: 0 },
    BANK: { method: "BANK", total: 0, count: 0 },
    OTHER: { method: "OTHER", total: 0, count: 0 },
  };

  let grandTotal = 0;
  expenses.forEach((e) => {
    const m = e.paymentMode || "CASH";
    if (!methodMap[m]) {
      methodMap[m] = { method: m, total: 0, count: 0 };
    }
    const amt = Number(e.amount || 0);
    methodMap[m].total += amt;
    methodMap[m].count += 1;
    grandTotal += amt;
  });

  const reportList = Object.values(methodMap)
    .filter((m) => m.count > 0)
    .map((m) => ({
      ...m,
      percentage: grandTotal > 0 ? Number(((m.total / grandTotal) * 100).toFixed(1)) : 0,
    }))
    .sort((a, b) => b.total - a.total);

  return {
    summary: {
      grandTotal,
      totalCount: expenses.length,
      methodsCount: reportList.length,
    },
    report: reportList,
  };
};

export const getPendingRecurringReportService = async () => {
  await syncRecurringInstanceStatuses();

  const instances = await prisma.recurringExpenseInstance.findMany({
    where: { status: { in: ["DUE", "OVERDUE"] } },
    include: {
      recurringExpense: { include: { category: true } },
      party: true,
    },
    orderBy: { dueDate: "asc" },
  });

  const totalPendingAmount = instances.reduce((sum, i) => sum + Number(i.amount || 0), 0);
  const overdueCount = instances.filter((i) => i.status === "OVERDUE").length;
  const dueCount = instances.filter((i) => i.status === "DUE").length;

  return {
    summary: {
      totalPendingAmount,
      totalPendingCount: instances.length,
      overdueCount,
      dueCount,
    },
    instances,
  };
};
