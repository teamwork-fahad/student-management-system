import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/role.middleware.js";
import {
  collectFeeController,
  getFeeHistoryController,
  getStudentFeeSummaryController,
  updateFeePaymentController,
  generateFeeReminderWhatsAppController,
} from "./fee.controller.js";

const router = Router();

// POST /api/v1/fees & /api/v1/fees/collect - Collect fee payment (SUPER_ADMIN, FACULTY)
router.post(
  "/",
  authenticate,
  authorize("SUPER_ADMIN", "FACULTY"),
  collectFeeController
);

router.post(
  "/collect",
  authenticate,
  authorize("SUPER_ADMIN", "FACULTY"),
  collectFeeController
);

// PUT /api/v1/fees/:id - Edit fee payment receipt details (SUPER_ADMIN)
router.put(
  "/:id",
  authenticate,
  authorize("SUPER_ADMIN"),
  updateFeePaymentController
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

// GET /api/v1/fees/student/:studentId/whatsapp-reminder - Generate WhatsApp Fee Reminder (SUPER_ADMIN, FACULTY)
router.get(
  "/student/:studentId/whatsapp-reminder",
  authenticate,
  authorize("SUPER_ADMIN", "FACULTY"),
  generateFeeReminderWhatsAppController
);

export default router;
