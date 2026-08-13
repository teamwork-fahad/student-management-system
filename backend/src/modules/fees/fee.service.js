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
  }, {
    timeout: 30000,
    maxWait: 10000,
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

/**
 * Update an existing fee payment record and recalculate admission dues.
 */
export const updateFeePayment = async (paymentId, payload, updatedBy) => {
  const existingPayment = await prisma.admissionPayment.findUnique({
    where: { id: paymentId },
    include: {
      admission: true,
    },
  });

  if (!existingPayment) {
    throw createHttpError("Fee payment record not found", 404);
  }

  const { admissionId, amount, paymentMode, paymentDate, transactionReference, remarks } = payload;
  const oldAdmissionId = existingPayment.admissionId;
  const newAdmissionId = admissionId && admissionId !== oldAdmissionId ? admissionId : oldAdmissionId;

  return prisma.$transaction(async (tx) => {
    const updateData = {};
    if (newAdmissionId !== oldAdmissionId) updateData.admissionId = newAdmissionId;
    if (amount !== undefined && amount !== null && amount !== "") updateData.amount = new Prisma.Decimal(Number(amount));
    if (paymentMode) updateData.paymentMode = paymentMode;
    if (paymentDate) updateData.paymentDate = new Date(paymentDate);
    if (transactionReference !== undefined) updateData.transactionReference = transactionReference;
    if (remarks !== undefined) updateData.remarks = remarks;

    const updatedPayment = await tx.admissionPayment.update({
      where: { id: paymentId },
      data: updateData,
      include: {
        admission: {
          include: {
            student: true,
            course: true,
          },
        },
      },
    });

    // Recalculate Admission total paid & pending amounts for old admission
    const oldPayments = await tx.admissionPayment.findMany({
      where: { admissionId: oldAdmissionId },
    });
    const oldTotalPaid = oldPayments.reduce((sum, p) => sum + Number(p.amount), 0);
    const oldFinalFees = Number(existingPayment.admission.finalFees || 0);
    const oldNewPending = Math.max(0, oldFinalFees - oldTotalPaid);

    await tx.admission.update({
      where: { id: oldAdmissionId },
      data: {
        paidAmount: new Prisma.Decimal(oldTotalPaid),
        pendingAmount: new Prisma.Decimal(oldNewPending),
        updatedBy,
      },
    });

    // If reassigned to a new admission, recalculate for new admission too
    if (newAdmissionId !== oldAdmissionId) {
      const targetAdmission = await tx.admission.findUnique({ where: { id: newAdmissionId } });
      if (targetAdmission) {
        const newPayments = await tx.admissionPayment.findMany({
          where: { admissionId: newAdmissionId },
        });
        const newTotalPaid = newPayments.reduce((sum, p) => sum + Number(p.amount), 0);
        const newFinalFees = Number(targetAdmission.finalFees || 0);
        const newPending = Math.max(0, newFinalFees - newTotalPaid);

        await tx.admission.update({
          where: { id: newAdmissionId },
          data: {
            paidAmount: new Prisma.Decimal(newTotalPaid),
            pendingAmount: new Prisma.Decimal(newPending),
            updatedBy,
          },
        });
      }
    }

    return updatedPayment;
  }, {
    timeout: 30000,
    maxWait: 10000,
  });
};

/**
 * Delete a fee payment record and recalculate admission dues.
 */
export const deleteFeePayment = async (paymentId, deletedBy) => {
  const existingPayment = await prisma.admissionPayment.findUnique({
    where: { id: paymentId },
    include: { admission: true },
  });

  if (!existingPayment) {
    throw createHttpError("Fee payment record not found", 404);
  }

  return prisma.$transaction(async (tx) => {
    await tx.admissionPayment.delete({
      where: { id: paymentId },
    });

    const remainingPayments = await tx.admissionPayment.findMany({
      where: { admissionId: existingPayment.admissionId },
    });

    const totalPaid = remainingPayments.reduce((sum, p) => sum + Number(p.amount), 0);
    const finalFees = Number(existingPayment.admission.finalFees || 0);
    const newPending = Math.max(0, finalFees - totalPaid);

    await tx.admission.update({
      where: { id: existingPayment.admissionId },
      data: {
        paidAmount: new Prisma.Decimal(totalPaid),
        pendingAmount: new Prisma.Decimal(newPending),
        updatedBy: deletedBy,
      },
    });

    return { message: "Fee payment deleted successfully" };
  }, {
    timeout: 30000,
    maxWait: 10000,
  });
};

/**
 * Generate personalized WhatsApp Fee Reminder for a student (for mobile app & web sharing).
 */
export const generateStudentFeeReminderWhatsApp = async (studentId) => {
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
    },
  });

  if (!admission || !admission.student) {
    throw createHttpError("Student admission record not found", 404);
  }

  const student = admission.student;
  const cleanMobile = String(student.mobile || "").replace(/\D/g, "");
  const formattedMobile = cleanMobile.length === 10 ? `91${cleanMobile}` : cleanMobile;
  const courseName = admission.courseNameSnapshot || admission.course?.name || "Enrolled Course";

  const totalFees = Number(admission.courseFees || admission.finalFees || 0);
  const discount = Number(admission.discount || 0);
  const finalFees = Number(admission.finalFees || 0);
  const paidAmount = Number(admission.paidAmount || 0);
  const pendingAmount = Number(admission.pendingAmount || 0);

  const portalUrl = "https://student-management-system-pi-rosy.vercel.app/";

  const text = `📢 *FEE PAYMENT REMINDER NOTICE*

Dear *${student.fullName}* (${student.studentId}),

This is a gentle reminder regarding your pending course fee balance for *${courseName}*.

💰 *Total Fees:* ₹${totalFees.toLocaleString("en-IN")}
🎁 *Discount:* ₹${discount.toLocaleString("en-IN")}
🏷️ *Final Fees:* ₹${finalFees.toLocaleString("en-IN")}
💳 *Paid Amount:* ₹${paidAmount.toLocaleString("en-IN")}
⚠️ *Pending Dues Balance:* ₹${pendingAmount.toLocaleString("en-IN")}

🔗 Aap system me ja kar payment verify kar sakte hain aur receipt download kar sakte hain:
${portalUrl}

Please clear your pending dues at the earliest to continue your classes smoothly. If you have already paid, kindly ignore this message.

Thank you!
_Student Management System_`;

  const encodedText = encodeURIComponent(text);

  return {
    studentId: student.id,
    displayId: student.studentId,
    fullName: student.fullName,
    mobile: student.mobile,
    pendingAmount,
    text,
    whatsappUrl: formattedMobile ? `https://wa.me/${formattedMobile}?text=${encodedText}` : `https://wa.me/?text=${encodedText}`,
    apiWhatsappUrl: formattedMobile ? `whatsapp://send?phone=${formattedMobile}&text=${encodedText}` : `whatsapp://send?text=${encodedText}`,
  };
};
