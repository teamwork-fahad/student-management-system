import {
  createCourse,
  deleteCourse,
  getAllCourses,
  getCourseById,
  updateCourse,
  getCourseStudents,
  bulkDeleteCourses,
  bulkUpdateCourseCategory,
} from "./course.service.js";
import {
  createCourseSchema,
  updateCourseSchema,
} from "./course.validation.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { successResponse } from "../../utils/response.js";

export const createCourseController = asyncHandler(async (req, res) => {
  const validatedData = createCourseSchema.parse(req.body);
  const course = await createCourse(validatedData);

  return successResponse(res, "Course created successfully", course, 201);
});

export const getAllCoursesController = asyncHandler(async (req, res) => {
  const courses = await getAllCourses(req.query);

  return successResponse(res, "Courses fetched successfully", courses, 200);
});

export const getCourseByIdController = asyncHandler(async (req, res) => {
  const course = await getCourseById(req.params.id);

  return successResponse(res, "Course fetched successfully", course, 200);
});

export const updateCourseController = asyncHandler(async (req, res) => {
  const validatedData = updateCourseSchema.parse(req.body);
  const course = await updateCourse(req.params.id, validatedData);

  return successResponse(res, "Course updated successfully", course, 200);
});

export const deleteCourseController = asyncHandler(async (req, res) => {
  const course = await deleteCourse(req.params.id);

  return successResponse(res, "Course deleted successfully", course, 200);
});

export const getCourseStudentsController = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const students = await getCourseStudents(req.params.id, status);

  return successResponse(res, "Course students fetched successfully", students, 200);
});

export const bulkDeleteCoursesController = asyncHandler(async (req, res) => {
  const { courseIds } = req.body;
  const result = await bulkDeleteCourses(courseIds);

  return successResponse(res, "Bulk courses deleted successfully", result, 200);
});

export const bulkUpdateCourseCategoryController = asyncHandler(async (req, res) => {
  const { courseIds, category } = req.body;
  const result = await bulkUpdateCourseCategory(courseIds, category);

  return successResponse(res, "Bulk course category updated successfully", result, 200);
});
