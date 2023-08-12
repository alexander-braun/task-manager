const mongoose = require("mongoose");
const { of } = require("rxjs");

of(
  mongoose.connect(process.env.MONGO_DB_URL, {
    dbName: process.env.DATABASE_NAME,
    autoIndex: true,
  })
).subscribe(() => console.log("MONGOOSE CONNECTED"));
