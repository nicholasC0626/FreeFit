import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { app } from "../../src/index";
import { prisma } from "../../src/config/database";

const TEST_EMAIL = `integration-${Date.now()}@test.local`;
const TEST_PASSWORD = "Integration1234!";

let accessToken = "";
let userId = "";

const auth = () => ({ Authorization: `Bearer ${accessToken}` });

beforeAll(async () => {
  const res = await request(app).post("/api/auth/register").send({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
    firstName: "Integration",
    lastName: "Test",
  });
  expect(res.status).toBe(201);
  accessToken = res.body.tokens.accessToken;
  userId = res.body.user.id;
});

afterAll(async () => {
  // Remove everything the test user created, then the user itself.
  await prisma.foodLog.deleteMany({ where: { userId } });
  await prisma.workoutSession.deleteMany({ where: { userId } });
  await prisma.program.deleteMany({ where: { userId } });
  await prisma.notificationPreference.deleteMany({ where: { userId } });
  await prisma.userProfile.deleteMany({ where: { userId } });
  await prisma.user.delete({ where: { id: userId } });
  await prisma.$disconnect();
});

describe("auth", () => {
  it("rejects login with a wrong password", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: TEST_EMAIL, password: "WrongPassword1!" });
    expect(res.status).toBe(401);
  });

  it("logs in with correct credentials", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: TEST_EMAIL, password: TEST_PASSWORD });
    expect(res.status).toBe(200);
    expect(res.body.tokens.accessToken).toBeTruthy();
  });

  it("rejects protected routes without a token", async () => {
    const res = await request(app).get("/api/nutrition/summary");
    expect(res.status).toBe(401);
  });
});

describe("user profile", () => {
  it("creates a profile and calculates macro targets", async () => {
    const res = await request(app).put("/api/user/profile").set(auth()).send({
      heightCm: 180,
      weightKg: 80,
      age: 25,
      sex: "MALE",
      activityLevel: "MODERATELY_ACTIVE",
      goal: "BUILD_MUSCLE",
      experienceLevel: "INTERMEDIATE",
    });
    expect(res.status).toBe(200);
    expect(res.body.calorieTarget).toBeGreaterThan(2000);
    expect(res.body.proteinTarget).toBe(176);
  });
});

describe("nutrition log CRUD", () => {
  let logId = "";

  it("creates a food log entry", async () => {
    const res = await request(app).post("/api/nutrition/log").set(auth()).send({
      mealType: "LUNCH",
      foodName: "Grilled Chicken Breast",
      servingSize: "6 oz",
      servings: 1,
      calories: 280,
      protein: 53,
      carbs: 0,
      fat: 6,
    });
    expect(res.status).toBe(201);
    expect(res.body.log.foodName).toBe("Grilled Chicken Breast");
    logId = res.body.log.id;
  });

  it("reflects the entry in the daily summary", async () => {
    const res = await request(app).get("/api/nutrition/summary").set(auth());
    expect(res.status).toBe(200);
    expect(res.body.consumed.calories).toBe(280);
    expect(res.body.remaining.calories).toBe(res.body.targets.calories - 280);
  });

  it("updates the entry", async () => {
    const res = await request(app)
      .put(`/api/nutrition/log/${logId}`)
      .set(auth())
      .send({ servings: 2, calories: 560, protein: 106 });
    expect(res.status).toBe(200);
    expect(res.body.log.calories).toBe(560);
  });

  it("rejects malformed entries", async () => {
    const res = await request(app)
      .post("/api/nutrition/log")
      .set(auth())
      .send({ mealType: "BRUNCH", foodName: "" });
    expect(res.status).toBe(400);
  });

  it("deletes the entry", async () => {
    const res = await request(app).delete(`/api/nutrition/log/${logId}`).set(auth());
    expect(res.status).toBe(204);
    const summary = await request(app).get("/api/nutrition/summary").set(auth());
    expect(summary.body.consumed.calories).toBe(0);
  });
});

describe("food suggestions", () => {
  it("returns whole-food suggestions sized to remaining macros", async () => {
    const res = await request(app).get("/api/nutrition/suggestions").set(auth());
    expect(res.status).toBe(200);
    expect(res.body.suggestions.length).toBeGreaterThan(0);
    expect(res.body.suggestions.some((s: { category: string }) => s.category === "PRODUCE")).toBe(
      true,
    );
  });
});

describe("fast food", () => {
  it("filters by calories and protein", async () => {
    const res = await request(app)
      .get("/api/nutrition/fast-food?maxCalories=400&minProtein=25")
      .set(auth());
    expect(res.status).toBe(200);
    expect(res.body.items.length).toBeGreaterThan(0);
    for (const item of res.body.items) {
      expect(item.calories).toBeLessThanOrEqual(400);
      expect(item.protein).toBeGreaterThanOrEqual(25);
    }
  });
});

describe("training", () => {
  let programId = "";
  let sessionId = "";

  it("creates a program with workouts", async () => {
    const res = await request(app)
      .post("/api/training/programs")
      .set(auth())
      .send({
        name: "Integration Program",
        workouts: [
          {
            name: "Day A",
            exercises: [
              {
                exerciseName: "Bench Press",
                muscleGroup: "Chest",
                sets: 3,
                repRangeMin: 8,
                repRangeMax: 12,
              },
            ],
          },
        ],
      });
    expect(res.status).toBe(201);
    programId = res.body.program.id;
    expect(res.body.program.workoutTemplates).toHaveLength(1);
  });

  it("starts a session, logs a PR set, and completes it", async () => {
    const templateId = (
      await request(app).get("/api/training/programs").set(auth())
    ).body.programs.find((p: { id: string }) => p.id === programId).workoutTemplates[0].id;

    const start = await request(app)
      .post("/api/training/sessions")
      .set(auth())
      .send({ workoutTemplateId: templateId });
    expect(start.status).toBe(201);
    sessionId = start.body.session.id;

    const exercise = await request(app)
      .post(`/api/training/sessions/${sessionId}/exercises`)
      .set(auth())
      .send({ exerciseName: "Bench Press", muscleGroup: "Chest" });
    expect(exercise.status).toBe(201);

    const set = await request(app)
      .post(`/api/training/sessions/${sessionId}/exercises/${exercise.body.exerciseLog.id}/sets`)
      .set(auth())
      .send({ weight: 135, reps: 10 });
    expect(set.status).toBe(201);
    expect(set.body.set.isPersonalRecord).toBe(true); // first ever set = PR

    const complete = await request(app)
      .put(`/api/training/sessions/${sessionId}`)
      .set(auth())
      .send({});
    expect(complete.status).toBe(200);
    expect(complete.body.session.completedAt).toBeTruthy();
  });

  it("blocks access to another user's program", async () => {
    const res = await request(app)
      .post("/api/ai/review-program")
      .set(auth())
      .send({ programId: "someone-elses-program-id" });
    expect(res.status).toBe(404);
  });
});
