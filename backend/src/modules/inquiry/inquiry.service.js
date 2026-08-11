import { Prisma } from "@prisma/client";
import prisma from "../../config/prisma.js";
import { createHttpError } from "../../utils/httpError.js";
import { sendAdminInquiryNotification } from "../../utils/emailService.js";
import { createNotification } from "../notifications/notification.service.js";

const INQUIRY_NUMBER_PREFIX = "INQ";
const INQUIRY_NUMBER_MAX_RETRIES = 3;

const inquiryInclude = {
  course: true,
  leadSource: true,
  assignedTo: {
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  },
};

const followUpInclude = {
  createdBy: {
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  },
};

const getCurrentYear = () => new Date().getFullYear();

const buildInquiryNumber = (year, sequence) => {
  return `${INQUIRY_NUMBER_PREFIX}-${year}-${String(sequence).padStart(4, "0")}`;
};

const getNextInquiryNumber = async (tx) => {
  const year = getCurrentYear();
  const prefix = `${INQUIRY_NUMBER_PREFIX}-${year}-`;

  const latestInquiry = await tx.inquiry.findFirst({
    where: {
      inquiryNumber: {
        startsWith: prefix,
      },
    },
    orderBy: {
      inquiryNumber: "desc",
    },
    select: {
      inquiryNumber: true,
    },
  });

  const latestSequence = latestInquiry
    ? Number(latestInquiry.inquiryNumber.split("-")[2])
    : 0;

  return buildInquiryNumber(year, latestSequence + 1);
};

const checkDuplicateInquiryOrStudent = async (mobile, email, allowDuplicate = false) => {
  if (allowDuplicate) return;

  const cleanMobile = String(mobile || "").trim();
  const cleanEmail = email ? String(email || "").trim() : null;

  if (!cleanMobile && !cleanEmail) return;

  const existingInquiry = await prisma.inquiry.findFirst({
    where: {
      isActive: true,
      OR: [
        { mobile: cleanMobile },
        ...(cleanEmail ? [{ email: cleanEmail }] : []),
      ],
    },
    include: { course: true },
  });

  if (existingInquiry) {
    throw createHttpError(
      `An inquiry already exists with this mobile (${cleanMobile}) or email address. Duplicate inquiry submission is disabled unless explicitly allowed by Admin.`,
      409
    );
  }

  const existingStudent = await prisma.student.findFirst({
    where: {
      deletedAt: null,
      OR: [
        { mobile: cleanMobile },
        ...(cleanEmail ? [{ email: cleanEmail }] : []),
      ],
    },
  });

  if (existingStudent) {
    throw createHttpError(
      `A registered student already exists with mobile (${cleanMobile}). Cannot generate duplicate inquiry.`,
      409
    );
  }
};

const getActiveInquiryById = async (id) => {
  const inquiry = await prisma.inquiry.findFirst({
    where: {
      id,
      isActive: true,
    },
    include: inquiryInclude,
  });

  if (!inquiry) {
    throw createHttpError("Inquiry not found", 404);
  }

  return inquiry;
};

const ensureCourseExists = async (courseId) => {
  const course = await prisma.course.findFirst({
    where: {
      id: courseId,
      isActive: true,
    },
    select: {
      id: true,
    },
  });

  if (!course) {
    throw createHttpError("Course not found", 404);
  }
};

const ensureLeadSourceExists = async (leadSourceId) => {
  const leadSource = await prisma.leadSource.findFirst({
    where: {
      id: leadSourceId,
      isActive: true,
    },
    select: {
      id: true,
    },
  });

  if (!leadSource) {
    throw createHttpError("Lead source not found", 404);
  }
};

const ensureAssignedUserExists = async (assignedToId) => {
  const user = await prisma.user.findFirst({
    where: {
      id: assignedToId,
      isActive: true,
    },
    select: {
      id: true,
    },
  });

  if (!user) {
    throw createHttpError("Assigned user not found", 404);
  }
};

const ensureInquiryReferencesExist = async (data) => {
  await Promise.all([
    data.courseId ? ensureCourseExists(data.courseId) : Promise.resolve(),
    data.leadSourceId ? ensureLeadSourceExists(data.leadSourceId) : Promise.resolve(),
    data.assignedToId ? ensureAssignedUserExists(data.assignedToId) : Promise.resolve(),
  ]);
};

