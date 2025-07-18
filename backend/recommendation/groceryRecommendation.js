const baseUrl = process.env.VITE_API_BASE_URL;
const axios = require("axios");
const { getDaysUntilExpiration } = require("../utils/dateUtils.js");
const {
  RECIPES_PATH,
  REC_PATH,
  MAP_PATH,
  GROCERY_LIST_PATH,
} = require("../utils/backend_paths.js");
const {
  INVENTORY_CONSTANTS,
  MEAL_CONSTANTS,
} = require("../utils/groceryConstants.js");

const groceryRecommendation = async (userId, preferences, inventory) => {
  const { budget, mealsNum, allowRepeats, maxRepeats } = preferences;

  try {
    const inventoryAnalysis = analyzeInventory(inventory);
    const mealPlan = await generateMealPlan(userId, {
      totalMeals: mealsNum,
      allowRepeats,
      maxRepeats,
    });

    if (mealPlan.length === 0) {
      return {
        shoppingList: [],
        totalCost: 0,
        budget: budget,
        expiringItems: inventoryAnalysis.expiringSoon,
        expiringCount: inventoryAnalysis.expiringSoon.length,
        mealPlan: [],
        itemsNeeded: 0,
        message: "No meals could be planned",
      };
    }

    const { shoppingList, expiringItems, itemsToBuy, itemsExpiring } =
      calculateShoppingAndExpiring(mealPlan, inventoryAnalysis);

    if (itemsToBuy === 0) {
      return {
        shoppingList: [],
        totalCost: 0,
        budget: budget,
        expiringItems: expiringItems,
        expiringCount: itemsExpiring,
        mealPlan: mealPlan,
        itemsNeeded: 0,
        message: "All ingredients already available",
      };
    }
    const shoppingListWithPrices = await mapIngredientsToProducts(
      shoppingList,
      budget,
      userId
    );

    return {
      shoppingList: shoppingListWithPrices.shoppingList,
      totalCost: shoppingListWithPrices.totalCost,
      budget: budget,
      expiringItems: expiringItems,
      expiringCount: itemsExpiring,
      mealPlan,
      itemsNeeded: itemsToBuy,
    };
  } catch (err) {
    console.error("Grocery recommendation error:", err);
  }
};

const analyzeInventory = (inventory) => {
  const expiringSoon = [],
    runningLow = [],
    wellStocked = [],
    expired = [];
  // Check stock and expiration for each inventory item
  inventory.forEach((item) => {
    const daysUntilExpire = getDaysUntilExpiration(item.expiration_date);
    if (daysUntilExpire < INVENTORY_CONSTANTS.EXPIRED) {
      expired.push(item);
    } else if (item.quantity <= INVENTORY_CONSTANTS.LOW_STOCK) {
      runningLow.push(item);
    } else if (daysUntilExpire <= INVENTORY_CONSTANTS.EXPIRING_THREE_DAYS) {
      expiringSoon.push(item);
    } else {
      wellStocked.push(item);
    }
  });
  return { expiringSoon, runningLow, wellStocked, expired };
};

const generateMealPlan = async (userId, preferences) => {
  const {
    totalMeals = MEAL_CONSTANTS.TOTAL_MEALS,
    allowRepeats = true,
    maxRepeats = MEAL_CONSTANTS.MAX_REPEATS,
  } = preferences;
  if (allowRepeats) {
    return await generateMealPlanWithRepeats(userId, {
      totalMeals,
      maxRepeats,
    });
  } else {
    return await generateMealPlanNoRepeats(userId, totalMeals);
  }
};

const generateMealPlanNoRepeats = async (userId, preferences) => {
  const { totalMeals } = preferences;
  const mealPlan = [];
  const usedRecipes = new Set();

  for (let i = 0; i < totalMeals; i++) {
    try {
      // Call recipe recommendation system
      const response = await axios.get(
        `${baseUrl}${RECIPES_PATH}${REC_PATH}/${userId}`,
        {
          params: {
            ingredientType: "partial",
            priority: "balanced",
            expirationToggle: true,
            maxMissing: MEAL_CONSTANTS.MAX_MISSING,
          },
        }
      );

      const recipes = response.data.recipes || [];
      // Ensure meals don't repeat in the plan
      const possibleRecipes = recipes.filter(
        (recipe) => !usedRecipes.has(recipe.id)
      );

      if (possibleRecipes.length > 0) {
        const recipeIndex = i % recipes.length;
        const selectedRecipe = {
          ...possibleRecipes[recipeIndex],
          mealNumber: i + 1,
        };
        mealPlan.push(selectedRecipe);
        usedRecipes.add(selectedRecipe.id);
      }
    } catch (err) {
      console.log("Error getting meals");
    }
  }
  return mealPlan;
};

