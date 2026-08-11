import prisma from "../../config/prisma.js";
import { createHttpError } from "../../utils/httpError.js";

/**
 * Safely parse date string to UTC midnight (00:00:00.000Z) to avoid timezone shifts
 */
const parseDateToUTC = (dateStr) => {
  if (!dateStr || dateStr === "undefined" || dateStr === "null") {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
  }

  if (typeof dateStr === "string") {
    const cleanStr = dateStr.trim().split("T")[0];
    const parts = cleanStr.split("-");
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
        return new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
      }
    }
  }

  const d = new Date(dateStr);
  if (isNaN(d.getTime())) {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
  }
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

  const rawIds = records.map((r) => r.studentId).filter(Boolean);
  if (rawIds.length === 0) {
    throw createHttpError("No valid student IDs provided", 400);
  }

  // Support both primary key (id) and display studentId (STU-xxx)
  const validStudents = await prisma.student.findMany({
    where: {
      OR: [
        { id: { in: rawIds } },
        { studentId: { in: rawIds } },
      ],
    },
    select: { id: true, studentId: true },
  });

  const idMap = new Map();
  validStudents.forEach((s) => {
    idMap.set(s.id, s.id);
    idMap.set(s.studentId, s.id);
  });

  const validRecords = [];
  records.forEach((r) => {
    const dbId = idMap.get(r.studentId);
    if (dbId) {
      validRecords.push({
        ...r,
        studentId: dbId,
      });
    }
  });

  if (validRecords.length === 0) {
    throw createHttpError("No valid student records found to mark attendance", 400);
  }

  const validStudentIds = validRecords.map((r) => r.studentId);
  const toUpsert = validRecords.filter((r) => r.status && r.status !== "UNMARKED");

  try {
    // Step 1: Remove existing attendance entries for these students on target date
    await prisma.attendance.deleteMany({
      where: {
        date: attendanceDate,
        studentId: { in: validStudentIds },
      },
    });

    // Step 2: Bulk insert new attendance records if status is marked
    if (toUpsert.length > 0) {
      const createData = toUpsert.map((r) => ({
        studentId: r.studentId,
        date: attendanceDate,
        status: r.status,
        remarks: r.remarks || null,
        markedBy: markedBy || "SUPER_ADMIN",
      }));

      try {
        await prisma.attendance.createMany({
          data: createData,
        });
      } catch (enumErr) {
        // Fallback if PostgreSQL enum type lacks custom enum values (EARLY_LEAVE / NO_CLASS / HOLIDAY)
        const fallbackData = createData.map((d) => {
          let safeStatus = d.status;
          if (d.status === "EARLY_LEAVE") safeStatus = "LATE";
          if (d.status === "NO_CLASS" || d.status === "HOLIDAY") safeStatus = "EXEMPTED";
          return { ...d, status: safeStatus };
        });

        await prisma.attendance.createMany({
          data: fallbackData,
        });
      }
    }

    return { count: validRecords.length };
  } catch (dbErr) {
    console.error("[ATTENDANCE_SAVE_ERROR]", dbErr);
    throw createHttpError(dbErr.message || "Failed to save attendance records", 400);
  }
};

/**
 * Get attendance records for a specific date or date range.
 */
export const getAttendanceByDate = async (dateStr, courseId) => {
  try {
    const targetDate = parseDateToUTC(dateStr);
    
    // Include end of target date to cover full 24h of target date
    const targetDateEnd = new Date(targetDate.getTime() + 24 * 60 * 60 * 1000 - 1);

    // Filter by active/revision status AND joining date (must have joined on or before target date)
    const where = {
      deletedAt: null,
      status: { in: ["ACTIVE", "REVISION"] },
      joinedDate: { lte: targetDateEnd },
      admission: {
        status: { notIn: ["COMPLETED", "CANCELLED"] },
        ...(courseId ? { courseId } : {}),
      },
    };

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
      courseId: s.admission?.courseId || null,
      studentStatus: s.status,
      admissionStatus: s.admission?.status || "N/A",
      attendance: s.attendances?.[0] || null,
      status: s.attendances?.[0]?.status || "UNMARKED",
    }));
  } catch (err) {
    console.error("[GET_ATTENDANCE_BY_DATE_ERROR]", err);
    throw createHttpError(err.message || "Failed to fetch attendance list", 400);
  }
};

/**
 * Get overall attendance summary statistics using single groupBy query.
 */