const createInquiryWithGeneratedNumber = async (inquiryData) => {
  return prisma.$transaction(async (tx) => {
    const inquiryNumber = await getNextInquiryNumber(tx);

    return tx.inquiry.create({
      data: {
        ...inquiryData,
        inquiryNumber,
      },
      include: inquiryInclude,
    });
  });
};

export const createLeadSource = async (leadSourceData) => {
  const existing = await prisma.leadSource.findUnique({
    where: { name: leadSourceData.name },
  });

  if (existing) {
    if (!existing.isActive) {
      return prisma.leadSource.update({
        where: { id: existing.id },
        data: { isActive: true, description: leadSourceData.description },
      });
    }
    throw createHttpError("Lead source already exists", 409);
  }

  return prisma.leadSource.create({
    data: leadSourceData,
  });
};

export const getAllLeadSources = async () => {
  return prisma.leadSource.findMany({
    where: {
      isActive: true,
    },
    orderBy: {
      name: "asc",
    },
  });
};

export const createInquiry = async (inquiryData) => {
  const { allowDuplicate, ...cleanData } = inquiryData;

  if (!cleanData.gender) cleanData.gender = "Male";
  if (!cleanData.nextFollowUpDate) cleanData.nextFollowUpDate = new Date(Date.now() + 3 * 86400000);
  if (cleanData.expectedFees === undefined) cleanData.expectedFees = 0;

  await checkDuplicateInquiryOrStudent(cleanData.mobile, cleanData.email, allowDuplicate);
  await ensureInquiryReferencesExist(cleanData);

  let newInquiry = null;

  for (let attempt = 1; attempt <= INQUIRY_NUMBER_MAX_RETRIES; attempt += 1) {
    try {
      newInquiry = await createInquiryWithGeneratedNumber(cleanData);
      break;

    } catch (error) {
      const isInquiryNumberConflict =
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002" &&
        error.meta?.target?.includes("inquiryNumber");

      if (!isInquiryNumberConflict || attempt === INQUIRY_NUMBER_MAX_RETRIES) {
        throw error;
      }
    }
  }

  if (!newInquiry) {
    throw createHttpError("Unable to generate inquiry number", 500);
  }

  // Send Email Alert to Admin
  sendAdminInquiryNotification({
    inquiryNumber: newInquiry.inquiryNumber,
    fullName: newInquiry.fullName,
    mobile: newInquiry.mobile,
    email: newInquiry.email,
    courseName: newInquiry.course?.name || "General Course",
    remarks: newInquiry.remarks,
  }).catch((e) => console.error("[EMAIL NOTIFICATION TRIGGER ERROR]:", e));

  // Create In-App Notification for Admin
  await createNotification({
    title: "📩 New Inquiry Received",
    message: `New Inquiry from ${newInquiry.fullName} (${newInquiry.mobile}) for ${newInquiry.course?.name || "Course"}.`,
    type: "NEW_INQUIRY",
    link: "/dashboard/inquiries",
  }).catch((e) => console.error("[IN-APP NOTIFICATION ERROR]:", e));

  return newInquiry;
};


