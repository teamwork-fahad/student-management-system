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

export const getAllCourses = async () => {
  const courses = await prisma.course.findMany({
    where: {
      isActive: true,
    },
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
    orderBy: {
      createdAt: "desc",
    },
  });

  return courses.map((c) => {
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
  await findActiveCourseById(id);

  return prisma.course.update({
    where: {
      id,
    },
    data: {
      isActive: false,
    },
  });
};
