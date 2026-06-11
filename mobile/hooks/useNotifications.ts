import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";

import { registerPushToken } from "../services/notification.service";
import { useAuthStore } from "../stores/auth.store";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Registers this device for push notifications once per session after login.
 * Quietly does nothing on web, simulators, or when permission is denied —
 * notifications are an enhancement, never a blocker.
 */
export const useNotifications = (): void => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const hasRegistered = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || hasRegistered.current) {
      return;
    }
    if (Platform.OS === "web" || !Device.isDevice) {
      return;
    }

    const register = async () => {
      try {
        if (Platform.OS === "android") {
          await Notifications.setNotificationChannelAsync("default", {
            name: "default",
            importance: Notifications.AndroidImportance.DEFAULT,
          });
        }

        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== "granted") {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
        if (finalStatus !== "granted") {
          return;
        }

        const projectId =
          Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
        const tokenResponse = await Notifications.getExpoPushTokenAsync(
          projectId ? { projectId } : undefined,
        );

        await registerPushToken(tokenResponse.data);
        hasRegistered.current = true;
      } catch {
        // Expo Go without an EAS project, denied permission, or offline —
        // all fine, the app works without push.
      }
    };

    void register();
  }, [isAuthenticated]);
};
