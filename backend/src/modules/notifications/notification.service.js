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
    const currentMonth = today.getMonth() + 1; // 1-12
    const currentDate = today.getDate(); // 1-31

    // Find active students with dob
    const activeStudents = await prisma.student.findMany({
      where: {
        deletedAt: null,
        status: "ACTIVE",
        dob: { not: null },
      },
      select: {
        id: true,
        studentId: true,
        fullName: true,
        dob: true,
      },
    });

    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    for (const student of activeStudents) {
      if (!student.dob) continue;
      const studentDob = new Date(student.dob);
      if (studentDob.getMonth() + 1 === currentMonth && studentDob.getDate() === currentDate) {
        // Check if birthday notification already generated today
        const existingNotice = await prisma.notification.findFirst({
          where: {
            type: "STUDENT_BIRTHDAY",
            message: { contains: student.studentId },
            createdAt: { gte: startOfToday },
          },
        });

        if (!existingNotice) {
          await createNotification({
            title: `🎂 Birthday Alert Today!`,
            message: `Happy Birthday to ${student.fullName} (${student.studentId})! Wish them today.`,
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
