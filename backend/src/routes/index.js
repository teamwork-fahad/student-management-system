import { Router } from "express";
import authRoutes from "../modules/auth/auth.routes.js";
import courseRoutes from "../modules/course/course.routes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/v1/courses", courseRoutes);

export default router;
