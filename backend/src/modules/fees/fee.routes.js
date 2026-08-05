import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/role.middleware.js";
import {
  collectFeeController,
  getFeeHistoryController,
  getStudentFeeSummaryController,
} from "./fee.controller.js";

const router = Router();

// POST /api/v1/fees - Collect fee payment (SUPER_ADMIN, FACULTY)
router.post(
  "/",
  authenticate,
  authorize("SUPER_ADMIN", "FACULTY"),
  collectFeeController
);

// GET /api/v1/fees - Get fee history list with filters (SUPER_ADMIN, FACULTY)
router.get(
  "/",
  authenticate,
  authorize("SUPER_ADMIN", "FACULTY"),
  getFeeHistoryController
);

// GET /api/v1/fees/student/:studentId - Get student fee summary & history (SUPER_ADMIN, FACULTY)
router.get(
  "/student/:studentId",
  authenticate,
  authorize("SUPER_ADMIN", "FACULTY"),
  getStudentFeeSummaryController
);

export default router;
