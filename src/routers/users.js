const express = require("express");
require("../db/mongoose");
const User = require("../models/user");
const { catchError, EMPTY, tap, from, switchMap, of } = require("rxjs");
const auth = require("../middleware/auth");
const multer = require("multer");
const sharp = require("sharp");
const sendMail = require("../emails/account");

const router = express.Router();

router.post("/users", (req, res) => {
  console.log("USERS");
  const user = new User(req.body);
  from(user.save())
    .pipe(
      switchMap((user) =>
        user.generateAuthToken().pipe(switchMap((token) => of([user, token])))
      ),
      catchError((e) => {
        res.status(400).send(e.message);
        return EMPTY;
      }),
      tap(([user, token]) => {
        res.status(201).send({ user, token });
        sendMail(
          user.email,
          "Thanks for signing up!",
          `Welcome to roadmap ${user.name}. I hope you enjoy!`
        );
      })
    )
    .subscribe();
});

router.post("/users/login", (req, res) => {
  User.findByCredentials(req.body.email, req.body.password)
    .pipe(
      switchMap((user) =>
        user.generateAuthToken().pipe(switchMap((token) => of([user, token])))
      ),
      catchError((e) => {
        res.status(400).send(e.message);

        return EMPTY;
      }),
      tap(([user, token]) => {
        res.status(200).send({ user, token });
      })
    )
    .subscribe();
});

router.post("/users/logout", auth, (req, res) => {
  req.user.tokens = req.user.tokens.filter(
    (tokenObj) => tokenObj.token !== req.token
  );
  from(req.user.save())
    .pipe(
      catchError((e) => res.status(500).send(e.message)),
      tap((user) => {
        if (!user) {
          res.status(400).send();
        }
        res.status(200).send(user);
      })
    )
    .subscribe();
});

router.post("/users/logoutAll", auth, (req, res) => {
  req.user.tokens = [];
  from(req.user.save())
    .pipe(
      catchError((e) => res.status(500).send(e.message)),
      tap((user) => {
        if (!user) {
          res.status(500).send();
        }
        res.status(200).send(user);
      })
    )
    .subscribe();
});

router.get("/users/me", auth, (req, res) => {
  // user is added to request in auth middleware
  res.send(req.user);
});

router.patch("/users/me", auth, (req, res) => {
  const changedFields = Object.keys(req.body);
  const allowedOperations = ["name", "email", "password", "age"];
  const isValidOperation = changedFields.every((field) =>
    allowedOperations.includes(field)
  );

  if (!isValidOperation) {
    res.status(400).send({ message: "Invalid updates!" });
    return;
  }

  changedFields.forEach((field) => {
    req.user[field] = req.body[field];
  });

  from(req.user.save())
    .pipe(
      catchError((e) => {
        res.status(500).send(e.message);
        return EMPTY;
      }),
      tap((user) => {
        if (!user) {
          res.status(404).send();
        } else {
          res.status(200).send(user);
        }
      })
    )
    .subscribe();
});

router.delete("/users/me", auth, (req, res) => {
  from(req.user.deleteOne())
    .pipe(
      catchError((e) => {
        res.status(500).send(e.message);
        return EMPTY;
      }),
      tap((user) => {
        if (!user) {
          res.status(500).send();
        } else {
          res.status(200).send(user);
          sendMail(
            user.email,
            "Your account has been removed.",
            `Good Bye ${user.name} and thank you for using roadmap!`
          );
        }
      })
    )
    .subscribe();
});

const upload = multer({
  limits: {
    fileSize: 1000000,
  },
  fileFilter(req, file, callback) {
    if (file.originalname.match(/\.(jpg|png|jpeg)$/)) {
      callback(undefined, true);
    } else {
      callback(new Error("Filetype not jpg."));
    }
  },
});

router.post(
  "/users/me/avatar",
  auth,
  upload.single("avatar"),
  (req, res) => {
    from(sharp(req.file.buffer).png().resize({ width: 250 }).toBuffer())
      .pipe(
        switchMap((buffer) => {
          req.user.avatar = buffer;
          return of(req.user.save());
        }),
        tap(() => {
          res.status(200).send({ file: req.file.originalname });
        }),
        catchError((e) => {
          res.status(500).send(e.message);
        })
      )
      .subscribe();
  },
  (error, req, res, next) => {
    res.status(400).send({ error: error.message });
  }
);

router.delete("/users/me/avatar", auth, (req, res) => {
  req.user.avatar = undefined;
  from(req.user.save())
    .pipe(
      tap(() => {
        res.status(200).send();
      }),
      catchError((e) => {
        res.status(500).send({ error: e.message });
      })
    )
    .subscribe();
});

router.get("/users/:id/avatar", (req, res) => {
  from(User.findById(req.params.id))
    .pipe(
      tap((user) => {
        if (user?.avatar) {
          res.set("Content-Type", "image/png").status(200).send(user.avatar);
        } else {
          res.status(400).send({ error: "Not found" });
        }
      }),
      catchError((e) => {
        res.status(500).send({ error: e.message });
      })
    )
    .subscribe();
});

module.exports = router;
