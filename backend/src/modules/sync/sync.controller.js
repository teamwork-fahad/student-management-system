import prisma from "../../config/prisma.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { successResponse } from "../../utils/response.js";
import { getAdmissionStatistics } from "../admission/admission.service.js";

export const getSyncExportDataController = asyncHandler(async (req, res) => {
  const apiKey = req.headers["x-api-key"] || req.query.apiKey;
  const validKey = process.env.SYNC_API_KEY || "appxwind-erp-secret-key";

  // Allow either valid API key or standard authorization
  if (apiKey !== validKey && !req.headers.authorization) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized access. Provide valid API Key or Bearer Token.",
    });
  }

  // 1. Fetch Statistics
  const stats = await getAdmissionStatistics();

  // 2. Fetch All Students
  const studentsRaw = await prisma.student.findMany({
    where: { deletedAt: null },
    include: {
      admission: {
        include: { course: true },
      },
    },
    orderBy: { fullName: "asc" },
  });

  const students = studentsRaw.map((s) => ({
    studentId: s.studentId,
    fullName: s.fullName,
    mobile: s.mobile,
    email: s.email || "N/A",
    gender: s.gender,
    status: s.status,
    joinedDate: s.joinedDate,
    courseName: s.admission?.courseNameSnapshot || s.admission?.course?.name || "N/A",
    totalFees: Number(s.admission?.finalFees || s.admission?.courseFees || 0),
    paidAmount: Number(s.admission?.paidAmount || 0),
    pendingAmount: Number(s.admission?.pendingAmount || 0),
  }));

  // 3. Fetch All Admissions Log
  const admissionsRaw = await prisma.admission.findMany({
    where: { deletedAt: null },
    include: { student: true, course: true },
    orderBy: { createdAt: "desc" },
  });

  const admissions = admissionsRaw.map((a) => ({
    admissionNumber: a.admissionNumber,
    studentName: a.student?.fullName || a.inquiry?.fullName || a.guardianName || "N/A",
    mobile: a.student?.mobile || a.inquiry?.mobile || a.guardianMobile || "N/A",
    courseName: a.courseNameSnapshot || a.course?.name || "N/A",
    courseFees: Number(a.courseFees || 0),
    discount: Number(a.discount || 0),
    finalFees: Number(a.finalFees || 0),
    paidAmount: Number(a.paidAmount || 0),
    pendingAmount: Number(a.pendingAmount || 0),
    status: a.status,
    admissionDate: a.admissionDate,
  }));

  // 4. Fetch Courses Summary
  const coursesRaw = await prisma.course.findMany({
    include: {
      admissions: {
        where: { deletedAt: null },
      },
    },
  });

  const courses = coursesRaw.map((c) => ({
    code: c.code,
    name: c.name,
    category: c.category || "IT Course",
    duration: `${c.duration} ${c.durationType}`,
    fees: Number(c.fees),
    totalStudents: c.admissions.length,
    activeStudents: c.admissions.filter((a) => a.status === "ACTIVE").length,
    completedStudents: c.admissions.filter((a) => a.status === "COMPLETED").length,
  }));

  return successResponse(
    res,
    "Sync data exported successfully",
    {
      stats,
      students,
      admissions,
      courses,
      timestamp: new Date().toISOString(),
    },
    200
  );
});

export const importInternshipStudentsController = asyncHandler(async (req, res) => {
  const { importInternshipStudents } = await import("../../seed/importInternshipStudents.js");
  const stats = await importInternshipStudents();
  return successResponse(res, "Internship 2025 students imported and mapped successfully", stats, 200);
});

export const mergeInternshipCoursesController = asyncHandler(async (req, res) => {
  const { mergeCourses } = await import("../../scripts/mergeInternshipCourses.js");
  const stats = await mergeCourses();
  return successResponse(res, "Internship courses merged successfully", stats, 200);
});

export const fixAdmissionLinksController = asyncHandler(async (req, res) => {
  const { fixAdmissions } = await import("../../scripts/fixAdmissionStudentLinks.js");
  const result = await fixAdmissions();
  return successResponse(res, "Admission student links fixed successfully", result, 200);
});



