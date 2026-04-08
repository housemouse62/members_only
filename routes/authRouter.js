const express = require("express");
const authRouter = express.Router();
const pool = require("../db/pool");
const { body, validationResult } = require("express-validator");
const passport = require("../config/passport");
const bcrypt = require("bcryptjs");
authRouter.get("/sign-up", (req, res) => res.render("sign-up-form"));

authRouter.post(
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

authRouter.post(
  "/log-in",
  passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/",
  }),
);

authRouter.get("/log-out", (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});

authRouter.get("/confirm", (req, res) => {
  res.render("confirm-membership", { user: req.user });
});

authRouter.post("/confirm", async (req, res) => {
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

module.exports = authRouter;
