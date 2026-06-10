import { prisma } from "../config/database";
import { AppError } from "../middleware/error.middleware";
import type {
  AddExerciseLogInput,
  CompleteSessionInput,
  CreateProgramInput,
  LogSetInput,
  StartSessionInput,
  UpdateProgramInput,
} from "../validators/training.validator";

const programInclude = {
  workoutTemplates: {
    orderBy: { order: "asc" },
    include: {
      exercises: { orderBy: { order: "asc" } },
    },
  },
} as const;

const sessionInclude = {
  workoutTemplate: {
    include: { exercises: { orderBy: { order: "asc" } } },
  },
  exerciseLogs: {
    orderBy: { order: "asc" },
    include: { sets: { orderBy: { setNumber: "asc" } } },
  },
} as const;

// ─── Programs ────────────────────────────────────────────

export const listPrograms = async (userId: string) => {
  return prisma.program.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: programInclude,
  });
};

export const createProgram = async (userId: string, input: CreateProgramInput) => {
  return prisma.program.create({
    data: {
      userId,
      name: input.name,
      description: input.description ?? null,
      workoutTemplates: {
        create: input.workouts.map((workout, workoutIndex) => ({
          name: workout.name,
          dayOfWeek: workout.dayOfWeek ?? null,
          order: workoutIndex,
          exercises: {
            create: workout.exercises.map((exercise, exerciseIndex) => ({
              exerciseName: exercise.exerciseName,
              muscleGroup: exercise.muscleGroup,
              sets: exercise.sets,
              repRangeMin: exercise.repRangeMin,
              repRangeMax: exercise.repRangeMax,
              restSeconds: exercise.restSeconds ?? 120,
              notes: exercise.notes ?? null,
              order: exerciseIndex,
            })),
          },
        })),
      },
    },
    include: programInclude,
  });
};

const assertOwnedProgram = async (userId: string, programId: string) => {
  const program = await prisma.program.findUnique({
    where: { id: programId },
    select: { userId: true },
  });
  if (!program || program.userId !== userId) {
    throw new AppError(404, "Program not found");
  }
};

export const updateProgram = async (
  userId: string,
  programId: string,
  input: UpdateProgramInput,
) => {
  await assertOwnedProgram(userId, programId);

  return prisma.program.update({
    where: { id: programId },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
    },
    include: programInclude,
  });
};

export const deleteProgram = async (userId: string, programId: string) => {
  await assertOwnedProgram(userId, programId);
  await prisma.program.delete({ where: { id: programId } });
};

// ─── Sessions ────────────────────────────────────────────

const utcToday = (): Date => {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
};

export const startSession = async (userId: string, input: StartSessionInput) => {
  if (input.workoutTemplateId) {
    const template = await prisma.workoutTemplate.findUnique({
      where: { id: input.workoutTemplateId },
      select: { program: { select: { userId: true } } },
    });
    if (!template || template.program.userId !== userId) {
      throw new AppError(404, "Workout template not found");
    }
  }

  return prisma.workoutSession.create({
    data: {
      userId,
      workoutTemplateId: input.workoutTemplateId ?? null,
      date: utcToday(),
      startedAt: new Date(),
      notes: input.notes ?? null,
    },
    include: sessionInclude,
  });
};

const getOwnedSession = async (userId: string, sessionId: string) => {
  const session = await prisma.workoutSession.findUnique({
    where: { id: sessionId },
    select: { userId: true, completedAt: true },
  });
  if (!session || session.userId !== userId) {
    throw new AppError(404, "Workout session not found");
  }
  return session;
};

export const getSession = async (userId: string, sessionId: string) => {
  const session = await prisma.workoutSession.findUnique({
    where: { id: sessionId },
    include: sessionInclude,
  });
  if (!session || session.userId !== userId) {
    throw new AppError(404, "Workout session not found");
  }
  return session;
};

export const listSessions = async (userId: string, limit = 20) => {
  return prisma.workoutSession.findMany({
    where: { userId },
    orderBy: { startedAt: "desc" },
    take: limit,
    include: sessionInclude,
  });
};

export const completeSession = async (
  userId: string,
  sessionId: string,
  input: CompleteSessionInput,
) => {
  const session = await getOwnedSession(userId, sessionId);
  if (session.completedAt) {
    throw new AppError(400, "Session is already completed");
  }

  return prisma.workoutSession.update({
    where: { id: sessionId },
    data: {
      completedAt: new Date(),
      ...(input.notes !== undefined ? { notes: input.notes } : {}),
    },
    include: sessionInclude,
  });
};

