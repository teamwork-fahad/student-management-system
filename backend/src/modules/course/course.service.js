import prisma from "../../config/prisma.js";
import { createHttpError } from "../../utils/httpError.js";

const findActiveCourseById = async (id) => {
  const course = await prisma.course.findFirst({
    where: {
      id,
      isActive: true,
    },
  });

  if (!course) {
    throw createHttpError("Course not found", 404);
  }

  return course;
};

const ensureUniqueCode = async (code, courseId = null) => {
  if (!code) {
    return;
  }

  const existingCourse = await prisma.course.findUnique({
    where: {
      code,
    },
  });

  if (existingCourse && existingCourse.id !== courseId) {
    throw createHttpError("Course code already exists", 409);
  }
};

export const createCourse = async (courseData) => {
  await ensureUniqueCode(courseData.code);

  return prisma.course.create({
    data: courseData,
  });
};

export const getAllCourses = async (query = {}) => {
  const { sortBy = "name_asc", search = "", category = "" } = query;

  const where = {
    isActive: true,
  };

  if (category) {
    where.category = category;
  }

  if (search) {
    const trimmed = String(search).trim();
    where.OR = [
      { name: { contains: trimmed, mode: "insensitive" } },
      { code: { contains: trimmed, mode: "insensitive" } },
      { category: { contains: trimmed, mode: "insensitive" } },
      { description: { contains: trimmed, mode: "insensitive" } },
    ];
  }

  const courses = await prisma.course.findMany({
    where,
    include: {
      admissions: {
        where: {
          deletedAt: null,
        },
        select: {
          id: true,
          status: true,
        },
      },
    },
  });

  const formatted = courses.map((c) => {
    const admissions = c.admissions || [];
    const activeStudents = admissions.filter((a) => a.status === "ACTIVE").length;
    const completedStudents = admissions.filter((a) => a.status === "COMPLETED").length;
    const cancelledStudents = admissions.filter((a) => a.status === "CANCELLED").length;
    const totalStudents = admissions.length;

    const { admissions: _, ...courseData } = c;
    return {
      ...courseData,
      stats: {
        activeStudents,
        completedStudents,
        cancelledStudents,
        totalStudents,
      },
    };
  });

  // Apply Sorting (Name A to Z by default)
  formatted.sort((a, b) => {
    if (sortBy === "name_asc") {
      return (a.name || "").localeCompare(b.name || "");
    }
    if (sortBy === "name_desc") {
      return (b.name || "").localeCompare(a.name || "");
    }
    if (sortBy === "students_desc") {
      return (b.stats?.totalStudents || 0) - (a.stats?.totalStudents || 0);
    }
    if (sortBy === "students_asc") {
      return (a.stats?.totalStudents || 0) - (b.stats?.totalStudents || 0);
    }
    if (sortBy === "fee_desc") {
      return Number(b.fees || 0) - Number(a.fees || 0);
    }
    if (sortBy === "fee_asc") {
      return Number(a.fees || 0) - Number(b.fees || 0);
    }
    if (sortBy === "newest") {
      return new Date(b.createdAt) - new Date(a.createdAt);
    }
    if (sortBy === "oldest") {
      return new Date(a.createdAt) - new Date(b.createdAt);
    }
    if (sortBy === "duration_desc") {
      return Number(b.duration || 0) - Number(a.duration || 0);
    }
    return (a.name || "").localeCompare(b.name || "");
  });

  return formatted;
};

export const getCourseById = async (id) => {
  return findActiveCourseById(id);
};

export const updateCourse = async (id, courseData) => {
  await findActiveCourseById(id);
  await ensureUniqueCode(courseData.code, id);

  return prisma.course.update({
    where: {
      id,
    },
    data: courseData,
  });
};

export const deleteCourse = async (id) => {
  const course = await findActiveCourseById(id);

  // Check if any active/valid admissions are linked to this course
  const linkedAdmissionsCount = await prisma.admission.count({
    where: {
      courseId: id,
      deletedAt: null,
    },
  });

  if (linkedAdmissionsCount > 0) {
    throw createHttpError(
      `Cannot delete course "${course.name}"! There are ${linkedAdmissionsCount} student(s) currently enrolled under this course. Please transfer or reassign these students to another course before deleting.`,
      400
    );
  }

  return prisma.course.update({
    where: {
      id,
    },
    data: {
      isActive: false,
    },
  });
};

export const getCourseStudents = async (courseId, status) => {
  await findActiveCourseById(courseId);

  const where = {
    courseId,
    deletedAt: null,
  };

  if (status && status !== "ALL") {
    where.status = status;
  }

  const admissions = await prisma.admission.findMany({
    where,
    orderBy: {
      admissionDate: "desc",
    },
    include: {
      student: {
        select: {
          id: true,
          studentId: true,
          fullName: true,
          mobile: true,
          email: true,
          status: true,
          joinedDate: true,
        },
      },
      inquiry: {
        select: {
          fullName: true,
          mobile: true,
          email: true,
        },
      },
    },
  });

  return admissions.map((adm) => ({
    id: adm.student?.id || adm.id,
    admissionId: adm.id,
    admissionNumber: adm.admissionNumber,
    studentId: adm.student?.studentId || adm.admissionNumber,
    fullName: adm.student?.fullName || adm.inquiry?.fullName || "N/A",
    mobile: adm.student?.mobile || adm.inquiry?.mobile || "N/A",
    email: adm.student?.email || adm.inquiry?.email || "N/A",
    status: adm.status,
    studentStatus: adm.student?.status || "ACTIVE",
    admissionDate: adm.admissionDate,
    finalFees: Number(adm.finalFees || 0),
    paidAmount: Number(adm.paidAmount || 0),
    pendingAmount: Number(adm.pendingAmount || 0),
  }));
};

/**
 * Bulk Delete Courses (only if 0 enrolled students)
 */
export const bulkDeleteCourses = async (courseIds = []) => {
  if (!Array.isArray(courseIds) || courseIds.length === 0) {
    throw createHttpError("No courses selected for deletion", 400);
  }

  // Check if any selected courses have linked active admissions
  const coursesWithStudents = await prisma.course.findMany({
    where: {
      id: { in: courseIds },
      admissions: {
        some: {
          deletedAt: null,
        },
      },
    },
    select: {
      id: true,
      name: true,
    },
  });

  if (coursesWithStudents.length > 0) {
    const blockedNames = coursesWithStudents.map((c) => c.name).join(", ");
    throw createHttpError(
      `Cannot delete course(s): [${blockedNames}]! Students are currently enrolled under these courses. Please transfer or reassign students first.`,
      400
    );
  }

  // Deactivate selected courses
  await prisma.course.updateMany({
    where: {
      id: { in: courseIds },
    },
    data: {
      isActive: false,
    },
  });

  return { deletedCount: courseIds.length };
};

/**
 * Bulk Update Course Category / Department
 */
export const bulkUpdateCourseCategory = async (courseIds = [], category) => {
  if (!Array.isArray(courseIds) || courseIds.length === 0) {
    throw createHttpError("No courses selected for category update", 400);
  }

  if (!category) {
    throw createHttpError("Please specify a valid department category", 400);
  }

  await prisma.course.updateMany({
    where: {
      id: { in: courseIds },
    },
    data: {
      category,
    },
  });

  return { updatedCount: courseIds.length, category };
};
