const sqlite3 = require("sqlite3");
const express = require("express");
const path = require("path");
const session = require("express-session");
const logRoutes = require("../routes/logRoutes");
const request = require("supertest");
const StatusCodes = require("http-status-codes").StatusCodes;

const router = express.Router();
const MAX_AGE = 1000 * 60 * 60;
let db;

const app = express();
app.use(router);
// Used to parse request bodies
app.use(express.json());
const agent = request.agent(app);

app.use(
  session({
    secret: "capstone-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: MAX_AGE },
  })
);
app.use("/log", logRoutes);

describe("Consumption log routes", () => {
  const testLog = {
    user_id: "2",
    item_id: "8",
    servings: "1",
  };

  beforeAll((done) => {
    const dbPath = path.resolve(__dirname, "../db/fridge.db");
    db = new sqlite3.Database(dbPath, done);
  });

  afterAll((done) => {
    db.run(
      "DELETE FROM consumption_logs WHERE user_id = ?",
      [testLog.user_id],
      function (err) {
        if (err) {
          return done(err);
        }
        db.close(done);
      }
    );
  });

  test("User logs item", async () => {
    const res = await request(app).post("/log").send(testLog);
    expect(res.statusCode).toBe(StatusCodes.CREATED);
    expect(res.body).toEqual({ message: "Created log", id: res.body.id });
  });

  test("User logs item, missing required fields", async () => {
    const incompleteLog = { user_id: "2", item_id: "8" };
    const res = await request(app).post("/log").send(incompleteLog);
    expect(res.statusCode).toBe(StatusCodes.BAD_REQUEST);
    expect(res.text).toBe(
      "Missing required fields: user_id, item_id, servings"
    );
  });

  test("User deletes log", async () => {
    const createRes = await request(app).post("/log").send(testLog);
    const createdLogId = createRes.body.id;
    const deleteRes = await request(app).delete(`/log/${createdLogId}`);
    expect(deleteRes.statusCode).toBe(StatusCodes.OK);
    expect(deleteRes.text).toBe("Deleted log");
  });

  test("User tries to delete a log that doesn't exist", async () => {
    const deleteRes = await request(app).delete(`/log/999`);
    expect(deleteRes.statusCode).toBe(StatusCodes.NOT_FOUND);
    expect(deleteRes.text).toBe("Log entry not found");
  });

  test("User gets specific log by ID", async () => {
    const createRes = await request(app).post("/log").send(testLog);
    const createdLogId = createRes.body.id;
    const getRes = await request(app).get(`/log/${createdLogId}`);
    expect(getRes.statusCode).toBe(StatusCodes.OK);
    expect(getRes.body).toEqual({
      id: createdLogId,
      user_id: parseInt(testLog.user_id),
      item_id: parseInt(testLog.item_id),
      servings: parseInt(testLog.servings),
      date_logged: new Date(Date.now()).toDateString(),
    });
  });

  test("User tries to get log that doesn't exist", async () => {
    const getRes = await request(app).get(`/log/999`);
    expect(getRes.statusCode).toBe(StatusCodes.NOT_FOUND);
    expect(getRes.text).toBe("Log entry not found");
  });

  test("User updates log", async () => {
    const createRes = await request(app).post("/log").send(testLog);
    const createdLogId = createRes.body.id;
    const updatedLog = {
      item_id: "10",
      servings: "2",
    };
    const updateRes = await request(app)
      .patch(`/log/${createdLogId}`)
      .send(updatedLog);
    expect(updateRes.statusCode).toBe(StatusCodes.OK);
    expect(updateRes.text).toBe("Updated log");

    const getRes = await request(app).get(`/log/${createdLogId}`);
    expect(getRes.statusCode).toBe(StatusCodes.OK);
    expect(getRes.body).toEqual({
      id: createdLogId,
      user_id: parseInt(testLog.user_id),
      item_id: parseInt(updatedLog.item_id),
      servings: parseInt(updatedLog.servings),
      date_logged: new Date(Date.now()).toDateString(),
    });
  });
});
