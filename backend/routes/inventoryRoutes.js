require("dotenv").config({ path: "./.env" });
const sqlite3 = require("sqlite3");
const path = require("path");
const express = require("express");
const inventoryRoutes = express.Router();
const StatusCodes = require("http-status-codes").StatusCodes;
const dbPath = path.resolve(__dirname, "../db/fridge.db");
const db = new sqlite3.Database(dbPath);

const checkInvalidVariable = (variable) => {
  return variable === undefined || variable === null || variable === "";
};

// Get all inventory items for a user
inventoryRoutes.get("/", async (req, res) => {
  const userId = req.query.user_id;
  db.all(`SELECT * FROM inventory WHERE user_id = ?`, [userId], (err, rows) => {
    if (err) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        error: "Error fetching inventory items",
        details: err.message,
      });
    }
    return res.status(StatusCodes.OK).json(rows);
  });
});

// Add food item to inventory
inventoryRoutes.post("/", async (req, res) => {
  const { user_id, item_id, name, quantity, expiration_date } = req.body;

  if (
    checkInvalidVariable(user_id) ||
    checkInvalidVariable(item_id) ||
    checkInvalidVariable(name) ||
    checkInvalidVariable(quantity) ||
    checkInvalidVariable(expiration_date)
  ) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ error: "Missing required fields" });
  }
  try {
    db.run(
      `INSERT INTO inventory (user_id, item_id, name, quantity, expiration_date) VALUES (?, ?, ?, ?, ?)`,
      [user_id, item_id, name, quantity, expiration_date],
      function (err) {
        if (err) {
          return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            error: "Error inserting food item",
            error: err.message,
          });
        }
        const insertedItem = {
          id: this.lastID,
          user_id: user_id,
          item_id: item_id,
          name: name,
          quantity: quantity,
          expiration_date: expiration_date,
        };
        return res.status(StatusCodes.CREATED).json({
          message: "Created food item for inventory",
          item: insertedItem,
        });
      }
    );
  } catch (err) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: "An error occurred while creating a food item",
      error: err.message,
    });
  }
});

// Update inventory items
inventoryRoutes.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, expiration_date, item_id, name } = req.body;
    const updates = [];
    const values = [];

    if (quantity !== undefined) {
      updates.push("quantity = ?");
      values.push(quantity);
    }

    if (expiration_date !== undefined) {
      updates.push("expiration_date = ?");
      values.push(expiration_date);
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
      `UPDATE inventory SET ${updates.join(", ")} WHERE id = ?`,
      values,
      function (err) {
        if (err) {
          return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: "Error updating food item",
            error: err.message,
          });
        }
        // Get updated grocery item
        db.get(`SELECT * FROM inventory WHERE id = ?`, [id], (err, row) => {
          if (err) {
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
              message: "Error fetching updated record",
              error: err.message,
            });
          }
          return res
            .status(StatusCodes.OK)
            .json({ message: "Updated food item", item: row });
        });
      }
    );
  } catch (err) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: "An error occurred while updating food item",
      error: err.message,
    });
  }
});

// Delete food item from inventory
inventoryRoutes.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    db.get("SELECT id FROM inventory WHERE id = ?", [id], (err, row) => {
      if (err) {
        return res
          .status(StatusCodes.INTERNAL_SERVER_ERROR)
          .json({ message: "Database error", error: err.message });
      }

      if (!row) {
        return res
          .status(StatusCodes.NOT_FOUND)
          .json({ error: "Food item not found in inventory" });
      }

      db.run("DELETE FROM inventory WHERE id = ?", [id], function (err) {
        if (err) {
          return res
            .status(StatusCodes.INTERNAL_SERVER_ERROR)
            .json({ error: "Error deleting food item" });
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


module.exports = inventoryRoutes;
