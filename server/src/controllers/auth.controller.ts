import type { RequestHandler } from "express";

import { logoutUser, loginUser, refreshTokens, registerUser } from "../services/auth.service";

export const registerHandler: RequestHandler = async (req, res, next) => {
  try {
    const result = await registerUser(req.body);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

export const loginHandler: RequestHandler = async (req, res, next) => {
  try {
    const result = await loginUser(req.body);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const refreshHandler: RequestHandler = async (req, res, next) => {
  try {
    const result = await refreshTokens(req.body.refreshToken);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const logoutHandler: RequestHandler = async (_req, res, next) => {
  try {
    await logoutUser();
    res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
};
