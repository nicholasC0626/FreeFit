import type { RequestHandler } from "express";

import {
  getNotificationPrefs,
  savePushToken,
  updateNotificationPrefs,
} from "../services/notification.service";
import { getUserProfile, upsertUserProfile } from "../services/user.service";
import type { NotificationPrefsInput, PushTokenInput } from "../validators/user.validator";

export const getProfileHandler: RequestHandler = async (req, res, next) => {
  try {
    const userId = (req as { user?: { id?: string } }).user?.id;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const profile = await getUserProfile(userId);
    res.status(200).json(profile);
  } catch (error) {
    next(error);
  }
};

export const upsertProfileHandler: RequestHandler = async (req, res, next) => {
  try {
    const userId = (req as { user?: { id?: string } }).user?.id;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const profile = await upsertUserProfile(userId, req.body);
    res.status(200).json(profile);
  } catch (error) {
    next(error);
  }
};

export const savePushTokenHandler: RequestHandler = async (req, res, next) => {
  try {
    const userId = (req as { user?: { id?: string } }).user?.id;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    await savePushToken(userId, req.body as PushTokenInput);
    res.status(200).json({ ok: true });
  } catch (error) {
    next(error);
  }
};

export const getNotificationPrefsHandler: RequestHandler = async (req, res, next) => {
  try {
    const userId = (req as { user?: { id?: string } }).user?.id;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const prefs = await getNotificationPrefs(userId);
    res.status(200).json({ prefs });
  } catch (error) {
    next(error);
  }
};

export const updateNotificationPrefsHandler: RequestHandler = async (req, res, next) => {
  try {
    const userId = (req as { user?: { id?: string } }).user?.id;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const prefs = await updateNotificationPrefs(userId, req.body as NotificationPrefsInput);
    res.status(200).json({ prefs });
  } catch (error) {
    next(error);
  }
};
