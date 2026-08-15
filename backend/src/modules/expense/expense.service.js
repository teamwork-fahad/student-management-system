import prisma from "../../config/prisma.js";
import { syncRecurringInstanceStatuses } from "./recurringExpense.service.js";

// Utility to generate unique expense number EXP-000001
export const generateExpenseNumber = async () => {
  const count = await prisma.expense.count();
  const nextNum = count + 1;
  const formattedNum = `EXP-${String(nextNum).padStart(6, "0")}`;
  
  // Double-check uniqueness
  const existing = await prisma.expense.findUnique({ where: { expenseNumber: formattedNum } });
  if (existing) {
    const timestamp = Date.now().toString().slice(-4);
    return `EXP-${String(nextNum).padStart(4, "0")}${timestamp}`;
  }
  return formattedNum;
};

export const getExpensesService = async ({
  page = 1,
  limit = 50,
  search,
  categoryId,
  partyId,
  paymentMode,
  dateFrom,
  dateTo,
  month,
}) => {
  const skip = (Number(page) - 1) * Number(limit);
  const take = Number(limit);

  const where = {};
  if (search) {
    where.OR = [
      { expenseNumber: { contains: search, mode: "insensitive" } },
      { title: { contains: search, mode: "insensitive" } },
      { remarks: { contains: search, mode: "insensitive" } },
      { paidTo: { contains: search, mode: "insensitive" } },
      { referenceNumber: { contains: search, mode: "insensitive" } },
    ];
  }
  if (categoryId) where.categoryId = categoryId;
  if (partyId) where.partyId = partyId;
  if (paymentMode) where.paymentMode = paymentMode;

  if (dateFrom || dateTo) {
    where.expenseDate = {};
    if (dateFrom) where.expenseDate.gte = new Date(`${dateFrom}T00:00:00.000Z`);
    if (dateTo) where.expenseDate.lte = new Date(`${dateTo}T23:59:59.999Z`);
  } else if (month) {
    const startDate = new Date(`${month}-01T00:00:00.000Z`);
    const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0, 23, 59, 59);
    where.expenseDate = { gte: startDate, lte: endDate };
  }

  const [expenses, total, categories, parties] = await Promise.all([
    prisma.expense.findMany({
      where,
      skip,
      take,
      orderBy: { expenseDate: "desc" },
      include: { category: true, party: true },
    }),
    prisma.expense.count({ where }),
    prisma.expenseCategory.findMany({ orderBy: { name: "asc" } }),
    prisma.expenseParty.findMany({ where: { status: "ACTIVE" }, orderBy: { name: "asc" } }),
  ]);

  return {
    expenses,
    categories,
    parties,
    pagination: {
      page: Number(page),
      limit: take,
      total,
      totalPages: Math.ceil(total / take),
    },
  };
};

export const createExpenseService = async (data) => {
  const {
    title,
    amount,
    expenseDate,
    paymentMode,
    categoryId,
    categoryName,
    category,
    partyId,
    paidTo,
    vendorName,
    referenceNumber,
    remarks,
    receiptUrl,
    createdBy,
  } = data;

  const targetCategoryName = categoryName || category;
  let finalCategoryId = categoryId;
  if (!finalCategoryId && targetCategoryName) {
    const cat = await prisma.expenseCategory.upsert({
      where: { name: targetCategoryName.trim() },
      update: {},
      create: { name: targetCategoryName.trim() },
    });
    finalCategoryId = cat.id;
  }

  const expenseNumber = await generateExpenseNumber();

  // If partyId is provided, get party name
  let targetPaidTo = paidTo || vendorName || null;
  if (partyId && !targetPaidTo) {
    const partyObj = await prisma.expenseParty.findUnique({ where: { id: partyId } });
    if (partyObj) targetPaidTo = partyObj.name;
  }

  const expense = await prisma.expense.create({
    data: {
      expenseNumber,
      title: title || "General Expense",
      amount: Number(amount) || 0,
      expenseDate: expenseDate ? new Date(expenseDate) : new Date(),
      paymentMode: paymentMode || "CASH",
      categoryId: finalCategoryId || null,
      partyId: partyId || null,
      paidTo: targetPaidTo,
      referenceNumber: referenceNumber ? referenceNumber.trim() : null,
      remarks: remarks ? remarks.trim() : null,
      receiptUrl: receiptUrl || null,
      createdBy: createdBy || null,
    },
    include: { category: true, party: true },
  });

  return expense;
};

