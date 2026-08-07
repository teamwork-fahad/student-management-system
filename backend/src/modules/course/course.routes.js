import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/role.middleware.js";
import {
  createCourseController,
  deleteCourseController,
  getAllCoursesController,
  getCourseByIdController,
  updateCourseController,
  getCourseStudentsController,
  bulkDeleteCoursesController,
  bulkUpdateCourseCategoryController,
} from "./course.controller.js";

const router = Router();

// Public course listing endpoint (no authentication required)
router.get("/public", getAllCoursesController);

router.post(
  "/",
  authenticate,
  authorize("SUPER_ADMIN"),
  createCourseController
);

router.post(
  "/bulk-delete",
  authenticate,
  authorize("SUPER_ADMIN"),
  bulkDeleteCoursesController
);

router.post(
  "/bulk-category",
  authenticate,
  authorize("SUPER_ADMIN"),
  bulkUpdateCourseCategoryController
);

router.get(
  "/",
  authenticate,
  authorize("SUPER_ADMIN", "FACULTY"),
  getAllCoursesController
);

router.get(
  "/:id",
  authenticate,
  authorize("SUPER_ADMIN", "FACULTY"),
  getCourseByIdController
);

router.get(
  "/:id/students",
  authenticate,
  authorize("SUPER_ADMIN", "FACULTY"),
  getCourseStudentsController
);

router.put(
  "/:id",
  authenticate,
  authorize("SUPER_ADMIN"),
  updateCourseController
);

router.delete(
  "/:id",
  authenticate,
  authorize("SUPER_ADMIN"),
  deleteCourseController
);

export default router;
