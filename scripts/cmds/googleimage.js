const axios = require("axios");
const path = require("path");
const fs = require("fs-extra");

module.exports = {
  config: {
    name: "googleimage",
    aliases: ["gimg", "googleimg", "gimage"],
    version: "1.0",
    author: "Christus",
    role: 0,
    countDown: 5,
    description: { fr: "Rechercher des images depuis Google Images." },
    category: "image",
    guide: { fr: "{pn} <recherche> - <nombre>\nExemple : {pn} Naruto - 5" },
  },

  onStart: async function ({ api, event, args }) {
    try {
      const input = args.join(" ").trim();

      if (!input) {
        return api.sendMessage(
`╭ ◜◝ ͡ ◜◝ ͡ ◜◝ ͡ ◝╮
♡ 𝘼𝙣𝙜𝙚𝙡 𝘽𝙤𝙩 ♡
╰ ◟◞ ͜ ◟ ͜ ◟◞ ͜ ◞ ╯

❌ Please provide a search query

✨ Example:
/googleimg Naruto - 5`,
          event.threadID,
          event.messageID
        );
      }

      let query = input;
      let count = 5;

      if (input.includes("-")) {
        const parts = input.split("-");
        query = parts[0].trim();
        count = parseInt(parts[1].trim()) || 5;
      }

      if (count > 25) count = 25;

      const GITHUB_RAW = "https://raw.githubusercontent.com/Saim-x69x/sakura/main/ApiUrl.json";
      const rawRes = await axios.get(GITHUB_RAW);
      const apiBase = rawRes.data.apiv1;

      const apiUrl = `${apiBase}/api/googleimage?query=${encodeURIComponent(query)}`;
      const res = await axios.get(apiUrl);
      const data = res.data?.images || [];

      if (!data.length) {
        return api.sendMessage(
`╭ ◜◝ ͡ ◜◝ ͡ ◜◝ ͡ ◝╮
♡ 𝘼𝙣𝙜𝙚𝙡 𝘽𝙤𝙩 ♡
╰ ◟◞ ͜ ◟ ͜ ◟◞ ͜ ◞ ╯

❌ No images found for:
"${query}"

🎀 Try another search`,
          event.threadID,
          event.messageID
        );
      }

      const cacheDir = path.join(__dirname, "cache");
      await fs.ensureDir(cacheDir);

      const validImages = [];

      for (let url of data) {
        if (validImages.length >= count) break;

        try {
          const headRes = await axios.head(url);
          const type = headRes.headers["content-type"];

          if (!type || !type.startsWith("image")) continue;

          const imgRes = await axios.get(url, { responseType: "arraybuffer" });
          const imgPath = path.join(cacheDir, `${validImages.length + 1}.jpg`);

          await fs.writeFile(imgPath, imgRes.data);
          validImages.push(fs.createReadStream(imgPath));

        } catch (err) {
          continue;
        }
      }

      if (!validImages.length) {
        return api.sendMessage(
`╭ ◜◝ ͡ ◜◝ ͡ ◜◝ ͡ ◝╮
♡ 𝘼𝙣𝙜𝙚𝙡 𝘽𝙤𝙩 ♡
╰ ◟◞ ͜ ◟ ͜ ◟◞ ͜ ◞ ╯

❌ Unable to load valid images

💫 Please try again later`,
          event.threadID,
          event.messageID
        );
      }

      await api.sendMessage(
        {
          body:
`╭ ◜◝ ͡ ◜◝ ͡ ◜◝ ͡ ◝╮
♡ 𝘼𝙣𝙜𝙚𝙡 𝘽𝙤𝙩 ♡
╰ ◟◞ ͜ ◟ ͜ ◟◞ ͜ ◞ ╯

✨ Results for: "${query}"
🎀 Images loaded successfully`,
          attachment: validImages
        },
        event.threadID,
        event.messageID
      );

      await fs.remove(cacheDir);

    } catch (error) {
      console.error("GoogleImg Error:", error);

      return api.sendMessage(
`╭ ◜◝ ͡ ◜◝ ͡ ◜◝ ͡ ◝╮
♡ 𝘼𝙣𝙜𝙚𝙡 𝘽𝙤𝙩 ♡
╰ ◟◞ ͜ ◟ ͜ ◟◞ ͜ ◞ ╯

❌ Image generation failed

🎀 Please try again later...
💫 Maybe the server is resting ~

╭═══════════════╮
🔹 Prefix: /
🔸 Use /help for commands
╰═══════════════╯`,
        event.threadID,
        event.messageID
      );
    }
  }
};
