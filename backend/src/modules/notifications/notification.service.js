import prisma from "../../config/prisma.js";
import { createHttpError } from "../../utils/httpError.js";

/**
 * Helper to create an in-app notification
 */
export const createNotification = async ({
  title,
  message,
  type = "SYSTEM",
  link = null,
  recipientId = null,
}) => {
  try {
    return await prisma.notification.create({
      data: {
        title,
        message,
        type,
        link,
        recipientId,
      },
    });
  } catch (err) {
    console.error("[NOTIFICATION CREATE ERROR]:", err);
    return null;
  }
};

/**
 * Check and generate birthday notifications for students whose birthday is today
 */
export const checkAndGenerateBirthdayNotifications = async () => {
  try {
    const today = new Date();
    const currentMonth = today.getMonth() + 1; // 1-12 (Local)
    const currentDate = today.getDate(); // 1-31 (Local)
    const currentUTCMonth = today.getUTCMonth() + 1;
    const currentUTCDate = today.getUTCDate();

    // Find active & revision students with a registered date of birth
    const activeStudents = await prisma.student.findMany({
      where: {
        deletedAt: null,
        status: { in: ["ACTIVE", "REVISION"] },
        dob: { not: null },
      },
      select: {
        id: true,
        studentId: true,
        fullName: true,
        mobile: true,
        dob: true,
      },
    });

    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    for (const student of activeStudents) {
      if (!student.dob) continue;
      const dobObj = new Date(student.dob);
      
      const dobLocalMonth = dobObj.getMonth() + 1;
      const dobLocalDate = dobObj.getDate();
      const dobUTCMonth = dobObj.getUTCMonth() + 1;
      const dobUTCDate = dobObj.getUTCDate();

      // Match either local or UTC month & date
      const isBirthdayToday =
        (dobLocalMonth === currentMonth && dobLocalDate === currentDate) ||
        (dobUTCMonth === currentUTCMonth && dobUTCDate === currentUTCDate) ||
        (dobUTCMonth === currentMonth && dobUTCDate === currentDate);

      if (isBirthdayToday) {
        // Check if birthday notification was already created today for this student
        const existingNotice = await prisma.notification.findFirst({
          where: {
            type: "STUDENT_BIRTHDAY",
            OR: [
              { message: { contains: student.studentId } },
              { message: { contains: student.fullName } },
            ],
            createdAt: { gte: startOfToday },
          },
        });

        if (!existingNotice) {
          await createNotification({
            title: `🎂 Today is ${student.fullName}'s Birthday!`,
            message: `🎉 Happy Birthday to ${student.fullName} (${student.studentId})! Contact/WhatsApp: ${student.mobile}. Wish them today!`,
            type: "STUDENT_BIRTHDAY",
            link: `/dashboard/students`,
          });
        }
      }
    }
  } catch (err) {
    console.error("[BIRTHDAY NOTIFICATION CHECK ERROR]:", err);
  }
};

/**
 * Retrieve notifications for current user/admin with unread count
 */
export const getNotifications = async (userId) => {
  // Generate birthday notifications on fetch
  await checkAndGenerateBirthdayNotifications();

  const notifications = await prisma.notification.findMany({
    where: {
      OR: [
        { recipientId: null },
        { recipientId: userId },
      ],
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 50,
  });

  const unreadCount = await prisma.notification.count({
    where: {
      OR: [
        { recipientId: null },
        { recipientId: userId },
      ],
      isRead: false,
    },
  });

  return {
    notifications,
    unreadCount,
  };
};

/**
 * Mark a single notification as read
 */
export const markNotificationAsRead = async (notificationId) => {
  const existing = await prisma.notification.findUnique({
    where: { id: notificationId },
  });

  if (!existing) {
    throw createHttpError("Notification not found", 404);
  }

  return prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true },
  });
};

/**
 * Mark ALL notifications as read
 */
export const markAllNotificationsAsRead = async (userId) => {
  await prisma.notification.updateMany({
    where: {
      OR: [
        { recipientId: null },
        { recipientId: userId },
      ],
      isRead: false,
    },
    data: { isRead: true },
  });

  return { message: "All notifications marked as read" };
};
