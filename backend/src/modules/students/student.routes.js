import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/role.middleware.js";
import {
  getAllStudentsController,
  getStudentByIdController,
  updateStudentProfileController,
} from "./student.controller.js";

const router = Router();

// GET /api/v1/students - List Students (SUPER_ADMIN, FACULTY)
router.get(
  "/",
  authenticate,
  authorize("SUPER_ADMIN", "FACULTY"),
  getAllStudentsController
);

// GET /api/v1/students/:id - Get Student Profile (SUPER_ADMIN, FACULTY)
router.get(
  "/:id",
  authenticate,
  authorize("SUPER_ADMIN", "FACULTY"),
  getStudentByIdController
);

// PUT /api/v1/students/:id - Update Student Profile (SUPER_ADMIN, FACULTY)
router.put(
  "/:id",
  authenticate,
  authorize("SUPER_ADMIN", "FACULTY"),
  updateStudentProfileController
);

export default router;
