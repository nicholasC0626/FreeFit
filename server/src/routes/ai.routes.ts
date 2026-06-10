import { Router } from "express";

import { chatHandler, generateProgramHandler } from "../controllers/ai.controller";
import { requireAuth } from "../middleware/auth.middleware";
import { validateBody } from "../middleware/validate.middleware";
import { chatSchema, generateProgramSchema } from "../validators/ai.validator";

const aiRouter = Router();

aiRouter.use(requireAuth);
aiRouter.post("/chat", validateBody(chatSchema), chatHandler);
aiRouter.post("/generate-program", validateBody(generateProgramSchema), generateProgramHandler);

export { aiRouter };
