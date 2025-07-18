require("dotenv").config();
const db = require("./connect");
const express = require("express");
const session = require("express-session");
const authRoutes = require("./routes/authRoutes");
const logRoutes = require("./routes/logRoutes");
const cors = require("cors");
const foodRoutes = require("./routes/foodItemRoutes");
const groceryRoutes = require("./routes/groceryItemRoutes");
const inventoryRoutes = require("./routes/inventoryRoutes");
const profileRoutes = require("./routes/userProfileRoutes");
const recipeRoutes = require("./routes/recipeRoutes");
const groceryListRoutes = require("./routes/groceryListRoutes");

const app = express();
const PORT = 3000;
const MAX_AGE = 1000 * 60 * 60;

db.run("PRAGMA foreign_keys = ON");
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:3000"],
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(
  session({
    secret: "capstone-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: MAX_AGE, sameSite: "lax" },
  })
);
app.use(express.json());
app.use("/auth", authRoutes);
app.use("/log", logRoutes);
app.use("/food", foodRoutes);
app.use("/grocery", groceryRoutes);
app.use("/inventory", inventoryRoutes);
app.use("/profile", profileRoutes);
app.use("/recipes", recipeRoutes);
app.use("/groceryList", groceryListRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
