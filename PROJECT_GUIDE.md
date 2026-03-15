# FitForge — Complete Project Guide

> A full-stack mobile fitness app: calorie tracker, progressive overload logger, AI-powered trainer, and smart notifications — all in one.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Technology Stack & Justification](#2-technology-stack--justification)
3. [Project Directory Structure](#3-project-directory-structure)
4. [Key Features & Modules](#4-key-features--modules)
5. [Database Schema](#5-database-schema)
6. [High-Level API Endpoints](#6-high-level-api-endpoints)
7. [Security & Scalability](#7-security--scalability)
8. [Testing & Deployment Strategy](#8-testing--deployment-strategy)
9. [Step-by-Step Build Order](#9-step-by-step-build-order)
10. [Beginner Coding Guide](#10-beginner-coding-guide)

---

## 1. Project Overview

**App Name:** FitForge

**Core Value Proposition:** One app replaces MyFitnessPal + a lifting tracker + a personal trainer. It connects nutrition to training so the user never has to switch between apps.

### The Four Pillars

| Pillar | What It Does |
|---|---|
| **Nutrition Tracker** | Log food via search/barcode, track calories & macros, get food suggestions based on what you still need for the day |
| **Progressive Overload Tracker** | Log every set/rep/weight for every exercise, visualize strength gains over time, auto-detect plateaus |
| **AI Trainer** | Generate science-based lifting programs, critique user-made programs for redundancy, suggest optimal exercises per muscle group |
| **Smart Notifications** | Know your schedule, bug you if you skip a planned workout, celebrate streaks |

---

## 2. Technology Stack & Justification

### Frontend (Mobile App)

| Technology | Why |
|---|---|
| **React Native + Expo** | Write one codebase, ship to iOS and Android. Expo gives you barcode scanning, push notifications, and camera access out of the box with zero native config. Massive beginner community and docs. |
| **TypeScript** | Catches bugs before they run. Every tutorial you'll follow uses it. Worth learning from day one. |
| **Expo Router** | File-based routing (like Next.js for mobile). Drop a file in a folder, it becomes a screen. |
| **NativeWind (Tailwind for RN)** | Style your app with utility classes instead of writing stylesheet objects. Much faster. |
| **Zustand** | State management that's 10x simpler than Redux. One file, one store, done. |
| **React Query (TanStack Query)** | Handles all API calls, caching, loading states, and retries. You never write `useEffect` for fetching again. |

### Backend (API Server)

| Technology | Why |
|---|---|
| **Node.js + Express.js** | JavaScript everywhere (same language as your frontend). Express is the most documented web framework in existence. |
| **TypeScript** | Same reason as frontend — type safety and autocompletion. |
| **Prisma ORM** | Write database queries in TypeScript instead of raw SQL. Auto-generates types from your schema. Beginner-friendly migrations. |
| **PostgreSQL** | Production-grade relational database. Free tier on Supabase/Neon/Railway. Handles complex queries for nutrition data beautifully. |
| **Redis** | Caching layer for food search results and session data. Optional at first, add when you need speed. |

### AI & External Services

| Technology | Why |
|---|---|
| **OpenAI API (GPT-4o-mini)** | Cheapest smart model for the AI trainer. $0.15 per 1M input tokens. Good enough for exercise programming. |
| **Open Food Facts API** | Free, open-source food database with barcode lookup. 3M+ products. No API key needed. |
| **USDA FoodData Central API** | Free, government-backed nutrition database. Most accurate calorie/macro data available. Free API key. |
| **Expo Notifications** | Free push notifications through Expo's servers. No Firebase config needed. |
| **expo-camera** | Free barcode scanning built into Expo. No third-party SDK needed. |

### Infrastructure

| Technology | Why |
|---|---|
| **Railway or Render** | One-click deploy for your Node.js backend + PostgreSQL. Free tier to start. |
| **Expo Application Services (EAS)** | Build and submit your app to App Store / Google Play from the cloud. Free tier available. |
| **GitHub** | Version control. Non-negotiable. |

### Why NOT These Alternatives

| Rejected | Reason |
|---|---|
| Flutter/Dart | Learning a new language (Dart) on top of everything else is too much for a first project. |
| Firebase/Firestore | NoSQL makes nutrition tracking queries painful. Relational data (foods → meals → days) needs PostgreSQL. |
| Django/Python backend | Would mean learning two languages. Keeping everything in TypeScript halves your learning curve. |
| AWS/GCP | Overkill complexity for a first project. Railway/Render abstract all of it. |
| Swift/Kotlin native | Two separate codebases for iOS and Android. Double the work, double the bugs. |

---

## 3. Project Directory Structure

```
fitforge-app/
│
├── mobile/                          # React Native + Expo app
│   ├── app/                         # Expo Router screens (file-based routing)
│   │   ├── (tabs)/                  # Tab navigator group
│   │   │   ├── _layout.tsx          # Tab bar configuration
│   │   │   ├── nutrition.tsx        # Nutrition home screen (daily log)
│   │   │   ├── training.tsx         # Training home screen (today's workout)
│   │   │   ├── ai-trainer.tsx       # AI Trainer chat screen
│   │   │   └── profile.tsx          # Profile & settings
│   │   ├── (auth)/                  # Auth screens group
│   │   │   ├── _layout.tsx          # Auth layout (no tab bar)
│   │   │   ├── login.tsx            # Login screen
│   │   │   ├── register.tsx         # Registration screen
│   │   │   └── onboarding.tsx       # Initial setup (goals, weight, etc.)
│   │   ├── nutrition/               # Nested nutrition screens
│   │   │   ├── add-food.tsx         # Search / barcode scan to add food
│   │   │   ├── barcode-scanner.tsx  # Camera-based barcode scanner
│   │   │   ├── food-detail.tsx      # Nutrition facts for a food item
│   │   │   ├── meal-plan.tsx        # AI-suggested meals for remaining macros
│   │   │   ├── fast-food.tsx        # Healthy fast food options
│   │   │   └── grocery-list.tsx     # Suggested grocery haul
│   │   ├── training/                # Nested training screens
│   │   │   ├── active-workout.tsx   # Live workout logger
│   │   │   ├── exercise-detail.tsx  # Exercise history + progress charts
│   │   │   ├── program-editor.tsx   # Create/edit lifting programs
│   │   │   └── progress.tsx         # Overall strength progress dashboard
│   │   ├── ai/                      # Nested AI screens
│   │   │   ├── program-review.tsx   # AI reviews your lifting program
│   │   │   └── exercise-suggest.tsx # AI suggests exercises for a muscle group
│   │   └── _layout.tsx              # Root layout
│   │
│   ├── components/                  # Reusable UI components
│   │   ├── ui/                      # Generic UI primitives
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── ProgressBar.tsx
│   │   │   └── Badge.tsx
│   │   ├── nutrition/               # Nutrition-specific components
│   │   │   ├── MacroRing.tsx        # Circular macro progress indicator
│   │   │   ├── FoodItem.tsx         # Food list item row
│   │   │   ├── MealSection.tsx      # Breakfast/Lunch/Dinner/Snack group
│   │   │   └── CalorieBar.tsx       # Daily calorie progress bar
│   │   ├── training/                # Training-specific components
│   │   │   ├── SetRow.tsx           # Single set input (weight × reps)
│   │   │   ├── ExerciseCard.tsx     # Exercise within a workout
│   │   │   ├── PRBadge.tsx          # Personal record celebration
│   │   │   └── ProgressChart.tsx    # Strength over time chart
│   │   └── ai/                      # AI-specific components
│   │       ├── ChatBubble.tsx       # AI message bubble
│   │       └── ProgramCard.tsx      # Rendered lifting program
│   │
│   ├── services/                    # API communication layer
│   │   ├── api.ts                   # Axios/fetch instance with auth headers
│   │   ├── nutrition.service.ts     # All nutrition API calls
│   │   ├── training.service.ts      # All training API calls
│   │   ├── ai.service.ts            # AI trainer API calls
│   │   ├── auth.service.ts          # Login/register/token refresh
│   │   └── notification.service.ts  # Push notification registration
│   │
│   ├── stores/                      # Zustand state management
│   │   ├── auth.store.ts            # User session state
│   │   ├── nutrition.store.ts       # Daily food log state
│   │   └── training.store.ts        # Active workout state
│   │
│   ├── hooks/                       # Custom React hooks
│   │   ├── useAuth.ts               # Auth state + actions
│   │   ├── useNutrition.ts          # React Query hooks for nutrition
│   │   ├── useTraining.ts           # React Query hooks for training
│   │   └── useNotifications.ts      # Push notification setup
│   │
│   ├── utils/                       # Helper functions
│   │   ├── calories.ts              # TDEE/BMR/macro calculations
│   │   ├── progressive-overload.ts  # PR detection, volume calculation
│   │   ├── formatters.ts            # Number/date formatting
│   │   └── validators.ts            # Input validation
│   │
│   ├── constants/                   # Static data
│   │   ├── exercises.ts             # Exercise database (name, muscle group, type)
│   │   ├── fast-food-menus.ts       # Pre-loaded healthy fast food options
│   │   └── theme.ts                 # Colors, spacing, typography
│   │
│   ├── types/                       # TypeScript type definitions
│   │   ├── nutrition.types.ts
│   │   ├── training.types.ts
│   │   ├── ai.types.ts
│   │   └── user.types.ts
│   │
│   ├── assets/                      # Images, fonts, icons
│   ├── app.json                     # Expo configuration
│   ├── tsconfig.json
│   ├── package.json
│   └── tailwind.config.js           # NativeWind configuration
│
├── server/                          # Node.js + Express backend
│   ├── src/
│   │   ├── routes/                  # Express route definitions
│   │   │   ├── auth.routes.ts       # POST /auth/register, /auth/login, etc.
│   │   │   ├── nutrition.routes.ts  # CRUD for food logs, search, barcode
│   │   │   ├── training.routes.ts   # CRUD for workouts, programs, exercises
│   │   │   ├── ai.routes.ts         # AI trainer endpoints
│   │   │   └── user.routes.ts       # Profile, settings, goals
│   │   │
│   │   ├── controllers/             # Route handler logic
│   │   │   ├── auth.controller.ts
│   │   │   ├── nutrition.controller.ts
│   │   │   ├── training.controller.ts
│   │   │   ├── ai.controller.ts
│   │   │   └── user.controller.ts
│   │   │
│   │   ├── services/                # Business logic layer
│   │   │   ├── auth.service.ts      # Password hashing, JWT creation
│   │   │   ├── nutrition.service.ts # Calorie calculations, food suggestions
│   │   │   ├── training.service.ts  # Progressive overload detection, PR tracking
│   │   │   ├── ai.service.ts        # OpenAI integration, prompt engineering
│   │   │   ├── food-api.service.ts  # Open Food Facts + USDA API wrappers
│   │   │   └── notification.service.ts # Push notification sending
│   │   │
│   │   ├── middleware/              # Express middleware
│   │   │   ├── auth.middleware.ts   # JWT verification
│   │   │   ├── rate-limit.middleware.ts  # API rate limiting
│   │   │   ├── validate.middleware.ts    # Request body validation (Zod)
│   │   │   └── error.middleware.ts       # Global error handler
│   │   │
│   │   ├── validators/             # Zod schemas for request validation
│   │   │   ├── auth.validator.ts
│   │   │   ├── nutrition.validator.ts
│   │   │   └── training.validator.ts
│   │   │
│   │   ├── utils/                   # Server helper functions
│   │   │   ├── macro-calculator.ts  # TDEE, BMR, macro split calculations
│   │   │   ├── ai-prompts.ts        # System prompts for OpenAI
│   │   │   └── grocery-generator.ts # Grocery list generation from macro targets
│   │   │
│   │   ├── jobs/                    # Scheduled tasks (cron)
│   │   │   ├── notification-scheduler.ts  # "Go to the gym!" reminders
│   │   │   └── daily-reset.ts             # Reset daily nutrition logs
│   │   │
│   │   ├── config/                  # Configuration
│   │   │   ├── database.ts          # Prisma client instance
│   │   │   ├── redis.ts             # Redis client instance
│   │   │   └── env.ts               # Environment variable validation
│   │   │
│   │   └── index.ts                 # Express app entry point
│   │
│   ├── prisma/
│   │   ├── schema.prisma            # Database schema
│   │   ├── seed.ts                  # Seed data (exercises, fast food menus)
│   │   └── migrations/              # Auto-generated by Prisma
│   │
│   ├── tests/                       # Backend tests
│   │   ├── unit/
│   │   │   ├── nutrition.test.ts
│   │   │   ├── training.test.ts
│   │   │   └── ai.test.ts
│   │   ├── integration/
│   │   │   ├── auth.test.ts
│   │   │   └── nutrition-api.test.ts
│   │   └── setup.ts                 # Test database setup
│   │
│   ├── tsconfig.json
│   ├── package.json
│   ├── Dockerfile                   # Container for deployment
│   └── .env.example                 # Template for environment variables
│
├── shared/                          # Shared types between frontend & backend
│   ├── types/
│   │   ├── api-responses.ts         # API response shape types
│   │   ├── nutrition.ts             # Shared nutrition types
│   │   └── training.ts              # Shared training types
│   └── constants/
│       └── muscle-groups.ts         # Enum of all muscle groups
│
├── .gitignore
├── PROJECT_GUIDE.md                 # ← This file
└── README.md                        # Quick start instructions
```

---

## 4. Key Features & Modules

### Module 1: Authentication & Onboarding

**Screens:** Login → Register → Onboarding (3 steps)

**Onboarding collects:**
- Height, weight, age, biological sex
- Activity level (sedentary → very active)
- Goal: lose fat / maintain / build muscle
- Training experience: beginner / intermediate / advanced
- Preferred gym days per week

**What happens behind the scenes:**
- BMR calculated using Mifflin-St Jeor equation
- TDEE = BMR × activity multiplier
- Calorie target = TDEE ± deficit/surplus based on goal
- Macro split calculated (protein: 1g per lb bodyweight, fat: 25-30% calories, carbs: remainder)

```
BMR (males) = 10 × weight(kg) + 6.25 × height(cm) - 5 × age - 5
BMR (females) = 10 × weight(kg) + 6.25 × height(cm) - 5 × age - 161
TDEE = BMR × activity_factor  (1.2 sedentary → 1.9 very active)
```

---

### Module 2: Nutrition Tracker

#### 2a — Food Logging

**How the user logs food:**
1. **Text search** → hits USDA FoodData Central API → returns matching foods with full nutrition data
2. **Barcode scan** → camera opens via `expo-camera` → scans barcode → looks up product on Open Food Facts API → returns nutrition data
3. **Recent foods** → cached locally for quick re-logging
4. **Custom food** → user enters nutrition info manually

**Each food entry stores:** food name, brand, serving size, servings, calories, protein, carbs, fat, fiber, sugar, sodium

**Display:** Foods grouped into meals (Breakfast, Lunch, Dinner, Snacks). Top of screen shows a circular progress ring for calories and horizontal bars for protein/carbs/fat.

#### 2b — Smart Food Suggestions

Once the user has logged some food for the day, the app calculates what's left:

```
remaining_calories = daily_target - consumed_calories
remaining_protein  = protein_target - consumed_protein
remaining_carbs    = carb_target - consumed_carbs
remaining_fat      = fat_target - consumed_fat
```

The backend then queries the food database to suggest meals that fit within the remaining macros. Uses a scoring algorithm:

```
score = (protein_match × 3) + (calorie_match × 2) + (carb_match × 1) + (fat_match × 1)
```

Protein is weighted highest because it's the hardest macro to hit.

#### 2c — Healthy Fast Food Options

Pre-loaded database of nutritionally-analyzed menu items from major fast food chains (McDonald's, Chipotle, Chick-fil-A, Subway, etc.). Filtered by remaining macros. Example: "You have 600 cal and 40g protein left → here are 8 fast food meals that fit."

The data is stored in a seed file and loaded into the database. Updates can be added manually or scraped from restaurant nutrition PDFs.

#### 2d — Grocery Haul Generator

Based on the user's weekly macro targets, the AI generates a grocery list optimized for:
- Hitting macros consistently
- Budget (prefers affordable staples)
- Variety (rotates protein sources, carb sources)
- Prep simplicity (prefers foods that are easy to cook)

Uses OpenAI with a structured prompt that includes the user's macro targets, dietary restrictions, and budget preference. Returns a JSON list grouped by store section (produce, meat, dairy, pantry, frozen).

---

### Module 3: Progressive Overload Tracker

#### 3a — Workout Logging

**Screen flow:** Select program → Today's workout loads → For each exercise, log sets:
- Weight (lbs or kg, user preference)
- Reps performed
- RPE (Rate of Perceived Exertion, optional, 1-10 scale)
- Set type: working set, warm-up, drop set, failure set

The app pre-populates with your previous workout's numbers so you can see what to beat.

#### 3b — Progressive Overload Detection

After each workout, the backend analyzes your performance:

```
volume_per_exercise = Σ (weight × reps) for all working sets
```

**Overload achieved if any of these are true:**
- More total reps at the same weight
- Same reps at higher weight
- More sets at the same weight and reps
- Higher estimated 1RM (using Epley formula: `1RM = weight × (1 + reps/30)`)

**Plateau detected if:** No overload for 3+ consecutive sessions on the same exercise.

When a PR is hit, the app shows a celebration animation and logs it to the PR history.

#### 3c — Progress Visualization

Charts for each exercise showing over time:
- Estimated 1RM progression (line chart)
- Volume per session (bar chart)
- Best set per session (weight × reps)

Also a full-body muscle map showing weekly volume per muscle group (sets per muscle per week) with color coding:
- Red: under-trained (< 10 sets/week)
- Green: optimal (10-20 sets/week)
- Yellow: potentially excessive (> 20 sets/week)

---

### Module 4: AI Trainer

#### 4a — Program Generator

The user answers:
1. How many days per week can you train?
2. What's your goal? (strength / hypertrophy / general fitness)
3. What equipment do you have access to?
4. Any injuries or limitations?
5. Experience level?

The AI generates a complete program using established splits:
- 3 days → Full Body × 3
- 4 days → Upper/Lower × 2
- 5 days → Upper/Lower/Push/Pull/Legs
- 6 days → Push/Pull/Legs × 2

Each workout includes: exercise name, sets, rep range, rest period, and a note on technique cues.

**System prompt includes evidence-based constraints:**
- 10-20 hard sets per muscle group per week
- Compounds before isolations
- Balanced push/pull ratio
- Progressive rep ranges (strength: 3-6, hypertrophy: 8-12, endurance: 15-20)
- Deload week every 4-6 weeks

#### 4b — Program Reviewer

User creates their own program in the program editor. The AI analyzes it for:
- **Redundancy:** "You have 3 chest exercises that all target the same portion of the pec. Replace incline dumbbell fly with cable crossover for better stretch-mediated hypertrophy."
- **Imbalance:** "You have 15 sets of push per week but only 8 sets of pull. Add 4-6 sets of rowing."
- **Missing muscle groups:** "Rear delts, lateral delts, and hamstrings are undertrained."
- **Volume issues:** "28 sets for chest per week exceeds the maximum recoverable volume for most lifters."
- **Exercise order:** "Move your compound squat before leg extensions for better performance."

#### 4c — Exercise Suggester

User taps a muscle group on the body map → AI returns the top 5 exercises for that muscle, ranked by:
- EMG activation data
- Strength curve match
- Stretch-mediated hypertrophy potential
- Practical difficulty (beginner vs advanced)

Each suggestion includes: name, video link placeholder, sets × reps recommendation, key coaching cues, and common mistakes.

---

### Module 5: Smart Notifications

#### 5a — Workout Reminders

The app knows your program schedule (e.g., Push on Monday/Thursday, Pull on Tuesday/Friday, Legs on Wednesday/Saturday).

**Notification logic:**
1. **Morning reminder (8 AM):** "Today is Push day. Let's get it."
2. **If no workout logged by 4 PM:** "You haven't trained yet today. Your Push workout is waiting."
3. **If no workout logged by 8 PM:** "Last chance! Don't break your streak. Even 30 minutes counts."
4. **If workout is skipped:** Next morning: "You missed Push yesterday. Want to do it today instead?"

#### 5b — Streak Tracking

- Consecutive days where all planned workouts were completed
- Weekly completion rate (e.g., 5/6 workouts = 83%)
- Monthly streak badges

#### 5c — Nutrition Alerts

- "You've only logged 800 calories today and it's 3 PM. Don't forget to log your lunch."
- "You're 35g of protein away from your target. Here's a quick snack idea: Greek yogurt + protein scoop (38g protein, 210 cal)."

---

## 5. Database Schema

Below is the Prisma schema. This is the **single source of truth** for your database.

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─── USERS ───────────────────────────────────────────────

model User {
  id                String   @id @default(cuid())
  email             String   @unique
  passwordHash      String
  firstName         String
  lastName          String
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  profile           UserProfile?
  foodLogs          FoodLog[]
  workoutSessions   WorkoutSession[]
  programs          Program[]
  notifications     NotificationPreference?
  expoPushToken     String?
}

model UserProfile {
  id                String   @id @default(cuid())
  userId            String   @unique
  user              User     @relation(fields: [userId], references: [id])

  heightCm          Float
  weightKg          Float
  age               Int
  sex               Sex
  activityLevel     ActivityLevel
  goal              FitnessGoal
  experienceLevel   ExperienceLevel

  calorieTarget     Int
  proteinTarget     Int
  carbTarget        Int
  fatTarget         Int

  preferredUnit     Unit     @default(METRIC)
  gymDaysPerWeek    Int      @default(4)

  updatedAt         DateTime @updatedAt
}

enum Sex {
  MALE
  FEMALE
}

enum ActivityLevel {
  SEDENTARY
  LIGHTLY_ACTIVE
  MODERATELY_ACTIVE
  VERY_ACTIVE
  EXTREMELY_ACTIVE
}

enum FitnessGoal {
  LOSE_FAT
  MAINTAIN
  BUILD_MUSCLE
}

enum ExperienceLevel {
  BEGINNER
  INTERMEDIATE
  ADVANCED
}

enum Unit {
  METRIC
  IMPERIAL
}

// ─── NUTRITION ───────────────────────────────────────────

model FoodLog {
  id                String   @id @default(cuid())
  userId            String
  user              User     @relation(fields: [userId], references: [id])

  date              DateTime @db.Date
  mealType          MealType
  foodName          String
  brand             String?
  barcode           String?

  servingSize       String
  servings          Float
  calories          Int
  protein           Float
  carbs             Float
  fat               Float
  fiber             Float?
  sugar             Float?
  sodium            Float?

  createdAt         DateTime @default(now())

  @@index([userId, date])
}

enum MealType {
  BREAKFAST
  LUNCH
  DINNER
  SNACK
}

model FastFoodItem {
  id                String   @id @default(cuid())
  restaurant        String
  itemName          String
  calories          Int
  protein           Float
  carbs             Float
  fat               Float
  servingSize       String
  category          String

  @@index([restaurant])
}

// ─── TRAINING ────────────────────────────────────────────

model Program {
  id                String   @id @default(cuid())
  userId            String
  user              User     @relation(fields: [userId], references: [id])

  name              String
  description       String?
  isActive          Boolean  @default(true)
  isAiGenerated     Boolean  @default(false)
  createdAt         DateTime @default(now())

  workoutTemplates  WorkoutTemplate[]
}

model WorkoutTemplate {
  id                String   @id @default(cuid())
  programId         String
  program           Program  @relation(fields: [programId], references: [id], onDelete: Cascade)

  name              String
  dayOfWeek         Int?
  order             Int

  exercises         ExerciseTemplate[]
  sessions          WorkoutSession[]
}

model ExerciseTemplate {
  id                  String   @id @default(cuid())
  workoutTemplateId   String
  workoutTemplate     WorkoutTemplate @relation(fields: [workoutTemplateId], references: [id], onDelete: Cascade)

  exerciseName        String
  muscleGroup         String
  sets                Int
  repRangeMin         Int
  repRangeMax         Int
  restSeconds         Int      @default(120)
  notes               String?
  order               Int
}

model WorkoutSession {
  id                  String   @id @default(cuid())
  userId              String
  user                User     @relation(fields: [userId], references: [id])
  workoutTemplateId   String?
  workoutTemplate     WorkoutTemplate? @relation(fields: [workoutTemplateId], references: [id])

  date                DateTime @db.Date
  startedAt           DateTime
  completedAt         DateTime?
  notes               String?

  exerciseLogs        ExerciseLog[]

  @@index([userId, date])
}

model ExerciseLog {
  id                  String   @id @default(cuid())
  workoutSessionId    String
  workoutSession      WorkoutSession @relation(fields: [workoutSessionId], references: [id], onDelete: Cascade)

  exerciseName        String
  muscleGroup         String
  order               Int

  sets                SetLog[]
}

model SetLog {
  id                  String   @id @default(cuid())
  exerciseLogId       String
  exerciseLog         ExerciseLog @relation(fields: [exerciseLogId], references: [id], onDelete: Cascade)

  setNumber           Int
  weight              Float
  reps                Int
  rpe                 Float?
  setType             SetType  @default(WORKING)
  isPersonalRecord    Boolean  @default(false)
}

enum SetType {
  WARMUP
  WORKING
  DROP
  FAILURE
}

// ─── NOTIFICATIONS ───────────────────────────────────────

model NotificationPreference {
  id                    String   @id @default(cuid())
  userId                String   @unique
  user                  User     @relation(fields: [userId], references: [id])

  workoutReminders      Boolean  @default(true)
  nutritionReminders    Boolean  @default(true)
  morningReminderTime   String   @default("08:00")
  eveningReminderTime   String   @default("20:00")
}
```

---

## 6. High-Level API Endpoints

### Authentication

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Create account (email, password, name) |
| POST | `/api/auth/login` | Login → returns JWT access + refresh tokens |
| POST | `/api/auth/refresh` | Exchange refresh token for new access token |
| POST | `/api/auth/logout` | Invalidate refresh token |

### User Profile

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/user/profile` | Get user profile + macro targets |
| PUT | `/api/user/profile` | Update profile (recalculates macros) |
| PUT | `/api/user/push-token` | Register Expo push notification token |
| PUT | `/api/user/notification-prefs` | Update notification settings |

### Nutrition

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/nutrition/log?date=2026-03-13` | Get all food entries for a date |
| POST | `/api/nutrition/log` | Add a food entry |
| PUT | `/api/nutrition/log/:id` | Edit a food entry |
| DELETE | `/api/nutrition/log/:id` | Delete a food entry |
| GET | `/api/nutrition/summary?date=2026-03-13` | Get calorie/macro totals for a date |
| GET | `/api/nutrition/search?q=chicken+breast` | Search USDA food database |
| GET | `/api/nutrition/barcode/:code` | Look up food by barcode |
| GET | `/api/nutrition/suggestions?date=2026-03-13` | Get food suggestions based on remaining macros |
| GET | `/api/nutrition/fast-food?maxCal=600&minProtein=30` | Filter healthy fast food options |
| POST | `/api/nutrition/grocery-list` | Generate AI grocery list from weekly macros |
| GET | `/api/nutrition/recent` | Get recently logged foods for quick add |

### Training

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/training/programs` | List all user's programs |
| POST | `/api/training/programs` | Create a new program |
| PUT | `/api/training/programs/:id` | Update a program |
| DELETE | `/api/training/programs/:id` | Delete a program |
| GET | `/api/training/programs/:id/templates` | Get all workouts in a program |
| POST | `/api/training/programs/:id/templates` | Add a workout to a program |
| POST | `/api/training/sessions` | Start a new workout session |
| PUT | `/api/training/sessions/:id` | Complete a workout session |
| POST | `/api/training/sessions/:id/exercises` | Add exercise log to session |
| POST | `/api/training/sessions/:id/exercises/:eid/sets` | Log a set |
| GET | `/api/training/exercise-history/:name` | Get history for a specific exercise |
| GET | `/api/training/prs` | Get all personal records |
| GET | `/api/training/volume-summary` | Weekly volume per muscle group |
| GET | `/api/training/streak` | Get workout streak info |

### AI Trainer

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/ai/generate-program` | Generate a full lifting program |
| POST | `/api/ai/review-program` | Review user's program for issues |
| POST | `/api/ai/suggest-exercises` | Suggest exercises for a muscle group |
| POST | `/api/ai/chat` | Free-form chat with AI trainer |

---

## 7. Security & Scalability

### Security

#### Authentication & Authorization
- **Password hashing:** bcrypt with 12 salt rounds (never store plain text passwords)
- **JWT tokens:** Short-lived access tokens (15 min) + long-lived refresh tokens (7 days) stored as httpOnly cookies
- **Token rotation:** Each refresh generates a new refresh token and invalidates the old one
- **Route protection:** Every non-auth endpoint passes through `auth.middleware.ts` which verifies the JWT

#### Data Protection
- **Input validation:** Every request body validated with Zod schemas before reaching the controller. Rejects malformed data at the middleware level
- **SQL injection prevention:** Prisma ORM uses parameterized queries by default — no raw SQL concatenation
- **Rate limiting:** `express-rate-limit` middleware: 100 requests per 15 minutes per IP for general endpoints, 5 requests per 15 minutes for auth endpoints (prevents brute force)
- **CORS:** Whitelist only your mobile app's origin
- **Helmet.js:** Sets security headers (X-Content-Type-Options, X-Frame-Options, etc.)
- **Environment variables:** All secrets (DB URL, JWT secret, OpenAI key) in `.env`, never committed to git

#### API Security
- **OpenAI key:** Only called server-side. The mobile app never sees your OpenAI API key
- **Barcode/food APIs:** Called server-side to prevent exposing API keys and to cache results
- **Request size limits:** Express body parser capped at 1MB to prevent payload attacks

### Scalability

#### Phase 1 — Solo Developer (0-1,000 users)
- Single Railway instance (backend) + managed PostgreSQL
- No Redis needed yet
- Expo push notifications handle the volume easily
- Total cost: $0-5/month (free tiers)

#### Phase 2 — Growing (1,000-10,000 users)
- Add Redis for caching food search results (90% of searches are repeated queries)
- Add database indexes on hot queries (user+date for food logs, user+date for workout sessions)
- Move to Railway Pro or Render paid tier
- Total cost: $20-50/month

#### Phase 3 — Scaling (10,000+ users)
- Horizontal scaling: multiple backend instances behind a load balancer
- Database read replicas for heavy query loads
- CDN for any static assets
- Background job queue (BullMQ + Redis) for AI requests and notification sending
- Consider moving food database to local PostgreSQL (import USDA data dump) to reduce external API dependency
- Total cost: $100-300/month

#### Key Architecture Decisions for Scale
- **Stateless backend:** No server-side sessions. JWT means any instance can handle any request
- **Database indexing:** Compound indexes on `(userId, date)` for food logs and workout sessions — the two most frequent queries
- **Caching strategy:** Cache food search results for 24 hours (nutrition data doesn't change). Cache fast food menus indefinitely (manually updated)
- **Pagination:** All list endpoints return paginated results (limit/offset)

---

## 8. Testing & Deployment Strategy

### Testing

#### Unit Tests (Vitest)
Test individual functions in isolation:

```typescript
// Example: testing macro calculator
import { calculateTDEE, calculateMacros } from '../utils/macro-calculator';

describe('calculateTDEE', () => {
  it('calculates TDEE for a moderately active male', () => {
    const tdee = calculateTDEE({
      weightKg: 80,
      heightCm: 180,
      age: 25,
      sex: 'MALE',
      activityLevel: 'MODERATELY_ACTIVE',
    });
    expect(tdee).toBeCloseTo(2687, 0);
  });
});

describe('calculateMacros', () => {
  it('sets protein to 1g per lb of bodyweight for muscle building', () => {
    const macros = calculateMacros({
      weightKg: 80,
      tdee: 2700,
      goal: 'BUILD_MUSCLE',
    });
    expect(macros.protein).toBe(176); // 80kg = 176lbs
    expect(macros.protein + macros.carbs + macros.fat).toBeGreaterThan(0);
  });
});
```

**What to unit test:**
- Macro/calorie calculations
- Progressive overload detection logic
- PR detection
- Food suggestion scoring algorithm
- Input validators

#### Integration Tests (Vitest + Supertest)
Test API endpoints with a real test database:

```typescript
// Example: testing food log creation
import request from 'supertest';
import { app } from '../src/index';

describe('POST /api/nutrition/log', () => {
  it('creates a food log entry and returns updated daily totals', async () => {
    const res = await request(app)
      .post('/api/nutrition/log')
      .set('Authorization', `Bearer ${testToken}`)
      .send({
        date: '2026-03-13',
        mealType: 'LUNCH',
        foodName: 'Grilled Chicken Breast',
        servingSize: '6 oz',
        servings: 1,
        calories: 280,
        protein: 53,
        carbs: 0,
        fat: 6,
      });

    expect(res.status).toBe(201);
    expect(res.body.data.foodName).toBe('Grilled Chicken Breast');
  });
});
```

**What to integration test:**
- All auth flows (register, login, refresh, protected routes)
- CRUD operations for food logs
- CRUD operations for workouts and programs
- AI endpoint responses (mock OpenAI in tests)

#### Mobile App Testing (Jest + React Native Testing Library)
Test components and screens:

```typescript
// Example: testing the MacroRing component
import { render } from '@testing-library/react-native';
import { MacroRing } from '../components/nutrition/MacroRing';

describe('MacroRing', () => {
  it('shows correct percentage when half of calories consumed', () => {
    const { getByText } = render(
      <MacroRing current={1000} target={2000} label="Calories" />
    );
    expect(getByText('50%')).toBeTruthy();
    expect(getByText('1,000 / 2,000')).toBeTruthy();
  });
});
```

#### Test Commands
```bash
# Backend unit + integration tests
cd server && npm test

# Backend tests in watch mode (during development)
cd server && npm run test:watch

# Mobile app component tests
cd mobile && npm test

# Run all tests before deployment
npm run test:all
```

### Deployment

#### Backend Deployment (Railway)

**First-time setup:**
1. Push your code to GitHub
2. Go to [railway.app](https://railway.app) and sign in with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your repo, Railway auto-detects Node.js
5. Add a PostgreSQL database to the project (one click)
6. Set environment variables in Railway dashboard:
   - `DATABASE_URL` (auto-set by Railway when you add PostgreSQL)
   - `JWT_SECRET` (generate: `openssl rand -base64 32`)
   - `JWT_REFRESH_SECRET` (generate another)
   - `OPENAI_API_KEY` (from platform.openai.com)
   - `USDA_API_KEY` (from fdc.nal.usda.gov)
7. Railway auto-deploys on every push to `main`

**Deployment pipeline:**
```
Push to GitHub → Railway detects change → Builds with Dockerfile →
Runs "npx prisma migrate deploy" → Starts server → Health check passes → Live
```

#### Mobile App Deployment (Expo EAS)

**First-time setup:**
```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure your project
cd mobile && eas build:configure
```

**Building for testing (development build):**
```bash
# Build for Android (generates APK)
eas build --platform android --profile development

# Build for iOS (requires Apple Developer account, $99/year)
eas build --platform ios --profile development
```

**Building for App Store / Google Play:**
```bash
# Production build
eas build --platform all --profile production

# Submit to stores
eas submit --platform android
eas submit --platform ios
```

**Over-the-Air updates (skip store review for JS-only changes):**
```bash
eas update --branch production --message "Fixed macro calculation bug"
```

#### CI/CD Pipeline (GitHub Actions)

Create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test-server:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_DB: fitforge_test
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
        ports:
          - 5432:5432
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: cd server && npm ci
      - run: cd server && npx prisma migrate deploy
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/fitforge_test
      - run: cd server && npm test
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/fitforge_test
          JWT_SECRET: test-secret
          JWT_REFRESH_SECRET: test-refresh-secret

  test-mobile:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: cd mobile && npm ci
      - run: cd mobile && npm test
```

---

## 9. Step-by-Step Build Order

This is the most important section. **Follow this order exactly.** Each phase builds on the previous one, and you'll have a working (but incomplete) app at the end of every phase.

### Phase 0: Environment Setup (Day 1)

- [ ] Install Node.js 20 LTS from [nodejs.org](https://nodejs.org)
- [ ] Install VS Code or Cursor (you already have this)
- [ ] Install Git from [git-scm.com](https://git-scm.com)
- [ ] Install PostgreSQL from [postgresql.org](https://postgresql.org) OR use Docker: `docker run -p 5432:5432 -e POSTGRES_PASSWORD=password postgres:16`
- [ ] Install Expo Go on your phone (App Store / Google Play)
- [ ] Create accounts: GitHub, Expo (expo.dev), OpenAI (platform.openai.com), USDA API key (fdc.nal.usda.gov/api-key-signup.html)
- [ ] Create GitHub repository: `git init && git remote add origin <url>`

```bash
# Verify installations
node --version    # Should show v20.x.x
npm --version     # Should show 10.x.x
git --version     # Should show 2.x.x
```

### Phase 1: Backend Foundation (Days 2-5)

**Goal:** Running Express server with auth that you can hit from Postman.

1. Initialize the server project:
```bash
mkdir server && cd server
npm init -y
npm install express cors helmet dotenv
npm install prisma @prisma/client
npm install bcryptjs jsonwebtoken
npm install zod express-rate-limit
npm install -D typescript @types/node @types/express @types/bcryptjs @types/jsonwebtoken
npm install -D vitest supertest @types/supertest tsx
npx tsc --init
npx prisma init
```

2. Create the Prisma schema (copy from Section 5 above)
3. Run `npx prisma migrate dev --name init` to create tables
4. Build these files in order:
   - `src/config/env.ts` — load and validate env vars
   - `src/config/database.ts` — Prisma client singleton
   - `src/index.ts` — Express app with middleware
   - `src/middleware/error.middleware.ts` — global error handler
   - `src/validators/auth.validator.ts` — Zod schemas for register/login
   - `src/middleware/validate.middleware.ts` — Zod validation middleware
   - `src/services/auth.service.ts` — hash password, verify password, create JWT
   - `src/controllers/auth.controller.ts` — register + login handlers
   - `src/routes/auth.routes.ts` — wire up routes
   - `src/middleware/auth.middleware.ts` — JWT verification middleware

5. Test with Postman or curl:
```bash
# Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test1234!","firstName":"John","lastName":"Doe"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test1234!"}'
```

### Phase 2: Mobile App Shell (Days 6-9)

**Goal:** React Native app with tab navigation, login screen, and connection to your backend.

1. Initialize the mobile project:
```bash
cd .. # back to root
npx create-expo-app mobile --template tabs
cd mobile
npm install @tanstack/react-query zustand axios
npm install nativewind tailwindcss
npm install expo-secure-store
```

2. Build these screens/components in order:
   - Set up NativeWind (Tailwind CSS)
   - `stores/auth.store.ts` — Zustand store for user session
   - `services/api.ts` — Axios instance with base URL + auth interceptor
   - `services/auth.service.ts` — login/register API calls
   - `app/(auth)/login.tsx` — Login screen (email + password + button)
   - `app/(auth)/register.tsx` — Register screen
   - `app/(auth)/_layout.tsx` — Auth layout
   - `app/(tabs)/_layout.tsx` — Tab bar with 4 tabs (Nutrition, Training, AI, Profile)
   - `app/(tabs)/nutrition.tsx` — Placeholder screen
   - `app/(tabs)/training.tsx` — Placeholder screen
   - `app/(tabs)/ai-trainer.tsx` — Placeholder screen
   - `app/(tabs)/profile.tsx` — Placeholder screen
   - `app/_layout.tsx` — Root layout that checks auth state

3. Test: Open Expo Go on your phone, scan QR code. You should be able to register, login, and see the tab bar.

### Phase 3: User Profile & Onboarding (Days 10-12)

**Goal:** After registration, user fills out their info and gets their calorie/macro targets.

1. Backend:
   - `src/utils/macro-calculator.ts` — BMR, TDEE, and macro calculation functions
   - `src/controllers/user.controller.ts` — create/update profile
   - `src/routes/user.routes.ts` — profile endpoints

2. Mobile:
   - `app/(auth)/onboarding.tsx` — Multi-step form (height, weight, age, goal, etc.)
   - `components/ui/Input.tsx` — Styled text input
   - `components/ui/Button.tsx` — Styled button
   - Show calculated targets on profile screen

### Phase 4: Nutrition Tracker (Days 13-22)

**Goal:** Full food logging with search, barcode scanning, and daily summary.

Build in this order:

1. **Backend — Food search:**
   - `src/services/food-api.service.ts` — USDA API + Open Food Facts wrapper
   - `src/controllers/nutrition.controller.ts` — search, barcode lookup
   - `src/routes/nutrition.routes.ts`

2. **Backend — Food logging:**
   - Add CRUD endpoints for food log entries
   - Add daily summary endpoint (total calories/macros for a date)

3. **Mobile — Daily log screen:**
   - `components/nutrition/CalorieBar.tsx` — Top-of-screen calorie progress
   - `components/nutrition/MacroRing.tsx` — Circular protein/carbs/fat rings
   - `components/nutrition/MealSection.tsx` — Grouped food entries
   - `components/nutrition/FoodItem.tsx` — Individual food row

4. **Mobile — Add food:**
   - `app/nutrition/add-food.tsx` — Search screen with text input
   - `hooks/useNutrition.ts` — React Query hooks for search + CRUD
   - `app/nutrition/food-detail.tsx` — Nutrition facts + serving size + "Add" button

5. **Mobile — Barcode scanner:**
   - `app/nutrition/barcode-scanner.tsx` — Camera view with `expo-camera` barcode scanning
   - On scan → API call → show food detail

### Phase 5: Training Tracker (Days 23-32)

**Goal:** Create programs, log workouts, track progress.

1. **Backend:**
   - CRUD for programs and workout templates
   - Workout session endpoints (start, log sets, complete)
   - Exercise history endpoint
   - Progressive overload detection in `src/services/training.service.ts`
   - PR detection logic

2. **Mobile:**
   - `app/(tabs)/training.tsx` — Today's workout overview
   - `app/training/active-workout.tsx` — Live workout logging screen
   - `components/training/ExerciseCard.tsx` — Exercise with expandable sets
   - `components/training/SetRow.tsx` — Weight × Reps input row
   - `components/training/PRBadge.tsx` — PR celebration
   - `app/training/exercise-detail.tsx` — History charts for one exercise
   - `app/training/progress.tsx` — Overall progress dashboard
   - `app/training/program-editor.tsx` — Create/edit programs manually

### Phase 6: AI Trainer (Days 33-40)

**Goal:** AI generates programs, reviews programs, suggests exercises.

1. **Backend:**
   - `src/utils/ai-prompts.ts` — System prompts for each AI feature
   - `src/services/ai.service.ts` — OpenAI API integration with structured outputs
   - `src/controllers/ai.controller.ts` — Endpoints for generate, review, suggest
   - `src/routes/ai.routes.ts`

2. **Mobile:**
   - `app/(tabs)/ai-trainer.tsx` — Chat interface with AI
   - `components/ai/ChatBubble.tsx` — Message bubbles
   - `components/ai/ProgramCard.tsx` — Rendered program from AI
   - `app/ai/program-review.tsx` — Upload your program, get AI feedback
   - `app/ai/exercise-suggest.tsx` — Tap muscle group, see suggestions

### Phase 7: Smart Food Suggestions & Grocery List (Days 41-46)

**Goal:** App suggests what to eat and what to buy.

1. **Backend:**
   - Food suggestion scoring algorithm in `nutrition.service.ts`
   - Fast food filtering endpoint
   - Grocery list generation with OpenAI
   - Seed fast food data: `prisma/seed.ts`

2. **Mobile:**
   - `app/nutrition/meal-plan.tsx` — Suggested meals for remaining macros
   - `app/nutrition/fast-food.tsx` — Healthy fast food picker
   - `app/nutrition/grocery-list.tsx` — AI-generated grocery list

### Phase 8: Notifications (Days 47-52)

**Goal:** App bugs you to train and eat.

1. **Backend:**
   - `src/services/notification.service.ts` — Send push via Expo
   - `src/jobs/notification-scheduler.ts` — Cron job for timed reminders
   - Logic: check if user has logged a workout today → if not, send reminder

2. **Mobile:**
   - `hooks/useNotifications.ts` — Register for push notifications on app launch
   - `services/notification.service.ts` — Send push token to backend
   - In-app notification banners

### Phase 9: Polish & Deploy (Days 53-60)

- [ ] Add loading skeletons to all screens
- [ ] Add error states with retry buttons
- [ ] Add pull-to-refresh on list screens
- [ ] Add haptic feedback on PR celebrations
- [ ] Write unit tests for all calculation utils
- [ ] Write integration tests for critical API flows
- [ ] Deploy backend to Railway
- [ ] Build with EAS and test on real devices
- [ ] Create App Store / Google Play listings

---

## 10. Beginner Coding Guide

### Prerequisites You Need to Learn First

**Before touching this project**, spend 1-2 weeks on these fundamentals. Do them in this exact order:

#### Week 1: JavaScript & TypeScript Fundamentals
1. **JavaScript basics** — [javascript.info](https://javascript.info) (Chapters 1-6) ### Currently on Chapter 2.8
   - Variables, types, functions, arrays, objects
   - Promises and async/await (critical — every API call uses this)
   - Array methods: `.map()`, `.filter()`, `.reduce()`, `.find()`
2. **TypeScript basics** — [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/) (First 5 chapters)
   - Types, interfaces, enums, generics

#### Week 2: React Fundamentals
1. **React official tutorial** — [react.dev/learn](https://react.dev/learn)
   - Components, props, state, hooks (`useState`, `useEffect`)
   - Conditional rendering, lists, forms
2. **React Native intro** — [reactnative.dev](https://reactnative.dev/docs/getting-started)
   - `View`, `Text`, `ScrollView`, `FlatList`, `TouchableOpacity`
   - StyleSheet vs NativeWind

### Key Concepts You'll Use Constantly

#### The Request-Response Cycle
```
[Phone App] → HTTP Request → [Express Server] → [PostgreSQL Database]
[Phone App] ← HTTP Response ← [Express Server] ← [Query Result]
```

Every feature follows this pattern:
1. User taps something on the phone
2. App sends an HTTP request (GET/POST/PUT/DELETE) to your server
3. Server validates the request
4. Server queries the database
5. Server sends back a JSON response
6. App displays the data

#### Project File Naming Conventions
- **Files:** `kebab-case.ts` (e.g., `macro-calculator.ts`, `auth.service.ts`)
- **Components:** `PascalCase.tsx` (e.g., `MacroRing.tsx`, `SetRow.tsx`)
- **Variables/functions:** `camelCase` (e.g., `calculateTDEE`, `foodLogs`)
- **Constants:** `UPPER_SNAKE_CASE` (e.g., `MAX_SETS_PER_EXERCISE`)
- **Database tables:** `PascalCase` (Prisma convention)

#### How to Approach Each Feature
1. **Define the data shape** — What does the database need to store?
2. **Write the Prisma schema** — Add models, run migration
3. **Build the API endpoint** — Route → Controller → Service → Database
4. **Build the mobile screen** — Screen → Components → API call → Display
5. **Test it** — Use Postman for API, Expo Go for mobile

#### Debugging Checklist (When Something Doesn't Work)
1. Check the terminal running your server — is there an error?
2. Check the Expo terminal — is there a React error?
3. `console.log()` the data at each step to find where it breaks
4. Check the Network tab — is the API returning what you expect?
5. Check the database directly — is the data actually there? (`npx prisma studio`)
6. Google the exact error message — someone has had this exact problem before

### Recommended VS Code / Cursor Extensions
- **Prisma** — Syntax highlighting for `.prisma` files
- **ES7+ React/Redux/React-Native snippets** — Auto-complete for React patterns
- **Thunder Client** — API testing (like Postman) built into your editor
- **Error Lens** — Shows errors inline in your code
- **Pretty TypeScript Errors** — Makes TS errors readable
- **GitLens** — See git blame and history inline

### Essential Terminal Commands You'll Use Daily
```bash
# Start the backend server (in /server)
npx tsx watch src/index.ts

# Start the mobile app (in /mobile)
npx expo start

# Create a new database migration after schema changes
npx prisma migrate dev --name describe-what-changed

# View your database in a GUI
npx prisma studio

# Generate Prisma client after schema changes
npx prisma generate

# Install a new package
npm install package-name

# Install a dev-only package
npm install -D package-name

# Run tests
npm test

# Check for TypeScript errors without running
npx tsc --noEmit
```

---

## Quick Reference Card

| Need to... | Go to... |
|---|---|
| Add a new database table | `server/prisma/schema.prisma` → run `npx prisma migrate dev` |
| Add a new API endpoint | `server/src/routes/` → `controllers/` → `services/` |
| Add a new screen | `mobile/app/` (drop a `.tsx` file, it auto-routes) |
| Add a new reusable component | `mobile/components/` |
| Call the API from mobile | `mobile/services/` → create a function → use in a React Query hook |
| Store data locally on phone | `mobile/stores/` (Zustand) or `expo-secure-store` (for tokens) |
| Change the database schema | Edit `schema.prisma` → `npx prisma migrate dev --name change-name` |
| Add an environment variable | `server/.env` → load in `server/src/config/env.ts` |
| Debug an API issue | `npx prisma studio` to check DB + Postman to check API response |

---

**You now have everything you need. Start at Phase 0, work through each phase in order, and you'll have a production-ready fitness app. Don't skip ahead — each phase builds on the last.**

**The single most important thing:** When you get stuck, read the error message carefully. 90% of the time, it tells you exactly what's wrong. The other 10%, paste it into Google or ask an AI. Every developer does this. It's not cheating — it's the job.

Good luck. Go build something great.
