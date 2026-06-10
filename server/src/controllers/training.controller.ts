import type { Request, RequestHandler } from "express";

import { AppError } from "../middleware/error.middleware";
import {
  addExerciseLog,
  completeSession,
  createProgram,
  deleteProgram,
  getExerciseHistory,
  getPersonalRecords,
  getSession,
  listPrograms,
  listSessions,
  logSet,
  startSession,
  updateProgram,
} from "../services/training.service";
import type {
  AddExerciseLogInput,
  CompleteSessionInput,
  CreateProgramInput,
  LogSetInput,
  StartSessionInput,
  UpdateProgramInput,
} from "../validators/training.validator";

const getUserId = (req: Request<unknown>): string | undefined =>
  (req as { user?: { id?: string } }).user?.id;

const requireUserId = (req: Request<unknown>): string => {
  const userId = getUserId(req);
  if (!userId) {
    throw new AppError(401, "Unauthorized");
  }
  return userId;
};

export const listProgramsHandler: RequestHandler = async (req, res, next) => {
  try {
    const programs = await listPrograms(requireUserId(req));
    res.status(200).json({ programs });
  } catch (error) {
    next(error);
  }
};

export const createProgramHandler: RequestHandler = async (req, res, next) => {
  try {
    const program = await createProgram(requireUserId(req), req.body as CreateProgramInput);
    res.status(201).json({ program });
  } catch (error) {
    next(error);
  }
};

export const updateProgramHandler: RequestHandler<{ id: string }> = async (req, res, next) => {
  try {
    const program = await updateProgram(
      requireUserId(req),
      req.params.id,
      req.body as UpdateProgramInput,
    );
    res.status(200).json({ program });
  } catch (error) {
    next(error);
  }
};

export const deleteProgramHandler: RequestHandler<{ id: string }> = async (req, res, next) => {
  try {
    await deleteProgram(requireUserId(req), req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const listSessionsHandler: RequestHandler = async (req, res, next) => {
  try {
    const sessions = await listSessions(requireUserId(req));
    res.status(200).json({ sessions });
  } catch (error) {
    next(error);
  }
};

export const getSessionHandler: RequestHandler<{ id: string }> = async (req, res, next) => {
  try {
    const session = await getSession(requireUserId(req), req.params.id);
    res.status(200).json({ session });
  } catch (error) {
    next(error);
  }
};

export const startSessionHandler: RequestHandler = async (req, res, next) => {
  try {
    const session = await startSession(requireUserId(req), req.body as StartSessionInput);
    res.status(201).json({ session });
  } catch (error) {
    next(error);
  }
};

export const completeSessionHandler: RequestHandler<{ id: string }> = async (req, res, next) => {
  try {
    const session = await completeSession(
      requireUserId(req),
      req.params.id,
      req.body as CompleteSessionInput,
    );
    res.status(200).json({ session });
  } catch (error) {
    next(error);
  }
};

export const addExerciseLogHandler: RequestHandler<{ id: string }> = async (req, res, next) => {
  try {
    const exerciseLog = await addExerciseLog(
      requireUserId(req),
      req.params.id,
      req.body as AddExerciseLogInput,
    );
    res.status(201).json({ exerciseLog });
  } catch (error) {
    next(error);
  }
};

export const logSetHandler: RequestHandler<{ id: string; eid: string }> = async (
  req,
  res,
  next,
) => {
  try {
    const set = await logSet(
      requireUserId(req),
      req.params.id,
      req.params.eid,
      req.body as LogSetInput,
    );
    res.status(201).json({ set });
  } catch (error) {
    next(error);
  }
};

export const exerciseHistoryHandler: RequestHandler<{ name: string }> = async (
  req,
  res,
  next,
) => {
  try {
    const history = await getExerciseHistory(
      requireUserId(req),
      decodeURIComponent(req.params.name),
    );
    res.status(200).json({ history });
  } catch (error) {
    next(error);
  }
};

export const personalRecordsHandler: RequestHandler = async (req, res, next) => {
  try {
    const prs = await getPersonalRecords(requireUserId(req));
    res.status(200).json({ prs });
  } catch (error) {
    next(error);
  }
};
