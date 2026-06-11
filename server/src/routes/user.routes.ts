import { Router } from "express";

import {
  getNotificationPrefsHandler,
  getProfileHandler,
  savePushTokenHandler,
  updateNotificationPrefsHandler,
  upsertProfileHandler,
} from "../controllers/user.controller";
import { requireAuth } from "../middleware/auth.middleware";
import { validateBody } from "../middleware/validate.middleware";
import {
  notificationPrefsSchema,
  pushTokenSchema,
  upsertProfileSchema,
} from "../validators/user.validator";

const userRouter = Router();

userRouter.use(requireAuth);
userRouter.get("/profile", getProfileHandler);
userRouter.put("/profile", validateBody(upsertProfileSchema), upsertProfileHandler);
userRouter.put("/push-token", validateBody(pushTokenSchema), savePushTokenHandler);
userRouter.get("/notification-prefs", getNotificationPrefsHandler);
userRouter.put(
  "/notification-prefs",
  validateBody(notificationPrefsSchema),
  updateNotificationPrefsHandler,
);

export { userRouter };
