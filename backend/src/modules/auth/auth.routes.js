import { Router } from "express";
import { login, getMe } from "./auth.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";

const router = Router();

router.post("/login", login);

// Protected Route
router.get("/me", authenticate, getMe);

export default router;