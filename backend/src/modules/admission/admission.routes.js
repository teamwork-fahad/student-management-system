import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/role.middleware.js";
import {
  createAdmissionController,
  getAdmissionByIdController,
  getAdmissionsController,
  updateAdmissionController,
} from "./admission.controller.js";

const router = Router();

// POST /api/v1/admissions - Create Admission (SUPER_ADMIN, FACULTY)
router.post(
  "/",
  authenticate,
  authorize("SUPER_ADMIN", "FACULTY"),
  createAdmissionController
);

// GET /api/v1/admissions - Get All Admissions (SUPER_ADMIN, FACULTY)
router.get(
  "/",
  authenticate,
  authorize("SUPER_ADMIN", "FACULTY"),
  getAdmissionsController
);

// GET /api/v1/admissions/:id - Get Admission By ID (SUPER_ADMIN, FACULTY)
router.get(
  "/:id",
  authenticate,
  authorize("SUPER_ADMIN", "FACULTY"),
  getAdmissionByIdController
);

// PUT /api/v1/admissions/:id - Update Admission (SUPER_ADMIN)
router.put(
  "/:id",
  authenticate,
  authorize("SUPER_ADMIN"),
  updateAdmissionController
);

export default router;
