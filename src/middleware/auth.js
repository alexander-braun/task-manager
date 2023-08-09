const jwt = require("jsonwebtoken");
const User = require("../models/user");
const { switchMap, catchError, EMPTY, tap, of } = require("rxjs");

const auth = (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");
  of(jwt.verify(token, process.env.JWT_SECRET))
    .pipe(
      switchMap((decoded) =>
        User.findOne({ _id: decoded._id, "tokens.token": token })
      ),
      catchError((e) => {
        res.status(401).send(e.message);
        return EMPTY;
      }),
      tap((user) => {
        if (!user) {
          res.status(401).send("Please authenticate");
        } else {
          req.token = token;
          req.user = user;
          next();
        }
      })
    )
    .subscribe();
};

module.exports = auth;
