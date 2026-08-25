import { Prisma } from "@prisma/client";
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
      const hasActiveAdmission = s.allAdmissions.some((a) => a.status === "ACTIVE" && a.deletedAt === null);
      if (hasActiveAdmission) {
        s.status = "ACTIVE";
      }

      const courseList = s.allAdmissions.map((a) => {
        const fees = Number(a.finalFees || a.courseFees || 0);
        const paid = Number(a.paidAmount || 0);
        const isInactive = a.status === "COMPLETED" || a.status === "CANCELLED";
        const pending = isInactive ? 0 : Math.max(0, fees - paid);
        return {
          id: a.id,
          admissionNumber: a.admissionNumber,
          courseName: a.courseNameSnapshot || a.course?.name || "General Course",
          courseFees: fees,
          paidAmount: paid,
          pendingAmount: pending,
          admissionDate: a.admissionDate,
          status: a.status,
        };
      });

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
      const totalPending = s.allAdmissions.reduce((sum, a) => {
        if (a.status === "COMPLETED" || a.status === "CANCELLED") return sum;
        const fees = Number(a.finalFees || a.courseFees || 0);
        const paid = Number(a.paidAmount || 0);
        return sum + Math.max(0, fees - paid);
      }, 0);

      s.courseInfo = {
        primaryCourse,
        courseNames,
        extraCoursesCount: Math.max(0, extraCoursesCount),
        totalCourses: courseNames.length,
        courseList,
      };

      const activeAdmissions = s.allAdmissions.filter((a) => a.status === "ACTIVE");
      const primaryAdm = activeAdmissions[0] || s.allAdmissions[0];

      s.admission = {
        ...primaryAdm,
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
    departmentId,
    category,
    paymentFilter,
    sortBy = "name_asc",
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
  } else if (departmentId || category) {
    where.admission = {
      course: {
        ...(departmentId && { departmentId }),
        ...(category && { category }),
      },
    };
  }

  if (search) {
    const trimmed = String(search).trim();
    const cleanedDigits = trimmed.replace(/\D/g, "");
    const last10 = cleanedDigits.length >= 10 ? cleanedDigits.slice(-10) : cleanedDigits;

    where.OR = [
      { studentId: { contains: trimmed, mode: "insensitive" } },
      { fullName: { contains: trimmed, mode: "insensitive" } },
      { mobile: { contains: trimmed, mode: "insensitive" } },
      { whatsapp: { contains: trimmed, mode: "insensitive" } },
      { email: { contains: trimmed, mode: "insensitive" } },
      { fatherName: { contains: trimmed, mode: "insensitive" } },
      { motherName: { contains: trimmed, mode: "insensitive" } },
      { aadhaarNumber: { contains: trimmed, mode: "insensitive" } },
      { admission: { admissionNumber: { contains: trimmed, mode: "insensitive" } } },
      { admission: { courseNameSnapshot: { contains: trimmed, mode: "insensitive" } } },
      { admission: { guardianName: { contains: trimmed, mode: "insensitive" } } },
      { admission: { guardianMobile: { contains: trimmed, mode: "insensitive" } } },
    ];

    if (last10 && last10.length >= 4) {
      where.OR.push({ mobile: { contains: last10, mode: "insensitive" } });
      where.OR.push({ whatsapp: { contains: last10, mode: "insensitive" } });
      where.OR.push({ admission: { guardianMobile: { contains: last10, mode: "insensitive" } } });
    }
  }

  // Fetch all matching rows to deduplicate accurately across admissions
  const rawStudents = await prisma.student.findMany({
    where,
    orderBy: { createdAt: "desc" },
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

  let uniqueStudents = deduplicateStudents(rawStudents);

  // Fee Status Filter (Payment Filter)
  if (paymentFilter === "PENDING") {
    uniqueStudents = uniqueStudents.filter(
      (s) => Number(s.admission?.pendingAmount || 0) > 0
    );
  } else if (paymentFilter === "CLEARED") {
    uniqueStudents = uniqueStudents.filter(
      (s) => Number(s.admission?.pendingAmount || 0) <= 0
    );
  }

  // Sorting: ACTIVE students first, then secondary sort criteria
  if (sortBy === "pending_desc") {
    uniqueStudents.sort(
      (a, b) => Number(b.admission?.pendingAmount || 0) - Number(a.admission?.pendingAmount || 0)
    );
  } else if (sortBy === "pending_asc") {
    uniqueStudents.sort(
      (a, b) => Number(a.admission?.pendingAmount || 0) - Number(b.admission?.pendingAmount || 0)
    );
  } else if (sortBy === "name_asc") {
    uniqueStudents.sort((a, b) => {
      const aActive = a.status === "ACTIVE" ? 0 : 1;
      const bActive = b.status === "ACTIVE" ? 0 : 1;
      if (aActive !== bActive) return aActive - bActive;
      return (a.fullName || "").localeCompare(b.fullName || "");
    });
  } else if (sortBy === "name_desc") {
    uniqueStudents.sort((a, b) => {
      const aActive = a.status === "ACTIVE" ? 0 : 1;
      const bActive = b.status === "ACTIVE" ? 0 : 1;
      if (aActive !== bActive) return aActive - bActive;
      return (b.fullName || "").localeCompare(a.fullName || "");
    });
  } else if (sortBy === "oldest") {
    uniqueStudents.sort((a, b) => {
      const aActive = a.status === "ACTIVE" ? 0 : 1;
      const bActive = b.status === "ACTIVE" ? 0 : 1;
      if (aActive !== bActive) return aActive - bActive;
      return new Date(a.createdAt) - new Date(b.createdAt);
    });
  } else if (sortBy === "newest") {
    uniqueStudents.sort((a, b) => {
      const aActive = a.status === "ACTIVE" ? 0 : 1;
      const bActive = b.status === "ACTIVE" ? 0 : 1;
      if (aActive !== bActive) return aActive - bActive;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
  }

  // Aggregate Stats
  const activeStudents = uniqueStudents.filter((s) => s.status === "ACTIVE").length;
  const completedStudents = uniqueStudents.filter((s) => s.status === "COMPLETED").length;
  const onHoldStudents = uniqueStudents.filter((s) => s.status === "ON_HOLD").length;
  const droppedStudents = uniqueStudents.filter((s) => s.status === "DROPPED").length;
  const transferredStudents = uniqueStudents.filter((s) => s.status === "TRANSFERRED").length;
  const revisionStudents = uniqueStudents.filter((s) => s.status === "REVISION").length;

  const pendingDuesStudents = uniqueStudents.filter(
    (s) => Number(s.admission?.pendingAmount || 0) > 0
  );
  const totalPendingDuesAmount = pendingDuesStudents.reduce(
    (sum, s) => sum + Number(s.admission?.pendingAmount || 0),
    0
  );

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
    stats: {
      totalStudents: total,
      activeStudents,
      completedStudents,
      pendingDuesCount: pendingDuesStudents.length,
      totalPendingDuesAmount,
      statusCounts: {
        ACTIVE: activeStudents,
        ON_HOLD: onHoldStudents,
        COMPLETED: completedStudents,
        DROPPED: droppedStudents,
        TRANSFERRED: transferredStudents,
        REVISION: revisionStudents,
      },
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
      admission: {
        deletedAt: null,
      },
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
  const allAdmissions = allMatching
    .map((s) => s.admission)
    .filter((adm) => adm && adm.deletedAt === null);

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

  if (allAdmissions.length > 0) {
    const courseNames = [...new Set(allAdmissions.map((a) => a.courseNameSnapshot || a.course?.name).filter(Boolean))];
    const totalCourseFees = allAdmissions.reduce((sum, a) => sum + Number(a.finalFees || a.courseFees || 0), 0);
    const totalPaid = allAdmissions.reduce((sum, a) => sum + Number(a.paidAmount || 0), 0);
    const totalPending = allAdmissions.reduce((sum, a) => {
      if (a.status === "COMPLETED" || a.status === "CANCELLED") return sum;
      const fees = Number(a.finalFees || a.courseFees || 0);
      const paid = Number(a.paidAmount || 0);
      return sum + Math.max(0, fees - paid);
    }, 0);

    const activeAdmissions = allAdmissions.filter((a) => a.status === "ACTIVE");
    const primaryAdm = activeAdmissions[0] || allAdmissions[0];

    student.admission = {
      ...primaryAdm,
      courseNameSnapshot: courseNames.join(", "),
      courseFees: totalCourseFees,
      finalFees: totalCourseFees,
      paidAmount: totalPaid,
      pendingAmount: totalPending,
    };
  }

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
    completionDate,
    isCertificateEligible,
    certificateUrl,
    certificateFileName,
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
    let finalCompletionDate = s.completionDate;
    if (status === "COMPLETED") {
      finalCompletionDate = completionDate ? new Date(completionDate) : (s.completionDate || new Date());
    } else if (status && status !== "COMPLETED") {
      finalCompletionDate = null;
    }

    await prisma.student.update({
      where: { id: s.id },
      data: {
        ...(formattedName && { fullName: formattedName }),
        ...(mobile && { mobile }),
        ...(email !== undefined && { email }),
        ...(address !== undefined && { address }),
        ...(status && { status }),
        completionDate: finalCompletionDate,
        ...(isCertificateEligible !== undefined && { isCertificateEligible: Boolean(isCertificateEligible) }),
        ...(certificateUrl !== undefined && { certificateUrl }),
        ...(certificateFileName !== undefined && { certificateFileName }),
        ...(certificateUrl ? { certificateUploadedAt: new Date() } : {}),
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

/**
 * Bulk update status for multiple students at once.
 */
export const bulkUpdateStudentStatus = async (studentIds = [], newStatus) => {
  if (!Array.isArray(studentIds) || studentIds.length === 0) {
    throw createHttpError("No student IDs provided for bulk update", 400);
  }

  if (!newStatus) {
    throw createHttpError("Status is required for bulk update", 400);
  }

  // Update Student records
  await prisma.student.updateMany({
    where: {
      id: { in: studentIds },
    },
    data: {
      status: newStatus,
    },
  });

  // Find corresponding admission records to update
  const students = await prisma.student.findMany({
    where: { id: { in: studentIds } },
    select: { admissionId: true },
  });

  const admissionIds = students.map((s) => s.admissionId).filter(Boolean);

  if (admissionIds.length > 0) {
    let admStatus = newStatus;
    if (newStatus === "COMPLETED") admStatus = "COMPLETED";
    if (newStatus === "DROPPED" || newStatus === "CANCELLED") admStatus = "CANCELLED";
    if (newStatus === "ACTIVE") admStatus = "ACTIVE";

    await prisma.admission.updateMany({
      where: { id: { in: admissionIds } },
      data: { status: admStatus },
    });
  }

  return { updatedCount: studentIds.length, status: newStatus };
};

/**
 * Enroll an existing student into a new course.
 */
export const addCourseToStudent = async (idOrStudentId, payload) => {
  const student = await prisma.student.findFirst({
    where: {
      OR: [{ id: idOrStudentId }, { studentId: idOrStudentId }],
      deletedAt: null,
    },
    include: { admission: true, user: true },
  });

  if (!student) {
    throw createHttpError("Student record not found", 404);
  }

  const {
    courseId,
    courseFees,
    discount = 0,
    paymentAmount = 0,
    paymentMode = "CASH",
    paymentDate,
    transactionReference,
    remarks,
    admittedBy,
  } = payload;

  if (!courseId) {
    throw createHttpError("Course ID is required", 400);
  }

  const course = await prisma.course.findUnique({
    where: { id: courseId },
  });

  if (!course) {
    throw createHttpError("Selected course not found", 404);
  }

  return prisma.$transaction(async (tx) => {
    // 1. Generate Unique Inquiry Number
    let seqInquiry = await tx.sequence.findFirst({ where: { name: "INQUIRY" } });
    let inqVal = (seqInquiry?.currentValue || 100) + 1;
    let inquiryNumber = "";
    while (true) {
      const candidate = `INQ-${new Date().getFullYear()}-${String(inqVal).padStart(4, "0")}`;
      const exists = await tx.inquiry.findUnique({ where: { inquiryNumber: candidate } });
      if (!exists) {
        inquiryNumber = candidate;
        if (seqInquiry) {
          await tx.sequence.update({ where: { id: seqInquiry.id }, data: { currentValue: inqVal } });
        } else {
          seqInquiry = await tx.sequence.create({ data: { name: "INQUIRY", currentValue: inqVal } });
        }
        break;
      }
      inqVal++;
    }

    let leadSource = await tx.leadSource.findFirst();
    if (!leadSource) {
      leadSource = await tx.leadSource.create({
        data: { name: "Direct Admission", description: "Default lead source" },
      });
    }

    let superUser = await tx.user.findFirst({ where: { role: "SUPER_ADMIN" } });
    if (!superUser) {
      superUser = await tx.user.findFirst();
    }

    // Create Inquiry linked to new course
    const newInquiry = await tx.inquiry.create({
      data: {
        inquiryNumber,
        fullName: student.fullName,
        mobile: student.mobile,
        gender: student.gender || "Female",
        email: student.email,
        expectedFees: new Prisma.Decimal(course.fees),
        nextFollowUpDate: new Date(),
        status: "ADMISSION_DONE",
        courseId: course.id,
        leadSourceId: leadSource.id,
        assignedToId: admittedBy || superUser?.id || "",
      },
    });

    // 2. Generate Unique Admission Number
    let seqAdm = await tx.sequence.findFirst({ where: { name: "ADMISSION" } });
    let admVal = (seqAdm?.currentValue || 100) + 1;
    let admissionNumber = "";
    while (true) {
      const candidate = `ADM-${new Date().getFullYear()}-${String(admVal).padStart(4, "0")}`;
      const exists = await tx.admission.findUnique({ where: { admissionNumber: candidate } });
      if (!exists) {
        admissionNumber = candidate;
        if (seqAdm) {
          await tx.sequence.update({ where: { id: seqAdm.id }, data: { currentValue: admVal } });
        } else {
          seqAdm = await tx.sequence.create({ data: { name: "ADMISSION", currentValue: admVal } });
        }
        break;
      }
      admVal++;
    }

    // 3. Generate Unique Student ID String
    let seqStd = await tx.sequence.findFirst({ where: { name: "STUDENT" } });
    let stdVal = (seqStd?.currentValue || 100) + 1;
    const yearShort = String(new Date().getFullYear()).slice(-2);
    let newStudentIdStr = "";
    while (true) {
      const candidate = `STD${yearShort}${String(stdVal).padStart(4, "0")}`;
      const exists = await tx.student.findFirst({ where: { studentId: candidate } });
      if (!exists) {
        newStudentIdStr = candidate;
        if (seqStd) {
          await tx.sequence.update({ where: { id: seqStd.id }, data: { currentValue: stdVal } });
        } else {
          seqStd = await tx.sequence.create({ data: { name: "STUDENT", currentValue: stdVal } });
        }
        break;
      }
      stdVal++;
    }

    const numericCourseFees = Number(courseFees !== undefined ? courseFees : course.fees);
    const numericDiscount = Number(discount || 0);
    const numericFinalFees = Math.max(0, numericCourseFees - numericDiscount);
    const numericPaid = Number(paymentAmount || 0);
    const numericPending = Math.max(0, numericFinalFees - numericPaid);

    const currentYear = new Date().getFullYear();
    const defaultAdmissionYear = `${currentYear}-${String(currentYear + 1).slice(-2)}`;

    // 3. Create Admission Record
    const newAdmission = await tx.admission.create({
      data: {
        admissionNumber,
        inquiryId: newInquiry.id,
        courseId: course.id,
        courseNameSnapshot: course.name,
        courseFeesSnapshot: new Prisma.Decimal(course.fees),
        admissionDate: paymentDate ? new Date(paymentDate) : new Date(),
        admissionYear: defaultAdmissionYear,
        courseFees: new Prisma.Decimal(numericCourseFees),
        discount: new Prisma.Decimal(numericDiscount),
        finalFees: new Prisma.Decimal(numericFinalFees),
        paidAmount: new Prisma.Decimal(numericPaid),
        pendingAmount: new Prisma.Decimal(numericPending),
        remarks: remarks || `Additional Course: ${course.name}`,
        studentCategory: student.admission?.studentCategory || "COLLEGE",
        guardianName: student.admission?.guardianName || student.fullName,
        guardianMobile: student.admission?.guardianMobile || student.mobile,
        guardianRelation: student.admission?.guardianRelation || "FATHER",
        admittedBy: admittedBy || "SUPER_ADMIN",
        status: "ACTIVE",
      },
    });

    // 4. Create new Student profile row (linked to new admission)
    const newStudent = await tx.student.create({
      data: {
        studentId: newStudentIdStr,
        admissionId: newAdmission.id,
        userId: null,
        fullName: student.fullName,
        fatherName: student.fatherName,
        motherName: student.motherName,
        gender: student.gender,
        dob: student.dob,
        mobile: student.mobile,
        whatsapp: student.whatsapp,
        email: student.email,
        address: student.address,
        area: student.area,
        city: student.city,
        state: student.state,
        pincode: student.pincode,
        joinedDate: paymentDate ? new Date(paymentDate) : new Date(),
        status: "ACTIVE",
      },
    });

    // Link admission -> studentId
    await tx.admission.update({
      where: { id: newAdmission.id },
      data: { studentId: newStudent.id },
    });

    // 5. Create payment record if paymentAmount > 0
    if (numericPaid > 0) {
      const seqRec = await tx.sequence.findFirst({ where: { name: "RECEIPT" } });
      let receiptNumber = null;
      if (seqRec) {
        const upRec = await tx.sequence.update({
          where: { id: seqRec.id },
          data: { currentValue: { increment: 1 } },
        });
        receiptNumber = `REC-${new Date().getFullYear()}-${String(upRec.currentValue).padStart(4, "0")}`;
      }

      await tx.admissionPayment.create({
        data: {
          admissionId: newAdmission.id,
          amount: new Prisma.Decimal(numericPaid),
          paymentMode: paymentMode || "CASH",
          transactionReference: transactionReference || receiptNumber || null,
          paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
          remarks: remarks || `Down Payment for ${course.name}`,
        },
      });
    }

    return { studentDbId: student.id };
  }, {
    timeout: 30000,
    maxWait: 10000,
  });

  return getStudentById(transactionResult.studentDbId);
};

export const deleteStudent = async (studentId) => {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
  });

  if (!student) {
    throw createHttpError("Student not found", 404);
  }

  const now = new Date();

  await prisma.$transaction([
    prisma.student.update({
      where: { id: studentId },
      data: { deletedAt: now },
    }),
    prisma.admission.updateMany({
      where: {
        OR: [
          { studentId: student.id },
          { id: student.admissionId },
        ],
      },
      data: { deletedAt: now },
    }),
  ]);

  return { message: "Student record deleted successfully" };
};
