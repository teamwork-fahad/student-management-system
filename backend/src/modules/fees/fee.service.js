import { Prisma } from "@prisma/client";
import prisma from "../../config/prisma.js";
import { createHttpError } from "../../utils/httpError.js";

/**
 * Collect a fee payment for an admission/student and update total paid & pending amounts.
 */
export const collectFee = async (payload, collectedBy) => {
  const {
    admissionId,
    studentId,
    amount,
    paymentMode,
    transactionReference,
    paymentDate,
    remarks,
    instituteId,
  } = payload;

  const numericAmount = Number(amount);
  if (!numericAmount || numericAmount <= 0) {
    throw createHttpError("Payment amount must be greater than zero", 400);
  }

  // Find Admission by admissionId OR studentId
  let admission = null;

  if (admissionId) {
    admission = await prisma.admission.findFirst({
      where: { id: admissionId, deletedAt: null },
      include: { student: true },
    });
  } else if (studentId) {
    admission = await prisma.admission.findFirst({
      where: {
        OR: [
          { studentId },
          { student: { studentId } },
          { student: { id: studentId } },
        ],
        deletedAt: null,
      },
      orderBy: { pendingAmount: "desc" },
      include: { student: true },
    });
  }

  if (!admission) {
    throw createHttpError("Admission or Student record not found", 404);
  }

  return prisma.$transaction(async (tx) => {
    // Generate Receipt Number via Sequence if sequence exists
    let receiptNumber = null;
    const sequenceRecord = await tx.sequence.findFirst({
      where: {
        name: "RECEIPT",
        ...(instituteId ? { instituteId } : {}),
      },
    });

    if (sequenceRecord) {
      const updatedSequence = await tx.sequence.update({
        where: { id: sequenceRecord.id },
        data: { currentValue: { increment: 1 } },
      });
      const year = new Date().getFullYear();
      receiptNumber = `REC-${year}-${String(updatedSequence.currentValue).padStart(4, "0")}`;
    }

    // Create payment entry
    const payment = await tx.admissionPayment.create({
      data: {
        admissionId: admission.id,
        amount: new Prisma.Decimal(numericAmount),
        paymentMode,
        transactionReference: transactionReference || receiptNumber || null,
        paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
        remarks: remarks || (receiptNumber ? `Receipt: ${receiptNumber}` : null),
        instituteId: instituteId || null,
      },
    });

    // Update Admission financial totals
    const currentPaid = Number(admission.paidAmount || 0);
    const currentFinal = Number(admission.finalFees || 0);
    const newPaid = currentPaid + numericAmount;
    const newPending = Math.max(0, currentFinal - newPaid);

    const updatedAdmission = await tx.admission.update({
      where: { id: admission.id },
      data: {
        paidAmount: new Prisma.Decimal(newPaid),
        pendingAmount: new Prisma.Decimal(newPending),
        updatedBy: collectedBy,
      },
      include: {
        student: true,
        course: true,
      },
    });

    return {
      payment: {
        ...payment,
        receiptNumber,
      },
      admission: updatedAdmission,
    };
  });
};

/**
 * Retrieve fee payment history with pagination and filters.
 */
export const getFeeHistory = async (queryParams = {}) => {
  const {
    page = 1,
    limit = 10,
    studentId,
    admissionId,
    paymentMode,
    startDate,
    endDate,
  } = queryParams;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, parseInt(limit, 10) || 10);
  const skip = (pageNum - 1) * limitNum;

  const where = {};

  if (admissionId) {
    where.admissionId = admissionId;
  }

  if (studentId) {
    where.admission = {
      OR: [
        { studentId },
        { student: { studentId } },
        { student: { id: studentId } },
      ],
    };
  }

  if (paymentMode) {
    where.paymentMode = paymentMode;
  }

  if (startDate || endDate) {
    where.paymentDate = {};
    if (startDate) where.paymentDate.gte = new Date(startDate);
    if (endDate) where.paymentDate.lte = new Date(endDate);
  }

  const [total, payments] = await Promise.all([
    prisma.admissionPayment.count({ where }),
    prisma.admissionPayment.findMany({
      where,
      include: {
        admission: {
          include: {
            student: true,
            course: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: limitNum,
    }),
  ]);

  const totalPages = Math.ceil(total / limitNum) || 1;

  return {
    payments,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages,
      hasNextPage: pageNum < totalPages,
      hasPreviousPage: pageNum > 1,
    },
  };
};

/**
 * Get comprehensive fee summary for a specific student.
 */
export const getStudentFeeSummary = async (studentId) => {
  const admission = await prisma.admission.findFirst({
    where: {
      OR: [
        { studentId },
        { student: { studentId } },
        { student: { id: studentId } },
      ],
      deletedAt: null,
    },
    include: {
      student: true,
      course: true,
      payments: {
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!admission) {
    throw createHttpError("Student fee record not found", 404);
  }

  return {
    student: admission.student,
    course: admission.course,
    feeSummary: {
      courseFees: admission.courseFees,
      discount: admission.discount,
      finalFees: admission.finalFees,
      paidAmount: admission.paidAmount,
      pendingAmount: admission.pendingAmount,
    },
    payments: admission.payments,
  };
};
