const fs = require("fs-extra");
const path = require("path");

const DATA_PATH = path.resolve(__dirname, "cache", "count_activity.json");

// 👉 remplace par TON ID
const OWNER_ID = "61573867120837";

module.exports = {
  config: {
    name: "resetcount",
    version: "1.0",
    author: "Shade",
    role: 2,
    category: "admin",
    description: "Reset total des stats count (owner only)"
  },

  onStart: async function ({ event, message }) {
    const senderID = event.senderID;

    // 🔒 sécurité owner only
    if (senderID !== OWNER_ID) {
      return message.reply("❌ 𝘈𝘤𝘤𝘦̀𝘴 𝘳𝘦𝘧𝘶𝘴𝘦́…");
    }

    try {
      // 🧹 reset du fichier
      fs.writeFileSync(DATA_PATH, JSON.stringify({}, null, 2));

      return message.reply("✨ 𝘙𝘦𝘴𝘦𝘵 𝘵𝘦𝘳𝘮𝘪𝘯𝘦́… 𝘵𝘰𝘶𝘵 𝘭𝘦 𝘮𝘰𝘯𝘥𝘦 𝘳𝘦𝘤𝘰𝘮𝘮𝘦𝘯𝘤𝘦 𝘢̀ 𝘻𝘦́𝘳𝘰.");
    } catch (err) {
      return message.reply("❌ erreur reset: " + err.message);
    }
  }
};
