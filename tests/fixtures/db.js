const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const User = require("../../src/models/user");
const Task = require("../../src/models/task");

// Sample User setup
const user1ID = new mongoose.Types.ObjectId();
const user1 = {
  _id: user1ID,
  name: "Alex",
  email: "alexanderbraun@freenet.com",
  password: "MyTestPassword!",
  tokens: [
    {
      token: jwt.sign({ _id: user1ID }, process.env.JWT_SECRET),
    },
  ],
};

// Sample User 2 setup
const user2ID = new mongoose.Types.ObjectId();
const user2 = {
  _id: user2ID,
  name: "Andreq",
  email: "andrew@freenet.com",
  password: "MyTestPassword123!",
  tokens: [
    {
      token: jwt.sign({ _id: user2ID }, process.env.JWT_SECRET),
    },
  ],
};

// Create task
const task1 = {
  _id: new mongoose.Types.ObjectId(),
  description: "First Task",
  completed: false,
  owner: user1ID._id,
};

const task2 = {
  _id: new mongoose.Types.ObjectId(),
  description: "Second Task",
  completed: false,
  owner: user1ID._id,
};

const task3 = {
  _id: new mongoose.Types.ObjectId(),
  description: "Third Task",
  completed: false,
  owner: user2ID._id,
};

const setupDatabase = async () => {
  if (process.env.DATABASE_NAME !== "task-manager-test") {
    throw new Error();
  }
  await Task.deleteMany();
  await User.deleteMany();
  await new User(user1).save();
  await new User(user2).save();
  await new Task(task1).save();
  await new Task(task2).save();
  await new Task(task3).save();
};

module.exports = {
  setupDatabase,
  user1,
  user1ID,
  user2,
  user2ID,
  task1,
  task2,
  task3,
};
