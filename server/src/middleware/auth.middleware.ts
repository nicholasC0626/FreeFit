import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

import { env } from "../config/env";
import { AppError } from "./error.middleware";

type AccessJwtPayload = {
  sub: string;
  email: string;
  type: "access";
};

export type AuthenticatedRequest = Request & {
  user?: {
    id: string;
    email: string;
  };
};

export const requireAuth = (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    next(new AppError(401, "Missing or invalid authorization header"));
    return;
  }

  const token = authHeader.slice("Bearer ".length);

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as AccessJwtPayload;

    if (payload.type !== "access") {
      next(new AppError(401, "Invalid access token"));
      return;
    }

    req.user = {
      id: payload.sub,
      email: payload.email,
    };
    next();
  } catch {
    next(new AppError(401, "Invalid or expired access token"));
  }
};
