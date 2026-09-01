import { getUpcomingBirthdays } from '../src/modules/notifications/notification.service.js';
import { processDailyBirthdayAlerts } from '../src/cron/birthdayCron.js';
import prisma from '../src/config/prisma.js';

async function runVerification() {
  console.log('🧪 Starting Upcoming Birthdays & Birthday Cron Verification...\n');

  try {
    // 1. Test getUpcomingBirthdays service
    console.log('1️⃣ Testing getUpcomingBirthdays(30)...');
    const upcoming = await getUpcomingBirthdays(30);
    console.log(`✅ Fetched upcoming birthdays: ${upcoming.count} total student(s) in next 30 days.`);
    console.log(`   Today count: ${upcoming.todayCount}`);

    if (upcoming.students.length > 0) {
      console.log('   Sample upcoming birthdays:');
      upcoming.students.slice(0, 5).forEach((s, idx) => {
        console.log(
          `   [${idx + 1}] ${s.fullName} (${s.studentId}) - ${s.nextBirthdayDate} (${s.daysUntilText}, Turning age: ${s.turningAge})`
        );
      });
    }

    // 2. Test processDailyBirthdayAlerts cron trigger
    console.log('\n2️⃣ Testing processDailyBirthdayAlerts() execution...');
    const cronResult = await processDailyBirthdayAlerts();
    console.log('✅ Cron execution result:', cronResult);

    console.log('\n✨ ALL TESTS PASSED SUCCESSFULLY!');
  } catch (err) {
    console.error('❌ Verification failed:', err);
  } finally {
    await prisma.$disconnect();
  }
}

runVerification();
