const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors());

app.get("/pinterest", async (req, res) => {
  const query = req.query.query;

  if (!query) {
    return res.json({ error: "no query" });
  }

  try {
    // 🔥 STEP 1: get token vqd
    const html = await axios.get(
      `https://duckduckgo.com/?q=${encodeURIComponent(query)}&iax=images&ia=images`,
      {
        headers: {
          "User-Agent": "Mozilla/5.0"
        }
      }
    );

    const match = html.data.match(/vqd='(.*?)'/);

    if (!match) {
      return res.json({ error: "no token found" });
    }

    const vqd = match[1];

    // 🔥 STEP 2: real image API
    const img = await axios.get(
      `https://duckduckgo.com/i.js?l=us-en&o=json&q=${encodeURIComponent(query)}&vqd=${vqd}&p=1`,
      {
        headers: {
          "User-Agent": "Mozilla/5.0",
          "Referer": "https://duckduckgo.com/"
        }
      }
    );

    const images = img.data.results.map(i => i.image);

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

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("🔥 Pinterest API running on port", PORT);
});
