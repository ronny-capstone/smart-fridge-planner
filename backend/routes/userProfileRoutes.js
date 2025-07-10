const sqlite3 = require("sqlite3");
const express = require("express");
const path = require("path");
const { STATUS_CODES } = require("http");
const checkInvalidVariable = require("../utils/invalidVars.jsx");
const {
  calculateBMR,
  calculateTDEE,
  calculateMacroTargets,
} = require("../utils/healthCalc.jsx");
const StatusCodes = require("http-status-codes").StatusCodes;

const profileRoutes = express.Router();
const dbPath = path.resolve(__dirname, "../db/fridge.db");

const db = new sqlite3.Database(dbPath);

const updateProfile = (id, profileInfo, res) => {
  const {
    health_goal,
    dietary_preferences,
    age,
    weight_kg,
    height_feet,
    height_inches,
    gender,
    activity,
  } = profileInfo;

  try {
    // Update BMR, TDEE, and macro targets with new information
    const updatedBmr = calculateBMR(
      gender,
      age,
      weight_kg,
      height_feet,
      height_inches
    );
    const updatedTdee = calculateTDEE(
      gender,
      age,
      activity,
      weight_kg,
      height_feet,
      height_inches
    );
    const macroTargets = calculateMacroTargets(updatedTdee, health_goal);
    db.run(
      `UPDATE users SET health_goal = ?, dietary_preferences = ?, age = ?, weight_kg = ?, height_feet = ?, height_inches = ?, gender = ?, activity = ?, calorie_goal = ?, protein_goal = ?, carb_goal = ?, fat_goal = ?, bmr = ?, tdee = ?, profile_completed = ? WHERE id = ?`,
      [
        health_goal,
        dietary_preferences,
        age,
        weight_kg,
        height_feet,
        height_inches,
        gender,
        activity,
        macroTargets.calorie_goal,
        macroTargets.protein_goal,
        macroTargets.carb_goal,
        macroTargets.fat_goal,
        updatedBmr,
        updatedTdee,
        true,
        id,
      ],
      function (err) {
        if (err) {
          return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: "An error occurred while updating the user profile",
          });
        }
        return res.status(StatusCodes.OK).json({
          message: "Profile updated successfully",
          profile: {
            id,
            health_goal,
            dietary_preferences,
            age,
            weight_kg,
            height_feet,
            height_inches,
            gender,
            activity,
            calorie_goal: macroTargets.calorie_goal,
            protein_goal: macroTargets.protein_goal,
            carb_goal: macroTargets.carb_goal,
            fat_goal: macroTargets.fat_goal,
            bmr: updatedBmr,
            tdee: updatedTdee,
            profile_completed: true,
          },
        });
      }
    );
  } catch (err) {
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "Error updating user profile" });
  }
};

