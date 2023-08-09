const express = require("express");
require("../db/mongoose");
const Task = require("../models/task");
const { catchError, EMPTY, tap, from, switchMap, throwError } = require("rxjs");
const auth = require("../middleware/auth");

const router = express.Router();

router.post("/tasks", auth, (req, res) => {
  const task = new Task({
    ...req.body,
    owner: req.user._id,
  });

  from(task.save())
    .pipe(
      catchError((e) => {
        res.status(400).send(e.message);
        return EMPTY;
      }),
      tap((task) => {
        res.status(201).send(task);
      })
    )
    .subscribe();
});

// GET /tasks?completed=true
// GET /tasks?limit=10 (amount of results to get)
// GET /tasks?skip=200 (amount of results to skip over)
// GET /tasks?sortBy=createdAt:asc
router.get("/tasks", auth, (req, res) => {
  const completed =
    req.query.completed === "true"
      ? true
      : req.query.completed === "false"
      ? false
      : undefined;

  const sortParts = req.query.sortBy?.split(":");
  const sort = {};
  if (sortParts?.length) {
    sort[sortParts[0]] = sortParts[1] === "asc" ? 1 : -1;
  }

  // Task.find({ owner: req.user._id }) would also work
  from(
    req.user.populate({
      path: "tasks",
      match: {
        ...(completed !== undefined && { completed }),
      },
      options: {
        limit: parseInt(req.query.limit),
        skip: parseInt(req.query.skip),
        sort,
      },
    })
  )
    .pipe(
      catchError((e) => {
        res.status(500).send(e.message);
        return EMPTY;
      }),
      tap((user) => {
        if (!user?.tasks) {
          res.status(400).send();
        }
        res.status(200).send(user.tasks);
      })
    )
    .subscribe();
});

router.get("/tasks/:id", auth, (req, res) => {
  from(Task.findOne({ _id: req.params.id, owner: req.user._id }))
    .pipe(
      catchError((e) => {
        res.status(500).send(e.message);
        return EMPTY;
      }),
      tap((task) => {
        if (!task) {
          res.status(404).send();
        } else {
          res.status(200).send(task);
        }
      })
    )
    .subscribe();
});

router.patch("/tasks/:id", auth, (req, res) => {
  from(Task.findOne({ _id: req.params.id, owner: req.user._id }))
    .pipe(
      switchMap((task) => {
        if (task) {
          Object.keys(req.body).forEach((key) => (task[key] = req.body[key]));
          return from(task.save());
        } else {
          return throwError(() => new Error("Task not found"));
        }
      }),
      catchError((e) => {
        res.status(404).send(e.message);
        return EMPTY;
      }),
      tap((task) => {
        if (!task) {
          res.status(404).send();
        } else {
          res.status(200).send(task);
        }
      })
    )
    .subscribe();
});

router.delete("/tasks/:id", auth, (req, res) => {
  from(Task.findOneAndDelete({ _id: req.params.id, owner: req.user._id }))
    .pipe(
      catchError((e) => {
        res.status(500).send(e.message);
        return EMPTY;
      }),
      tap((task) => {
        if (!task) {
          res.status(404).send();
        } else {
          res.status(200).send(task);
        }
      })
    )
    .subscribe();
});

module.exports = router;
