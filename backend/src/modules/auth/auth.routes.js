import { Router } from "express";
import {
  login,
  registerStudent,
  forgotPassword,
  resetPassword,
  getStudentProfile,
  getMe,
  adminDashboard,
} from "./auth.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/role.middleware.js";

const router = Router();

router.post("/login", login);
router.post("/register-student", registerStudent);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

// Protected Routes
router.get("/me", authenticate, getMe);
router.get("/student-profile", authenticate, getStudentProfile);

router.get(
  "/admin",
  authenticate,
  authorize("SUPER_ADMIN"),
  adminDashboard
);

export default router;
