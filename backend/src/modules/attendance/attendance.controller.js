import { z } from "zod";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { successResponse } from "../../utils/response.js";
import {
  markBatchAttendance,
  getAttendanceByDate,
  getAttendanceStats,
  getStudentAttendanceHistory,
  getAttendanceWhatsAppReport,
  getPublicAttendanceReport,
} from "./attendance.service.js";

const markAttendanceSchema = z.object({
  date: z.string().trim().min(1, "Date is required"),
  records: z.array(
    z.object({
      studentId: z.string().trim().min(1, "Student ID is required"),
      status: z.enum(
        [
          "PRESENT",
          "ABSENT",
          "LATE",
          "EARLY_LEAVE",
          "NO_CLASS",
          "HOLIDAY",
          "EXEMPTED",
          "UNMARKED",
        ],
        { errorMap: () => ({ message: "Invalid attendance status" }) }
      ),
      remarks: z.string().trim().optional(),
    })
  ).min(1, "At least one attendance record is required"),
});

export const markAttendanceController = asyncHandler(async (req, res) => {
  const validated = markAttendanceSchema.parse(req.body);
  const markedBy = req.user?.name || "SUPER_ADMIN";

  const result = await markBatchAttendance({
    date: validated.date,
    records: validated.records,
    markedBy,
  });

  return successResponse(res, "Attendance marked successfully", result, 200);
});

export const getAttendanceByDateController = asyncHandler(async (req, res) => {
  const { date, courseId } = req.query;
  const students = await getAttendanceByDate(date, courseId);

  return successResponse(res, "Attendance fetched successfully", students, 200);
});

export const getAttendanceStatsController = asyncHandler(async (req, res) => {
  const { date } = req.query;
  const stats = await getAttendanceStats(date);

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

export const getPublicAttendanceReportController = asyncHandler(async (req, res) => {
  const { range } = req.query;
  const report = await getPublicAttendanceReport({ range });

  return successResponse(res, "Public attendance report fetched successfully", report, 200);
});

