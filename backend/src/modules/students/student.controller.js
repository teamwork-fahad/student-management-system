import { z } from "zod";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { successResponse } from "../../utils/response.js";
import {
  getAllStudents,
  getStudentById,
  updateStudentFullService,
  bulkUpdateStudentStatus,
  addCourseToStudent,
  deleteStudent,
} from "./student.service.js";

const studentStatuses = ["ACTIVE", "ON_HOLD", "COMPLETED", "DROPPED", "TRANSFERRED", "REVISION"];

const updateStudentSchema = z.object({
  fullName: z.string().trim().min(2, "Name must be at least 2 characters").optional(),
  mobile: z.string().trim().regex(/^\+?[0-9]{10,15}$/, "Invalid mobile number format").optional(),
  email: z.string().trim().email("Invalid email format").optional().or(z.literal("")),
  fatherName: z.string().trim().optional(),
  fatherMobile: z.string().trim().optional(),
  status: z.enum(studentStatuses, { errorMap: () => ({ message: "Invalid student status" }) }).optional(),
  admissionId: z.string().trim().optional(),
  courseFees: z.union([z.string(), z.number()]).transform(val => Number(val)).refine(val => val >= 0, "Fees must be non-negative").optional(),
  discount: z.union([z.string(), z.number()]).transform(val => Number(val)).refine(val => val >= 0, "Discount must be non-negative").optional(),
  finalFees: z.union([z.string(), z.number()]).transform(val => Number(val)).refine(val => val >= 0, "Final fees must be non-negative").optional(),
  remarks: z.string().trim().optional(),
});

const bulkUpdateStudentStatusSchema = z.object({
  studentIds: z.array(z.string().trim().min(1, "Invalid student ID")).min(1, "At least one student ID is required"),
  status: z.enum(studentStatuses, { errorMap: () => ({ message: "Invalid student status" }) }),
});

const addCourseToStudentSchema = z.object({
  courseId: z.string().trim().min(1, "Course ID is required"),
  courseFees: z.union([z.string(), z.number()]).transform(val => Number(val)).refine(val => val >= 0, "Course fees must be non-negative"),
  discount: z.union([z.string(), z.number()]).transform(val => Number(val)).refine(val => val >= 0, "Discount must be non-negative").optional(),
  finalFees: z.union([z.string(), z.number()]).transform(val => Number(val)).refine(val => val >= 0, "Final fees must be non-negative"),
  initialPayment: z.union([z.string(), z.number()]).transform(val => Number(val)).refine(val => val >= 0, "Initial payment must be non-negative").optional(),
  paymentMode: z.string().trim().optional(),
  remarks: z.string().trim().optional(),
});

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

export const updateStudentController = asyncHandler(async (req, res) => {
  const validatedData = updateStudentSchema.parse(req.body);
  const updatedStudent = await updateStudentFullService(req.params.id, validatedData);

  return successResponse(
    res,
    "Student details, status, and fee structure updated successfully",
    updatedStudent,
    200
  );
});

export const bulkUpdateStudentStatusController = asyncHandler(async (req, res) => {
  const validatedData = bulkUpdateStudentStatusSchema.parse(req.body);
  const result = await bulkUpdateStudentStatus(validatedData.studentIds, validatedData.status);

  return successResponse(
    res,
    `Successfully updated status to ${validatedData.status} for ${result.updatedCount} student(s)`,
    result,
    200
  );
});

export const addCourseToStudentController = asyncHandler(async (req, res) => {
  const validatedData = addCourseToStudentSchema.parse(req.body);
  const result = await addCourseToStudent(req.params.id, {
    ...validatedData,
    admittedBy: req.user.id,
  });

  return successResponse(
    res,
    "New course added to student profile successfully",
    result,
    201
  );
});

export const deleteStudentController = asyncHandler(async (req, res) => {
  const result = await deleteStudent(req.params.id);

  return successResponse(
    res,
    "Student record deleted successfully",
    result,
    200
  );
});
