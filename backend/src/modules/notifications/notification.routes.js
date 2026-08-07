import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import {
  handleGetNotifications,
  handleMarkAsRead,
  handleMarkAllAsRead,
} from "./notification.controller.js";

const router = Router();

router.get("/", authenticate, handleGetNotifications);
router.patch("/read-all", authenticate, handleMarkAllAsRead);
router.patch("/:id/read", authenticate, handleMarkAsRead);

export default router;
