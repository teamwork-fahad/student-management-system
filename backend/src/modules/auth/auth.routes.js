import { Router } from "express";
import { login, getMe,adminDashboard  } from "./auth.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/role.middleware.js";

const router = Router();

router.post("/login", login);

// Protected Route
router.get("/me", authenticate, getMe);

router.get(
  "/admin",
  authenticate,
  authorize("SUPER_ADMIN"),
  adminDashboard
);

export default router;