export const addExerciseLog = async (
  userId: string,
  sessionId: string,
  input: AddExerciseLogInput,
) => {
  const session = await getOwnedSession(userId, sessionId);
  if (session.completedAt) {
    throw new AppError(400, "Cannot add exercises to a completed session");
  }

  const count = await prisma.exerciseLog.count({ where: { workoutSessionId: sessionId } });

  return prisma.exerciseLog.create({
    data: {
      workoutSessionId: sessionId,
      exerciseName: input.exerciseName,
      muscleGroup: input.muscleGroup,
      order: count,
    },
    include: { sets: true },
  });
};

export const logSet = async (
  userId: string,
  sessionId: string,
  exerciseLogId: string,
  input: LogSetInput,
) => {
  const session = await getOwnedSession(userId, sessionId);
  if (session.completedAt) {
    throw new AppError(400, "Cannot log sets on a completed session");
  }

  const exerciseLog = await prisma.exerciseLog.findUnique({
    where: { id: exerciseLogId },
    select: { workoutSessionId: true, exerciseName: true },
  });
  if (!exerciseLog || exerciseLog.workoutSessionId !== sessionId) {
    throw new AppError(404, "Exercise log not found");
  }

  const setType = input.setType ?? "WORKING";

  // PR detection: heaviest working/failure set ever logged for this exercise.
  let isPersonalRecord = false;
  if ((setType === "WORKING" || setType === "FAILURE") && input.weight > 0 && input.reps > 0) {
    const best = await prisma.setLog.aggregate({
      where: {
        setType: { in: ["WORKING", "FAILURE"] },
        exerciseLog: {
          exerciseName: exerciseLog.exerciseName,
          workoutSession: { userId },
        },
      },
      _max: { weight: true },
    });
    isPersonalRecord = input.weight > (best._max.weight ?? 0);
  }

  const setNumber =
    (await prisma.setLog.count({ where: { exerciseLogId } })) + 1;

  return prisma.setLog.create({
    data: {
      exerciseLogId,
      setNumber,
      weight: input.weight,
      reps: input.reps,
      rpe: input.rpe ?? null,
      setType,
      isPersonalRecord,
    },
  });
};

// ─── History & PRs ───────────────────────────────────────

export const getExerciseHistory = async (userId: string, exerciseName: string) => {
  const logs = await prisma.exerciseLog.findMany({
    where: {
      exerciseName: { equals: exerciseName, mode: "insensitive" },
      workoutSession: { userId },
    },
    orderBy: { workoutSession: { startedAt: "desc" } },
    take: 30,
    include: {
      sets: { orderBy: { setNumber: "asc" } },
      workoutSession: { select: { date: true, startedAt: true } },
    },
  });

  return logs.map((log) => ({
    sessionDate: log.workoutSession.date.toISOString().slice(0, 10),
    sets: log.sets.map((set) => ({
      setNumber: set.setNumber,
      weight: set.weight,
      reps: set.reps,
      rpe: set.rpe,
      setType: set.setType,
      isPersonalRecord: set.isPersonalRecord,
    })),
  }));
};

export const getPersonalRecords = async (userId: string) => {
  const prSets = await prisma.setLog.findMany({
    where: {
      isPersonalRecord: true,
      exerciseLog: { workoutSession: { userId } },
    },
    orderBy: { weight: "desc" },
    include: {
      exerciseLog: {
        select: {
          exerciseName: true,
          muscleGroup: true,
          workoutSession: { select: { date: true } },
        },
      },
    },
  });

  // Keep only the latest/heaviest PR per exercise.
  const byExercise = new Map<string, (typeof prSets)[number]>();
  for (const set of prSets) {
    const key = set.exerciseLog.exerciseName.toLowerCase();
    if (!byExercise.has(key)) {
      byExercise.set(key, set);
    }
  }

  return Array.from(byExercise.values()).map((set) => ({
    exerciseName: set.exerciseLog.exerciseName,
    muscleGroup: set.exerciseLog.muscleGroup,
    weight: set.weight,
    reps: set.reps,
    date: set.exerciseLog.workoutSession.date.toISOString().slice(0, 10),
  }));
};
