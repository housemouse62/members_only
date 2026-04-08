const path = require("node:path");
const pool = require("./db/pool");
const express = require("express");
const router = express.Router();
const session = require("express-session");
const passport = require("./config/passport.js");
const messagesRouter = require("./routes/messagesRouter.js");
const authRouter = require("./routes/authRouter.js");
const app = express();

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(session({ secret: process.env.SESSION_SECRET, resave: false, saveUninitialized: false }));
app.use(passport.session());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));

app.use("/", messagesRouter);
app.use("/", authRouter);

app.listen(process.env.PORT || 3000, (err) => {
  if (err) {
    throw err;
  }
  console.log("app listening on port 3000!");
});
