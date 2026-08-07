import prisma from "../../config/prisma.js";
import { createHttpError } from "../../utils/httpError.js";

/**
 * Safely parse date string to UTC midnight (00:00:00.000Z) to avoid timezone shifts
 */
const parseDateToUTC = (dateStr) => {
  if (!dateStr) {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
  }
  const parts = String(dateStr).split("T")[0].split("-");
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    return new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
  }
  const d = new Date(dateStr);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
};

/**
 * Mark or update daily attendance for a batch of students.
 */
export const markBatchAttendance = async ({ date, records, markedBy }) => {
  if (!date || !Array.isArray(records) || records.length === 0) {
    throw createHttpError("Date and records array are required", 400);
  }

  const attendanceDate = parseDateToUTC(date);

  // Filter and validate only existing student IDs in DB to prevent foreign key errors
  const validStudents = await prisma.student.findMany({
    where: { id: { in: records.map((r) => r.studentId) } },
    select: { id: true },
  });

  const validStudentIds = new Set(validStudents.map((s) => s.id));
  const validRecords = records.filter((r) => validStudentIds.has(r.studentId));

  if (validRecords.length === 0) {
    throw createHttpError("No valid student records found to mark attendance", 400);
  }

  const results = await prisma.$transaction(
    validRecords.map((r) =>
      prisma.attendance.upsert({
        where: {
          studentId_date: {
            studentId: r.studentId,
            date: attendanceDate,
          },
        },
        update: {
          status: r.status || "PRESENT",
          remarks: r.remarks || null,
          markedBy: markedBy || "SUPER_ADMIN",
        },
        create: {
          studentId: r.studentId,
          date: attendanceDate,
          status: r.status || "PRESENT",
          remarks: r.remarks || null,
          markedBy: markedBy || "SUPER_ADMIN",
        },
      })
    )
  );

  return results;
};

/**
 * Get attendance records for a specific date or date range.
 */
export const getAttendanceByDate = async (dateStr, courseId) => {
  const targetDate = parseDateToUTC(dateStr);

  const where = {
    deletedAt: null,
    status: { in: ["ACTIVE", "REVISION"] },
    admission: {
      status: { in: ["ACTIVE", "REVISION"] },
    },
  };

  if (courseId) {
    where.admission.courseId = courseId;
  }

  const students = await prisma.student.findMany({
    where,
    include: {
      admission: {
        include: { course: true },
      },
      attendances: {
        where: {
          date: targetDate,
        },
      },
    },
    orderBy: { fullName: "asc" },
  });

  return students.map((s) => ({
    studentId: s.id,
    displayId: s.studentId,
    fullName: s.fullName,
    courseName: s.admission?.courseNameSnapshot || s.admission?.course?.name || "N/A",
    studentStatus: s.status,
    attendance: s.attendances[0] || null,
    status: s.attendances[0]?.status || "UNMARKED",
  }));
};

/**
 * Get overall attendance summary statistics.
 */
export const getAttendanceStats = async () => {
  const today = parseDateToUTC(new Date().toISOString().split("T")[0]);

  const [totalStudents, todayPresent, todayAbsent, todayLate] = await Promise.all([
    prisma.student.count({
      where: {
        deletedAt: null,
        status: { in: ["ACTIVE", "REVISION"] },
        admission: { status: { in: ["ACTIVE", "REVISION"] } },
      },
    }),
    prisma.attendance.count({ where: { date: today, status: "PRESENT" } }),
    prisma.attendance.count({ where: { date: today, status: "ABSENT" } }),
    prisma.attendance.count({ where: { date: today, status: "LATE" } }),
  ]);

  return {
    totalStudents,
    todayPresent,
    todayAbsent,
    todayLate,
    todayUnmarked: Math.max(0, totalStudents - (todayPresent + todayAbsent + todayLate)),
  };
};
