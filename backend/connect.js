const sqlite3 = require("sqlite3");
const path = require("path");
const dbPath = path.resolve(__dirname, "db", "fridge.db");

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    return console.error("Can't open database, ", err.message);
  }
  console.log("Connected to the fridge.db database");
});

db.serialize(() => {
  db.run(
    `CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY,
          health_goal TEXT NOT NULL,
          dietary_preferences TEXT NOT NULL,
          age INTEGER NOT NULL,
          weight_kg REAL NOT NULL,
          height_feet INTEGER NOT NULL,
          height_inches INTEGER NOT NULL,
          gender TEXT NOT NULL,
          activity TEXT NOT NULL,
          calorie_goal INTEGER NOT NULL,
          protein_goal INTEGER NOT NULL,
          carb_goal INTEGER NOT NULL,
          fat_goal INTEGER NOT NULL,
          bmr INTEGER,
          tdee INTEGER,
          profile_completed BOOLEAN DEFAULT FALSE
          )`
  );

  db.run(
    `CREATE TABLE IF NOT EXISTS users_auth (
          user_id INTEGER PRIMARY KEY,
          username TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          FOREIGN KEY (user_id) REFERENCES users(id)
          )`
  );

  db.run(`CREATE TABLE IF NOT EXISTS food_items (
          id INTEGER PRIMARY KEY,
          name TEXT NOT NULL,
          calories INTEGER NOT NULL,
          protein REAL NOT NULL,
          carbs REAL NOT NULL,
          fats REAL NOT NULL,
          sugars REAL NOT NULL
          )`);

  db.run(`CREATE TABLE IF NOT EXISTS consumption_logs (
          id INTEGER PRIMARY KEY,
          user_id INTEGER NOT NULL,
          item_id INTEGER NOT NULL,
          servings REAL NOT NULL,
          date_logged TEXT NOT NULL,
          FOREIGN KEY (user_id) REFERENCES users (id),
          FOREIGN KEY (item_id) REFERENCES food_items (id)
      )`);

  db.run(`CREATE TABLE IF NOT EXISTS grocery_items (
          id INTEGER PRIMARY KEY,
          item_id INTEGER NOT NULL,
          user_id INTEGER NOT NULL,
          name TEXT NOT NULL,
          quantity INTEGER NOT NULL,
          added_date TEXT NOT NULL,
          FOREIGN KEY (user_id) REFERENCES users (id),
          FOREIGN KEY (item_id) REFERENCES food_items (id)

      )`);

  db.run(`CREATE TABLE IF NOT EXISTS reminders (
        id INTEGER PRIMARY KEY,
        user_id INTEGER NOT NULL,
        item_id INTEGER NOT NULL,
        reminder_date TEXT NOT NULL,
        reminder_type TEXT NOT NULL,
        notified TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (item_id) REFERENCES food_items(id)
    )`);

  db.run(`CREATE TABLE IF NOT EXISTS inventory (
          id INTEGER PRIMARY KEY,
          item_id INTEGER NOT NULL,
          user_id INTEGER NOT NULL,
          name TEXT NOT NULL,
          quantity INTEGER NOT NULL,
          expiration_date TEXT NOT NULL,
          FOREIGN KEY (user_id) REFERENCES users (id),
          FOREIGN KEY (item_id) REFERENCES food_items (id)

      )`);
});

module.exports = db;
