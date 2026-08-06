import { Prisma } from "@prisma/client";
import prisma from "../../config/prisma.js";
import bcrypt from "bcrypt";
import { createHttpError } from "../../utils/httpError.js";

/**
 * ============================================================================
 * END-TO-END ADMISSION MODULE SERVICE
 * ============================================================================
 * Production-grade business logic for student onboarding, sequence generation,
 * pagination, filtering, searching, statistics, and transaction management.
 */

/**
 * ----------------------------------------------------------------------------
 * 1. validateInquiry(inquiryId, tx)
 * ----------------------------------------------------------------------------
 * Validates that an inquiry exists, is active, and has not already been admitted.
 */
export const validateInquiry = async (inquiryId, tx = prisma) => {
  const inquiry = await tx.inquiry.findFirst({
    where: {
      id: inquiryId,
      isActive: true,
    },
    include: {
      admission: true,
    },
  });

  if (!inquiry) {
    throw createHttpError("Inquiry not found", 404);
  }

  if (inquiry.status === "ADMISSION_DONE" || inquiry.admission) {
    throw createHttpError("Admission already exists for this inquiry", 409);
  }

  return inquiry;
};

/**
 * ----------------------------------------------------------------------------
 * 2. validateCourse(courseId, tx)
 * ----------------------------------------------------------------------------
 * Validates that the requested course exists and is active.
 */
export const validateCourse = async (courseId, tx = prisma) => {
  const course = await tx.course.findFirst({
    where: {
      id: courseId,
      isActive: true,
    },
  });

  if (!course) {
    throw createHttpError("Course not found or inactive", 404);
  }

  return course;
};

/**
 * ----------------------------------------------------------------------------
 * 3. validateBatch(batchId, tx)
 * ----------------------------------------------------------------------------
 * Validates that the requested batch (if provided) exists and is active.
 */
export const validateBatch = async (batchId, tx = prisma) => {
  if (!batchId) {
    return null;
  }

  if (tx.batch) {
    const batch = await tx.batch.findFirst({
      where: {
        id: batchId,
        isActive: true,
      },
    });

    if (!batch) {
      throw createHttpError("Batch not found or inactive", 404);
    }

    return batch;
  }

  return { id: batchId };
};

/**
 * ----------------------------------------------------------------------------
 * 4. generateAdmissionNumber(tx, instituteId)
 * ----------------------------------------------------------------------------
 * Generates an atomic sequential Admission Number (e.g. ADM-2026-0001).
 */
export const generateAdmissionNumber = async (tx, instituteId = null) => {
  const sequenceRecord = await tx.sequence.findFirst({
    where: {
      name: "ADMISSION",
      ...(instituteId ? { instituteId } : {}),
    },
  });

  if (!sequenceRecord) {
    throw createHttpError("Sequence not configured for ADMISSION", 500);
  }

  const updatedSequence = await tx.sequence.update({
    where: { id: sequenceRecord.id },
    data: {
      currentValue: {
        increment: 1,
      },
    },
  });

  const year = new Date().getFullYear();
  const sequenceStr = String(updatedSequence.currentValue).padStart(4, "0");
  return `ADM-${year}-${sequenceStr}`;
};

/**
 * ----------------------------------------------------------------------------
 * 5. generateStudentId(tx, instituteId)
 * ----------------------------------------------------------------------------
 * Generates an atomic sequential Student ID (e.g. STD260001).
 */
export const generateStudentId = async (tx, instituteId = null) => {
  const sequenceRecord = await tx.sequence.findFirst({
    where: {
      name: "STUDENT",
      ...(instituteId ? { instituteId } : {}),
    },
  });

  if (!sequenceRecord) {
    throw createHttpError("Sequence not configured for STUDENT", 500);
  }

  const updatedSequence = await tx.sequence.update({
    where: { id: sequenceRecord.id },
    data: {
      currentValue: {
        increment: 1,
      },
    },
  });

  const yearShort = String(new Date().getFullYear()).slice(-2);
  const sequenceStr = String(updatedSequence.currentValue).padStart(4, "0");
  return `STD${yearShort}${sequenceStr}`;
};

