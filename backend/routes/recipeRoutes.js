require("dotenv").config({ path: "./.env" });
const express = require("express");
const recipeRoutes = express.Router();
const StatusCodes = require("http-status-codes").StatusCodes;
const axios = require("axios");
const apiKey = process.env.SPOONACULAR_API_KEY;
const baseUrl = process.env.SPOONACULAR_RECIPE_URL;
const checkInvalidVariable = require("../utils/invalidVars.js");
const sqlite3 = require("sqlite3");
const path = require("path");
const dbPath = path.resolve(__dirname, "../db/fridge.db");
const db = new sqlite3.Database(dbPath);
const INGREDIENTS_PATH = "/findByIngredients";
const EXACT_PATH = "/exact";
const PARTIAL_PATH = "/partial";
const REC_PATH = "/recommendations";
const { EXPIRING_PATH } = require("../utils/backend_paths.js");
const { getDaysUntilExpiration } = require("../utils/dateUtils.js");
const {
  recipeRecommendation,
} = require("../recommendation/recipeRecommendation.js");

// Filter recipes
recipeRoutes.get("/", async (req, res) => {
  const preferences = req.query;
  const recipeParams = {
    apiKey: apiKey,
    query: preferences.query || "",
    cuisine: preferences.cuisine || "",
    diet: preferences.diet || "",
    type: preferences.type || "",
    includeIngredients: preferences.includeIngredients || "",
    addRecipeInformation: preferences.addRecipeInformation || "",
    fillIngredients: preferences.fillIngredients || "",
    number: preferences.number || "",
    minCarbs: preferences.minCarbs || "",
    maxCarbs: preferences.maxCarbs || "",
    minProtein: preferences.minProtein || "",
    maxProtein: preferences.maxProtein || "",
    minCalories: preferences.minCalories || "",
    maxCalories: preferences.maxCalories || "",
    minFat: preferences.minFat || "",
    maxFat: preferences.maxFat || "",
  };

  Object.keys(recipeParams).forEach((key) => {
    if (recipeParams[key] === "" || recipeParams[key] === undefined) {
      delete recipeParams[key];
    }
  });

  try {
    const response = await axios.get(`${baseUrl}/complexSearch`, {
      params: recipeParams,
    });
    res.json({
      success: true,
      recipes: response.data.results,
      totalResults: response.data.totalResults,
    });
  } catch (err) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: "Failed to fetch recipes" });
  }
});

// Filter recipes by ingredients
recipeRoutes.get("/ingredients", async (req, res) => {
  // Number is max number of recipes
  // Ranking is whether to maximize used ingredients or minimize missing ingredients
  const { ingredients, number, ranking = 2 } = req.query;

  if (checkInvalidVariable(ingredients)) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: "Missing required ingredients parameter",
    });
  }

  const recipeParams = {
    apiKey: apiKey,
    ingredients: ingredients,
    number: number,
    ranking: ranking,
    ignorePantry: true,
  };

  try {
    const response = await axios.get(`${baseUrl}${INGREDIENTS_PATH}`, {
      params: recipeParams,
    });

    res.json({
      success: true,
      recipes: response.data,
    });
  } catch (err) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Failed to fetch recipes by ingredients",
    });
  }
});

// Get recipe information
recipeRoutes.get("/:id", async (req, res) => {
  const { id } = req.params;
  const { includeNutrition = true } = req.query;

  const recipeParams = {
    apiKey: apiKey,
    includeNutrition: includeNutrition,
  };

  try {
    const response = await axios.get(`${baseUrl}/${id}/information`, {
      params: recipeParams,
    });

    res.json({
      success: true,
      recipes: response.data,
    });
  } catch (err) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: "Failed to fetch recipe information" });
  }
});

// Get recipes only using user's inventory items
recipeRoutes.get(`${EXACT_PATH}/:userId`, (req, res) => {
  const { userId } = req.params;
  try {
    db.all(
      `SELECT * FROM inventory WHERE user_id = ?`,
      [userId],
      async (err, inventory) => {
        if (err) {
          return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Error fetching inventory items",
          });
        }

        if (inventory.length === 0) {
          return res.json({
            success: true,
            recipes: [],
            message: "No inventory items",
          });
        }

        try {
          const apiParams = {
            apiKey,
            ingredients: inventory.map((item) => item.name).join(","),
            number: 20,
            ranking: 2,
            ignorePantry: true,
          };

          const response = await axios.get(`${baseUrl}${INGREDIENTS_PATH}`, {
            params: apiParams,
          });

          const exactRecipes = response.data.filter(
            (recipe) => recipe.missedIngredientCount === 0
          );

          const detailedRecipes = await findDetailedRecipes(exactRecipes);

          res.json({
            success: true,
            recipes: detailedRecipes,
            numFound: detailedRecipes.length,
            itemsUsed: inventory.length,
            message: `Found ${detailedRecipes.length} recipes using only your ingredients!`,
          });
        } catch (err) {
          res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Error fetching recipes",
          });
        }
      }
    );
  } catch (err) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: `Failed to fetch recipes with exact ingredients`,
    });
  }
});

