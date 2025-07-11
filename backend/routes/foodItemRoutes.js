require("dotenv").config({ path: "./.env" });
const sqlite3 = require("sqlite3");
const path = require("path");
const express = require("express");
const foodRoutes = express.Router();
const StatusCodes = require("http-status-codes").StatusCodes;
const axios = require("axios");
const apiKey = process.env.SPOONACULAR_API_KEY;
const baseUrl = process.env.SPOONACULAR_BASE_URL;
const dbPath = path.resolve(__dirname, "../db/fridge.db");
const {
  SEARCH_PATH,
  NUTRITION_PATH,
} = require("../../frontend/src/utils/paths.jsx");
const checkInvalidVariable = require("../utils/invalidVars.jsx");
const db = new sqlite3.Database(dbPath);

// Get nutritional information for food item
foodRoutes.get(NUTRITION_PATH, async (req, res) => {
  const { itemId, amount } = req.query;
  if (!itemId) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ error: "Missing query parameter" });
  }
  try {
    const response = await axios.get(
      `${baseUrl}/ingredients/${itemId}/information?amount=${amount}&apiKey=${apiKey}`
    );

    return res.json(response.data);
  } catch (err) {
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: "Failed to fetch nutritional info" });
  }
});

// Search for food item
foodRoutes.get(SEARCH_PATH, async (req, res) => {
  const item = req.query.query;

  if (!item) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ error: "Missing query parameter" });
  }
  try {
    const response = await axios.get(
      `${baseUrl}/ingredients/search?query=${item}&number=2&apiKey=${apiKey}`
    );

    return res.json(response.data);
  } catch (err) {
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: "Failed to fetch food" });
  }
});

// Get all food items
foodRoutes.get("/", async (req, res) => {
  db.all("SELECT * FROM food_items", async (err, rows) => {
    if (err) {
      return res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .send("Unable to get items");
    }
    return res.status(StatusCodes.OK).json(rows);
  });
});

// Get specific food item
foodRoutes.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    db.get("SELECT * FROM food_items WHERE id = ?", [id], (err, row) => {
      if (err) {
        return res
          .status(StatusCodes.INTERNAL_SERVER_ERROR)
          .json({ message: "Unable to get item" });
      }
      if (!row) {
        return res
          .status(StatusCodes.NOT_FOUND)
          .json({ message: "Food item not found" });
      }
      return res.status(StatusCodes.OK).json(row);
    });
  } catch (err) {
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "Error fetchin food item" });
  }
});

// Add to foodItems db
foodRoutes.post("/", async (req, res) => {
  const { spoonacular_id, name, calories, protein, carbs, fats, sugars } =
    req.body;
  if (
    checkInvalidVariable(spoonacular_id) ||
    checkInvalidVariable(name) ||
    checkInvalidVariable(calories) ||
    checkInvalidVariable(protein) ||
    checkInvalidVariable(carbs) ||
    checkInvalidVariable(fats) ||
    checkInvalidVariable(sugars)
  ) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ error: "Missing required fields" });
  }
  try {
    // Check if food item is already in db
    db.get(
      "SELECT name FROM food_items WHERE LOWER(name) = LOWER(?)",
      [name],
      (err, row) => {
        if (err) {
          return res
            .status(StatusCodes.INTERNAL_SERVER_ERROR)
            .json({ error: "Error adding food item" });
        }
        if (row) {
          return res
            .status(StatusCodes.CONFLICT)
            .json({ error: "Food item already logged", existingItem: row });
        }
      }
    );
    db.run(
      `INSERT INTO food_items (spoonacular_id, name, calories, protein, carbs, fats, sugars) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [spoonacular_id, name, calories, protein, carbs, fats, sugars],
      function (err) {
        if (err) {
          return res
            .status(StatusCodes.INTERNAL_SERVER_ERROR)
            .json({ error: err.message });
        }
        return res.status(StatusCodes.CREATED).json({
          id: this.lastID,
          spoonacular_id: spoonacular_id,
          name: name,
          calories: calories,
          protein: protein,
          carbs: carbs,
          fats: fats,
          sugars: sugars,
        });
      }
    );
  } catch (err) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: "An error occurred while adding a food item",
      error: err.message,
    });
  }
});

// Delete from foodItems db
foodRoutes.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    db.get("SELECT name FROM food_items WHERE id = ?", [id], (err, row) => {
      if (err) {
        return res
          .status(StatusCodes.INTERNAL_SERVER_ERROR)
          .json({ error: "Database error" });
      }

      if (!row) {
        return res
          .status(StatusCodes.NOT_FOUND)
          .json({ error: "Food item not found" });
      }
      db.run("DELETE FROM food_items WHERE id = ?", [id], function (err) {
        if (err) {
          return res
            .status(StatusCodes.INTERNAL_SERVER_ERROR)
            .json({ error: "Error deleeting food item" });
        }

        return res.status(StatusCodes.OK).json({
          message: "Food item deleted successfully",
          deletedItem: row,
        });
      });
    });
  } catch (err) {
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: "An error occurred while deleting a food item" });
  }
});

module.exports = foodRoutes;
