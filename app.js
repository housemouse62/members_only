const path = require("node:path");
const { Pool } = require("pg");
const express = require("express");
const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;

const pool = new Pool({
  host: "localhost",
  user: "ryanskeels",
  database: "members_only",
  port: 5432,
});

const app = express();
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(session({ secret: "cats", resave: false, saveUninitialized: false }));
app.use(passport.session());
app.use(express.urlencoded({ extended: false }));

app.get("/", (req, res) => res.render("index"));
app.get("/sign-up", (req, res) => res.render("sign-up-form"));
app.post("/sign-up", async (req, res, next) => {
  try {
    await pool.query(
      "INSERT INTO users (first_name, last_name, email, username, password) VALUES ($1, $2, $3, $4, $5)",
      [
        req.body.first_name,
        req.body.last_name,
        req.body.email,
        req.body.username,
        req.body.password,
      ],
    );
    res.redirect("/");
  } catch (err) {
    return next(err);
  }
});

app.listen(3000, (err) => {
  if (err) {
    throw err;
  }
  console.log("app listening on port 3000!");
});
