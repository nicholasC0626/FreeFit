import type { Request, RequestHandler } from "express";

import { AppError } from "../middleware/error.middleware";
import { chatWithTrainer, generateProgram } from "../services/ai.service";
import type { ChatInput, GenerateProgramInput } from "../validators/ai.validator";

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
