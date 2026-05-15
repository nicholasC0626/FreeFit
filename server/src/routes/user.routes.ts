import { Router } from "express";

import { getProfileHandler, upsertProfileHandler } from "../controllers/user.controller";
import { requireAuth } from "../middleware/auth.middleware";
import { validateBody } from "../middleware/validate.middleware";
import { upsertProfileSchema } from "../validators/user.validator";

const userRouter = Router();

userRouter.use(requireAuth);
userRouter.get("/profile", getProfileHandler);
userRouter.put("/profile", validateBody(upsertProfileSchema), upsertProfileHandler);

export { userRouter };
