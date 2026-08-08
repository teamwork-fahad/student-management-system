import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/role.middleware.js";
import {
  markAttendanceController,
  getAttendanceByDateController,
  getAttendanceStatsController,
  getStudentAttendanceHistoryController,
  getAttendanceWhatsAppReportController,
} from "./attendance.controller.js";

const router = Router();

router.get(
  "/stats",
  authenticate,
  authorize("SUPER_ADMIN", "FACULTY"),
  getAttendanceStatsController
);

router.get(
  "/whatsapp-report",
  authenticate,
  authorize("SUPER_ADMIN", "FACULTY"),
  getAttendanceWhatsAppReportController
);

router.get(
  "/student/:studentId",
  authenticate,
  getStudentAttendanceHistoryController
);

router.get(
  "/",
  authenticate,
  authorize("SUPER_ADMIN", "FACULTY"),
  getAttendanceByDateController
);

router.post(
  "/",
  authenticate,
  authorize("SUPER_ADMIN", "FACULTY"),
  markAttendanceController
);

export default router;
