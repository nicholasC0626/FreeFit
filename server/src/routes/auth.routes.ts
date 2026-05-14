import { Router } from "express";

import {
  loginHandler,
  logoutHandler,
  refreshHandler,
  registerHandler,
} from "../controllers/auth.controller";
import { validateBody } from "../middleware/validate.middleware";
import { loginSchema, refreshSchema, registerSchema } from "../validators/auth.validator";

const authRouter = Router();

authRouter.post("/register", validateBody(registerSchema), registerHandler);
authRouter.post("/login", validateBody(loginSchema), loginHandler);
authRouter.post("/refresh", validateBody(refreshSchema), refreshHandler);
authRouter.post("/logout", logoutHandler);

export { authRouter };
