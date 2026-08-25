import prisma from "../../config/prisma.js";
import { generateExpenseNumber } from "./expense.service.js";

// Calculate next due date based on frequency
export const calculateNextDueDate = (currentDate, frequency) => {
  const date = new Date(currentDate);
  switch (frequency) {
    case "DAILY":
      date.setDate(date.getDate() + 1);
      break;
    case "WEEKLY":
      date.setDate(date.getDate() + 7);
      break;
    case "MONTHLY":
      date.setMonth(date.getMonth() + 1);
      break;
    case "QUARTERLY":
      date.setMonth(date.getMonth() + 3);
      break;
    case "HALF_YEARLY":
      date.setMonth(date.getMonth() + 6);
      break;
    case "YEARLY":
      date.setFullYear(date.getFullYear() + 1);
      break;
    default:
      date.setMonth(date.getMonth() + 1);
  }
  return date;
};

// Sync instance statuses (UPCOMING, DUE, OVERDUE)
export const syncRecurringInstanceStatuses = async () => {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

  // Update UNPAID instances to DUE or OVERDUE
  await prisma.$transaction([
    // Today's due instances -> DUE
    prisma.recurringExpenseInstance.updateMany({
      where: {
        status: { not: "PAID" },
        dueDate: { gte: todayStart, lte: todayEnd },
      },
      data: { status: "DUE" },
    }),
    // Past due instances -> OVERDUE
    prisma.recurringExpenseInstance.updateMany({
      where: {
        status: { not: "PAID" },
        dueDate: { lt: todayStart },
      },
      data: { status: "OVERDUE" },
    }),
    // Future due instances -> UPCOMING
    prisma.recurringExpenseInstance.updateMany({
      where: {
        status: { not: "PAID" },
        dueDate: { gt: todayEnd },
      },
      data: { status: "UPCOMING" },
    }),
  ]);
};

export const getRecurringExpensesService = async ({ page = 1, limit = 50, search, status, categoryId, partyId }) => {
  await syncRecurringInstanceStatuses();

  const skip = (Number(page) - 1) * Number(limit);
  const take = Number(limit);

  const where = {};
  if (status) where.status = status;
  if (categoryId) where.categoryId = categoryId;
  if (partyId) where.partyId = partyId;
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  const [recurringExpenses, total] = await Promise.all([
    prisma.recurringExpense.findMany({
      where,
      skip,
      take,
      orderBy: { nextDueDate: "asc" },
      include: {
        category: true,
        party: true,
        instances: {
          orderBy: { dueDate: "desc" },
          take: 12,
        },
      },
    }),
    prisma.recurringExpense.count({ where }),
  ]);

  // Overall summary metrics for recurring expenses
  const allInstances = await prisma.recurringExpenseInstance.findMany({
    where: { status: { in: ["DUE", "OVERDUE"] } },
  });

  const pendingAmount = allInstances.reduce((sum, i) => sum + Number(i.amount || 0), 0);
  const pendingCount = allInstances.length;

  return {
    recurringExpenses,
    summary: {
      totalTemplates: total,
      pendingAmount,
      pendingCount,
    },
    pagination: {
      page: Number(page),
      limit: take,
      total,
      totalPages: Math.ceil(total / take),
    },
  };
};

export const createRecurringExpenseService = async (data) => {
  const {
    title,
    amount,
    paymentMode,
    frequency,
    startDate,
    endDate,
    reminderDays,
    description,
    categoryId,
    categoryName,
    partyId,
    createdBy,
  } = data;

  let finalCategoryId = categoryId;
  if (!finalCategoryId && categoryName) {
    const cat = await prisma.expenseCategory.upsert({
      where: { name: categoryName.trim() },
      update: {},
      create: { name: categoryName.trim() },
    });
    finalCategoryId = cat.id;
  }

  const start = startDate ? new Date(startDate) : new Date();
  const end = endDate ? new Date(endDate) : null;

  const recurringExpense = await prisma.recurringExpense.create({
    data: {
      title: title.trim(),
      amount: Number(amount),
      paymentMode: paymentMode || "CASH",
      frequency: frequency || "MONTHLY",
      startDate: start,
      endDate: end,
      nextDueDate: start,
      reminderDays: Number(reminderDays) || 3,
      description: description ? description.trim() : null,
      status: "ACTIVE",
      categoryId: finalCategoryId || null,
      partyId: partyId || null,
      createdBy: createdBy || null,
    },
    include: { category: true, party: true },
  });

  // Generate initial instances up to 6 occurrences
  let currentDue = new Date(start);
  const now = new Date();
  const instancesToCreate = [];

  for (let i = 0; i < 6; i++) {
    if (end && currentDue > end) break;

    let status = "UPCOMING";
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    if (currentDue >= todayStart && currentDue <= todayEnd) {
      status = "DUE";
    } else if (currentDue < todayStart) {
      status = "OVERDUE";
    }

    instancesToCreate.push({
      recurringExpenseId: recurringExpense.id,
      dueDate: new Date(currentDue),
      amount: Number(amount),
      status,
      partyId: partyId || null,
    });

    currentDue = calculateNextDueDate(currentDue, recurringExpense.frequency);
  }

  if (instancesToCreate.length > 0) {
    await prisma.recurringExpenseInstance.createMany({
      data: instancesToCreate,
    });
  }

  return recurringExpense;
};

