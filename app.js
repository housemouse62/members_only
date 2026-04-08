const path = require("node:path");
const { Pool } = require("pg");
const express = require("express");
const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcryptjs");
const { body, matchedData, validationResult } = require("express-validator");

const pool = new Pool({
  host: "localhost",
  user: "ryanskeels",
  database: "members_only",
  port: 5432,
});

passport.use(
  new LocalStrategy(async (username, password, done) => {
    try {
      const { rows } = await pool.query(
        "SELECT * FROM users WHERE username = $1",
        [username],
      );
      const user = rows[0];

      if (!user) {
        return done(null, false, { message: "Incorrect username" });
      }
      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        return done(null, false, { message: "Incorrect password" });
      }
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }),
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const { rows } = await pool.query("SELECT * FROM users WHERE id = $1", [
      id,
    ]);
    const user = rows[0];

    done(null, user);
  } catch (err) {
    done(err);
  }
});
const app = express();
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(session({ secret: "cats", resave: false, saveUninitialized: false }));
app.use(passport.session());
app.use(express.urlencoded({ extended: false }));

app.post(
  "/log-in",
  passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/",
  }),
);

app.get("/log-out", (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});

app.get("/sign-up", (req, res) => res.render("sign-up-form"));

app.post(
  "/sign-up",
  body("confirmPassword").custom((value, { req }) => {
    const match = value === req.body.password;
    if (!match) throw new Error("Passwords do not match.");
    return true;
  }),
  async (req, res, next) => {
    const passwordErrors = validationResult(req);
    console.log(passwordErrors.array());
    if (!passwordErrors.isEmpty()) {
      const passwordErrorPayload = {
        passwordErrors: passwordErrors.array(),
        passwordData: req.body,
      };

      return res.status(400).render("sign-up-form", {
        ...passwordErrorPayload,
      });
    }
    try {
      const hashedPassword = await bcrypt.hash(req.body.password, 10);
      const { rows } = await pool.query(
        "INSERT INTO users (first_name, last_name, email, username, password, admin) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, username",
        [
          req.body.first_name,
          req.body.last_name,
          req.body.email,
          req.body.username,
          hashedPassword,
          req.body.admin ? true : false,
        ],
      );
      const user = rows[0];
      req.login(user, function (err) {
        if (err) {
          return next(err);
        }
        return res.redirect("/confirm");
      });
    } catch (err) {
      return next(err);
    }
  },
);

app.get("/confirm", (req, res) => {
  res.render("confirm-membership", { user: req.user });
});

app.post("/confirm", async (req, res) => {
  if (req.body.confirm === "62") {
    await pool.query(
      "UPDATE users SET membership_status = true WHERE id = $1",
      [req.user.id],
    );
    return res.redirect("/");
  } else {
    return res.render("confirm-membership", {
      confirmError: "Incorrect Confirmation Number, Try Again!",
    });
  }
});

app.get("/createMessage", (req, res) => {
  res.render("create-message", { user: req.user });
});

app.post("/createMessage", async (req, res) => {
  await pool.query(
    "INSERT INTO messages (user_id, title, text) VALUES ($1, $2, $3)",
    [req.user.id, req.body.title, req.body.text],
  );
  res.render("message-posted");
});

app.get("/", async (req, res) => {
  const { rows } = await pool.query(
    "SELECT users.username AS username, users.membership_status AS member, messages.title AS title, messages.text AS text, messages.timestamp AS timestamp, messages.message_id AS message_id FROM users INNER JOIN messages ON users.id=messages.user_id;",
  );
  res.render("index", { user: req.user, messages: rows });
});

app.post("/", async (req, res) => {
  const item = req.query.message_id;
  await pool.query("DELETE FROM messages WHERE message_id = $1", [item]);
  res.redirect("/");
});

app.listen(3000, (err) => {
  if (err) {
    throw err;
  }
  console.log("app listening on port 3000!");
});
