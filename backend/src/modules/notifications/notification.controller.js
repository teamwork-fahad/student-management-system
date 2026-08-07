import { asyncHandler } from "../../utils/asyncHandler.js";
import { successResponse } from "../../utils/response.js";
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "./notification.service.js";

export const handleGetNotifications = asyncHandler(async (req, res) => {
  const result = await getNotifications(req.user?.id);
  return successResponse(res, result, "Notifications retrieved successfully");
});

export const handleMarkAsRead = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await markNotificationAsRead(id);
  return successResponse(res, result, "Notification marked as read");
});

export const handleMarkAllAsRead = asyncHandler(async (req, res) => {
  const result = await markAllNotificationsAsRead(req.user?.id);
  return successResponse(res, result, "All notifications marked as read");
});
