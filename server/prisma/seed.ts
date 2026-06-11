import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type SeedItem = {
  restaurant: string;
  itemName: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingSize: string;
  category: string;
};

// Macro data from each chain's published nutrition info (approximate).
const FAST_FOOD_ITEMS: SeedItem[] = [
  // ── Chipotle ───────────────────────────────────────────
  { restaurant: "Chipotle", itemName: "Chicken Bowl (rice, black beans, fajita veggies, salsa)", calories: 625, protein: 45, carbs: 75, fat: 15, servingSize: "1 bowl", category: "Bowl" },
  { restaurant: "Chipotle", itemName: "Steak Bowl (rice, pinto beans, lettuce, salsa)", calories: 610, protein: 38, carbs: 73, fat: 16, servingSize: "1 bowl", category: "Bowl" },
  { restaurant: "Chipotle", itemName: "Chicken Salad Bowl (no rice, beans, salsa, lettuce)", calories: 405, protein: 40, carbs: 32, fat: 12, servingSize: "1 bowl", category: "Salad" },
  { restaurant: "Chipotle", itemName: "Double Chicken Bowl (rice, veggies, salsa)", calories: 750, protein: 77, carbs: 60, fat: 20, servingSize: "1 bowl", category: "Bowl" },

  // ── Chick-fil-A ────────────────────────────────────────
  { restaurant: "Chick-fil-A", itemName: "Grilled Chicken Sandwich", calories: 390, protein: 28, carbs: 44, fat: 12, servingSize: "1 sandwich", category: "Sandwich" },
  { restaurant: "Chick-fil-A", itemName: "Grilled Nuggets (12 ct)", calories: 200, protein: 38, carbs: 2, fat: 4, servingSize: "12 nuggets", category: "Entree" },
  { restaurant: "Chick-fil-A", itemName: "Market Salad with Grilled Chicken", calories: 550, protein: 28, carbs: 41, fat: 31, servingSize: "1 salad", category: "Salad" },
  { restaurant: "Chick-fil-A", itemName: "Egg White Grill (breakfast)", calories: 290, protein: 26, carbs: 30, fat: 8, servingSize: "1 sandwich", category: "Breakfast" },

  // ── McDonald's ─────────────────────────────────────────
  { restaurant: "McDonald's", itemName: "McDouble", calories: 400, protein: 22, carbs: 33, fat: 20, servingSize: "1 burger", category: "Burger" },
  { restaurant: "McDonald's", itemName: "McChicken", calories: 400, protein: 14, carbs: 39, fat: 21, servingSize: "1 sandwich", category: "Sandwich" },
  { restaurant: "McDonald's", itemName: "Quarter Pounder with Cheese", calories: 520, protein: 30, carbs: 42, fat: 26, servingSize: "1 burger", category: "Burger" },
  { restaurant: "McDonald's", itemName: "Egg McMuffin", calories: 310, protein: 17, carbs: 30, fat: 13, servingSize: "1 sandwich", category: "Breakfast" },

  // ── Subway ─────────────────────────────────────────────
  { restaurant: "Subway", itemName: "6\" Turkey Breast Sub (wheat, veggies, no cheese)", calories: 280, protein: 18, carbs: 46, fat: 4, servingSize: "6 inch sub", category: "Sandwich" },
  { restaurant: "Subway", itemName: "Footlong Turkey Breast Sub (wheat, veggies)", calories: 560, protein: 36, carbs: 92, fat: 8, servingSize: "12 inch sub", category: "Sandwich" },
  { restaurant: "Subway", itemName: "6\" Rotisserie Chicken Sub (wheat, veggies)", calories: 350, protein: 29, carbs: 45, fat: 6, servingSize: "6 inch sub", category: "Sandwich" },
  { restaurant: "Subway", itemName: "Rotisserie Chicken Protein Bowl", calories: 350, protein: 39, carbs: 13, fat: 16, servingSize: "1 bowl", category: "Bowl" },

  // ── Taco Bell ──────────────────────────────────────────
  { restaurant: "Taco Bell", itemName: "Chicken Soft Taco (x2)", calories: 380, protein: 24, carbs: 38, fat: 14, servingSize: "2 tacos", category: "Tacos" },
  { restaurant: "Taco Bell", itemName: "Power Menu Bowl with Chicken", calories: 470, protein: 26, carbs: 50, fat: 19, servingSize: "1 bowl", category: "Bowl" },
  { restaurant: "Taco Bell", itemName: "Bean Burrito (fresco style)", calories: 350, protein: 12, carbs: 55, fat: 9, servingSize: "1 burrito", category: "Burrito" },

  // ── Wendy's ────────────────────────────────────────────
  { restaurant: "Wendy's", itemName: "Grilled Chicken Sandwich", calories: 350, protein: 33, carbs: 37, fat: 9, servingSize: "1 sandwich", category: "Sandwich" },
  { restaurant: "Wendy's", itemName: "Large Chili", calories: 330, protein: 22, carbs: 32, fat: 13, servingSize: "1 large", category: "Soup" },
  { restaurant: "Wendy's", itemName: "Apple Pecan Salad with Grilled Chicken", calories: 460, protein: 38, carbs: 32, fat: 21, servingSize: "1 salad", category: "Salad" },

  // ── Panda Express ──────────────────────────────────────
  { restaurant: "Panda Express", itemName: "Grilled Teriyaki Chicken (entree only)", calories: 275, protein: 33, carbs: 14, fat: 10, servingSize: "1 entree", category: "Entree" },
  { restaurant: "Panda Express", itemName: "String Bean Chicken Breast (entree only)", calories: 210, protein: 12, carbs: 13, fat: 12, servingSize: "1 entree", category: "Entree" },
  { restaurant: "Panda Express", itemName: "Grilled Teriyaki Chicken + Super Greens", calories: 365, protein: 39, carbs: 24, fat: 13, servingSize: "1 plate", category: "Plate" },
];

const main = async () => {
  // Idempotent: wipe and re-insert so re-running the seed never duplicates.
  await prisma.fastFoodItem.deleteMany();
  await prisma.fastFoodItem.createMany({ data: FAST_FOOD_ITEMS });
  const count = await prisma.fastFoodItem.count();
  console.log(`Seeded ${count} fast food items.`);
};

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
