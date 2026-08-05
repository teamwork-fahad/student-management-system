import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/role.middleware.js";
import {
  createAdmissionController,
  getAdmissionByIdController,
  getAdmissionsController,
  getAdmissionStatisticsController,
  searchAdmissionsController,
  updateAdmissionController,
} from "./admission.controller.js";

const router = Router();

// POST /api/v1/admissions - Take/Create Admission (SUPER_ADMIN, FACULTY)
router.post(
  "/",
  authenticate,
  authorize("SUPER_ADMIN", "FACULTY"),
  createAdmissionController
);

// GET /api/v1/admissions - List Admissions with pagination, filters & sorting (SUPER_ADMIN, FACULTY)
router.get(
  "/",
  authenticate,
  authorize("SUPER_ADMIN", "FACULTY"),
  getAdmissionsController
);

// GET /api/v1/admissions/statistics - Aggregate Admission Statistics (SUPER_ADMIN, FACULTY)
router.get(
  "/statistics",
  authenticate,
  authorize("SUPER_ADMIN", "FACULTY"),
  getAdmissionStatisticsController
);

// GET /api/v1/admissions/search - Dedicated Admission Search (SUPER_ADMIN, FACULTY)
router.get(
  "/search",
  authenticate,
  authorize("SUPER_ADMIN", "FACULTY"),
  searchAdmissionsController
);

// GET /api/v1/admissions/:id - Get Admission Details by ID (SUPER_ADMIN, FACULTY)
router.get(
  "/:id",
  authenticate,
  authorize("SUPER_ADMIN", "FACULTY"),
  getAdmissionByIdController
);

// PUT /api/v1/admissions/:id - Update Admission details (SUPER_ADMIN)
router.put(
  "/:id",
  authenticate,
  authorize("SUPER_ADMIN"),
  updateAdmissionController
);

export default router;