const generateMealPlanWithRepeats = async (userId, preferences) => {
  const { totalMeals, maxRepeats = MEAL_CONSTANTS.MAX_REPEATS } = preferences;

  try {
    // Call recipe recommendation system
    const response = await axios.get(
      `${baseUrl}${RECIPES_PATH}${REC_PATH}/${userId}`,
      {
        params: {
          ingredientType: "partial",
          priority: "balanced",
          expirationToggle: true,
          maxMissing: MEAL_CONSTANTS.MAX_MISSING,
        },
      }
    );

    const recipes = response.data.recipes || [];
    const mealPlan = [];
    for (let i = 0; i < totalMeals; i++) {
      const recipeIndex = i % recipes.length;
      if (recipes.length > 0) {
        // Track which meal number this is
        mealPlan.push({ ...recipes[recipeIndex], mealNumber: i + 1 });
      }
    }
    return mealPlan;
  } catch (err) {
    console.log("Error getting meals");
  }
};

const calculateShoppingAndExpiring = (mealPlan, inventoryAnalysis) => {
  // Items to buy
  const shoppingList = new Map();
  // Items to use up
  const expiringItems = [];

  // Iterate through each recipe in mealPlan
  mealPlan.forEach((recipe) => {
    const ingredients =
      recipe.extendedIngredients || recipe.missedIngredients || [];
    // Iterate through each ingredient in the recipe
    ingredients.forEach((ingredient) => {
      const ingredientName = ingredient.name.toLowerCase();
      // Check if this ingredient is well stocked
      const stockedIngredient = inventoryAnalysis.wellStocked.find(
        (item) => item.name.toLowerCase() === ingredientName
      );
      // Check if we need to buy this ingredient
      if (!stockedIngredient) {
        if (shoppingList.has(ingredientName)) {
          // Combine ingredient quantities for multiple recipes
          const alreadyExisting = shoppingList.get(ingredientName);
          shoppingList.set(ingredientName, {
            ...alreadyExisting,
            quantity: alreadyExisting.quantity + ingredient.amount,
            unit: ingredient.unit,
            // Combine recipes that use this ingredient
            recipes: [...alreadyExisting.recipes, recipe.title],
          });
        } else {
          shoppingList.set(ingredientName, {
            name: ingredient.name,
            quantity: ingredient.amount,
            unit: ingredient.unit,
            recipes: [recipe.title],
            priority: "needed",
          });
        }
      }
    });
  });

  // Identify expiring items
  inventoryAnalysis.expiringSoon.forEach((item) => {
    expiringItems.push({
      name: item.name,
      quantity: item.quantity,
      expirationDate: item.expiration_date,
      daysLeft: getDaysUntilExpiration(item.expiration_date),
      priority: "expiring",
    });
  });

  return {
    shoppingList: Array.from(shoppingList.values()),
    expiringItems: expiringItems.sort((a, b) => a.daysLeft - b.daysLeft),
    itemsToBuy: shoppingList.size,
    itemsExpiring: expiringItems.length,
  };
};

const mapIngredientsToProducts = async (shoppingList, budget, userId) => {
  const items = [];
  let totalCost = 0;

  for (const ingredient of shoppingList) {
    try {
      const response = await axios.get(
        `${baseUrl}${GROCERY_LIST_PATH}${MAP_PATH}/${userId}`,
        {
          params: {
            ingredient: ingredient.name,
          },
        }
      );
      if (response.data.product) {
        const product = response.data.product;
        const itemCost = product.price * Math.ceil(ingredient.quantity);
        items.push({
          ...ingredient,
          productName: product.name,
          price: product.price,
          totalCost: itemCost,
          imageUrl: product.imgUrl,
        });
        totalCost += itemCost;
      } else {
        console.log(`No price found for ${ingredient.name}`);
      }
    } catch (err) {
      console.log(`Error pricing ${ingredient.name}`);
    }
  }
  return { shoppingList: items, totalCost: totalCost, itemCount: items.length };
};

module.exports = {
  groceryRecommendation,
  analyzeInventory,
  generateMealPlan,
  generateMealPlanNoRepeats,
  generateMealPlanWithRepeats,
  calculateShoppingAndExpiring,
  mapIngredientsToProducts,
};
