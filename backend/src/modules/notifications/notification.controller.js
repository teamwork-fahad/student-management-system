import { asyncHandler } from "../../utils/asyncHandler.js";
import { successResponse } from "../../utils/response.js";
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getUpcomingBirthdays,
} from "./notification.service.js";

export const handleGetNotifications = asyncHandler(async (req, res) => {
  const result = await getNotifications(req.user?.id);
  return successResponse(res, "Notifications retrieved successfully", result);
});

export const handleGetUpcomingBirthdays = asyncHandler(async (req, res) => {
  const days = req.query.days ? parseInt(req.query.days, 10) : 30;
  const result = await getUpcomingBirthdays(days);
  return successResponse(res, "Upcoming birthdays retrieved successfully", result);
});

export const handleMarkAsRead = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await markNotificationAsRead(id);
  return successResponse(res, "Notification marked as read", result);
});

export const handleMarkAllAsRead = asyncHandler(async (req, res) => {
  const result = await markAllNotificationsAsRead(req.user?.id);
  return successResponse(res, "All notifications marked as read", result);
});

