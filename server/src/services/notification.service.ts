import { Expo, type ExpoPushMessage } from "expo-server-sdk";

import { prisma } from "../config/database";
import { AppError } from "../middleware/error.middleware";
import type { NotificationPrefsInput, PushTokenInput } from "../validators/user.validator";

const expo = new Expo();

// ─── Push token & preferences ────────────────────────────

export const savePushToken = async (userId: string, input: PushTokenInput) => {
  if (!Expo.isExpoPushToken(input.expoPushToken)) {
    // Store nothing rather than a token Expo will reject at send time.
    throw new AppError(400, "Invalid Expo push token");
  }

  await prisma.user.update({
    where: { id: userId },
    data: { expoPushToken: input.expoPushToken },
  });
};

export const getNotificationPrefs = async (userId: string) => {
  const existing = await prisma.notificationPreference.findUnique({ where: { userId } });
  if (existing) {
    return existing;
  }
  return prisma.notificationPreference.create({ data: { userId } });
};

export const updateNotificationPrefs = async (userId: string, input: NotificationPrefsInput) => {
  await getNotificationPrefs(userId); // ensure the row exists

  return prisma.notificationPreference.update({
    where: { userId },
    data: {
      ...(input.workoutReminders !== undefined
        ? { workoutReminders: input.workoutReminders }
        : {}),
      ...(input.nutritionReminders !== undefined
        ? { nutritionReminders: input.nutritionReminders }
        : {}),
      ...(input.morningReminderTime !== undefined
        ? { morningReminderTime: input.morningReminderTime }
        : {}),
      ...(input.eveningReminderTime !== undefined
        ? { eveningReminderTime: input.eveningReminderTime }
        : {}),
    },
  });
};

// ─── Sending ─────────────────────────────────────────────

export const sendPushToUser = async (
  expoPushToken: string,
  title: string,
  body: string,
): Promise<boolean> => {
  if (!Expo.isExpoPushToken(expoPushToken)) {
    return false;
  }

  const message: ExpoPushMessage = {
    to: expoPushToken,
    sound: "default",
    title,
    body,
  };

  try {
    const [ticket] = await expo.sendPushNotificationsAsync([message]);
    return ticket?.status === "ok";
  } catch (error) {
    // Push failures must never crash the scheduler.
    console.error("Failed to send push notification:", error);
    return false;
  }
};

// ─── Reminder decisions ──────────────────────────────────

const utcToday = (): Date => {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
};

export const hasWorkoutToday = async (userId: string): Promise<boolean> => {
  const count = await prisma.workoutSession.count({
    where: { userId, date: utcToday() },
  });
  return count > 0;
};

export const caloriesLoggedToday = async (userId: string): Promise<number> => {
  const aggregate = await prisma.foodLog.aggregate({
    where: { userId, date: utcToday() },
    _sum: { calories: true },
  });
  return aggregate._sum.calories ?? 0;
};

/** Users who can receive pushes, with their prefs (defaults if never saved). */
export const getNotifiableUsers = async () => {
  const users = await prisma.user.findMany({
    where: { expoPushToken: { not: null } },
    select: {
      id: true,
      firstName: true,
      expoPushToken: true,
      notifications: true,
    },
  });

  return users.map((user) => ({
    id: user.id,
    firstName: user.firstName,
    expoPushToken: user.expoPushToken as string,
    prefs: user.notifications ?? {
      workoutReminders: true,
      nutritionReminders: true,
      morningReminderTime: "08:00",
      eveningReminderTime: "20:00",
    },
  }));
};
