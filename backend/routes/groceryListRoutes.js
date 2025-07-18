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
  MAP_PATH,
  PRODUCTS_PATH,
  SEARCH_PATH,
  GENERATE_PATH,
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

// Map ingredient item to grocery products
groceryListRoutes.get(`${MAP_PATH}/:userId`, async (req, res) => {
  const { ingredient } = req.query;

  try {
    const response = await axios.get(
      `${baseUrl}${PRODUCTS_PATH}${SEARCH_PATH}`,
      {
        params: {
          apiKey,
          query: ingredient,
          number: 3, // Number of results
          addProductInformation: true,
          sort: "price",
          sortDirection: "asc",
        },
      }
    );

    if (response.data.products && response.data.products.length > 0) {
      // Get cheapest result
      const product = response.data.products[0];
      res.json({
        success: true,
        product: {
          name: product.title,
          id: product.id,
          price: product.price / 100,
          imgUrl: product.image,
        },
        nutrition: {
          calories: product.nutrition.calories || 0,
          protein: product.nutrition.protein || 0,
          carbs: product.nutrition.carbohydrates || 0,
          fat: product.nutrition.fat || 0,
        },
      });
    } else {
      res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: `No products found for ${ingredient}`,
      });
    }
  } catch (err) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Error fetching product information",
    });
  }
});

module.exports = groceryListRoutes;
