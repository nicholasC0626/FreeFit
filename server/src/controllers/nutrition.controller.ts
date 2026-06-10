import type { Request, RequestHandler } from "express";

import {
  createFoodLog,
  deleteFoodLog,
  getDailySummary,
  getFoodLogs,
  updateFoodLog,
} from "../services/nutrition.service";
import { searchFoods } from "../services/food-api.service";
import {
  dateQuerySchema,
  searchQuerySchema,
  toLogDate,
  type CreateFoodLogInput,
  type UpdateFoodLogInput,
} from "../validators/nutrition.validator";

const getUserId = (req: Request<unknown>): string | undefined =>
  (req as { user?: { id?: string } }).user?.id;

export const getSummaryHandler: RequestHandler = async (req, res, next) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const query = dateQuerySchema.safeParse(req.query);
    if (!query.success) {
      next(query.error);
      return;
    }

    const summary = await getDailySummary(userId, toLogDate(query.data.date));
    res.status(200).json(summary);
  } catch (error) {
    next(error);
  }
};

export const searchFoodsHandler: RequestHandler = async (req, res, next) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const query = searchQuerySchema.safeParse(req.query);
    if (!query.success) {
      next(query.error);
      return;
    }

    const results = await searchFoods(query.data.q);
    res.status(200).json({ results });
  } catch (error) {
    next(error);
  }
};

export const getLogsHandler: RequestHandler = async (req, res, next) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const query = dateQuerySchema.safeParse(req.query);
    if (!query.success) {
      next(query.error);
      return;
    }

    const logs = await getFoodLogs(userId, toLogDate(query.data.date));
    res.status(200).json({ logs });
  } catch (error) {
    next(error);
  }
};

export const createLogHandler: RequestHandler = async (req, res, next) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const log = await createFoodLog(userId, req.body as CreateFoodLogInput);
    res.status(201).json({ log });
  } catch (error) {
    next(error);
  }
};

export const updateLogHandler: RequestHandler<{ id: string }> = async (req, res, next) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const log = await updateFoodLog(userId, req.params.id, req.body as UpdateFoodLogInput);
    res.status(200).json({ log });
  } catch (error) {
    next(error);
  }
};

export const deleteLogHandler: RequestHandler<{ id: string }> = async (req, res, next) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    await deleteFoodLog(userId, req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
