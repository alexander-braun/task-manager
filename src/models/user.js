const mongoose = require("mongoose");
const { from, switchMap, throwError, of, tap } = require("rxjs");
const validator = require("validator");
const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Task = require("./task");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      unique: true,
      type: String,
      validate(value) {
        if (!validator.isEmail(value)) {
          throw new Error("Not a valid email");
        }
      },
      trim: true,
      lowercase: true,
      required: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 7,
      trim: true,
      validate(value) {
        if (value.toLowerCase() === "password") {
          throw new Error("Not a valid password");
        }
      },
    },
    age: {
      type: Number,
    },
    avatar: {
      type: Buffer,
    },
    tokens: {
      type: [
        {
          token: {
            type: String,
            required: true,
          },
        },
      ],
    },
  },
  {
    timestamps: true,
  }
);

// relationship between user and task
// links _id from user to owner field in tasks
userSchema.virtual("tasks", {
  ref: "Task",
  // where local data is stored - _id on task associated with _id on user
  localField: "_id",
  // name of the field on the task to create relationship
  foreignField: "owner",
});

userSchema.pre("save", { document: true }, function (next) {
  if (this.isModified("password")) {
    from(bcryptjs.hash(this.password, 12)).subscribe((password) => {
      this.password = password;
      next();
    });
  } else {
    next();
  }
});

// Delte all related tasks before removing user
userSchema.pre("deleteOne", { document: true }, function (next) {
  from(Task.deleteMany({ owner: this._id })).subscribe(() => next());
});

// Static methods are accessible on the model of User
userSchema.statics.findByCredentials = (email, password) => {
  return from(User.findOne({ email })).pipe(
    switchMap((user) => {
      if (!user) {
        return throwError(() => new Error("Email not found"));
      } else {
        return from(bcryptjs.compare(password, user.password)).pipe(
          switchMap((match) => {
            if (!match) {
              return throwError(() => new Error("Wrong password"));
            } else {
              return of(user);
            }
          })
        );
      }
    })
  );
};

// Methods methods are accessible on the instance of User
userSchema.methods.generateAuthToken = function () {
  console.log("sign token");
  const token = jwt.sign({ _id: this._id.toString() }, process.env.JWT_SECRET);
  this.tokens = this.tokens.concat({ token });
  return from(this.save()).pipe(switchMap(() => of(token)));
};

userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  delete user.tokens;
  // has extra request and is big
  delete user.avatar;
  return user;
};

const User = mongoose.model("User", userSchema);

module.exports = User;