export const getRecurringExpenseByIdService = async (id) => {
  await syncRecurringInstanceStatuses();

  const recurringExpense = await prisma.recurringExpense.findUnique({
    where: { id },
    include: {
      category: true,
      party: true,
      instances: {
        orderBy: { dueDate: "desc" },
        include: { expense: true },
      },
    },
  });

  return recurringExpense;
};

export const updateRecurringExpenseService = async (id, data) => {
  const { title, amount, paymentMode, frequency, nextDueDate, status, categoryId, partyId, description } = data;

  const updated = await prisma.recurringExpense.update({
    where: { id },
    data: {
      ...(title && { title: title.trim() }),
      ...(amount && { amount: Number(amount) }),
      ...(paymentMode && { paymentMode }),
      ...(frequency && { frequency }),
      ...(nextDueDate && { nextDueDate: new Date(nextDueDate) }),
      ...(status && { status }),
      ...(categoryId !== undefined && { categoryId }),
      ...(partyId !== undefined && { partyId }),
      ...(description !== undefined && { description: description ? description.trim() : null }),
    },
    include: { category: true, party: true },
  });

  return updated;
};

export const deleteRecurringExpenseService = async (id) => {
  await prisma.recurringExpense.delete({ where: { id } });
  return true;
};

// Record payment for a recurring instance -> creates actual Expense transaction
export const payRecurringInstanceService = async (instanceId, data) => {
  const instance = await prisma.recurringExpenseInstance.findUnique({
    where: { id: instanceId },
    include: { recurringExpense: true, party: true },
  });

  if (!instance) throw new Error("Recurring expense instance not found");
  if (instance.status === "PAID") throw new Error("Instance has already been paid");

  const { paymentMode, remarks, referenceNumber, createdBy } = data;

  // Generate unique EXP-XXXXXX reference
  const expenseNumber = await generateExpenseNumber();

  const actualExpense = await prisma.$transaction(async (tx) => {
    // 1. Create actual Expense record
    const exp = await tx.expense.create({
      data: {
        expenseNumber,
        title: instance.recurringExpense.title,
        amount: Number(instance.amount),
        expenseDate: new Date(),
        paymentMode: paymentMode || instance.recurringExpense.paymentMode || "CASH",
        categoryId: instance.recurringExpense.categoryId,
        partyId: instance.partyId || instance.recurringExpense.partyId,
        paidTo: instance.party?.name || instance.recurringExpense.partyId || null,
        referenceNumber: referenceNumber || null,
        remarks: remarks || `Recurring payment for ${instance.recurringExpense.title}`,
        createdBy: createdBy || null,
        recurringExpenseId: instance.recurringExpenseId,
        recurringInstanceId: instance.id,
      },
    });

    // 2. Mark instance as PAID
    await tx.recurringExpenseInstance.update({
      where: { id: instanceId },
      data: {
        status: "PAID",
        paidDate: new Date(),
        expenseId: exp.id,
      },
    });

    // 3. Advance template nextDueDate
    const nextDate = calculateNextDueDate(instance.dueDate, instance.recurringExpense.frequency);
    await tx.recurringExpense.update({
      where: { id: instance.recurringExpenseId },
      data: { nextDueDate: nextDate },
    });

    // 4. Create next upcoming instance if none exists
    const existingNext = await tx.recurringExpenseInstance.findFirst({
      where: {
        recurringExpenseId: instance.recurringExpenseId,
        dueDate: nextDate,
      },
    });

    if (!existingNext) {
      await tx.recurringExpenseInstance.create({
        data: {
          recurringExpenseId: instance.recurringExpenseId,
          dueDate: nextDate,
          amount: Number(instance.recurringExpense.amount),
          status: "UPCOMING",
          partyId: instance.recurringExpense.partyId,
        },
      });
    }

    return exp;
  });

  return actualExpense;
};