// Create/update user profile
profileRoutes.post("/", (req, res) => {
  const {
    id,
    health_goal,
    dietary_preferences,
    age,
    weight_kg,
    height_feet,
    height_inches,
    gender,
    activity,
  } = req.body;

  if (
    checkInvalidVariable(id) ||
    checkInvalidVariable(health_goal) ||
    checkInvalidVariable(dietary_preferences) ||
    checkInvalidVariable(age) ||
    checkInvalidVariable(weight_kg) ||
    checkInvalidVariable(height_feet) ||
    checkInvalidVariable(height_inches) ||
    checkInvalidVariable(gender) ||
    checkInvalidVariable(activity)
  ) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: "Missing required fields" });
  }

  const bmr = calculateBMR(gender, age, weight_kg, height_feet, height_inches);
  const tdee = calculateTDEE(
    gender,
    age,
    activity,
    weight_kg,
    height_feet,
    height_inches
  );
  const macroTargets = calculateMacroTargets(tdee, health_goal);

  // Check if user's profile already exists
  try {
    db.get(
      "SELECT profile_completed FROM users WHERE id = ?",
      [id],
      (err, row) => {
        if (err) {
          return res
            .status(StatusCodes.INTERNAL_SERVER_ERROR)
            .json({ message: "Error fetching user profile" });
        }
        // If user's profile exists, update the profile
        if (row) {
          const profileInfo = {
            health_goal,
            dietary_preferences,
            age,
            weight_kg,
            height_feet,
            height_inches,
            gender,
            activity,
          };
          return updateProfile(id, profileInfo, res);
        } else {
          // Create a new user profile
          try {
            db.run(
              `INSERT INTO users (id, health_goal, dietary_preferences, age, weight_kg, height_feet, height_inches, gender, activity, calorie_goal, protein_goal, carb_goal, fat_goal, bmr, tdee, profile_completed) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                id,
                health_goal,
                dietary_preferences,
                age,
                weight_kg,
                height_feet,
                height_inches,
                gender,
                activity,
                macroTargets.calorie_goal,
                macroTargets.protein_goal,
                macroTargets.carb_goal,
                macroTargets.fat_goal,
                bmr,
                tdee,
                true,
              ],
              function (err) {
                if (err) {
                  console.error("DB insert error:", err);
                  return res
                    .status(StatusCodes.INTERNAL_SERVER_ERROR)
                    .json({ message: "Unable to sign up. Please try again" });
                }
                return res
                  .status(StatusCodes.CREATED)
                  .json({ message: "Profile creation successful!" });
              }
            );
          } catch (err) {
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
              message: "An error occurred while creating a user profile",
              error: err.message,
            });
          }
        }
      }
    );
  } catch (err) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: "Something went wrong during profile creation",
    });
  }
});

// Update user's profile
profileRoutes.patch("/:id", (req, res) => {
  try {
    const { id } = req.params;
    const {
      health_goal,
      dietary_preferences,
      age,
      weight_kg,
      height_feet,
      height_inches,
      gender,
      activity,
    } = req.body;

    if (
      checkInvalidVariable(id) ||
      checkInvalidVariable(health_goal) ||
      checkInvalidVariable(dietary_preferences) ||
      checkInvalidVariable(age) ||
      checkInvalidVariable(weight_kg) ||
      checkInvalidVariable(height_feet) ||
      checkInvalidVariable(height_inches) ||
      checkInvalidVariable(gender) ||
      checkInvalidVariable(activity)
    ) {
      return res
        .status(STATUS_CODES.BAD_REQUEST)
        .json({ message: "Missing required fields" });
    }

    db.get(
      "SELECT profile_completed FROM users WHERE id = ?",
      [id],
      async (err, row) => {
        if (err) {
          return res
            .status(StatusCodes.INTERNAL_SERVER_ERROR)
            .json({ message: "Error fetching user profile" });
        }
        if (!row) {
          return res
            .status(StatusCodes.NOT_FOUND)
            .json({ message: "User not found" });
        }

        const profileInfo = {
          health_goal,
          dietary_preferences,
          age,
          weight_kg,
          height_feet,
          height_inches,
          gender,
          activity,
        };
        updateProfile(id, profileInfo, res);
      }
    );
  } catch (err) {
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "Error updating user profile" });
  }
});

// Get specific user's profile
profileRoutes.get("/:id", (req, res) => {
  const { id } = req.params;

  try {
    db.get("SELECT * FROM users WHERE id = ?", [id], (err, row) => {
      if (err) {
        return res
          .status(StatusCodes.INTERNAL_SERVER_ERROR)
          .json({ message: "Error getting user's profile" });
      }
      if (!row) {
        return res
          .status(StatusCodes.NOT_FOUND)
          .json({ message: "User profile not found" });
      }

      return res.status(StatusCodes.OK).json({ profile: row });
    });
  } catch (error) {
    console.error(error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: "Error fetching user profile",
    });
  }
});

module.exports = profileRoutes;