/**
 * ----------------------------------------------------------------------------
 * 6. createAdmission(admissionData, tx)
 * ----------------------------------------------------------------------------
 * Inserts the core Admission record into the database with fee snapshots.
 */
export const createAdmission = async (admissionData, tx = prisma) => {
  const {
    admissionNumber,
    inquiryId,
    courseId,
    batchId,
    courseNameSnapshot,
    courseFeesSnapshot,
    admissionDate,
    admissionYear,
    courseFees,
    discount = 0,
    paidAmount = 0,
    remarks,
    referredBy,
    studentCategory,
    guardianName,
    guardianMobile,
    guardianRelation,
    admittedBy,
    instituteId,
  } = admissionData;

  const numericCourseFees = Number(courseFees || courseFeesSnapshot);
  const numericDiscount = Number(discount || 0);
  const numericFinalFees = numericCourseFees - numericDiscount;
  const numericPaidAmount = Number(paidAmount || 0);
  const numericPendingAmount = numericFinalFees - numericPaidAmount;

  const currentYear = new Date().getFullYear();
  const defaultAdmissionYear = `${currentYear}-${String(currentYear + 1).slice(-2)}`;

  return tx.admission.create({
    data: {
      admissionNumber,
      inquiryId,
      courseId,
      batchId: batchId || null,
      courseNameSnapshot,
      courseFeesSnapshot: new Prisma.Decimal(courseFeesSnapshot),
      admissionDate: admissionDate ? new Date(admissionDate) : new Date(),
      admissionYear: admissionYear || defaultAdmissionYear,
      courseFees: new Prisma.Decimal(numericCourseFees),
      discount: new Prisma.Decimal(numericDiscount),
      finalFees: new Prisma.Decimal(numericFinalFees),
      paidAmount: new Prisma.Decimal(numericPaidAmount),
      pendingAmount: new Prisma.Decimal(numericPendingAmount),
      remarks: remarks || null,
      referredBy: referredBy || null,
      studentCategory,
      guardianName,
      guardianMobile,
      guardianRelation,
      admittedBy,
      instituteId: instituteId || null,
    },
  });
};

/**
 * ----------------------------------------------------------------------------
 * 7. createStudent(studentData, tx)
 * ----------------------------------------------------------------------------
 * Creates the Student profile record linked strictly to an Admission.
 */
export const createStudent = async (studentData, tx = prisma) => {
  const {
    studentId,
    admissionId,
    userId,
    fullName,
    fatherName,
    motherName,
    gender,
    dob,
    mobile,
    whatsapp,
    email,
    address,
    area,
    city,
    state,
    country = "India",
    pincode,
    qualification,
    schoolCollege,
    bloodGroup,
    aadhaarNumber,
    joinedDate,
    instituteId,
  } = studentData;

  if (!admissionId) {
    throw createHttpError("Student must be created through a valid Admission", 400);
  }

  return tx.student.create({
    data: {
      studentId,
      admissionId,
      userId: userId || null,
      fullName,
      fatherName: fatherName || null,
      motherName: motherName || null,
      gender,
      dob: dob ? new Date(dob) : null,
      mobile,
      whatsapp: whatsapp || null,
      email: email || null,
      address: address || null,
      area: area || null,
      city: city || null,
      state: state || null,
      country: country || "India",
      pincode: pincode || null,
      qualification: qualification || null,
      schoolCollege: schoolCollege || null,
      bloodGroup: bloodGroup || null,
      aadhaarNumber: aadhaarNumber || null,
      joinedDate: joinedDate ? new Date(joinedDate) : new Date(),
      status: "ACTIVE",
      profileCompleted: false,
      instituteId: instituteId || null,
    },
  });
};

/**
 * ----------------------------------------------------------------------------
 * 8. createUser(userData, tx)
 * ----------------------------------------------------------------------------
 * Provision a User login account for the student (Role: STUDENT).
 */
export const createUser = async (userData, tx = prisma) => {
  const { name, email, password } = userData;

  if (!email || !password) {
    throw createHttpError("Email and password are required to create a user account", 400);
  }

  const existingUser = await tx.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw createHttpError("User email already exists", 409);
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  return tx.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role: "STUDENT",
      isActive: true,
    },
  });
};

