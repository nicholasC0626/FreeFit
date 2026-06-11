/** Temporary manual test for the notification scheduler. Run: npx tsx scripts/test-scheduler.ts */
import { prisma } from "../src/config/database";
import {
  caloriesLoggedToday,
  getNotifiableUsers,
  hasWorkoutToday,
} from "../src/services/notification.service";
import { runReminderSweep } from "../src/jobs/notification-scheduler";

const at = (hours: number, minutes: number): Date => {
  const d = new Date();
  d.setHours(hours, minutes, 0, 0);
  return d;
};

const main = async () => {
  const users = await getNotifiableUsers();
  console.log(`Notifiable users: ${users.length}`);
  for (const user of users) {
    console.log(
      `  ${user.firstName}: workout=${user.prefs.workoutReminders} nutrition=${user.prefs.nutritionReminders} ` +
        `morning=${user.prefs.morningReminderTime} evening=${user.prefs.eveningReminderTime} ` +
        `trainedToday=${await hasWorkoutToday(user.id)} caloriesToday=${await caloriesLoggedToday(user.id)}`,
    );
  }

  // Each window, including a duplicate run to confirm dedupe doesn't throw.
  await runReminderSweep(at(7, 35));
  console.log("sweep 07:35 (morning window) OK");
  await runReminderSweep(at(15, 5));
  console.log("sweep 15:05 (nutrition window) OK");
  await runReminderSweep(at(15, 5));
  console.log("sweep 15:05 repeat (dedupe) OK");
  await runReminderSweep(at(16, 5));
  console.log("sweep 16:05 (afternoon workout window) OK");
  await runReminderSweep(at(20, 5));
  console.log("sweep 20:05 (evening window) OK");
  await runReminderSweep(at(12, 0));
  console.log("sweep 12:00 (no window) OK");

  // Cleanup: remove the fake push token so the live scheduler doesn't
  // try to push to a junk token every day.
  await prisma.user.updateMany({
    where: { email: "phase6test@test.com" },
    data: { expoPushToken: null },
  });
  console.log("Cleaned up test push token.");
  process.exit(0);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
