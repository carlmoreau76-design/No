const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors());

// 🔥 PINTEREST STYLE API
app.get("/pinterest", async (req, res) => {
  const query = req.query.query;

  if (!query) {
    return res.json({ error: "no query" });
  }

  try {
    // 💥 SOURCE JSON IMAGE (plus stable)
    const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json`;

    const response = await axios.get(url);
    const data = response.data;

    // 🧠 extraction images via DuckDuckGo related topics (safe fallback)
    let images = [];

    if (data.RelatedTopics) {
      data.RelatedTopics.forEach(item => {
        if (item.Icon && item.Icon.URL) {
          images.push("https://duckduckgo.com" + item.Icon.URL);
        }
      });
    }

    res.json({
      query,
      data: images.slice(0, 30)
    });

  } catch (e) {
    res.status(500).json({
      error: "failed",
      message: e.message
    });
  }
});

// 🚀 START SERVER
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("🔥 Pinterest API running on port", PORT);
});
