import prisma from "../../config/prisma.js";
import { createHttpError } from "../../utils/httpError.js";

/**
 * Retrieve paginated students list with search and filtering.
 */
export const getAllStudents = async (queryParams = {}) => {
  const {
    page = 1,
    limit = 10,
    search,
    status,
    courseId,
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
    where.admission = {
      courseId,
    };
  }

  if (search) {
    const trimmed = String(search).trim();
    where.OR = [
      { studentId: { contains: trimmed, mode: "insensitive" } },
      { fullName: { contains: trimmed, mode: "insensitive" } },
      { mobile: { contains: trimmed, mode: "insensitive" } },
      { email: { contains: trimmed, mode: "insensitive" } },
      { fatherName: { contains: trimmed, mode: "insensitive" } },
      { admission: { admissionNumber: { contains: trimmed, mode: "insensitive" } } },
      { admission: { courseNameSnapshot: { contains: trimmed, mode: "insensitive" } } },
    ];
  }

  let orderBy = { createdAt: "desc" };
  if (sortBy === "oldest") {
    orderBy = { createdAt: "asc" };
  } else if (sortBy === "name") {
    orderBy = { fullName: "asc" };
  } else if (sortBy === "studentId") {
    orderBy = { studentId: "asc" };
  }

  const [total, students] = await Promise.all([
    prisma.student.count({ where }),
    prisma.student.findMany({
      where,
      skip,
      take: limitNum,
      orderBy,
      include: {
        admission: {
          include: {
            course: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            isActive: true,
          },
        },
      },
    }),
  ]);

  const totalPages = Math.ceil(total / limitNum) || 1;

  return {
    students,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages,
    },
  };
};

/**
 * Get student by DB id or STU-xxx studentId.
 */
export const getStudentById = async (idOrStudentId) => {
  const student = await prisma.student.findFirst({
    where: {
      OR: [
        { id: idOrStudentId },
        { studentId: idOrStudentId },
      ],
      deletedAt: null,
    },
    include: {
      admission: {
        include: {
          course: true,
          payments: {
            orderBy: { createdAt: "desc" },
          },
        },
      },
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
  });

  if (!student) {
    throw createHttpError("Student not found", 404);
  }

  return student;
};

/**
 * Update student profile & fee structure details by Super Admin.
 */
export const updateStudentFullService = async (idOrStudentId, updateData) => {
  const student = await getStudentById(idOrStudentId);

  const {
    fullName,
    mobile,
    email,
    address,
    status,
    courseFees,
    discount,
    finalFees,
    remarks,
  } = updateData;

  // 1. Update Student Table
  const updatedStudent = await prisma.student.update({
    where: { id: student.id },
    data: {
      ...(fullName && { fullName }),
      ...(mobile && { mobile }),
      ...(email !== undefined && { email }),
      ...(address !== undefined && { address }),
      ...(status && { status }),
    },
  });

  // 2. Update Admission & Fee structure if admission exists
  if (student.admissionId) {
    const currentAdm = student.admission || (await prisma.admission.findUnique({ where: { id: student.admissionId } }));
    
    const newCourseFees = courseFees !== undefined ? Number(courseFees) : Number(currentAdm.courseFees);
    const newDiscount = discount !== undefined ? Number(discount) : Number(currentAdm.discount);
    const calculatedFinalFees = finalFees !== undefined ? Number(finalFees) : Math.max(0, newCourseFees - newDiscount);
    const paidAmount = Number(currentAdm.paidAmount || 0);
    const newPendingAmount = Math.max(0, calculatedFinalFees - paidAmount);

    let admStatus = currentAdm.status;
    if (status === "COMPLETED") admStatus = "COMPLETED";
    if (status === "DROPPED" || status === "CANCELLED") admStatus = "CANCELLED";
    if (status === "ACTIVE") admStatus = "ACTIVE";

    await prisma.admission.update({
      where: { id: student.admissionId },
      data: {
        courseFees: newCourseFees,
        discount: newDiscount,
        finalFees: calculatedFinalFees,
        pendingAmount: newPendingAmount,
        status: admStatus,
        ...(remarks !== undefined && { remarks: String(remarks) }),
      },
    });
  }

  return getStudentById(student.id);
};