export const getAttendanceStats = async () => {
  try {
    const today = parseDateToUTC(new Date().toISOString().split("T")[0]);

    const [totalStudents, statusCounts] = await Promise.all([
      prisma.student.count({
        where: {
          deletedAt: null,
          status: { in: ["ACTIVE", "REVISION"] },
          admission: {
            status: { notIn: ["COMPLETED", "CANCELLED"] },
          },
        },
      }),
      prisma.attendance.groupBy({
        by: ["status"],
        where: { date: today },
        _count: { status: true },
      }),
    ]);

    const counts = {
      PRESENT: 0,
      ABSENT: 0,
      LATE: 0,
      EARLY_LEAVE: 0,
      NO_CLASS: 0,
      HOLIDAY: 0,
      EXEMPTED: 0,
    };

    statusCounts.forEach((item) => {
      if (Object.prototype.hasOwnProperty.call(counts, item.status)) {
        counts[item.status] = item._count.status;
      }
    });

    const markedTotal = Object.values(counts).reduce((acc, curr) => acc + curr, 0);

    return {
      totalStudents,
      todayPresent: counts.PRESENT,
      todayAbsent: counts.ABSENT,
      todayLate: counts.LATE,
      todayEarlyLeave: counts.EARLY_LEAVE,
      todayNoClass: counts.NO_CLASS,
      todayHoliday: counts.HOLIDAY,
      todayExempted: counts.EXEMPTED,
      todayUnmarked: Math.max(0, totalStudents - markedTotal),
    };
  } catch (err) {
    console.error("[GET_ATTENDANCE_STATS_ERROR]", err);
    return {
      totalStudents: 0,
      todayPresent: 0,
      todayAbsent: 0,
      todayLate: 0,
      todayEarlyLeave: 0,
      todayNoClass: 0,
      todayHoliday: 0,
      todayExempted: 0,
      todayUnmarked: 0,
    };
  }
};

/**
 * Get detailed attendance history & percentage for a specific student (for mobile app / profile view).
 */
export const getStudentAttendanceHistory = async (studentId) => {
  try {
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

    const attendances = student.attendances || [];
    const total = attendances.length;
    const present = attendances.filter((a) => a.status === "PRESENT").length;
    const absent = attendances.filter((a) => a.status === "ABSENT").length;
    const late = attendances.filter((a) => a.status === "LATE").length;
    const earlyLeave = attendances.filter((a) => a.status === "EARLY_LEAVE").length;
    const noClass = attendances.filter((a) => a.status === "NO_CLASS").length;
    const holiday = attendances.filter((a) => a.status === "HOLIDAY").length;
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
      history: attendances.map((a) => ({
        id: a.id,
        date: a.date,
        status: a.status,
        remarks: a.remarks,
        markedBy: a.markedBy,
      })),
    };
  } catch (err) {
    if (err.statusCode) throw err;
    console.error("[GET_STUDENT_ATTENDANCE_HISTORY_ERROR]", err);
    throw createHttpError(err.message || "Failed to fetch student attendance history", 400);
  }
};

/**
 * Generate formatted WhatsApp summary report for daily attendance (for mobile app & web sharing).
 */
