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

  const toUpsert = validRecords.filter((r) => r.status && r.status !== "UNMARKED");
  const toDelete = validRecords.filter((r) => r.status === "UNMARKED");

  const ops = [];

  if (toDelete.length > 0) {
    ops.push(
      prisma.attendance.deleteMany({
        where: {
          date: attendanceDate,
          studentId: { in: toDelete.map((r) => r.studentId) },
        },
      })
    );
  }

  toUpsert.forEach((r) => {
    ops.push(
      prisma.attendance.upsert({
        where: {
          studentId_date: {
            studentId: r.studentId,
            date: attendanceDate,
          },
        },
        update: {
          status: r.status,
          remarks: r.remarks || null,
          markedBy: markedBy || "SUPER_ADMIN",
        },
        create: {
          studentId: r.studentId,
          date: attendanceDate,
          status: r.status,
          remarks: r.remarks || null,
          markedBy: markedBy || "SUPER_ADMIN",
        },
      })
    );
  });

  const results = await prisma.$transaction(ops);
  return results;
};

/**
 * Get attendance records for a specific date or date range.
 */
export const getAttendanceByDate = async (dateStr, courseId) => {
  const targetDate = parseDateToUTC(dateStr);

  // ✅ FIX: Only filter by STUDENT status (ACTIVE / REVISION).
  // Do NOT filter by admission.status — a student can be ACTIVE even if
  // their admission is COMPLETED (e.g. course finished but still attending revision).
  const where = {
    deletedAt: null,
    status: { in: ["ACTIVE", "REVISION"] },
  };

  // If a specific course is requested, filter via the admission's courseId
  if (courseId) {
    where.admission = { courseId };
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
    courseId: s.admission?.courseId || null,          // ✅ expose courseId for frontend dept filter
    studentStatus: s.status,
    admissionStatus: s.admission?.status || "N/A",
    attendance: s.attendances[0] || null,
    status: s.attendances[0]?.status || "UNMARKED",
  }));
};

/**
 * Get overall attendance summary statistics.
 */
export const getAttendanceStats = async () => {
  const today = parseDateToUTC(new Date().toISOString().split("T")[0]);

  // ✅ FIX: Match same filter as getAttendanceByDate — only student.status matters
  const [totalStudents, todayPresent, todayAbsent, todayLate, todayEarlyLeave, todayNoClass, todayHoliday, todayExempted] = await Promise.all([
    prisma.student.count({
      where: {
        deletedAt: null,
        status: { in: ["ACTIVE", "REVISION"] },
      },
    }),
    prisma.attendance.count({ where: { date: today, status: "PRESENT" } }),
    prisma.attendance.count({ where: { date: today, status: "ABSENT" } }),
    prisma.attendance.count({ where: { date: today, status: "LATE" } }),
    prisma.attendance.count({ where: { date: today, status: "EARLY_LEAVE" } }),
    prisma.attendance.count({ where: { date: today, status: "NO_CLASS" } }),
    prisma.attendance.count({ where: { date: today, status: "HOLIDAY" } }),
    prisma.attendance.count({ where: { date: today, status: "EXEMPTED" } }),
  ]);

  const markedTotal = todayPresent + todayAbsent + todayLate + todayEarlyLeave + todayNoClass + todayHoliday + todayExempted;

  return {
    totalStudents,
    todayPresent,
    todayAbsent,
    todayLate,
    todayEarlyLeave,
    todayNoClass,
    todayHoliday,
    todayExempted,
    todayUnmarked: Math.max(0, totalStudents - markedTotal),
  };
};

/**
 * Get detailed attendance history & percentage for a specific student (for mobile app / profile view).
 */
