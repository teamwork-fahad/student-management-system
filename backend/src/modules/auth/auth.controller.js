import {
  loginService,
  registerStudentService,
  getStudentProfileService,
} from "./auth.service.js";
import { loginSchema, registerStudentSchema } from "./auth.validation.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { successResponse } from "../../utils/response.js";

export const login = asyncHandler(async (req, res) => {
  const validated = loginSchema.parse(req.body);
  const identifier = validated.identifier || validated.email;
  const result = await loginService(identifier, validated.password);

  return successResponse(
    res,
    "Login successful",
    {
      user: result.user,
      token: result.token,
    },
    200
  );
});

export const registerStudent = asyncHandler(async (req, res) => {
  const validated = registerStudentSchema.parse(req.body);
  const result = await registerStudentService(validated);

  return successResponse(
    res,
    result.message || "Student registered successfully",
    {
      user: result.user,
      token: result.token,
      student: result.student,
    },
    201
  );
});

export const getStudentProfile = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const student = await getStudentProfileService(userId);

  return successResponse(res, "Student profile fetched successfully", student, 200);
});

export const getMe = asyncHandler(async (req, res) => {
  return successResponse(res, "User fetched successfully", req.user, 200);
});

export const adminDashboard = asyncHandler(async (req, res) => {
  return successResponse(res, "Welcome Super Admin", req.user, 200);
});
