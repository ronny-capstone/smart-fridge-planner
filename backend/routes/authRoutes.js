const {
  SIGNUP_PATH,
  LOGIN_PATH,
  ME_PATH,
  LOGOUT_PATH,
} = require("../utils/backend_paths.jsx");
const sqlite3 = require("sqlite3");
const express = require("express");
const bcrypt = require("bcrypt");
const path = require("path");
const StatusCodes = require("http-status-codes").StatusCodes;

const authRoutes = express.Router();
const dbPath = path.resolve(__dirname, "../db/fridge.db");

const db = new sqlite3.Database(dbPath);

// Signup Route
authRoutes.post(SIGNUP_PATH, (req, res) => {
  // Case-insensitive username
  const username = req.body.username.toLowerCase();
  const password = req.body.password;
  try {
    if (!username || !password) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .send("Username and password are required.");
    }

    if (password.length < 8) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .send("Password must be at least 8 characters long.");
    }

    // Check if the username is already taken
    db.get(
      "SELECT username FROM users_auth WHERE LOWER(username) = ?",
      [username],
      async (err, row) => {
        if (err) {
          return res
            .status(StatusCodes.INTERNAL_SERVER_ERROR)
            .send("Database error");
        }
        if (row) {
          return res
            .status(StatusCodes.BAD_REQUEST)
            .send("Username already taken");
        }
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create a new user in the users table
        db.run(
          `INSERT INTO users_auth (username, password) VALUES (?, ?)`,
          [username, hashedPassword],
          function (err) {
            if (err) {
              return res
                .status(StatusCodes.INTERNAL_SERVER_ERROR)
                .send("Unable to sign up. Please try again");
            }
          }
        );
        return res.status(StatusCodes.CREATED).send("Signup successful!");
      }
    );
  } catch (error) {
    console.error(error);
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .send("Something went wrong during signup");
  }
});

// Login Route
authRoutes.post(LOGIN_PATH, async (req, res) => {
  const username = req.body.username.toLowerCase();
  const password = req.body.password;

  try {
    if (!username || !password) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .send("Username and password are required");
    }

    db.get(
      "SELECT * FROM users_auth WHERE LOWER(username) = ?",
      [username],
      async (err, row) => {
        if (err) {
          return res
            .status(StatusCodes.INTERNAL_SERVER_ERROR)
            .send("Database error");
        }
        if (!row) {
          return res
            .status(StatusCodes.UNAUTHORIZED)
            .json({ message: "Invalid username or password" });
        }

        const isValidPassword = await bcrypt.compare(password, row.password);
        if (!isValidPassword) {
          return res
            .status(StatusCodes.UNAUTHORIZED)
            .json({ message: "Invalid username or password" });
        }

        // Store user ID and username in a session
        db.get(
          "SELECT user_id FROM users_auth WHERE username = ?",
          [username],
          (err, row) => {
            if (err) {
              return res
                .status(StatusCodes.INTERNAL_SERVER_ERROR)
                .send("Error getting user id");
            }
            // Store user ID and username in the session
            req.session.userId = row.user_id;
            req.session.username = username;

            // res.json({ id: id, username: username });
            return res.status(StatusCodes.OK).send("Login successful!");
          }
        );
      }
    );
  } catch (error) {
    console.error(error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .send("Something went wrong during login");
  }
});

// Check if user is logged in
authRoutes.get(ME_PATH, async (req, res) => {
  if (!req.session.userId) {
    return res
      .status(StatusCodes.OK)
      .json({ authenticated: false, message: "Not logged in" });
  }

  try {
    db.get(
      "SELECT username FROM users_auth WHERE user_id = ?",
      [req.session.userId],
      (err, row) => {
        if (err) {
          return res
            .status(StatusCodes.INTERNAL_SERVER_ERROR)
            .json({ authenticated: false, message: "Error getting user data" });
        }
        if (row) {
          res.status(StatusCodes.OK).json({
            authenticated: true,
            user_id: req.session.userId,
            username: row.username,
          });
        } else {
          res
            .status(StatusCodes.OK)
            .json({ authenticated: false, message: "User not found" });
        }
      }
    );
  } catch (error) {
    console.error(error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      authenticated: false,
      message: "Error fetching user session data",
    });
  }
});

// Logout Route
authRoutes.post(LOGOUT_PATH, (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .send("Failed to log out");
    }
    res.clearCookie("connect.sid"); // Clear the session cookie
    res.status(StatusCodes.OK).send("Logout successful!");
  });
});

module.exports = authRoutes;
