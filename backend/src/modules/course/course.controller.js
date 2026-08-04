import {
  createCourse,
  deleteCourse,
  getAllCourses,
  getCourseById,
  updateCourse,
} from "./course.service.js";
import {
  createCourseSchema,
  updateCourseSchema,
} from "./course.validation.js";

const sendErrorResponse = (res, error) => {
  return res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || "Internal server error",
  });
};

export const createCourseController = async (req, res) => {
  try {
    const validatedData = createCourseSchema.parse(req.body);
    const course = await createCourse(validatedData);

    return res.status(201).json({
      success: true,
      message: "Course created successfully",
      data: course,
    });
  } catch (error) {
    if (error.name === "ZodError") {
      return res.status(400).json({
        success: false,
        message: error.issues[0]?.message || "Validation failed",
      });
    }

    return sendErrorResponse(res, error);
  }
};

export const getAllCoursesController = async (req, res) => {
  try {
    const courses = await getAllCourses();

    return res.status(200).json({
      success: true,
      message: "Courses fetched successfully",
      data: courses,
    });
  } catch (error) {
    return sendErrorResponse(res, error);
  }
};

export const getCourseByIdController = async (req, res) => {
  try {
    const course = await getCourseById(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Course fetched successfully",
      data: course,
    });
  } catch (error) {
    return sendErrorResponse(res, error);
  }
};

export const updateCourseController = async (req, res) => {
  try {
    const validatedData = updateCourseSchema.parse(req.body);
    const course = await updateCourse(req.params.id, validatedData);

    return res.status(200).json({
      success: true,
      message: "Course updated successfully",
      data: course,
    });
  } catch (error) {
    if (error.name === "ZodError") {
      return res.status(400).json({
        success: false,
        message: error.issues[0]?.message || "Validation failed",
      });
    }

    return sendErrorResponse(res, error);
  }
};

export const deleteCourseController = async (req, res) => {
  try {
    const course = await deleteCourse(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Course deleted successfully",
      data: course,
    });
  } catch (error) {
    return sendErrorResponse(res, error);
  }
};
