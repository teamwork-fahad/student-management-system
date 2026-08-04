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
  return prisma.course.findMany({
    where: {
      isActive: true,
    },
    orderBy: {
      createdAt: "desc",
    },
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
