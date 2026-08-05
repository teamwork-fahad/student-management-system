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
      include: {
        admission: {
          include: {
            course: true,
          },
        },
        documents: true,
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            isActive: true,
          },
        },
      },
      orderBy,
      skip,
      take: limitNum,
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
      hasNextPage: pageNum < totalPages,
      hasPreviousPage: pageNum > 1,
    },
  };
};

/**
 * Get single student details by database ID or studentId string.
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
 * Update student profile info.
 */
export const updateStudentProfile = async (idOrStudentId, updateData) => {
  const student = await getStudentById(idOrStudentId);

  return prisma.student.update({
    where: { id: student.id },
    data: updateData,
    include: {
      admission: {
        include: {
          course: true,
        },
      },
      documents: true,
    },
  });
};
