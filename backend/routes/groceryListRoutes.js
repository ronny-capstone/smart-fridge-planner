const baseUrl = process.env.SPOONACULAR_BASE_URL;
const express = require("express");
const path = require("path");
const dbPath = path.resolve(__dirname, "../db/fridge.db");
const sqlite3 = require("sqlite3");
const db = new sqlite3.Database(dbPath);
const groceryListRoutes = express.Router();
const apiKey = process.env.SPOONACULAR_API_KEY;
const StatusCodes = require("http-status-codes").StatusCodes;
const axios = require("axios");
const {
  COST_PATH,
  GENERATE_PATH,
  INGREDIENTS_PATH,
  INFORMATION_PATH,
} = require("../utils/backend_paths.js");
const {
  groceryRecommendation,
} = require("../recommendation/groceryRecommendation.js");

// Get user's full grocery list
groceryListRoutes.get(`${GENERATE_PATH}/:userId`, async (req, res) => {
  const { userId } = req.params;
  const {
    budget = 50,
    totalMeals = 7,
    allowRepeats = true,
    maxRepeats = 2,
  } = req.query;

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

        const groceryList = await groceryRecommendation(
          userId,
          {
            budget,
            mealsNum: totalMeals,
            allowRepeats,
            maxRepeats,
          },
          inventory
        );
        const budgetUsed = Math.round((groceryList.totalCost / budget) * 100);
        res.json({
          success: true,
          groceries: groceryList,
          totalCost: groceryList.totalCost,
          budgetUsed: budgetUsed,
        });
      }
    );
  } catch (err) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Error generating grocery list",
    });
  }
});

groceryListRoutes.get(`${COST_PATH}/:userId`, async (req, res) => {
  const { ingredientId, amount, unit } = req.query;

  try {
    const response = await axios.get(
      `${baseUrl}${INGREDIENTS_PATH}/${ingredientId}${INFORMATION_PATH}`,
      {
        params: {
          apiKey,
          amount: amount,
          unit: unit,
        },
      }
    );

    const ingredientInfo = response.data;
    // Get cost in dollars
    const cost = ingredientInfo.estimatedCost.value / 100;
    res.status(StatusCodes.OK).json({
      id: ingredientInfo.id,
      name: ingredientInfo.name,
      amount: amount,
      unit: unit,
      price: cost,
      image: ingredientInfo.image,
    });
  } catch (err) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Error getting ingredient information",
    });
  }
});

module.exports = groceryListRoutes;
