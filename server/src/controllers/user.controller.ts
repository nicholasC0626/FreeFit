import type { RequestHandler } from "express";

import { getUserProfile, upsertUserProfile } from "../services/user.service";

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
