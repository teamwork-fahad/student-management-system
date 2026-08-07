import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/role.middleware.js";
import {
  getAllStudentsController,
  getStudentByIdController,
  updateStudentController,
  bulkUpdateStudentStatusController,
  addCourseToStudentController,
  deleteStudentController,
} from "./student.controller.js";

const router = Router();

// GET /api/v1/students - List Students (SUPER_ADMIN, FACULTY)
router.get(
  "/",
  authenticate,
  authorize("SUPER_ADMIN", "FACULTY"),
  getAllStudentsController
);

// PATCH /api/v1/students/bulk-status - Bulk Update Students Status (SUPER_ADMIN, FACULTY)
router.patch(
  "/bulk-status",
  authenticate,
  authorize("SUPER_ADMIN", "FACULTY"),
  bulkUpdateStudentStatusController
);

// POST /api/v1/students/:id/courses - Enroll existing student into a new course (SUPER_ADMIN, FACULTY)
router.post(
  "/:id/courses",
  authenticate,
  authorize("SUPER_ADMIN", "FACULTY"),
  addCourseToStudentController
);

// GET /api/v1/students/:id - Get Student Profile (SUPER_ADMIN, FACULTY)
router.get(
  "/:id",
  authenticate,
  authorize("SUPER_ADMIN", "FACULTY"),
  getStudentByIdController
);

// PUT & PATCH /api/v1/students/:id - Update Student Profile, Status & Fees (SUPER_ADMIN, FACULTY)
router.put(
  "/:id",
  authenticate,
  authorize("SUPER_ADMIN", "FACULTY"),
  updateStudentController
);

router.patch(
  "/:id",
  authenticate,
  authorize("SUPER_ADMIN", "FACULTY"),
  updateStudentController
);

// DELETE /api/v1/students/:id - Delete Student (SUPER_ADMIN)
router.delete(
  "/:id",
  authenticate,
  authorize("SUPER_ADMIN"),
  deleteStudentController
);

export default router;
