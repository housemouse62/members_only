const express = require("express");
const messagesRouter = express.Router();
const pool = require("../db/pool");

messagesRouter.get("/createMessage", (req, res) => {
  res.render("create-message", { user: req.user });
});

messagesRouter.post("/createMessage", async (req, res) => {
  await pool.query(
    "INSERT INTO messages (user_id, title, text) VALUES ($1, $2, $3)",
    [req.user.id, req.body.title, req.body.text],
  );
  res.render("message-posted");
});

messagesRouter.get("/", async (req, res) => {
  const { rows } = await pool.query(
    "SELECT users.username AS username, users.membership_status AS member, messages.title AS title, messages.text AS text, messages.timestamp AS timestamp, messages.message_id AS message_id FROM users INNER JOIN messages ON users.id=messages.user_id;",
  );
  res.render("index", { user: req.user, messages: rows });
});

messagesRouter.post("/", async (req, res) => {
  const item = req.query.message_id;
  await pool.query("DELETE FROM messages WHERE message_id = $1", [item]);
  res.redirect("/");
});

module.exports = messagesRouter;