/**
 * ----------------------------------------------------------------------------
 * 9. createAdmissionPayments(admissionId, paymentsData, tx)
 * ----------------------------------------------------------------------------
 * Inserts multiple payment entries for an admission.
 */
export const createAdmissionPayments = async (admissionId, paymentsData = [], tx = prisma) => {
  if (!paymentsData || paymentsData.length === 0) {
    return [];
  }

  const createdPayments = [];

  for (const payment of paymentsData) {
    const paymentRecord = await tx.admissionPayment.create({
      data: {
        admissionId,
        amount: new Prisma.Decimal(payment.amount),
        paymentMode: payment.paymentMode,
        transactionReference: payment.transactionReference || null,
        paymentDate: payment.paymentDate ? new Date(payment.paymentDate) : new Date(),
        remarks: payment.remarks || null,
        instituteId: payment.instituteId || null,
      },
    });

    createdPayments.push(paymentRecord);
  }

  return createdPayments;
};

/**
 * ----------------------------------------------------------------------------
 * 10. createStudentDocuments(studentId, documentsData, tx)
 * ----------------------------------------------------------------------------
 * Creates initial document metadata entries for a student.
 */
export const createStudentDocuments = async (studentId, documentsData = [], uploadedBy, tx = prisma) => {
  if (!documentsData || documentsData.length === 0) {
    return [];
  }

  const createdDocs = [];

  for (const doc of documentsData) {
    const documentRecord = await tx.studentDocument.create({
      data: {
        studentId,
        documentType: doc.documentType,
        documentNumber: doc.documentNumber || null,
        fileName: doc.fileName,
        fileUrl: doc.fileUrl,
        mimeType: doc.mimeType,
        fileSize: Number(doc.fileSize || 0),
        issueDate: doc.issueDate ? new Date(doc.issueDate) : null,
        expiryDate: doc.expiryDate ? new Date(doc.expiryDate) : null,
        isRequired: doc.isRequired || false,
        uploadedBy,
        remarks: doc.remarks || null,
        instituteId: doc.instituteId || null,
      },
    });

    createdDocs.push(documentRecord);
  }

  return createdDocs;
};

/**
 * ----------------------------------------------------------------------------
 * 11. updateInquiryStatus(inquiryId, status, tx)
 * ----------------------------------------------------------------------------
 * Updates the Inquiry status to ADMISSION_DONE.
 */
export const updateInquiryStatus = async (inquiryId, status = "ADMISSION_DONE", tx = prisma) => {
  return tx.inquiry.update({
    where: { id: inquiryId },
    data: { status },
  });
};

/**
 * ----------------------------------------------------------------------------
 * 12. completeAdmission(admissionPayload)
 * ----------------------------------------------------------------------------
 * Master Orchestrator Method.
 * Executes the full admission workflow atomically inside Prisma $transaction().
 */