// Get recipes using mostly user's inventory items
recipeRoutes.get(`${PARTIAL_PATH}/:userId`, (req, res) => {
  const { userId } = req.params;
  const { maxMissing = 3 } = req.query;
  try {
    db.all(
      `SELECT * FROM inventory WHERE user_id = ?`,
      [userId],
      async (err, inventory) => {
        if (err) {
          return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Error fetching inventory items",
          });
        }
        if (inventory.length === 0) {
          return res.json({
            success: true,
            recipes: [],
            message: "No inventory items",
          });
        }
        try {
          const response = await axios.get(`${baseUrl}${INGREDIENTS_PATH}`, {
            params: {
              apiKey,
              ingredients: inventory.map((item) => item.name).join(","),
              number: 20,
              ranking: 2, // Minimize missing ingredients
              ignorePantry: true,
            },
          });

          const partialRecipes = response.data.filter(
            (recipe) =>
              recipe.missedIngredientCount > 0 &&
              recipe.missedIngredientCount <= parseInt(maxMissing)
          );

          const detailedRecipes = await findDetailedRecipes(partialRecipes);

          // Sort by fewest missing ingredients
          detailedRecipes.sort(
            (a, b) => a.missedIngredientCount - b.missedIngredientCount
          );
          res.json({
            success: true,
            recipes: detailedRecipes,
            numFound: detailedRecipes.length,
            message: `Found ${detailedRecipes.length} recipes with up to ${maxMissing} missing ingredients!`,
          });
        } catch (err) {
          res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Error fetching recipes",
          });
        }
      }
    );
  } catch (err) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: `Failed to fetch recipes with up to ${maxMissing} missing ingredients`,
    });
  }
});

// Get recipes prioritizing expiring ingredients
recipeRoutes.get(`${EXPIRING_PATH}/:userId`, (req, res) => {
  const { userId } = req.params;
  const { numDaysExpiring = 5 } = req.query;

  try {
    db.all(
      `SELECT * FROM inventory WHERE user_id = ?`,
      [userId],
      async (err, inventory) => {
        if (err) {
          return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Error fetching inventory items",
          });
        }

        if (inventory.length === 0) {
          return res.json({
            success: true,
            recipes: [],
            expiringItems: [],
            message: "No inventory items",
          });
        }

        const expiringItems = getExpiringItems(inventory, numDaysExpiring);

        if (expiringItems.length === 0) {
          return res.json({
            success: true,
            recipes: [],
            expiringItems: [],
            message: `No items expiring in less than ${numDaysExpiring} days`,
          });
        }

        try {
          const response = await axios.get(`${baseUrl}${INGREDIENTS_PATH}`, {
            params: {
              apiKey,
              ingredients: expiringItems.map((item) => item.name).join(","),
              number: 20,
              // Maximize used ingredients
              ranking: 1,
              ignorePantry: true,
            },
          });

          const priorityRecipes = response.data.map((recipe) => {
            let priority = 0;
            const usedExpiringItems = [];
            recipe.usedIngredients.forEach((ingredient) => {
              const expiringItem = expiringItems.find(
                (item) =>
                  ingredient.name.toLowerCase() === item.name.toLowerCase()
              );
              if (expiringItem) {
                const daysUntilExpire = getDaysUntilExpiration(
                  expiringItem.expiration_date
                );
                if (daysUntilExpire <= 1) {
                  priority += 3;
                } else if (daysUntilExpire <= 3) {
                  priority += 2;
                } else if (daysUntilExpire <= 7) {
                  priority += 1;
                }
                usedExpiringItems.push({
                  ...expiringItem,
                  daysUntilExpire,
                });
              }
            });
            return {
              ...recipe,
              priority,
              usedExpiringItems,
              numExpiringItems: usedExpiringItems.length,
            };
          });

          // Sort by priority (high -> low)
          priorityRecipes.sort((a, b) => b.priority - a.priority);
          res.json({
            success: true,
            recipes: priorityRecipes,
            expiringItems: expiringItems.map((item) => ({
              name: item.name,
              daysUntilExpire: getDaysUntilExpiration(item.expiration_date),
              expirationDate: item.expiration_date,
            })),
            numFound: priorityRecipes.length,
            message: `Found ${priorityRecipes.length} recipes using ${expiringItems.length} expiring ingredients!`,
          });
        } catch (err) {
          res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Error fetching recipes from API",
          });
        }
      }
    );
  } catch (err) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: `Failed to fetch expiring items`,
    });
  }
});

