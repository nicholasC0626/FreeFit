import type { Request, RequestHandler } from "express";

import { AppError } from "../middleware/error.middleware";
import {
  chatWithTrainer,
  generateProgram,
  reviewProgram,
  suggestExercises,
} from "../services/ai.service";
import type {
  ChatInput,
  GenerateProgramInput,
  ReviewProgramInput,
  SuggestExercisesInput,
} from "../validators/ai.validator";

const requireUserId = (req: Request): string => {
  const userId = (req as { user?: { id?: string } }).user?.id;
  if (!userId) {
    throw new AppError(401, "Unauthorized");
  }
  return userId;
};

export const chatHandler: RequestHandler = async (req, res, next) => {
  try {
    const reply = await chatWithTrainer(requireUserId(req), req.body as ChatInput);
    res.status(200).json({ reply });
  } catch (error) {
    next(error);
  }
};

export const generateProgramHandler: RequestHandler = async (req, res, next) => {
  try {
    const program = await generateProgram(requireUserId(req), req.body as GenerateProgramInput);
    res.status(201).json({ program });
  } catch (error) {
    next(error);
  }
};

export const reviewProgramHandler: RequestHandler = async (req, res, next) => {
  try {
    const result = await reviewProgram(requireUserId(req), req.body as ReviewProgramInput);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const suggestExercisesHandler: RequestHandler = async (req, res, next) => {
  try {
    const suggestions = await suggestExercises(
      requireUserId(req),
      req.body as SuggestExercisesInput,
    );
    res.status(200).json({ suggestions });
  } catch (error) {
    next(error);
  }
};
