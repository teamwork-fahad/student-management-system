import { asyncHandler } from "../../utils/asyncHandler.js";
import { successResponse } from "../../utils/response.js";
import {
  markBatchAttendance,
  getAttendanceByDate,
  getAttendanceStats,
  getStudentAttendanceHistory,
  getAttendanceWhatsAppReport,
} from "./attendance.service.js";

export const markAttendanceController = asyncHandler(async (req, res) => {
  const { date, records } = req.body;
  const markedBy = req.user?.name || "SUPER_ADMIN";

  const result = await markBatchAttendance({ date, records, markedBy });

  return successResponse(res, "Attendance marked successfully", result, 200);
});

export const getAttendanceByDateController = asyncHandler(async (req, res) => {
  const { date, courseId } = req.query;
  const students = await getAttendanceByDate(date, courseId);

  return successResponse(res, "Attendance fetched successfully", students, 200);
});

export const getAttendanceStatsController = asyncHandler(async (req, res) => {
  const stats = await getAttendanceStats();

  return successResponse(res, "Attendance statistics fetched successfully", stats, 200);
});

export const getStudentAttendanceHistoryController = asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  const data = await getStudentAttendanceHistory(studentId);

  return successResponse(res, "Student attendance history fetched successfully", data, 200);
});

export const getAttendanceWhatsAppReportController = asyncHandler(async (req, res) => {
  const { date } = req.query;
  const data = await getAttendanceWhatsAppReport(date);

  return successResponse(res, "WhatsApp attendance report generated successfully", data, 200);
});
