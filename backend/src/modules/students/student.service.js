import prisma from "../../config/prisma.js";
import { createHttpError } from "../../utils/httpError.js";

function toTitleCase(str) {
  if (!str) return "";
  return str
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Helper to deduplicate student records belonging to the same person (same mobile or name)
 */
export const deduplicateStudents = (studentRows) => {
  const map = new Map();

  studentRows.forEach((s) => {
    const key = (s.mobile || s.fullName).toLowerCase().trim();
    const formattedName = toTitleCase(s.fullName);
    s.fullName = formattedName;

    if (!map.has(key)) {
      const cloned = { ...s };
      cloned.allAdmissions = [];
      if (s.admission) {
        cloned.allAdmissions.push(s.admission);
      }
      map.set(key, cloned);
    } else {
      const existing = map.get(key);
      if (s.admission) {
        existing.allAdmissions.push(s.admission);
      }
    }
  });

  const result = Array.from(map.values()).map((s) => {
    if (s.allAdmissions && s.allAdmissions.length > 0) {
      const courseList = s.allAdmissions.map((a) => ({
        id: a.id,
        admissionNumber: a.admissionNumber,
        courseName: a.courseNameSnapshot || a.course?.name || "General Course",
        courseFees: Number(a.finalFees || a.courseFees || 0),
        paidAmount: Number(a.paidAmount || 0),
        pendingAmount: Number(a.pendingAmount || 0),
        admissionDate: a.admissionDate,
        status: a.status,
      }));

      const courseNames = [...new Set(courseList.map((c) => c.courseName).filter(Boolean))];
      const primaryCourse = courseNames[0] || "General Course";
      const extraCoursesCount = courseNames.length - 1;

      const totalCourseFees = s.allAdmissions.reduce(
        (sum, a) => sum + Number(a.finalFees || a.courseFees || 0),
        0
      );
      const totalPaid = s.allAdmissions.reduce(
        (sum, a) => sum + Number(a.paidAmount || 0),
        0
      );
      const totalPending = s.allAdmissions.reduce(
        (sum, a) => sum + Number(a.pendingAmount || 0),
        0
      );

      s.courseInfo = {
        primaryCourse,
        courseNames,
        extraCoursesCount: Math.max(0, extraCoursesCount),
        totalCourses: courseNames.length,
        courseList,
      };

      s.admission = {
        ...s.allAdmissions[0],
        courseNameSnapshot: courseNames.join(", "),
        courseFees: totalCourseFees,
        finalFees: totalCourseFees,
        paidAmount: totalPaid,
        pendingAmount: totalPending,
      };
    } else {
      s.courseInfo = {
        primaryCourse: "N/A",
        courseNames: [],
        extraCoursesCount: 0,
        totalCourses: 0,
        courseList: [],
      };
    }
    return s;
  });

  return result;
};

/**
 * Retrieve paginated students list with search, status filter, and deduplication.
 */
export const getAllStudents = async (queryParams = {}) => {
  const {
    page = 1,
    limit = 10,
    search,
    status,
    courseId,
    sortBy = "newest",
  } = queryParams;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, parseInt(limit, 10) || 10);

  const where = {
    deletedAt: null,
  };

  if (status) {
    where.status = status;
  }

  if (courseId) {
    where.admission = {
      courseId,
    };
  }

  if (search) {
    const trimmed = String(search).trim();
    where.OR = [
      { studentId: { contains: trimmed, mode: "insensitive" } },
      { fullName: { contains: trimmed, mode: "insensitive" } },
      { mobile: { contains: trimmed, mode: "insensitive" } },
      { email: { contains: trimmed, mode: "insensitive" } },
      { fatherName: { contains: trimmed, mode: "insensitive" } },
      { admission: { admissionNumber: { contains: trimmed, mode: "insensitive" } } },
      { admission: { courseNameSnapshot: { contains: trimmed, mode: "insensitive" } } },
    ];
  }

  let orderBy = { createdAt: "desc" };
  if (sortBy === "oldest") {
    orderBy = { createdAt: "asc" };
  } else if (sortBy === "name") {
    orderBy = { fullName: "asc" };
  } else if (sortBy === "studentId") {
    orderBy = { studentId: "asc" };
  }

  // Fetch all matching rows to deduplicate accurately across admissions
  const rawStudents = await prisma.student.findMany({
    where,
    orderBy,
    include: {
      admission: {
        include: {
          course: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
      },
      user: {
        select: {
          id: true,
          email: true,
          role: true,
          isActive: true,
        },
      },
    },
  });

  const uniqueStudents = deduplicateStudents(rawStudents);
  const total = uniqueStudents.length;
  const totalPages = Math.ceil(total / limitNum) || 1;

  const paginatedStudents = uniqueStudents.slice(
    (pageNum - 1) * limitNum,
    pageNum * limitNum
  );

  return {
    students: paginatedStudents,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages,
    },
  };
};

