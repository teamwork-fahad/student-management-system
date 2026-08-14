import prisma from "../../config/prisma.js";

export const getExpensesService = async ({ page = 1, limit = 50, search, categoryId, month }) => {
  const skip = (Number(page) - 1) * Number(limit);
  const take = Number(limit);

  const where = {};
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { remarks: { contains: search, mode: "insensitive" } },
      { paidTo: { contains: search, mode: "insensitive" } },
    ];
  }
  if (categoryId) {
    where.categoryId = categoryId;
  }

  if (month) {
    // e.g. month = "2026-08"
    const startDate = new Date(`${month}-01T00:00:00.000Z`);
    const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0, 23, 59, 59);
    where.expenseDate = {
      gte: startDate,
      lte: endDate,
    };
  }

  const [expenses, total, categories] = await Promise.all([
    prisma.expense.findMany({
      where,
      skip,
      take,
      orderBy: { expenseDate: "desc" },
      include: { category: true },
    }),
    prisma.expense.count({ where }),
    prisma.expenseCategory.findMany({ orderBy: { name: "asc" } }),
  ]);

  return {
    expenses,
    categories,
    pagination: {
      page: Number(page),
      limit: take,
      total,
      totalPages: Math.ceil(total / take),
    },
  };
};

export const createExpenseService = async (data) => {
  const { title, amount, expenseDate, paymentMode, categoryId, categoryName, category, remarks, paidTo, vendorName, createdBy } = data;

  const targetCategoryName = categoryName || category;
  let finalCategoryId = categoryId;
  if (!finalCategoryId && targetCategoryName) {
    // Upsert Category
    const cat = await prisma.expenseCategory.upsert({
      where: { name: targetCategoryName.trim() },
      update: {},
      create: { name: targetCategoryName.trim() },
    });
    finalCategoryId = cat.id;
  }

  const expense = await prisma.expense.create({
    data: {
      title: title || "General Expense",
      amount: Number(amount) || 0,
      expenseDate: expenseDate ? new Date(expenseDate) : new Date(),
      paymentMode: paymentMode || "CASH",
      categoryId: finalCategoryId || null,
      paidTo: paidTo || vendorName || null,
      remarks: remarks || null,
      createdBy: createdBy || null,
    },
    include: { category: true },
  });

  return expense;
};

export const deleteExpenseService = async (expenseId) => {
  await prisma.expense.delete({ where: { id: expenseId } });
  return true;
};

export const getExpenseStatsService = async () => {
  const allExpenses = await prisma.expense.findMany({
    include: { category: true },
    orderBy: { expenseDate: "desc" },
  });

  const totalExpense = allExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);

  // Group by Category
  const categoryStats = {};
  // Group by Month
  const monthlyStats = {};

  allExpenses.forEach((e) => {
    const catName = e.category?.name || "General";
    categoryStats[catName] = (categoryStats[catName] || 0) + Number(e.amount || 0);

    const mKey = new Date(e.expenseDate).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
    monthlyStats[mKey] = (monthlyStats[mKey] || 0) + Number(e.amount || 0);
  });

  return {
    totalExpense,
    totalCount: allExpenses.length,
    categoryStats,
    monthlyStats,
  };
};
