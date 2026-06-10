import { Router } from "express";

import {
  addExerciseLogHandler,
  completeSessionHandler,
  createProgramHandler,
  deleteProgramHandler,
  exerciseHistoryHandler,
  getSessionHandler,
  listProgramsHandler,
  listSessionsHandler,
  logSetHandler,
  personalRecordsHandler,
  startSessionHandler,
  updateProgramHandler,
} from "../controllers/training.controller";
import { requireAuth } from "../middleware/auth.middleware";
import { validateBody } from "../middleware/validate.middleware";
import {
  addExerciseLogSchema,
  completeSessionSchema,
  createProgramSchema,
  logSetSchema,
  startSessionSchema,
  updateProgramSchema,
} from "../validators/training.validator";

const trainingRouter = Router();

trainingRouter.use(requireAuth);

trainingRouter.get("/programs", listProgramsHandler);
trainingRouter.post("/programs", validateBody(createProgramSchema), createProgramHandler);
trainingRouter.put("/programs/:id", validateBody(updateProgramSchema), updateProgramHandler);
trainingRouter.delete("/programs/:id", deleteProgramHandler);

trainingRouter.get("/sessions", listSessionsHandler);
trainingRouter.post("/sessions", validateBody(startSessionSchema), startSessionHandler);
trainingRouter.get("/sessions/:id", getSessionHandler);
trainingRouter.put("/sessions/:id", validateBody(completeSessionSchema), completeSessionHandler);
trainingRouter.post(
  "/sessions/:id/exercises",
  validateBody(addExerciseLogSchema),
  addExerciseLogHandler,
);
trainingRouter.post(
  "/sessions/:id/exercises/:eid/sets",
  validateBody(logSetSchema),
  logSetHandler,
);

trainingRouter.get("/exercise-history/:name", exerciseHistoryHandler);
trainingRouter.get("/prs", personalRecordsHandler);

export { trainingRouter };