export const updateExpenseService = async (expenseId, data) => {
  const {
    title,
    amount,
    expenseDate,
    paymentMode,
    categoryId,
    partyId,
    paidTo,
    referenceNumber,
    remarks,
    receiptUrl,
    updatedBy,
  } = data;

  const expense = await prisma.expense.update({
    where: { id: expenseId },
    data: {
      ...(title && { title: title.trim() }),
      ...(amount && { amount: Number(amount) }),
      ...(expenseDate && { expenseDate: new Date(expenseDate) }),
      ...(paymentMode && { paymentMode }),
      ...(categoryId !== undefined && { categoryId }),
      ...(partyId !== undefined && { partyId }),
      ...(paidTo !== undefined && { paidTo: paidTo ? paidTo.trim() : null }),
      ...(referenceNumber !== undefined && { referenceNumber: referenceNumber ? referenceNumber.trim() : null }),
      ...(remarks !== undefined && { remarks: remarks ? remarks.trim() : null }),
      ...(receiptUrl !== undefined && { receiptUrl }),
      ...(updatedBy && { updatedBy }),
    },
    include: { category: true, party: true },
  });

  return expense;
};

export const deleteExpenseService = async (expenseId) => {
  await prisma.expense.delete({ where: { id: expenseId } });
  return true;
};

export const getExpenseStatsService = async () => {
  await syncRecurringInstanceStatuses();

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
  const startOfYear = new Date(now.getFullYear(), 0, 1, 0, 0, 0);

  const [allExpenses, recurringCount, pendingRecurringInstances] = await Promise.all([
    prisma.expense.findMany({
      include: { category: true, party: true },
      orderBy: { expenseDate: "desc" },
    }),
    prisma.recurringExpense.count({ where: { status: "ACTIVE" } }),
    prisma.recurringExpenseInstance.findMany({
      where: { status: { in: ["DUE", "OVERDUE"] } },
    }),
  ]);

  // Overall financial summary metrics
  let totalExpense = 0;
  let todayExpense = 0;
  let thisMonthExpense = 0;
  let thisYearExpense = 0;

  const categoryStats = {};
  const partyStats = {};
  const paymentMethodStats = {};
  const monthlyStats = {};

  allExpenses.forEach((e) => {
    const amt = Number(e.amount || 0);
    totalExpense += amt;

    const eDate = new Date(e.expenseDate);
    if (eDate >= startOfDay) todayExpense += amt;
    if (eDate >= startOfMonth) thisMonthExpense += amt;
    if (eDate >= startOfYear) thisYearExpense += amt;

    const catName = e.category?.name || "General";
    categoryStats[catName] = (categoryStats[catName] || 0) + amt;

    const pName = e.party?.name || e.paidTo || "General Payee";
    partyStats[pName] = (partyStats[pName] || 0) + amt;

    const mode = e.paymentMode || "CASH";
    paymentMethodStats[mode] = (paymentMethodStats[mode] || 0) + amt;

    const mKey = eDate.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
    monthlyStats[mKey] = (monthlyStats[mKey] || 0) + amt;
  });

  const recurringPendingAmount = pendingRecurringInstances.reduce(
    (sum, i) => sum + Number(i.amount || 0),
    0
  );

  // Status breakdown of recurring instances
  const instanceStatusCounts = await prisma.recurringExpenseInstance.groupBy({
    by: ["status"],
    _count: { status: true },
  });

  const recurringStatus = {
    UPCOMING: 0,
    DUE: 0,
    OVERDUE: 0,
    PAID: 0,
  };
  instanceStatusCounts.forEach((r) => {
    recurringStatus[r.status] = r._count.status;
  });

  return {
    summary: {
      totalExpense,
      todayExpense,
      thisMonthExpense,
      thisYearExpense,
      recurringCount,
      recurringPendingAmount,
      totalCount: allExpenses.length,
    },
    categoryStats,
    partyStats,
    paymentMethodStats,
    monthlyStats,
    recurringStatus,
    recentExpenses: allExpenses.slice(0, 10),
  };
};
