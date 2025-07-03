require("dotenv").config();
const db = require("./connect");
const express = require("express");
const session = require("express-session");
const authRoutes = require("./routes/authRoutes");
const logRoutes = require("./routes/logRoutes");
const cors = require("cors");
const foodRoutes = require("./routes/foodItemRoutes");

const app = express();
const PORT = 3000;
const MAX_AGE = 1000 * 60 * 60;

db.run("PRAGMA foreign_keys = ON");
app.use(cors());
app.use(express.json());
app.use(
  session({
    secret: "capstone-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: MAX_AGE },
  })
);
app.use("/auth", authRoutes);
app.use("/log", logRoutes);
app.use("/food", foodRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
