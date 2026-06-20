const express = require("express");
const app = express();

// 🟢 page test
app.get("/", (req, res) => {
  res.send("🟢 Bot is alive");
});

// 🔁 uptime endpoint
app.get("/ping", (req, res) => {
  res.status(200).json({
    status: "ok",
    uptime: process.uptime()
  });
});

// ❗ IMPORTANT : on exporte seulement l'app
module.exports = app;
