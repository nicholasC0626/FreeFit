import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import { env } from "../config/env";
import { prisma } from "../config/database";
import { AppError } from "../middleware/error.middleware";
import type { LoginInput, RegisterInput } from "../validators/auth.validator";

type PublicUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: Date;
  updatedAt: Date;
};

type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

type AuthResult = {
  user: PublicUser;
  tokens: AuthTokens;
};

type AccessTokenPayload = {
  sub: string;
  email: string;
  type: "access";
};

type RefreshTokenPayload = {
  sub: string;
  email: string;
  type: "refresh";
};

const ACCESS_EXPIRES_IN = "15m";
const REFRESH_EXPIRES_IN = "7d";
const SALT_ROUNDS = 12;

const toPublicUser = (user: {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: Date;
  updatedAt: Date;
}): PublicUser => ({
  id: user.id,
  email: user.email,
  firstName: user.firstName,
  lastName: user.lastName,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const generateTokens = (user: { id: string; email: string }): AuthTokens => {
  const accessToken = jwt.sign(
    {
      sub: user.id,
      email: user.email,
      type: "access",
    } satisfies AccessTokenPayload,
    env.JWT_SECRET,
    { expiresIn: ACCESS_EXPIRES_IN },
  );

  const refreshToken = jwt.sign(
    {
      sub: user.id,
      email: user.email,
      type: "refresh",
    } satisfies RefreshTokenPayload,
    env.JWT_REFRESH_SECRET,
    { expiresIn: REFRESH_EXPIRES_IN },
  );

  return { accessToken, refreshToken };
};

export const registerUser = async (input: RegisterInput): Promise<AuthResult> => {
  const existing = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (existing) {
    throw new AppError(409, "Email is already in use");
  }

  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      email: input.email,
      passwordHash,
      firstName: input.firstName,
      lastName: input.lastName,
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return {
    user: toPublicUser(user),
    tokens: generateTokens(user),
  };
};

export const loginUser = async (input: LoginInput): Promise<AuthResult> => {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (!user) {
    throw new AppError(401, "Invalid email or password");
  }

  const isMatch = await bcrypt.compare(input.password, user.passwordHash);

  if (!isMatch) {
    throw new AppError(401, "Invalid email or password");
  }

  return {
    user: toPublicUser(user),
    tokens: generateTokens(user),
  };
};

export const refreshTokens = async (refreshToken: string): Promise<AuthTokens> => {
  let payload: RefreshTokenPayload;

  try {
    payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as RefreshTokenPayload;
  } catch {
    throw new AppError(401, "Invalid refresh token");
  }

  if (payload.type !== "refresh") {
    throw new AppError(401, "Invalid refresh token");
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: { id: true, email: true },
  });

  if (!user) {
    throw new AppError(401, "Invalid refresh token");
  }

  return generateTokens(user);
};

export const logoutUser = async (): Promise<void> => {
  // Stateless tokens: server cannot revoke without token persistence.
  // Client should discard tokens; refresh token expiry limits exposure.
};
