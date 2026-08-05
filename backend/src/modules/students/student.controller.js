import { asyncHandler } from "../../utils/asyncHandler.js";
import { successResponse } from "../../utils/response.js";
import {
  getAllStudents,
  getStudentById,
  updateStudentProfile,
} from "./student.service.js";

export const getAllStudentsController = asyncHandler(async (req, res) => {
  const result = await getAllStudents(req.query);

  return successResponse(
    res,
    "Students fetched successfully",
    result,
    200
  );
});

export const getStudentByIdController = asyncHandler(async (req, res) => {
  const student = await getStudentById(req.params.id);

  return successResponse(
    res,
    "Student details fetched successfully",
    student,
    200
  );
});

export const updateStudentProfileController = asyncHandler(async (req, res) => {
  const updatedStudent = await updateStudentProfile(req.params.id, req.body);

  return successResponse(
    res,
    "Student profile updated successfully",
    updatedStudent,
    200
  );
});