export const completeAdmission = async (admissionPayload) => {
  const {
    inquiryId,
    courseId,
    batchId,
    admittedBy,
    studentCategory,
    guardianName,
    guardianMobile,
    guardianRelation,
    discount = 0,
    remarks,
    referredBy,
    admissionYear,
    admissionDate,
    studentDetails = {},
    userCredentials = {},
    payments = [],
    documents = [],
    instituteId = null,
  } = admissionPayload;

  return prisma.$transaction(async (tx) => {
    // Step 1: Validate Inquiry (Must exist & not already admitted)
    const inquiry = await validateInquiry(inquiryId, tx);

    // Step 2: Validate Course (Must exist & be active)
    const course = await validateCourse(courseId || inquiry.courseId, tx);

    // Step 3: Validate Batch if provided (Must exist & be active)
    if (batchId) {
      await validateBatch(batchId, tx);
    }

    // Step 4: Generate atomic Admission Number via Sequence table
    const admissionNumber = await generateAdmissionNumber(tx, instituteId);

    // Step 5: Generate atomic Student ID via Sequence table
    const studentIdStr = await generateStudentId(tx, instituteId);

    // Calculate initial paid amount from payments array
    const calculatedPaidAmount = payments.reduce(
      (sum, p) => sum + Number(p.amount || 0),
      0
    );

    // Step 6: Create Admission record with course snapshots
    const admission = await createAdmission(
      {
        admissionNumber,
        inquiryId: inquiry.id,
        courseId: course.id,
        batchId,
        courseNameSnapshot: course.name,
        courseFeesSnapshot: course.fees,
        admissionDate,
        admissionYear,
        courseFees: course.fees,
        discount,
        paidAmount: calculatedPaidAmount,
        remarks,
        referredBy,
        studentCategory,
        guardianName: guardianName || inquiry.fullName,
        guardianMobile: guardianMobile || inquiry.mobile,
        guardianRelation,
        admittedBy,
        instituteId,
      },
      tx
    );

    // Step 7: Always Create User Account (Auto-generate credentials if not provided)
    const userEmail = userCredentials.email || studentDetails.email || inquiry.email || `${studentIdStr.toLowerCase()}@student.erp`;
    const userPassword = userCredentials.password || `${studentIdStr}@Pass2026`;
    const userName = studentDetails.fullName || inquiry.fullName;

    const createdUser = await createUser(
      {
        name: userName,
        email: userEmail,
        password: userPassword,
      },
      tx
    );

    // Step 8: Create Student record linked to Admission & User (Rule 5)
    const student = await createStudent(
      {
        studentId: studentIdStr,
        admissionId: admission.id,
        userId: createdUser.id,
        fullName: studentDetails.fullName || inquiry.fullName,
        fatherName: studentDetails.fatherName || null,
        motherName: studentDetails.motherName || null,
        gender: studentDetails.gender || inquiry.gender,
        dob: studentDetails.dob || null,
        mobile: studentDetails.mobile || inquiry.mobile,
        whatsapp: studentDetails.whatsapp || inquiry.whatsapp,
        email: studentDetails.email || inquiry.email || userEmail,
        address: studentDetails.address || null,
        area: studentDetails.area || null,
        city: studentDetails.city || null,
        state: studentDetails.state || null,
        country: studentDetails.country || "India",
        pincode: studentDetails.pincode || null,
        qualification: studentDetails.qualification || null,
        schoolCollege: studentDetails.schoolCollege || null,
        bloodGroup: studentDetails.bloodGroup || null,
        aadhaarNumber: studentDetails.aadhaarNumber || null,
        joinedDate: admissionDate || new Date(),
        instituteId,
      },
      tx
    );

    // Step 9: Link generated studentId on Admission record
    await tx.admission.update({
      where: { id: admission.id },
      data: { studentId: student.id },
    });

    // Step 10: Create Admission Payments
    const createdPayments = await createAdmissionPayments(
      admission.id,
      payments,
      tx
    );

    // Step 11: Create Student Document Metadata if provided
    const createdDocuments = await createStudentDocuments(
      student.id,
      documents,
      admittedBy,
      tx
    );

    // Step 12: Update Inquiry Status to ADMISSION_DONE
    await updateInquiryStatus(inquiry.id, "ADMISSION_DONE", tx);

    // Return complete onboarding result
    return {
      admission: {
        ...admission,
        studentId: student.id,
      },
      student,
      user: {
        id: createdUser.id,
        name: createdUser.name,
        email: createdUser.email,
        role: createdUser.role,
        initialPassword: userPassword,
      },
      payments: createdPayments,
      documents: createdDocuments,
    };
  });
};

/**
 * ----------------------------------------------------------------------------
 * 13. getAllAdmissions(queryParams)
 * ----------------------------------------------------------------------------
 * Retrieves paginated admissions list with filters, search, and sorting options.
 */
