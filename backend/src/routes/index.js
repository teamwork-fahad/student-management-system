import { Router } from "express";
import authRoutes from "../modules/auth/auth.routes.js";
import courseRoutes from "../modules/course/course.routes.js";
import inquiryRoutes from "../modules/inquiry/inquiry.routes.js";
import admissionRoutes from "../modules/admission/admission.routes.js";
import feeRoutes from "../modules/fees/fee.routes.js";
import studentRoutes from "../modules/students/student.routes.js";
import attendanceRoutes from "../modules/attendance/attendance.routes.js";
import expenseRoutes from "../modules/expense/expense.routes.js";
import notificationRoutes from "../modules/notifications/notification.routes.js";
import departmentRoutes from "../modules/department/department.routes.js";
import syncRoutes from "../modules/sync/sync.routes.js";

const router = Router();

router.use("/v1/auth", authRoutes);
router.use("/v1/courses", courseRoutes);
router.use("/v1/inquiries", inquiryRoutes);
router.use("/v1/admissions", admissionRoutes);
router.use("/v1/fees", feeRoutes);
router.use("/v1/students", studentRoutes);
router.use("/v1/attendance", attendanceRoutes);
router.use("/v1/expenses", expenseRoutes);
router.use("/v1/notifications", notificationRoutes);
router.use("/v1/departments", departmentRoutes);
router.use("/v1/sync", syncRoutes);
router.use("/sync", syncRoutes);
router.use("/departments", departmentRoutes);
router.use("/courses", courseRoutes);

export default router;

