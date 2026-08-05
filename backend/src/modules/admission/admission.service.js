import { Prisma } from "@prisma/client";
import prisma from "../../config/prisma.js";
import bcrypt from "bcrypt";
import { createHttpError } from "../../utils/httpError.js";

/**
 * ============================================================================
 * SPRINT 5.2A & 5.2B: ADMISSION BUSINESS LOGIC SERVICE
 * ============================================================================
 *
 * This module implements the production-ready business logic for student
 * onboarding, admission completion, and querying/updating admissions.
 */

/**
 * ----------------------------------------------------------------------------
 * 1. validateInquiry(inquiryId, tx)
 * ----------------------------------------------------------------------------
 * Validates that an inquiry exists, is active, and has not already been admitted.
 *
 * @param {string} inquiryId - ID of the inquiry to validate
 * @param {object} [tx=prisma] - Prisma transaction context
 * @returns {Promise<object>} - Validated Inquiry object
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
 *
 * @param {string} courseId - ID of the course
 * @param {object} [tx=prisma] - Prisma transaction context
 * @returns {Promise<object>} - Validated Course object
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
 *
 * @param {string|null} batchId - ID of the batch (optional)
 * @param {object} [tx=prisma] - Prisma transaction context
 * @returns {Promise<object|null>} - Validated Batch object or null
 */
