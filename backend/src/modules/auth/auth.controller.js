import { loginService } from "./auth.service.js";
import { loginSchema } from "./auth.validation.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { successResponse } from "../../utils/response.js";

export const login = asyncHandler(async (req, res) => {
  const { email, password } = loginSchema.parse(req.body);
  const result = await loginService(email, password);

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

export const getMe = asyncHandler(async (req, res) => {
  return successResponse(res, "User fetched successfully", req.user, 200);
});

export const adminDashboard = asyncHandler(async (req, res) => {
  return successResponse(res, "Welcome Super Admin", req.user, 200);
});
