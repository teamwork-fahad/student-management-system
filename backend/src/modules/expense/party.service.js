import prisma from "../../config/prisma.js";

export const getPartiesService = async ({ page = 1, limit = 50, search, status }) => {
  const skip = (Number(page) - 1) * Number(limit);
  const take = Number(limit);

  const where = {};
  if (status) {
    where.status = status;
  }
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { contactPerson: { contains: search, mode: "insensitive" } },
      { mobile: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }

  const [parties, total] = await Promise.all([
    prisma.expenseParty.findMany({
      where,
      skip,
      take,
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { expenses: true, recurringExpenses: true },
        },
      },
    }),
    prisma.expenseParty.count({ where }),
  ]);

  return {
    parties,
    pagination: {
      page: Number(page),
      limit: take,
      total,
      totalPages: Math.ceil(total / take),
    },
  };
};

export const createPartyService = async (data) => {
  const { name, contactPerson, mobile, email, address, notes, status } = data;
  const party = await prisma.expenseParty.create({
    data: {
      name: name.trim(),
      contactPerson: contactPerson ? contactPerson.trim() : null,
      mobile: mobile ? mobile.trim() : null,
      email: email ? email.trim() : null,
      address: address ? address.trim() : null,
      notes: notes ? notes.trim() : null,
      status: status || "ACTIVE",
    },
  });
  return party;
};

export const getPartyByIdService = async (partyId) => {
  const party = await prisma.expenseParty.findUnique({
    where: { id: partyId },
    include: {
      expenses: {
        orderBy: { expenseDate: "desc" },
        include: { category: true },
      },
      recurringExpenses: {
        orderBy: { createdAt: "desc" },
        include: { category: true },
      },
      recurringInstances: {
        orderBy: { dueDate: "desc" },
      },
    },
  });

  if (!party) return null;

  // Financial calculations
  const totalExpenses = party.expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const totalPaid = totalExpenses;
  
  // Pending recurring payments calculation for this party
  const pendingInstances = party.recurringInstances.filter(
    (i) => i.status === "DUE" || i.status === "OVERDUE"
  );
  const totalPending = pendingInstances.reduce((sum, i) => sum + Number(i.amount || 0), 0);

  return {
    party,
    summary: {
      totalExpenses,
      totalPaid,
      totalPending,
      totalTransactions: party.expenses.length,
      pendingCount: pendingInstances.length,
    },
    expenses: party.expenses,
    recentTransactions: party.expenses.slice(0, 20),
    recurringExpenses: party.recurringExpenses,
    recurringInstances: party.recurringInstances,
  };
};

export const updatePartyService = async (partyId, data) => {
  const { name, contactPerson, mobile, email, address, notes, status } = data;
  const party = await prisma.expenseParty.update({
    where: { id: partyId },
    data: {
      ...(name && { name: name.trim() }),
      ...(contactPerson !== undefined && { contactPerson: contactPerson ? contactPerson.trim() : null }),
      ...(mobile !== undefined && { mobile: mobile ? mobile.trim() : null }),
      ...(email !== undefined && { email: email ? email.trim() : null }),
      ...(address !== undefined && { address: address ? address.trim() : null }),
      ...(notes !== undefined && { notes: notes ? notes.trim() : null }),
      ...(status && { status }),
    },
  });
  return party;
};

export const deletePartyService = async (partyId) => {
  await prisma.expenseParty.delete({ where: { id: partyId } });
  return true;
};