/**
 * Get student by DB id or STU-xxx studentId with complete course history, fee receipts, and attendance logs.
 */
export const getStudentById = async (idOrStudentId) => {
  const student = await prisma.student.findFirst({
    where: {
      OR: [
        { id: idOrStudentId },
        { studentId: idOrStudentId },
      ],
      deletedAt: null,
    },
    include: {
      admission: {
        include: {
          course: true,
          payments: {
            orderBy: { createdAt: "desc" },
          },
        },
      },
      documents: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
        },
      },
    },
  });

  if (!student) {
    throw createHttpError("Student not found", 404);
  }

  student.fullName = toTitleCase(student.fullName);

  // Find all student rows for this person mobile/name
  const allMatching = await prisma.student.findMany({
    where: {
      OR: [
        { mobile: student.mobile },
        { fullName: { equals: student.fullName, mode: "insensitive" } },
      ],
      deletedAt: null,
    },
    include: {
      admission: {
        include: {
          course: true,
          payments: { orderBy: { createdAt: "desc" } },
        },
      },
    },
  });

  const allStudentIds = allMatching.map((s) => s.id);
  const allAdmissions = allMatching.map((s) => s.admission).filter(Boolean);

  // Fetch Attendance Records
  const attendanceRecords = await prisma.attendance.findMany({
    where: { studentId: { in: allStudentIds } },
    orderBy: { date: "desc" },
  });

  const totalClasses = attendanceRecords.length;
  const presentCount = attendanceRecords.filter((a) => a.status === "PRESENT").length;
  const absentCount = attendanceRecords.filter((a) => a.status === "ABSENT").length;
  const attendancePercentage = totalClasses > 0 ? ((presentCount / totalClasses) * 100).toFixed(1) : 100;

  // Gather all payments across all course admissions
  const allPayments = [];
  allAdmissions.forEach((adm) => {
    if (adm.payments) {
      adm.payments.forEach((p) => {
        allPayments.push({
          ...p,
          courseName: adm.courseNameSnapshot || adm.course?.name,
          admissionNumber: adm.admissionNumber,
        });
      });
    }
  });
  allPayments.sort((a, b) => new Date(b.paymentDate || b.createdAt) - new Date(a.paymentDate || a.createdAt));

  student.allAdmissions = allAdmissions;
  student.allPayments = allPayments;
  student.attendanceStats = {
    totalClasses,
    presentCount,
    absentCount,
    attendancePercentage,
    recentLogs: attendanceRecords.slice(0, 15),
  };

  return student;
};

/**
 * Update student profile & fee structure details by Super Admin.
 */
export const updateStudentFullService = async (idOrStudentId, updateData) => {
  const student = await getStudentById(idOrStudentId);

  const {
    fullName,
    mobile,
    email,
    address,
    status,
    courseFees,
    discount,
    finalFees,
    remarks,
  } = updateData;

  const formattedName = fullName ? toTitleCase(fullName) : undefined;

  const matchingStudents = await prisma.student.findMany({
    where: {
      OR: [
        { mobile: student.mobile },
        { id: student.id },
      ],
    },
  });

  for (const s of matchingStudents) {
    await prisma.student.update({
      where: { id: s.id },
      data: {
        ...(formattedName && { fullName: formattedName }),
        ...(mobile && { mobile }),
        ...(email !== undefined && { email }),
        ...(address !== undefined && { address }),
        ...(status && { status }),
      },
    });

    if (s.admissionId) {
      const currentAdm = await prisma.admission.findUnique({ where: { id: s.admissionId } });
      if (currentAdm) {
        const newCourseFees = courseFees !== undefined ? Number(courseFees) : Number(currentAdm.courseFees);
        const newDiscount = discount !== undefined ? Number(discount) : Number(currentAdm.discount);
        const calculatedFinalFees = finalFees !== undefined ? Number(finalFees) : Math.max(0, newCourseFees - newDiscount);
        const paidAmount = Number(currentAdm.paidAmount || 0);
        const newPendingAmount = Math.max(0, calculatedFinalFees - paidAmount);

        let admStatus = currentAdm.status;
        if (status === "COMPLETED") admStatus = "COMPLETED";
        if (status === "DROPPED" || status === "CANCELLED") admStatus = "CANCELLED";
        if (status === "ACTIVE") admStatus = "ACTIVE";

        await prisma.admission.update({
          where: { id: s.admissionId },
          data: {
            courseFees: newCourseFees,
            discount: newDiscount,
            finalFees: calculatedFinalFees,
            pendingAmount: newPendingAmount,
            status: admStatus,
            ...(remarks !== undefined && { remarks: String(remarks) }),
          },
        });
      }
    }
  }

  return getStudentById(student.id);
};
