const baseUrl = process.env.VITE_API_BASE_URL;
const axios = require("axios");
const { getDaysUntilExpiration } = require("../utils/dateUtils.js");
const {
  RECIPES_PATH,
  REC_PATH,
  COST_PATH,
  GROCERY_LIST_PATH,
} = require("../utils/backend_paths.js");
const {
  INVENTORY_CONSTANTS,
  MEAL_CONSTANTS,
} = require("../utils/groceryConstants.js");

const groceryRecommendation = async (userId, preferences, inventory) => {
  const { budget, mealsNum, allowRepeats, maxRepeats } = preferences;

  try {
    // Analyze current inventory to find expiration and stock levels of items
    const inventoryAnalysis = analyzeInventory(inventory);

    // Generate meal plan based on inventory analysis and user's preferences
    const mealPlan = await generateMealPlan(userId, {
      totalMeals: mealsNum,
      allowRepeats,
      maxRepeats,
    });

    // If no meals could be planned, return meal plan
    if (mealPlan.length === 0) {
      return {
        shoppingList: [],
        inventoryRecommendations: [],
        totalCost: 0,
        budget: budget,
        expiringItems: inventoryAnalysis.expiringSoon,
        expiringCount: inventoryAnalysis.expiringSoon.length,
        mealPlan: [],
        itemsNeeded: 0,
        message: "No meals could be planned",
      };
    }

    // Generate shopping list based on meal plan and inventory
    const {
      shoppingList,
      inventoryRecommendations,
      expiringItems,
      itemsToBuy,
      itemsExpiring,
    } = calculateShoppingAndExpiring(mealPlan, inventoryAnalysis, userId);

    // If no additional items need to be bought, all ingredients are available
    if (itemsToBuy === 0) {
      return {
        shoppingList: [],
        inventoryRecommendations: [],
        totalCost: 0,
        budget: budget,
        expiringItems: expiringItems,
        expiringCount: itemsExpiring,
        mealPlan: mealPlan,
        itemsNeeded: 0,
        message: "All ingredients already available",
      };
    }

    // Calculate total cost of the shopping list for recipe ingredients
    const { shoppingList: shoppingListCosts, totalCost } =
      await calculateShoppingListCost(shoppingList, userId);

    // Return final shopping list with costs, and meal plan
    return {
      shoppingList: shoppingListCosts,
      inventoryRecommendations,
      totalCost,
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
  const { totalMeals, allowRepeats = true, maxRepeats } = preferences;

  // Fallback in case maxRepeats and totalMeals are undefined
  const actualTotalMeals = totalMeals || MEAL_CONSTANTS.TOTAL_MEALS;
  const actualMaxRepeats = maxRepeats || MEAL_CONSTANTS.MAX_REPEATS;

  if (allowRepeats) {
    return await generateMealPlanWithRepeats(userId, {
      totalMeals: actualTotalMeals,
      maxRepeats: actualMaxRepeats,
    });
  } else {
    return await generateMealPlanNoRepeats(userId, {
      totalMeals: actualTotalMeals,
    });
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
          },
        }
      );

      const recipes = response.data.recipes || [];
      // Ensure meals don't repeat in the plan
      const possibleRecipes = recipes.filter(
        (recipe) => !usedRecipes.has(recipe.id)
      );

      if (possibleRecipes.length > 0) {
        const selectedRecipe = {
          ...possibleRecipes[0],
          mealNumber: i + 1,
        };
        mealPlan.push(selectedRecipe);
        usedRecipes.add(selectedRecipe.id);
      } else {
        // No more unique recipes available
        break;
      }
    } catch (err) {
      break;
    }
  }
  return mealPlan;
};

const generateMealPlanWithRepeats = async (userId, preferences) => {
  const { totalMeals, maxRepeats } = preferences;

  // Fallback in case maxRepeats and totalMeals are undefined
  const actualTotalMeals = totalMeals || MEAL_CONSTANTS.TOTAL_MEALS;
  const actualMaxRepeats = maxRepeats || MEAL_CONSTANTS.MAX_REPEATS;

  try {
    // Call recipe recommendation system
    const response = await axios.get(
      `${baseUrl}${RECIPES_PATH}${REC_PATH}/${userId}`,
      {
        params: {
          ingredientType: "partial",
          priority: "balanced",
          expirationToggle: true,
        },
      }
    );

    const recipes = response.data.recipes || [];
    const maxPossibleMeals = recipes.length * actualMaxRepeats;
    const actualMeals = Math.min(actualTotalMeals, maxPossibleMeals);
    const mealPlan = [];
    const repeatMeals = new Map();

    recipes.forEach((recipe) => {
      repeatMeals.set(recipe.id, 0);
    });
    // Distribute recipes evenly
    for (let i = 0; i < actualMeals; i++) {
      // Find recipe with fewest repeats that hasn't reached max repeats
      let selectedRecipe = null;
      let minRepeats = actualMaxRepeats;
      for (const recipe of recipes) {
        const currRepeats = repeatMeals.get(recipe.id);
        if (currRepeats < actualMaxRepeats && currRepeats < minRepeats) {
          minRepeats = currRepeats;
          selectedRecipe = recipe;
        }
      }

      // If all recipes reached max repeats, break
      if (!selectedRecipe) {
        break;
      }
      // Add selected recipe to meal plan
      mealPlan.push({
        ...selectedRecipe,
        mealNumber: i + 1,
      });
      repeatMeals.set(selectedRecipe.id, minRepeats + 1);
    }
    return mealPlan;
  } catch (err) {
    return [];
  }
};

