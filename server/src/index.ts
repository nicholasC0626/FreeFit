import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";

import { env } from "./config/env";
import { startNotificationScheduler } from "./jobs/notification-scheduler";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware";
import { requireAuth, type AuthenticatedRequest } from "./middleware/auth.middleware";
import { aiRouter } from "./routes/ai.routes";
import { authRouter } from "./routes/auth.routes";
import { nutritionRouter } from "./routes/nutrition.routes";
import { trainingRouter } from "./routes/training.routes";
import { userRouter } from "./routes/user.routes";

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
app.use("/api/user", userRouter);
app.use("/api/nutrition", nutritionRouter);
app.use("/api/training", trainingRouter);
app.use("/api/ai", aiRouter);

app.get("/api/protected/ping", requireAuth, (req, res) => {
  const authReq = req as AuthenticatedRequest;
  res.json({ ok: true, message: "Protected route is working", user: authReq.user });
});

app.use(notFoundHandler);
app.use(errorHandler);

export { app };

// Only listen when run directly — integration tests import `app` instead.
if (require.main === module) {
  app.listen(env.PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Listening on http://localhost:${env.PORT}`);
    startNotificationScheduler();
  });
}
