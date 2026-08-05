import { Router } from "express";
import authRoutes from "../modules/auth/auth.routes.js";
import courseRoutes from "../modules/course/course.routes.js";
import inquiryRoutes from "../modules/inquiry/inquiry.routes.js";
import admissionRoutes from "../modules/admission/admission.routes.js";

const router = Router();

router.use("/v1/auth", authRoutes);
router.use("/v1/courses", courseRoutes);
router.use("/v1/inquiries", inquiryRoutes);
router.use("/v1/admissions", admissionRoutes);

export default router;