const calculateShoppingAndExpiring = (mealPlan, inventoryAnalysis, userId) => {
  // Items to buy
  const shoppingList = new Map();
  // Expiring items to use in recipes
  const expiringItems = [];
  const inventoryRecommendations = [];

  // Iterate through each recipe in mealPlan
  mealPlan.forEach((recipe) => {
    const ingredients =
      recipe.extendedIngredients || recipe.missedIngredients || [];
    // Iterate through each ingredient in the recipe
    ingredients.forEach((ingredientData) => {
      const ingredientId = ingredientData.id;

      // Check if this ingredient is well stocked
      const stockedIngredient = inventoryAnalysis.wellStocked.find(
        (item) => item.name.toLowerCase() === ingredientData.name.toLowerCase()
      );
      // Check if we need to buy this ingredient
      if (!stockedIngredient) {
        if (shoppingList.has(ingredientId)) {
          const alreadyExisting = shoppingList.get(ingredientId);

          // Combine ingredient quantities for multiple recipes
          const newQuantity = alreadyExisting.quantity + ingredientData.amount;
          shoppingList.set(ingredientId, {
            ...alreadyExisting,
            quantity: newQuantity,
            unit: ingredientData.unit,
            // Combine recipes that use this ingredient
            recipes: [...alreadyExisting.recipes, recipe.title],
          });
        } else {
          shoppingList.set(ingredientId, {
            id: ingredientId,
            name: ingredientData.name,
            quantity: ingredientData.amount,
            unit: ingredientData.unit,
            recipes: [recipe.title],
            priority: "needed",
          });
        }
      }
    });
  });

  // List of ingredients already in shopping list
  const recipeIngredientNames = Array.from(shoppingList.values()).map((item) =>
    item.name.toLowerCase()
  );
  // Identify expiring items
  inventoryAnalysis.expiringSoon.forEach((item) => {
    const daysLeft = getDaysUntilExpiration(item.expiration_date);
    // Check if expiring item is used in any recipes
    const usedInRecipe = recipeIngredientNames.includes(
      item.name.toLowerCase()
    );
    if (usedInRecipe) {
      expiringItems.push({
        name: item.name,
        quantity: item.quantity,
        expirationDate: item.expiration_date,
        daysLeft: daysLeft,
        priority: "expiring",
        id: item.id,
      });
    }

    // Only add to recommendations if not already in shopping list
    if (!usedInRecipe) {
      inventoryRecommendations.push({
        name: item.name,
        reason: `Expires in ${daysLeft} day${daysLeft === 1 ? "" : "s"}`,
        type: "expiring-replacement",
        item: item,
      });
    }
  });

  // Identify expired
  inventoryAnalysis.expired.forEach((item) => {
    const daysLeft = getDaysUntilExpiration(item.expiration_date);

    // Only add to recommendations if not already in shopping list
    if (!recipeIngredientNames.includes(item.name.toLowerCase())) {
      inventoryRecommendations.push({
        name: item.name,
        reason: `Expired ${Math.abs(daysLeft)} day${
          daysLeft === 1 ? "s" : ""
        } ago`,
        type: "expiring-replacement",
        item: item,
      });
    }
  });

  inventoryAnalysis.runningLow.forEach((item) => {
    const daysLeft = getDaysUntilExpiration(item.expiration_date);
    if (daysLeft > INVENTORY_CONSTANTS.MIN_RESTOCK_DAYS || 7) {
      if (!recipeIngredientNames.includes(item.name.toLowerCase())) {
        inventoryRecommendations.push({
          name: item.name,
          reason: `Only ${item.quantity} left`,
          type: "low-stock-replacement",
          item: item,
        });
      }
    }
  });

  return {
    shoppingList: Array.from(shoppingList.values()),
    inventoryRecommendations: inventoryRecommendations,
    expiringItems: expiringItems.sort((a, b) => a.daysLeft - b.daysLeft),
    itemsToBuy: shoppingList.size,
    itemsExpiring: expiringItems.length,
  };
};

const calculateShoppingListCost = async (shoppingList, userId) => {
  let totalCost = 0;
  const shoppingListCosts = [];

  // Calculate total cost for all items in shopping list
  for (const item of shoppingList) {
    try {
      const costInfo = await getIngredientCost(
        item.id,
        item.quantity,
        item.unit,
        userId
      );

      totalCost += costInfo.cost;
      shoppingListCosts.push({
        ...item,
        itemCost: Math.round(costInfo.cost * 100) / 100,
        costInfo: costInfo,
      });
    } catch (err) {
      shoppingListCosts.push({
        ...item,
        itemCost: 0,
        costInfo: null,
      });
    }
  }

  return { shoppingList: shoppingListCosts, totalCost: totalCost.toFixed(2) };
};

const getIngredientCost = async (
  ingredientId,
  quantity,
  ingredientUnit,
  userId
) => {
  // Fetch cost information for specific ingredient
  try {
    const response = await axios.get(
      `${baseUrl}${GROCERY_LIST_PATH}${COST_PATH}/${userId}`,
      {
        params: {
          ingredientId,
          amount: quantity,
          unit: ingredientUnit,
        },
      }
    );
    return {
      cost: response.data.price,
      ingredient: response.data.name,
      amount: response.data.amount,
      unit: response.data.unit,
    };
  } catch (err) {
    console.log("Error getting cost for ingredient");
    return null;
  }
};

module.exports = {
  groceryRecommendation,
  analyzeInventory,
  generateMealPlan,
  generateMealPlanNoRepeats,
  generateMealPlanWithRepeats,
  calculateShoppingAndExpiring,
  calculateShoppingListCost,
};