export const validateBatch = async (batchId, tx = prisma) => {
  if (!batchId) {
    return null;
  }

  // Gracefully check Batch table if model exists in active schema
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
 * Generates an atomic sequential Admission Number (e.g. ADM-2026-0001)
 * using the Sequence table.
 *
 * @param {object} tx - Prisma transaction context (Mandatory)
 * @param {string|null} [instituteId=null] - Institute ID for multi-tenant scope
 * @returns {Promise<string>} - Formatted Admission Number
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
 * Generates an atomic sequential Student ID (e.g. STD260001)
 * using the Sequence table.
 *
 * @param {object} tx - Prisma transaction context (Mandatory)
 * @param {string|null} [instituteId=null] - Institute ID for multi-tenant scope
 * @returns {Promise<string>} - Formatted Student ID
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
 *
 * @param {object} admissionData - Admission fields & snapshots
 * @param {object} [tx=prisma] - Prisma transaction context
 * @returns {Promise<object>} - Created Admission record
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
 * (Rule 5: Student can NEVER be created manually).
 *
 * @param {object} studentData - Student profile details
 * @param {object} [tx=prisma] - Prisma transaction context
 * @returns {Promise<object>} - Created Student record
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
 * Provision a User login account for the admitted student if credentials/flag
 * are provided.
 *
 * @param {object} userData - User login credentials (name, email, password)
 * @param {object} [tx=prisma] - Prisma transaction context
 * @returns {Promise<object>} - Created User record
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
 * Inserts multiple payment entries for an admission (Rule 9).
 *
 * @param {string} admissionId - ID of the admission
 * @param {Array<object>} paymentsData - List of payment objects
 * @param {object} [tx=prisma] - Prisma transaction context
 * @returns {Promise<Array<object>>} - List of created AdmissionPayment records
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
 * 10. updateInquiryStatus(inquiryId, status, tx)
 * ----------------------------------------------------------------------------
 * Updates the Inquiry status to ADMISSION_DONE (Rule 8).
 *
 * @param {string} inquiryId - ID of the inquiry
 * @param {string} [status="ADMISSION_DONE"] - Target status
 * @param {object} [tx=prisma] - Prisma transaction context
 * @returns {Promise<object>} - Updated Inquiry record
 */
export const updateInquiryStatus = async (inquiryId, status = "ADMISSION_DONE", tx = prisma) => {
  return tx.inquiry.update({
    where: { id: inquiryId },
    data: { status },
  });
};

/**
 * ----------------------------------------------------------------------------
 * 11. completeAdmission(admissionPayload)
 * ----------------------------------------------------------------------------
 * Master Orchestrator Method for Sprint 5.2A.
 * Executes the full admission workflow atomically inside Prisma $transaction().
 *
 * @param {object} admissionPayload - Full payload containing inquiry, student, and payment details
 * @returns {Promise<object>} - Completed Admission onboarding object
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
    createUserAccount = false,
    userCredentials = {},
    payments = [],
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

    // Step 7: Create User Login Account if requested
    let createdUser = null;
    if (createUserAccount && (userCredentials.email || studentDetails.email)) {
      createdUser = await createUser(
        {
          name: studentDetails.fullName || inquiry.fullName,
          email: userCredentials.email || studentDetails.email || inquiry.email,
          password: userCredentials.password,
        },
        tx
      );
    }

    // Step 8: Create Student record linked to Admission & User (Rule 5)
    const student = await createStudent(
      {
        studentId: studentIdStr,
        admissionId: admission.id,
        userId: createdUser ? createdUser.id : null,
        fullName: studentDetails.fullName || inquiry.fullName,
        fatherName: studentDetails.fatherName || null,
        motherName: studentDetails.motherName || null,
        gender: studentDetails.gender || inquiry.gender,
        dob: studentDetails.dob || null,
        mobile: studentDetails.mobile || inquiry.mobile,
        whatsapp: studentDetails.whatsapp || inquiry.whatsapp,
        email: studentDetails.email || inquiry.email,
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

    // Step 10: Create Admission Payments (Rule 9)
    const createdPayments = await createAdmissionPayments(
      admission.id,
      payments,
      tx
    );

    // Step 11: Update Inquiry Status to ADMISSION_DONE (Rule 8)
    await updateInquiryStatus(inquiry.id, "ADMISSION_DONE", tx);

    // Step 12: Return complete onboarding record
    return {
      admission: {
        ...admission,
        studentId: student.id,
      },
      student,
      user: createdUser ? { id: createdUser.id, email: createdUser.email, role: createdUser.role } : null,
      payments: createdPayments,
    };
  });
};

/**
 * ----------------------------------------------------------------------------
 * 12. getAllAdmissions(queryParams)
 * ----------------------------------------------------------------------------
 * Retrieves admissions list with optional search and filter criteria.
 *
 * @param {object} [queryParams={}] - Query filters (status, search, courseId, batchId, admissionYear)
 * @returns {Promise<Array<object>>} - List of admission records
 */
export const getAllAdmissions = async (queryParams = {}) => {
  const { status, search, courseId, batchId, admissionYear } = queryParams;

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

  if (search) {
    where.OR = [
      { admissionNumber: { contains: search, mode: "insensitive" } },
      { studentCategory: { contains: search, mode: "insensitive" } },
      { guardianName: { contains: search, mode: "insensitive" } },
      { guardianMobile: { contains: search, mode: "insensitive" } },
      { student: { fullName: { contains: search, mode: "insensitive" } } },
      { student: { studentId: { contains: search, mode: "insensitive" } } },
      { student: { mobile: { contains: search, mode: "insensitive" } } },
    ];
  }

  return prisma.admission.findMany({
    where,
    include: {
      inquiry: true,
      course: true,
      student: true,
      payments: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

/**
 * ----------------------------------------------------------------------------
 * 13. getAdmissionById(id)
 * ----------------------------------------------------------------------------
 * Retrieves a single admission by ID.
 *
 * @param {string} id - Admission ID
 * @returns {Promise<object>} - Single admission record with relations
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
      student: true,
      payments: true,
    },
  });

  if (!admission) {
    throw createHttpError("Admission not found", 404);
  }

  return admission;
};

/**
 * ----------------------------------------------------------------------------
 * 14. updateAdmission(id, updateData, updatedBy)
 * ----------------------------------------------------------------------------
 * Updates allowed editable fields of an admission and linked student record.
 * (Restricts updating admissionNumber, studentId, inquiryId, course snapshots).
 *
 * @param {string} id - Admission ID
 * @param {object} updateData - Allowed fields to update
 * @param {string} updatedBy - User ID performing the update
 * @returns {Promise<object>} - Updated admission record
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
    // Update Student details if studentDetails provided
    if (studentDetails && existingAdmission.studentId) {
      await tx.student.update({
        where: { id: existingAdmission.studentId },
        data: studentDetails,
      });
    }

    // Build admission update payload
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
        student: true,
        payments: true,
      },
    });
  });
};
