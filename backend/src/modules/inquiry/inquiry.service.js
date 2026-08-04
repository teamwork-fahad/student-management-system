import { Prisma } from "@prisma/client";
import prisma from "../../config/prisma.js";
import { createHttpError } from "../../utils/httpError.js";

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
  await ensureInquiryReferencesExist(inquiryData);

  for (let attempt = 1; attempt <= INQUIRY_NUMBER_MAX_RETRIES; attempt += 1) {
    try {
      return await createInquiryWithGeneratedNumber(inquiryData);
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

  throw createHttpError("Unable to generate inquiry number", 500);
};

export const getAllInquiries = async (queryParams = {}) => {
  const { status, search, courseId, leadSourceId, assignedToId } = queryParams;

  const where = {
    isActive: true,
  };

  if (status) {
    where.status = status;
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
