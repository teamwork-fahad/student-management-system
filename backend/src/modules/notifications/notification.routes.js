import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import {
  handleGetNotifications,
  handleMarkAsRead,
  handleMarkAllAsRead,
  handleGetUpcomingBirthdays,
} from "./notification.controller.js";

const router = Router();

router.get("/", authenticate, handleGetNotifications);
router.get("/birthdays/upcoming", authenticate, handleGetUpcomingBirthdays);
router.patch("/read-all", authenticate, handleMarkAllAsRead);
router.patch("/:id/read", authenticate, handleMarkAsRead);

export default router;

