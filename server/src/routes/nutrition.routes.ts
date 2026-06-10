import { Router } from "express";

import {
  createLogHandler,
  deleteLogHandler,
  getLogsHandler,
  getSummaryHandler,
  searchFoodsHandler,
  updateLogHandler,
} from "../controllers/nutrition.controller";
import { requireAuth } from "../middleware/auth.middleware";
import { validateBody } from "../middleware/validate.middleware";
import { createFoodLogSchema, updateFoodLogSchema } from "../validators/nutrition.validator";

const nutritionRouter = Router();

nutritionRouter.use(requireAuth);
nutritionRouter.get("/summary", getSummaryHandler);
nutritionRouter.get("/search", searchFoodsHandler);
nutritionRouter.get("/log", getLogsHandler);
nutritionRouter.post("/log", validateBody(createFoodLogSchema), createLogHandler);
nutritionRouter.put("/log/:id", validateBody(updateFoodLogSchema), updateLogHandler);
nutritionRouter.delete("/log/:id", deleteLogHandler);

export { nutritionRouter };