export const getAllAdmissions = async (queryParams = {}) => {
  const {
    page = 1,
    limit = 10,
    status,
    studentStatus,
    courseId,
    batchId,
    admissionYear,
    startDate,
    endDate,
    search,
    sortBy = "newest",
  } = queryParams;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, parseInt(limit, 10) || 10);
  const skip = (pageNum - 1) * limitNum;

  const where = {
    deletedAt: null,
  };

  if (status) {
    where.status = status;
  }

  if (courseId) {
    where.courseId = courseId;
  }

  if (batchId) {
    where.batchId = batchId;
  }

  if (admissionYear) {
    where.admissionYear = admissionYear;
  }

  if (studentStatus) {
    where.student = {
      status: studentStatus,
    };
  }

  if (startDate || endDate) {
    where.admissionDate = {};
    if (startDate) where.admissionDate.gte = new Date(startDate);
    if (endDate) where.admissionDate.lte = new Date(endDate);
  }

  if (search) {
    const trimmedSearch = String(search).trim();
    where.OR = [
      { admissionNumber: { contains: trimmedSearch, mode: "insensitive" } },
      { guardianName: { contains: trimmedSearch, mode: "insensitive" } },
      { guardianMobile: { contains: trimmedSearch, mode: "insensitive" } },
      { courseNameSnapshot: { contains: trimmedSearch, mode: "insensitive" } },
      { course: { name: { contains: trimmedSearch, mode: "insensitive" } } },
      { course: { code: { contains: trimmedSearch, mode: "insensitive" } } },
      { student: { fullName: { contains: trimmedSearch, mode: "insensitive" } } },
      { student: { studentId: { contains: trimmedSearch, mode: "insensitive" } } },
      { student: { mobile: { contains: trimmedSearch, mode: "insensitive" } } },
    ];
  }

  // Sorting maps
  let orderBy = { createdAt: "desc" };
  if (sortBy === "oldest") {
    orderBy = { createdAt: "asc" };
  } else if (sortBy === "studentName") {
    orderBy = { student: { fullName: "asc" } };
  } else if (sortBy === "admissionNumber") {
    orderBy = { admissionNumber: "asc" };
  }

  const [total, admissions] = await Promise.all([
    prisma.admission.count({ where }),
    prisma.admission.findMany({
      where,
      include: {
        inquiry: true,
        course: true,
        student: {
          include: {
            documents: true,
          },
        },
        payments: true,
      },
      orderBy,
      skip,
      take: limitNum,
    }),
  ]);

  const totalPages = Math.ceil(total / limitNum) || 1;

  return {
    admissions,
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
 * ----------------------------------------------------------------------------
 * 14. searchAdmissions(query, queryParams)
 * ----------------------------------------------------------------------------
 * Specialized search endpoint for admission number, student ID, student name,
 * mobile, guardian mobile, or course.
 */
export const searchAdmissions = async (query, queryParams = {}) => {
  return getAllAdmissions({
    ...queryParams,
    search: query,
  });
};

/**
 * ----------------------------------------------------------------------------
 * 15. getAdmissionById(id)
 * ----------------------------------------------------------------------------
 * Retrieves a single admission by ID with full relations.
 */
export const getAdmissionById = async (id) => {
  const admission = await prisma.admission.findFirst({
    where: {
      id,
      deletedAt: null,
    },
    include: {
      inquiry: true,
      course: true,
      student: {
        include: {
          documents: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              isActive: true,
            },
          },
        },
      },
      payments: {
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!admission) {
    throw createHttpError("Admission not found", 404);
  }

  return admission;
};

/**
 * ----------------------------------------------------------------------------
 * 16. updateAdmission(id, updateData, updatedBy)
 * ----------------------------------------------------------------------------
 * Updates allowed editable fields of an admission and linked student.
 */
export const updateAdmission = async (id, updateData, updatedBy) => {
  const existingAdmission = await getAdmissionById(id);

  const {
    remarks,
    batchId,
    guardianName,
    guardianMobile,
    guardianRelation,
    studentCategory,
    studentDetails,
  } = updateData;

  return prisma.$transaction(async (tx) => {
    if (studentDetails && existingAdmission.studentId) {
      await tx.student.update({
        where: { id: existingAdmission.studentId },
        data: studentDetails,
      });
    }

    const admissionUpdate = {
      updatedBy,
    };

    if (remarks !== undefined) admissionUpdate.remarks = remarks;
    if (batchId !== undefined) admissionUpdate.batchId = batchId;
    if (guardianName !== undefined) admissionUpdate.guardianName = guardianName;
    if (guardianMobile !== undefined) admissionUpdate.guardianMobile = guardianMobile;
    if (guardianRelation !== undefined) admissionUpdate.guardianRelation = guardianRelation;
    if (studentCategory !== undefined) admissionUpdate.studentCategory = studentCategory;

    return tx.admission.update({
      where: { id },
      data: admissionUpdate,
      include: {
        inquiry: true,
        course: true,
        student: {
          include: {
            documents: true,
          },
        },
        payments: true,
      },
    });
  });
};

/**
 * ----------------------------------------------------------------------------
 * 17. getAdmissionStatistics()
 * ----------------------------------------------------------------------------
 * Calculates comprehensive aggregate metrics for the dashboard.
 */
export const getAdmissionStatistics = async () => {
  const [
    totalAdmissions,
    activeAdmissions,
    completedAdmissions,
    cancelledAdmissions,
    studentStatusCounts,
    categoryCounts,
    yearCounts,
    financialAggregates,
  ] = await Promise.all([
    prisma.admission.count({ where: { deletedAt: null } }),
    prisma.admission.count({ where: { status: "ACTIVE", deletedAt: null } }),
    prisma.admission.count({ where: { status: "COMPLETED", deletedAt: null } }),
    prisma.admission.count({ where: { status: "CANCELLED", deletedAt: null } }),

    prisma.student.groupBy({
      by: ["status"],
      where: { deletedAt: null },
      _count: { status: true },
    }),

    prisma.admission.groupBy({
      by: ["studentCategory"],
      where: { deletedAt: null },
      _count: { studentCategory: true },
    }),

    prisma.admission.groupBy({
      by: ["admissionYear"],
      where: { deletedAt: null },
      _count: { admissionYear: true },
    }),

    prisma.admission.aggregate({
      where: { deletedAt: null },
      _sum: {
        courseFees: true,
        discount: true,
        finalFees: true,
        paidAmount: true,
        pendingAmount: true,
      },
    }),
  ]);

  const studentStatusBreakdown = studentStatusCounts.reduce((acc, curr) => {
    acc[curr.status] = curr._count.status;
    return acc;
  }, {});

  const categoryBreakdown = categoryCounts.reduce((acc, curr) => {
    acc[curr.studentCategory] = curr._count.studentCategory;
    return acc;
  }, {});

  const yearBreakdown = yearCounts.reduce((acc, curr) => {
    acc[curr.admissionYear] = curr._count.admissionYear;
    return acc;
  }, {});

  return {
    totalAdmissions,
    statusBreakdown: {
      ACTIVE: activeAdmissions,
      COMPLETED: completedAdmissions,
      CANCELLED: cancelledAdmissions,
    },
    studentStatusBreakdown,
    categoryBreakdown,
    yearBreakdown,
    financialSummary: {
      totalCourseFees: financialAggregates._sum.courseFees || 0,
      totalDiscounts: financialAggregates._sum.discount || 0,
      totalFinalFees: financialAggregates._sum.finalFees || 0,
      totalPaidAmount: financialAggregates._sum.paidAmount || 0,
      totalPendingAmount: financialAggregates._sum.pendingAmount || 0,
    },
  };
};

/**
 * Update single course admission status (e.g. ACTIVE, DROPPED, COMPLETED, ON_HOLD)
 */
export const updateAdmissionStatusService = async (admissionId, status) => {
  const admission = await prisma.admission.findUnique({ where: { id: admissionId } });
  if (!admission) throw createHttpError("Admission record not found", 404);

  return prisma.admission.update({
    where: { id: admissionId },
    data: { status },
  });
};

/**
 * Soft-delete a specific course admission entry
 */
export const deleteAdmissionService = async (admissionId) => {
  const admission = await prisma.admission.findUnique({ where: { id: admissionId } });
  if (!admission) throw createHttpError("Admission record not found", 404);

  // Soft-delete admission
  const updatedAdm = await prisma.admission.update({
    where: { id: admissionId },
    data: { deletedAt: new Date(), status: "CANCELLED" },
  });

  // Also soft-delete linked student records
  await prisma.student.updateMany({
    where: {
      OR: [
        { admissionId: admissionId },
        { id: admission.studentId || "" },
      ],
    },
    data: { deletedAt: new Date(), status: "DROPPED" },
  });

  return updatedAdm;
};
