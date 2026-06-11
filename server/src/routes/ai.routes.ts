import { Router } from "express";

import {
  chatHandler,
  generateProgramHandler,
  reviewProgramHandler,
  suggestExercisesHandler,
} from "../controllers/ai.controller";
import { requireAuth } from "../middleware/auth.middleware";
import { validateBody } from "../middleware/validate.middleware";
import {
  chatSchema,
  generateProgramSchema,
  reviewProgramSchema,
  suggestExercisesSchema,
} from "../validators/ai.validator";

const aiRouter = Router();

aiRouter.use(requireAuth);
aiRouter.post("/chat", validateBody(chatSchema), chatHandler);
aiRouter.post("/generate-program", validateBody(generateProgramSchema), generateProgramHandler);
aiRouter.post("/review-program", validateBody(reviewProgramSchema), reviewProgramHandler);
aiRouter.post("/suggest-exercises", validateBody(suggestExercisesSchema), suggestExercisesHandler);

export { aiRouter };