export const getAllInquiries = async (queryParams = {}) => {
  const { status, search, courseId, leadSourceId, assignedToId } = queryParams;

  const where = {
    isActive: true,
  };

  if (status) {
    if (status === "EXCLUDE_ADMISSION_DONE") {
      where.status = { not: "ADMISSION_DONE" };
    } else if (status !== "ALL") {
      where.status = status;
    }
  } else {
    // By default, show active pending inquiries (exclude ADMISSION_DONE)
    where.status = { not: "ADMISSION_DONE" };
  }

  if (courseId) {
    where.courseId = courseId;
  }

  if (leadSourceId) {
    where.leadSourceId = leadSourceId;
  }

  if (assignedToId) {
    where.assignedToId = assignedToId;
  }

  if (search) {
    where.OR = [
      { fullName: { contains: search, mode: "insensitive" } },
      { mobile: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { inquiryNumber: { contains: search, mode: "insensitive" } },
    ];
  }

  return prisma.inquiry.findMany({
    where,
    include: inquiryInclude,
    orderBy: {
      createdAt: "desc",
    },
  });
};

export const getInquiryById = async (id) => {
  return getActiveInquiryById(id);
};

export const updateInquiry = async (id, inquiryData) => {
  await getActiveInquiryById(id);
  await ensureInquiryReferencesExist(inquiryData);

  return prisma.inquiry.update({
    where: {
      id,
    },
    data: inquiryData,
    include: inquiryInclude,
  });
};

export const softDeleteInquiry = async (id) => {
  await getActiveInquiryById(id);

  return prisma.inquiry.update({
    where: {
      id,
    },
    data: {
      isActive: false,
    },
    include: inquiryInclude,
  });
};

export const bulkDeleteInquiries = async (inquiryIds = []) => {
  if (!Array.isArray(inquiryIds) || inquiryIds.length === 0) {
    throw createHttpError("No inquiry IDs provided for deletion", 400);
  }

  const result = await prisma.inquiry.updateMany({
    where: {
      id: { in: inquiryIds },
    },
    data: {
      isActive: false,
    },
  });

  return result;
};

export const addFollowUp = async (id, followUpData, createdById) => {
  await getActiveInquiryById(id);

  return prisma.$transaction(async (tx) => {
    const followUp = await tx.inquiryFollowUp.create({
      data: {
        inquiryId: id,
        followUpDate: followUpData.followUpDate || new Date(),
        remarks: followUpData.remarks,
        nextFollowUpDate: followUpData.nextFollowUpDate,
        createdById,
      },
      include: followUpInclude,
    });

    const nextStatus = followUpData.status || "FOLLOW_UP";

    const updateData = {
      lastContactDate: followUp.followUpDate,
      status: nextStatus,
    };

    if (followUpData.nextFollowUpDate) {
      updateData.nextFollowUpDate = followUpData.nextFollowUpDate;
    }

    await tx.inquiry.update({
      where: {
        id,
      },
      data: updateData,
    });

    return followUp;
  });
};

export const getFollowUpHistory = async (id) => {
  await getActiveInquiryById(id);

  return prisma.inquiryFollowUp.findMany({
    where: {
      inquiryId: id,
    },
    include: followUpInclude,
    orderBy: {
      createdAt: "desc",
    },
  });
};

export const convertInquiry = async (id) => {
  await getActiveInquiryById(id);

  const updatedInquiry = await prisma.inquiry.update({
    where: {
      id,
    },
    data: {
      status: "ADMISSION_DONE",
    },
    include: inquiryInclude,
  });

  return {
    readyForAdmission: true,
    inquiry: updatedInquiry,
  };
};

export const createPublicInquiry = async (data) => {
  const { fullName, mobile, email, courseId, remarks, allowDuplicate } = data;

  await checkDuplicateInquiryOrStudent(mobile, email, allowDuplicate);

  let adminUser = await prisma.user.findFirst({ where: { role: "SUPER_ADMIN" } });
  let leadSource = await prisma.leadSource.findFirst();
  
  if (!courseId) {
    throw createHttpError("Please select a course for your inquiry.", 400);
  }

  let course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) {
    throw createHttpError("Selected course does not exist.", 400);
  }

  const nextInquiryNumber = await getNextInquiryNumber(prisma);
  const now = new Date();

  const newInquiry = await prisma.inquiry.create({
    data: {
      inquiryNumber: nextInquiryNumber,
      fullName: String(fullName).trim(),
      mobile: String(mobile).trim(),
      whatsapp: String(mobile).trim(),
      gender: "Male",
      email: email ? String(email).trim() : null,
      remarks: remarks ? String(remarks).trim() : "Public website inquiry",
      expectedFees: course.fees,
      inquiryDate: now,
      nextFollowUpDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
      status: "NEW",
      courseId: course.id,
      leadSourceId: leadSource ? leadSource.id : "default_ls",
      assignedToId: adminUser ? adminUser.id : "admin",
    },
    include: inquiryInclude,
  });

  // Send Email Alert to Admin
  sendAdminInquiryNotification({
    inquiryNumber: newInquiry.inquiryNumber,
    fullName: newInquiry.fullName,
    mobile: newInquiry.mobile,
    email: newInquiry.email,
    courseName: course.name,
    remarks: newInquiry.remarks,
  }).catch((e) => console.error("[EMAIL NOTIFICATION TRIGGER ERROR]:", e));

  // Create In-App Notification for Admin
  await createNotification({
    title: "📩 New Inquiry Received",
    message: `New Inquiry from ${newInquiry.fullName} (${newInquiry.mobile}) for ${course.name}.`,
    type: "NEW_INQUIRY",
    link: "/dashboard/inquiries",
  }).catch((e) => console.error("[IN-APP NOTIFICATION ERROR]:", e));

  return newInquiry;
};

