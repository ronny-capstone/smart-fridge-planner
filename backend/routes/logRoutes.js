const sqlite3 = require("sqlite3");
const express = require("express");
const path = require("path");
const { STATUS_CODES } = require("http");
const logRoutes = express.Router();
const StatusCodes = require("http-status-codes").StatusCodes;

const dbPath = path.resolve(__dirname, "../db/fridge.db");

const db = new sqlite3.Database(dbPath);

// Add log entry
logRoutes.post("/", (req, res) => {
  try {
    const { user_id, item_id, servings } = req.body;
    if (!user_id || !item_id || servings === undefined) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .send("Missing required fields: user_id, item_id, servings");
    }
    db.run(
      `INSERT INTO consumption_logs (user_id, item_id, servings, date_logged) VALUES (?, ?, ?, ?)`,
      [user_id, item_id, servings, new Date(Date.now()).toDateString()],
      function (err) {
        if (err) {
          return res
            .status(StatusCodes.INTERNAL_SERVER_ERROR)
            .send("Error inserting into table");
        }
        return res
          .status(StatusCodes.CREATED)
          .json({ message: "Created log", id: this.lastID });
      }
    );
  } catch (err) {
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .send("An error occurred while creating a log");
  }
});

// Get all log entries
logRoutes.get("/", async (req, res) => {
  db.all("SELECT log_id FROM consumption_logs", async (err, rows) => {
    if (err) {
      return res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .send("Database error");
    }
    return res.status(StatusCodes.OK).json(rows);
  });
});

// Get specific log entry by id
logRoutes.get("/:id", async (req, res) => {
  const { id } = req.params;
  db.get(
    "SELECT * FROM consumption_logs WHERE id = ?",
    [id],
    async (err, row) => {
      if (err) {
        return res
          .status(StatusCodes.INTERNAL_SERVER_ERROR)
          .send("Database error");
      }
      if (!row) {
        return res.status(StatusCodes.NOT_FOUND).send("Log entry not found");
      }
      return res.status(StatusCodes.OK).json(row);
    }
  );
});

// Update log by id
logRoutes.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { servings, item_id, date_logged } = req.body;

    const updates = [];
    const values = [];

    if (servings !== undefined) {
      updates.push("servings = ?");
      values.push(servings);
    }

    if (item_id !== undefined) {
      updates.push("item_id = ?");
      values.push(item_id);
    }

    if (date_logged !== undefined) {
      updates.push("date_logged = ?");
      values.push(date_logged);
    }

    if (updates.length === 0) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .send("No valid fields sent to update");
    }

    values.push(id);
    const sql = `UPDATE consumption_logs SET ${updates.join(
      ", "
    )} WHERE id = ?`;

    db.run(sql, values, function (err) {
      if (err) {
        return res
          .status(StatusCodes.INTERNAL_SERVER_ERROR)
          .send("Error updating table");
      }
      return res.status(StatusCodes.OK).send("Updated log");
    });
  } catch (err) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .send("An error occurred while updating a log");
  }
});

// Delete log
logRoutes.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    db.get("SELECT * FROM consumption_logs WHERE id = ?", [id], (err, row) => {
      if (err) {
        return res
          .status(StatusCodes.INTERNAL_SERVER_ERROR)
          .send("Database error");
      }
      if (!row) {
        return res.status(StatusCodes.NOT_FOUND).send("Log entry not found");
      }
      db.run(`DELETE FROM consumption_logs WHERE id = ?`, [id], function (err) {
        if (err) {
          return res
            .status(StatusCodes.INTERNAL_SERVER_ERROR)
            .send("Error deleting from table");
        }
        return res.status(StatusCodes.OK).send("Deleted log");
      });
    });
  } catch (err) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .send("An error occurred while deleting a log");
  }
});

module.exports = logRoutes;
