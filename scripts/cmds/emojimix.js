const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const { getPrefix } = global.utils;

module.exports = {
  config: {
    name: "emojimix",
    aliases: ["mix"],
    version: "🌸1.1 angel kawaii",
    author: "Saimx69x × Angel Edit ✨",
    countDown: 5,
    role: 0,
    category: "🤡 fun",
    shortDescription: "💖 mix emojis in kawaii style",
    longDescription: "🌸 Combine two emojis into a magical Angel kawaii result",
    guide: {
      en: "{pn} <emoji1> <emoji2>\nExample: {pn} 😭 🫦"
    }
  },

  onStart: async function ({ api, event, args }) {
    try {
      const prefix = getPrefix(event.threadID);

      if (args.length < 2) {
        return api.sendMessage(
`╭─── 🌸 𝗔𝗡𝗚𝗘𝗟 𝗘𝗠𝗢𝗝𝗜𝗠𝗜𝗫 ───╮
💔 You forgot emojis !
✨ Usage: ${prefix}emojimix 😭 🫦
╰────────────────────╯`,
          event.threadID,
          event.messageID
        );
      }

      const [emoji1, emoji2] = args;

      /* 💫 API */
      const GITHUB_RAW = "https://raw.githubusercontent.com/Saim-x69x/sakura/main/ApiUrl.json";
      const rawRes = await axios.get(GITHUB_RAW);
      const apiBase = rawRes.data.apiv1;

      const apiUrl = `${apiBase}/api/emojimix?emoji1=${encodeURIComponent(emoji1)}&emoji2=${encodeURIComponent(emoji2)}`;

      /* 🌸 temp file */
      const tempDir = path.join(__dirname, "cache");
      await fs.ensureDir(tempDir);

      const imgPath = path.join(tempDir, `angel_mix_${Date.now()}.png`);

      const loading = await api.sendMessage(
`💖 Mixing your emojis… please wait angel~ 🌸✨`,
        event.threadID,
        event.messageID
      );

      const response = await axios.get(apiUrl, { responseType: "arraybuffer" });

      if (!response.data || response.data.length < 100) {
        return api.sendMessage(
`╭─── 💔 𝗔𝗡𝗚𝗘𝗟 𝗘𝗥𝗥𝗢𝗥 ───╮
❌ Failed to generate emoji mix
🌸 Try again later
╰──────────────────╯`,
          event.threadID,
          event.messageID
        );
      }

      await fs.writeFile(imgPath, response.data);

      return api.sendMessage(
        {
          body:
`╭─── 💖 𝗔𝗡𝗚𝗘𝗟 𝗘𝗠𝗢𝗝𝗜𝗠𝗜𝗫 ───╮
✨ Result generated successfully
🌸 ${emoji1} + ${emoji2}
💫 Magic created by Angel bot
╰──────────────────╯`,
          attachment: fs.createReadStream(imgPath)
        },
        event.threadID,
        () => {
          setTimeout(() => fs.unlink(imgPath).catch(() => {}), 1000);
        },
        event.messageID
      );

    } catch (error) {
      console.error("Angel EmojiMix Error:", error.message);

      return api.sendMessage(
`╭─── 💔 𝗖𝗥𝗜𝗧𝗜𝗖𝗔𝗟 𝗘𝗥𝗥𝗢𝗥 ───╮
❌ Something went wrong angel~
💫 Please try again later
╰────────────────────╯`,
        event.threadID,
        event.messageID
      );
    }
  }
};