// Get recipes with recommendations
recipeRoutes.get(`${REC_PATH}/:userId`, (req, res) => {
  const { userId } = req.params;
  const {
    ingredientType = "exact",
    expirationToggle = "false",
    priority = "balanced",
    maxPrepTime,
    cuisine,
    minCalories,
    maxCalories,
    minProtein,
    maxProtein,
    minCarbs,
    maxCarbs,
    minFat,
    maxFat,
  } = req.query;

  db.all(
    `SELECT * FROM inventory WHERE user_id = ?`,
    [userId],
    async (err, inventory) => {
      if (err) {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
          success: false,
          message: "Error fetching inventory items",
        });
      }

      if (inventory.length === 0) {
        return res.json({
          success: true,
          recipes: [],
          expiringItems: [],
          message: "No inventory items",
        });
      }

      db.get(
        `SELECT * FROM users WHERE id = ?`,
        [userId],
        async (err, profile) => {
          if (err) {
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
              success: false,
              message: "Error getting user profile",
            });
          }

          if (!profile) {
            return res.status(StatusCodes.NOT_FOUND).json({
              success: false,
              message: "User profile not found",
            });
          }

          try {
            const userFilters = {
              expirationToggle: expirationToggle === "true",
              maxPrepTime: maxPrepTime ? parseInt(maxPrepTime) : null,
              cuisine: cuisine ? cuisine : null,
              minCalories: minCalories ? parseInt(minCalories) : null,
              maxCalories: maxCalories ? parseInt(maxCalories) : null,
              minProtein: minProtein ? parseInt(minProtein) : null,
              maxProtein: maxProtein ? parseInt(maxProtein) : null,
              minCarbs: minCarbs ? parseInt(minCarbs) : null,
              maxCarbs: maxCarbs ? parseInt(maxCarbs) : null,
              minFat: minFat ? parseInt(minFat) : null,
              maxFat: maxFat ? parseInt(maxFat) : null,
              priority: priority ? priority : "balanced",
            };

            const recommendations = await recipeRecommendation(
              ingredientType,
              userFilters,
              profile,
              inventory
            );

            return res.json({ success: true, ...recommendations, userId });
          } catch (error) {
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
              success: false,
              message: "Error getting recommendations",
            });
          }
        }
      );
    }
  );
});

// Get detailed recipe information
const findDetailedRecipes = async (recipes) => {
  if (!recipes || recipes.length === 0) {
    return [];
  }
  const limitedRecipes = recipes.slice(0, 15);
  try {
    const response = await axios.get(`${baseUrl}/informationBulk`, {
      params: {
        apiKey,
        ids: limitedRecipes.map((recipe) => recipe.id).join(","),
        includeNutrition: true,
      },
    });
    const detailsMap = new Map();
    response.data.forEach((recipeDetail) => {
      detailsMap.set(recipeDetail.id, recipeDetail);
    });

    return limitedRecipes.map((recipe) => {
      const details = detailsMap.get(recipe.id);
      if (details) {
        return {
          ...recipe,
          ...details,
          missedIngredientCount: recipe.missedIngredientCount,
          usedIngredients: recipe.usedIngredients,
        };
      }
      return {
        ...recipe,
        readyInMinutes: null,
        cuisines: [],
      };
    });
  } catch (err) {
    console.log("Error fetching detailed recipes");
    return limitedRecipes.map((recipe) => ({
      ...recipe,
      readyInMinutes: null,
      cuisines: [],
    }));
  }
};

// Helper to get expiring items
const getExpiringItems = (inventory, daysUntilExpire) => {
  return inventory
    .filter(
      (item) =>
        getDaysUntilExpiration(item.expiration_date) <= daysUntilExpire &&
        getDaysUntilExpiration(item.expiration_date) >= 0
    )
    .sort((a, b) => {
      return (
        getDaysUntilExpiration(a.expiration_date) -
        getDaysUntilExpiration(b.expiration_date)
      );
    });
};

module.exports = recipeRoutes;
