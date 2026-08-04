import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/role.middleware.js";
import {
  createCourseController,
  deleteCourseController,
  getAllCoursesController,
  getCourseByIdController,
  updateCourseController,
} from "./course.controller.js";

const router = Router();

router.post(
  "/",
  authenticate,
  authorize("SUPER_ADMIN"),
  createCourseController
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
