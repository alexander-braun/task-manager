const request = require("supertest");
const app = require("../src/app");
const Task = require("../src/models/task");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const {
  user1ID,
  user1,
  setupDatabase,
  task1,
  user2,
} = require("./fixtures/db");

beforeEach(setupDatabase);

test("Should create task for user", async () => {
  const response = await request(app)
    .post("/tasks")
    .set("Authorization", `Bearer ${user1.tokens[0].token}`)
    .send({ description: "From my test" })
    .expect(201);

  const task = await Task.findById(response.body._id);
  expect(task).not.toBeNull();
  expect(task.completed).toEqual(false);
});

test("Should fetch user tasks", async () => {
  const response = await request(app)
    .get("/tasks")
    .set("Authorization", `Bearer ${user1.tokens[0].token}`)
    .send()
    .expect(200);

  expect(response.body.length).toEqual(2);
});

test("Should not delete task that doesn't belong to user", async () => {
  const response = await request(app)
    .delete("/tasks/" + task1._id)
    .set("Authorization", `Bearer ${user2.tokens[0].token}`)
    .send()
    .expect(404);

  const task = await request(app)
    .get("/tasks/" + task1._id)
    .set("Authorization", `Bearer ${user1.tokens[0].token}`)
    .send()
    .expect(200);
  expect(task).not.toBeNull();
});
