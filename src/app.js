const express = require("express");
require("./db/mongoose");
const UserRouter = require("./routers/users");
const TaskRouter = require("./routers/tasks");

const app = express();

app.use(express.json());
app.use(UserRouter);
app.use(TaskRouter);

module.exports = app;
