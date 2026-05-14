import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";

import { env } from "./config/env";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware";
import { requireAuth, type AuthenticatedRequest } from "./middleware/auth.middleware";
import { authRouter } from "./routes/auth.routes";

const app = express();

app.disable("x-powered-by");

app.use(helmet());
app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);
app.use(express.json({ limit: "1mb" }));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === "/health" || req.path === "/",
});

app.use(apiLimiter);

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    env: env.NODE_ENV,
    uptimeSeconds: Math.round(process.uptime()),
  });
});

app.get("/", (_req, res) => {
  res.json({ name: "FreeFit API", health: "/health" });
});

app.use("/api/auth", authRouter);

app.get("/api/protected/ping", requireAuth, (req, res) => {
  const authReq = req as AuthenticatedRequest;
  res.json({ ok: true, message: "Protected route is working", user: authReq.user });
});

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(env.PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Listening on http://localhost:${env.PORT}`);
});
