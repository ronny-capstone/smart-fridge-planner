const sqlite3 = require("sqlite3");
const express = require("express");
const path = require("path");
const remindersRoutes = express.Router();
const StatusCodes = require("http-status-codes").StatusCodes;
const dbPath = path.resolve(__dirname, "../db/fridge.db");
const db = new sqlite3.Database(dbPath);

// Get dismissed reminders for user
remindersRoutes.get("/", async (req, res) => {
  const { user_id, notified, reminder_type } = req.query;
  let query = `SELECT * FROM reminders WHERE user_id = ?`;
  let params = [user_id];
  if (notified) {
    query += " AND notified = ?";
    params.push(notified);
  }
  if (reminder_type) {
    query += " AND reminder_type = ?";
    params.push(reminder_type);
  }
  db.all(query, params, (err, rows) => {
    if (err) {
      return res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: "Error fetching reminders" });
    }
    res.json(rows);
  });
});

// Create/save dismissed reminder
remindersRoutes.post("/", (req, res) => {
  try {
    const { user_id, item_id, reminder_type, reminder_date, notified } =
      req.body;

    db.get(
      `SELECT id FROM reminders WHERE user_id = ? AND item_id = ? AND reminder_type = ?`,
      [user_id, item_id, reminder_type],
      (err, reminder) => {
        if (err) {
          return res
            .status(StatusCodes.INTERNAL_SERVER_ERROR)
            .json({ message: "Error fetching reminders" });
        }

        if (reminder) {
          // Update existing reminder
          db.run(
            `UPDATE reminders SET reminder_date = ?, notified = ? WHERE id = ?`,
            [reminder_date, notified, reminder.id],
            function (err) {
              if (err) {
                return res
                  .status(StatusCodes.INTERNAL_SERVER_ERROR)
                  .json({ message: "Error updating reminder" });
              }
              res.json({ id: reminder.id, message: "Reminder updated" });
            }
          );
        } else {
          // Create new reminder
          db.run(
            `INSERT INTO reminders (user_id, item_id, reminder_type, reminder_date, notified) VALUES (?, ?, ?, ?, ?)`,
            [user_id, item_id, reminder_type, reminder_date, notified],
            function (err) {
              if (err) {
                return res
                  .status(StatusCodes.INTERNAL_SERVER_ERROR)
                  .json({ message: "Error creating reminder" });
              }
              res.json({ id: this.lastID, message: "Reminder created" });
            }
          );
        }
      }
    );
  } catch (err) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "Unexpected error" });
  }
});

// Delete all user's dismissed reminders
remindersRoutes.delete("/", async (req, res) => {
  try {
    const { user_id } = req.query;
    if (!user_id) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "User ID is required" });
    }
    db.run(
      `DELETE FROM reminders WHERE user_id = ?`,
      [user_id],
      function (err) {
        if (err) {
          return res
            .status(StatusCodes.INTERNAL_SERVER_ERROR)
            .json({ message: "Error deleting reminders" });
        }
        return res
          .status(StatusCodes.OK)
          .json({ message: "All reminders deleted" });
      }
    );
  } catch (err) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "An error occurred while deleting a reminder" });
  }
});

module.exports = remindersRoutes;