export const getAttendanceWhatsAppReport = async (dateStr) => {
  try {
    const targetDate = parseDateToUTC(dateStr);
    const formattedDate = targetDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    const targetDateEnd = new Date(targetDate.getTime() + 24 * 60 * 60 * 1000 - 1);

    const [totalStudents, statusCounts, dayAttendances] = await Promise.all([
      prisma.student.count({
        where: {
          deletedAt: null,
          status: { in: ["ACTIVE", "REVISION"] },
          joinedDate: { lte: targetDateEnd },
          admission: {
            status: { notIn: ["COMPLETED", "CANCELLED"] },
          },
        },
      }),
      prisma.attendance.groupBy({
        by: ["status"],
        where: { date: targetDate },
        _count: { status: true },
      }),
      prisma.attendance.findMany({
        where: {
          date: targetDate,
          student: {
            deletedAt: null,
            status: { in: ["ACTIVE", "REVISION"] },
            joinedDate: { lte: targetDateEnd },
            admission: {
              status: { notIn: ["COMPLETED", "CANCELLED"] },
            },
          },
        },
        include: {
          student: {
            select: {
              fullName: true,
              studentId: true,
            },
          },
        },
        orderBy: { student: { fullName: "asc" } },
      }),
    ]);

    const counts = {
      PRESENT: 0,
      ABSENT: 0,
      LATE: 0,
      EARLY_LEAVE: 0,
      NO_CLASS: 0,
      HOLIDAY: 0,
      EXEMPTED: 0,
    };

    statusCounts.forEach((item) => {
      if (Object.prototype.hasOwnProperty.call(counts, item.status)) {
        counts[item.status] = item._count.status;
      }
    });

    const presentCount = counts.PRESENT;
    const absentCount = counts.ABSENT;
    const lateCount = counts.LATE;
    const earlyLeaveCount = counts.EARLY_LEAVE;
    const noClassCount = counts.NO_CLASS;
    const holidayCount = counts.HOLIDAY;
    const exemptedCount = counts.EXEMPTED;

    const markedTotalCount = presentCount + absentCount + lateCount + earlyLeaveCount + noClassCount + holidayCount + exemptedCount;
    const unmarkedCount = Math.max(0, totalStudents - markedTotalCount);
    const activeMarkedTotal = presentCount + absentCount + lateCount + earlyLeaveCount;
    const attendanceRate = activeMarkedTotal > 0 ? Math.round(((presentCount + lateCount * 0.5 + earlyLeaveCount * 0.75) / activeMarkedTotal) * 100) : 0;

    const absentList = dayAttendances
      .filter((a) => a.status === "ABSENT")
      .map((a) => `\u2022 ${a.student.fullName} (${a.student.studentId})`);

    const lateList = dayAttendances
      .filter((a) => a.status === "LATE")
      .map((a) => `\u2022 ${a.student.fullName} (${a.student.studentId})`);

    const earlyLeaveList = dayAttendances
      .filter((a) => a.status === "EARLY_LEAVE")
      .map((a) => `\u2022 ${a.student.fullName} (${a.student.studentId})`);

    const noClassList = dayAttendances
      .filter((a) => a.status === "NO_CLASS")
      .map((a) => `\u2022 ${a.student.fullName} (${a.student.studentId})`);

    const emojiChart = "\uD83D\uDCCA";
    const emojiCal = "\uD83D\uDCC5";
    const emojiUsers = "\uD83D\uDC65";
    const emojiCheck = "\u2705";
    const emojiCross = "\u274C";
    const emojiHourglass = "\u23F3";
    const emojiBrown = "\uD83D\uDFE4";
    const emojiCoffee = "\u2615";
    const emojiPalm = "\uD83C\uDF34";
    const emojiQuestion = "\u2753";
    const emojiUp = "\uD83D\uDCC8";
    const emojiNotice = "\uD83D\uDCE2";
    const emojiLink = "\uD83D\uDD17";

    let text = `${emojiChart} *DAILY STUDENT ATTENDANCE REPORT*
${emojiCal} *Date:* ${formattedDate}

${emojiUsers} *Total Active Students:* ${totalStudents}
${emojiCheck} *Present:* ${presentCount}
${emojiCross} *Absent:* ${absentCount}
${emojiHourglass} *Late:* ${lateCount}
${emojiBrown} *Early Leave:* ${earlyLeaveCount}
${emojiCoffee} *No Class:* ${noClassCount}
${emojiPalm} *Holiday:* ${holidayCount}
${emojiQuestion} *Unmarked:* ${unmarkedCount}

${emojiUp} *Attendance Rate:* ${attendanceRate}%`;

    if (absentList.length > 0) {
      text += `\n\n${emojiCross} *ABSENT STUDENTS (${absentList.length}):*\n${absentList.join("\n")}`;
    }

    if (lateList.length > 0) {
      text += `\n\n${emojiHourglass} *LATE STUDENTS (${lateList.length}):*\n${lateList.join("\n")}`;
    }

    if (earlyLeaveList.length > 0) {
      text += `\n\n${emojiBrown} *EARLY LEAVE (${earlyLeaveList.length}):*\n${earlyLeaveList.join("\n")}`;
    }

    if (noClassList.length > 0) {
      text += `\n\n${emojiCoffee} *NO CLASS (${noClassList.length}):*\n${noClassList.join("\n")}`;
    }

    text += `\n\n${emojiNotice} *STUDENT & PARENT NOTICE:*
You can check your attendance reports, student profile, and fee payment receipts anytime by logging in at:
${emojiLink} https://student-management-system-pi-rosy.vercel.app/

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
  } catch (err) {
    console.error("[WHATSAPP_REPORT_ERROR]", err);
    throw createHttpError(err.message || "Failed to generate WhatsApp report", 400);
  }
};
