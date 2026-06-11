import cron from "node-cron";

import {
  caloriesLoggedToday,
  getNotifiableUsers,
  hasWorkoutToday,
  sendPushToUser,
} from "../services/notification.service";

/**
 * Reminder windows use the server's local clock (per-user timezones are a
 * post-launch concern). The cron fires every 15 minutes and each reminder
 * type fires when "now" falls inside its 15-minute window.
 */
const CHECK_INTERVAL_MINUTES = 15;
const AFTERNOON_WORKOUT_CHECK = "16:00";
const NUTRITION_CHECK = "15:00";
const LOW_CALORIE_THRESHOLD = 800;

// In-memory dedupe: one reminder per user/type/day. Resets on server restart,
// which at worst repeats a single reminder — acceptable for now.
const sentToday = new Set<string>();
let lastResetDate = "";

const todayKey = (): string => new Date().toISOString().slice(0, 10);

const resetIfNewDay = () => {
  const today = todayKey();
  if (today !== lastResetDate) {
    sentToday.clear();
    lastResetDate = today;
  }
};

const minutesOfDay = (time: string): number => {
  const [hours = 0, minutes = 0] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

/** Exported for unit tests. */
export const isInWindow = (now: Date, target: string): boolean => {
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const targetMinutes = minutesOfDay(target);
  return nowMinutes >= targetMinutes && nowMinutes < targetMinutes + CHECK_INTERVAL_MINUTES;
};

const sendOnce = async (
  userId: string,
  type: string,
  expoPushToken: string,
  title: string,
  body: string,
) => {
  const key = `${userId}:${type}:${todayKey()}`;
  if (sentToday.has(key)) {
    return;
  }
  sentToday.add(key);
  await sendPushToUser(expoPushToken, title, body);
};

export const runReminderSweep = async (now = new Date()): Promise<void> => {
  resetIfNewDay();

  const users = await getNotifiableUsers();

  for (const user of users) {
    try {
      if (user.prefs.workoutReminders) {
        if (isInWindow(now, user.prefs.morningReminderTime)) {
          await sendOnce(
            user.id,
            "workout-morning",
            user.expoPushToken,
            "Time to train 💪",
            `Morning, ${user.firstName}! Today's workout is waiting for you.`,
          );
        }

        if (isInWindow(now, AFTERNOON_WORKOUT_CHECK) && !(await hasWorkoutToday(user.id))) {
          await sendOnce(
            user.id,
            "workout-afternoon",
            user.expoPushToken,
            "No workout logged yet",
            "You haven't trained yet today. There's still time to get it in.",
          );
        }

        if (isInWindow(now, user.prefs.eveningReminderTime) && !(await hasWorkoutToday(user.id))) {
          await sendOnce(
            user.id,
            "workout-evening",
            user.expoPushToken,
            "Last chance today",
            "Don't break your streak — even 30 minutes counts.",
          );
        }
      }

      if (user.prefs.nutritionReminders && isInWindow(now, NUTRITION_CHECK)) {
        const calories = await caloriesLoggedToday(user.id);
        if (calories < LOW_CALORIE_THRESHOLD) {
          await sendOnce(
            user.id,
            "nutrition-low",
            user.expoPushToken,
            "Log your meals 🍗",
            `Only ${calories} calories logged so far today. Don't forget to log your food.`,
          );
        }
      }
    } catch (error) {
      // One user's failure must not stop the sweep for everyone else.
      console.error(`Reminder sweep failed for user ${user.id}:`, error);
    }
  }
};

export const startNotificationScheduler = (): void => {
  cron.schedule(`*/${CHECK_INTERVAL_MINUTES} * * * *`, () => {
    void runReminderSweep().catch((error) => {
      console.error("Reminder sweep crashed:", error);
    });
  });
  console.log(`Notification scheduler running (every ${CHECK_INTERVAL_MINUTES} minutes).`);
};
