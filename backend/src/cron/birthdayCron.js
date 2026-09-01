import cron from "node-cron";
import prisma from "../config/prisma.js";
import { checkAndGenerateBirthdayNotifications } from "../modules/notifications/notification.service.js";
import {
  sendAdminBirthdayDigestEmail,
  sendStudentBirthdayWishEmail,
} from "../utils/emailService.js";

/**
 * Process daily 9:00 AM Birthday alerts & email notifications
 */
export const processDailyBirthdayAlerts = async () => {
  console.log("⏰ [CRON RUN] Running Daily 9:00 AM Birthday Alert Task...");

  try {
    // 1. Generate in-app notifications
    await checkAndGenerateBirthdayNotifications();

    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentDate = today.getDate();
    const currentUTCMonth = today.getUTCMonth() + 1;
    const currentUTCDate = today.getUTCDate();

    // 2. Fetch active students with DOB
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
        email: true,
        dob: true,
      },
    });

    const todayBirthdayStudents = activeStudents.filter((student) => {
      if (!student.dob) return false;
      const d = new Date(student.dob);
      const lm = d.getMonth() + 1;
      const ld = d.getDate();
      const um = d.getUTCMonth() + 1;
      const ud = d.getUTCDate();

      return (
        (lm === currentMonth && ld === currentDate) ||
        (um === currentUTCMonth && ud === currentUTCDate) ||
        (um === currentMonth && ud === currentDate)
      );
    });

    if (todayBirthdayStudents.length === 0) {
      console.log("ℹ️ [CRON RUN] No student birthdays today.");
      return { success: true, count: 0, message: "No birthdays today" };
    }

    console.log(
      `🎉 [CRON RUN] Found ${todayBirthdayStudents.length} student(s) having birthday today!`
    );

    // 3. Send Daily Digest Email to Admin
    await sendAdminBirthdayDigestEmail(todayBirthdayStudents);

    // 4. Send Individual Birthday Wish Emails to Students
    for (const student of todayBirthdayStudents) {
      if (student.email) {
        await sendStudentBirthdayWishEmail(student);
      }
    }

    return {
      success: true,
      count: todayBirthdayStudents.length,
      students: todayBirthdayStudents,
    };
  } catch (err) {
    console.error("❌ [CRON ERROR] Failed to process daily birthday alerts:", err);
    return { success: false, error: err.message };
  }
};

/**
 * Initialize Node-Cron scheduler (Runs daily at 09:00 AM local server time)
 */
export const initBirthdayCron = () => {
  // Schedule: 0 9 * * * (9:00 AM every day)
  cron.schedule("0 9 * * *", async () => {
    await processDailyBirthdayAlerts();
  });

  console.log("📅 [CRON INITIALIZED] Daily 9:00 AM Birthday Email Cron Job is Active (0 9 * * *).");
};
