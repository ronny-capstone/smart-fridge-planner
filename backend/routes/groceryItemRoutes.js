require("dotenv").config({ path: "./.env" });
const sqlite3 = require("sqlite3");
const path = require("path");
const express = require("express");
const groceryRoutes = express.Router();
const StatusCodes = require("http-status-codes").StatusCodes;
const checkInvalidVariable = require("../utils/invalidVars.jsx");
const dbPath = path.resolve(__dirname, "../db/fridge.db");
const db = new sqlite3.Database(dbPath);

// Get all grocery items for a user
groceryRoutes.get("/", async (req, res) => {
  const userId = req.query.user_id;
  db.all(
    `SELECT * FROM grocery_items WHERE user_id = ?`,
    [userId],
    (err, rows) => {
      if (err) {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
          error: "Error fetching grocery items",
          details: err.message,
        });
      }
      return res.status(StatusCodes.OK).json(rows);
    }
  );
});

// Add grocery item
groceryRoutes.post("/", async (req, res) => {
  const { user_id, item_id, name, quantity } = req.body;
  const added_date = new Date().toISOString().split("T")[0];

  if (
    checkInvalidVariable(user_id) ||
    checkInvalidVariable(item_id) ||
    checkInvalidVariable(name) ||
    checkInvalidVariable(quantity)
  ) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ error: "Missing required fields" });
  }
  try {
    db.run(
      `INSERT INTO grocery_items (user_id, item_id, name, quantity, added_date) VALUES (?, ?, ?, ?, ?)`,
      [user_id, item_id, name, quantity, added_date],
      function (err) {
        if (err) {
          return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            error: "Error inserting grocery item",
            error: err.message,
          });
        }
        const insertedItem = {
          id: this.lastID,
          user_id: user_id,
          item_id: item_id,
          name: name,
          quantity: quantity,
          added_date: added_date,
        };
        return res
          .status(StatusCodes.CREATED)
          .json({ message: "Created grocery item", item: insertedItem });
      }
    );
  } catch (err) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: "An error occurred while creating a grocery item",
      error: err.message,
    });
  }
});

// Update grocery items
groceryRoutes.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, item_id, name } = req.body;
    const updates = [];
    const values = [];

    if (quantity !== undefined) {
      updates.push("quantity = ?");
      values.push(quantity);
    }

    if (item_id !== undefined) {
      updates.push("item_id = ?");
      values.push(item_id);
    }

    if (name !== undefined) {
      updates.push("name = ?");
      values.push(name);
    }

    if (updates.length === 0) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ error: "No valid fields sent to update" });
    }
    values.push(id);
    db.run(
      `UPDATE grocery_items SET ${updates.join(", ")} WHERE id = ?`,
      values,
      function (err) {
        if (err) {
          return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: "Error updating grocery item",
            error: err.message,
          });
        }
        // Get updated grocery item
        db.get(`SELECT * FROM grocery_items WHERE id = ?`, [id], (err, row) => {
          if (err) {
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
              message: "Error fetching updated record",
              error: err.message,
            });
          }
          return res
            .status(StatusCodes.OK)
            .json({ message: "Updated grocery item", item: row });
        });
      }
    );
  } catch (err) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: "An error occurred while updating grocery item",
      error: err.message,
    });
  }
});

// Delete grocery item
groceryRoutes.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    db.get("SELECT id FROM grocery_items WHERE id = ?", [id], (err, row) => {
      if (err) {
        return res
          .status(StatusCodes.INTERNAL_SERVER_ERROR)
          .json({ message: "Database error", error: err.message });
      }

      if (!row) {
        return res
          .status(StatusCodes.NOT_FOUND)
          .json({ error: "Grocery item not found" });
      }

      db.run("DELETE FROM grocery_items WHERE id = ?", [id], function (err) {
        if (err) {
          return res
            .status(StatusCodes.INTERNAL_SERVER_ERROR)
            .json({ error: "Error deleting grocery item" });
        }

        return res.status(StatusCodes.OK).json({
          message: "Grocery item deleted successfully",
          deletedItem: row,
        });
      });
    });
  } catch (err) {
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: "An error occurred while deleting a grocery item" });
  }
});

module.exports = groceryRoutes;