export const getStudentAttendanceHistory = async (studentId) => {
  const student = await prisma.student.findFirst({
    where: {
      OR: [
        { id: studentId },
        { studentId: studentId },
      ],
    },
    include: {
      admission: { include: { course: true } },
      attendances: {
        orderBy: { date: "desc" },
      },
    },
  });

  if (!student) {
    throw createHttpError("Student not found", 404);
  }

  const total = student.attendances.length;
  const present = student.attendances.filter((a) => a.status === "PRESENT").length;
  const absent = student.attendances.filter((a) => a.status === "ABSENT").length;
  const late = student.attendances.filter((a) => a.status === "LATE").length;
  const earlyLeave = student.attendances.filter((a) => a.status === "EARLY_LEAVE").length;
  const noClass = student.attendances.filter((a) => a.status === "NO_CLASS").length;
  const holiday = student.attendances.filter((a) => a.status === "HOLIDAY").length;
  const percentage = total > 0 ? Math.round(((present + late * 0.5 + earlyLeave * 0.75) / total) * 100) : 100;

  return {
    studentId: student.id,
    displayId: student.studentId,
    fullName: student.fullName,
    mobile: student.mobile,
    courseName: student.admission?.courseNameSnapshot || student.admission?.course?.name || "N/A",
    stats: {
      total,
      present,
      absent,
      late,
      earlyLeave,
      noClass,
      holiday,
      percentage,
    },
    history: student.attendances.map((a) => ({
      id: a.id,
      date: a.date,
      status: a.status,
      remarks: a.remarks,
      markedBy: a.markedBy,
    })),
  };
};

/**
 * Generate formatted WhatsApp summary report for daily attendance (for mobile app & web sharing).
 */
export const getAttendanceWhatsAppReport = async (dateStr) => {
  const targetDate = parseDateToUTC(dateStr);
  const formattedDate = targetDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const [totalStudents, presentCount, absentCount, lateCount, earlyLeaveCount, noClassCount, holidayCount, exemptedCount] = await Promise.all([
    // ✅ FIX: Same filter as getAttendanceByDate
    prisma.student.count({
      where: {
        deletedAt: null,
        status: { in: ["ACTIVE", "REVISION"] },
      },
    }),
    prisma.attendance.count({ where: { date: targetDate, status: "PRESENT" } }),
    prisma.attendance.count({ where: { date: targetDate, status: "ABSENT" } }),
    prisma.attendance.count({ where: { date: targetDate, status: "LATE" } }),
    prisma.attendance.count({ where: { date: targetDate, status: "EARLY_LEAVE" } }),
    prisma.attendance.count({ where: { date: targetDate, status: "NO_CLASS" } }),
    prisma.attendance.count({ where: { date: targetDate, status: "HOLIDAY" } }),
    prisma.attendance.count({ where: { date: targetDate, status: "EXEMPTED" } }),
  ]);

  const markedTotalCount = presentCount + absentCount + lateCount + earlyLeaveCount + noClassCount + holidayCount + exemptedCount;
  const unmarkedCount = Math.max(0, totalStudents - markedTotalCount);
  const activeMarkedTotal = presentCount + absentCount + lateCount + earlyLeaveCount;
  const attendanceRate = activeMarkedTotal > 0 ? Math.round(((presentCount + lateCount * 0.5 + earlyLeaveCount * 0.75) / activeMarkedTotal) * 100) : 0;

  const text = `📊 *DAILY STUDENT ATTENDANCE REPORT*
📅 *Date:* ${formattedDate}

👥 *Total Active Students:* ${totalStudents}
✅ *Present:* ${presentCount}
❌ *Absent:* ${absentCount}
⏳ *Late:* ${lateCount}
🟤 *Early Leave:* ${earlyLeaveCount}
☕ *No Class:* ${noClassCount}
🌴 *Holiday:* ${holidayCount}
❓ *Unmarked:* ${unmarkedCount}

📈 *Attendance Rate:* ${attendanceRate}%

_Sent via Student Management System_`;

  const encodedText = encodeURIComponent(text);

  return {
    date: targetDate,
    formattedDate,
    stats: {
      totalStudents,
      presentCount,
      absentCount,
      lateCount,
      earlyLeaveCount,
      noClassCount,
      holidayCount,
      exemptedCount,
      unmarkedCount,
      attendanceRate,
    },
    text,
    whatsappUrl: `https://wa.me/?text=${encodedText}`,
    apiWhatsappUrl: `whatsapp://send?text=${encodedText}`,
  };
};
