import { api } from "./api";
import { useAuthStore } from "../stores/auth.store";

const authHeaders = () => {
  const accessToken = useAuthStore.getState().accessToken;
  return accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined;
};

export type NotificationPrefs = {
  workoutReminders: boolean;
  nutritionReminders: boolean;
  morningReminderTime: string;
  eveningReminderTime: string;
};

export const registerPushToken = async (expoPushToken: string): Promise<void> => {
  await api.put(
    "/api/user/push-token",
    { expoPushToken },
    { headers: authHeaders() },
  );
};

export const getNotificationPrefs = async (): Promise<NotificationPrefs> => {
  const { data } = await api.get<{ prefs: NotificationPrefs }>("/api/user/notification-prefs", {
    headers: authHeaders(),
  });
  return data.prefs;
};

export const updateNotificationPrefs = async (
  patch: Partial<NotificationPrefs>,
): Promise<NotificationPrefs> => {
  const { data } = await api.put<{ prefs: NotificationPrefs }>(
    "/api/user/notification-prefs",
    patch,
    { headers: authHeaders() },
  );
  return data.prefs;
};
