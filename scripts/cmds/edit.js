const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "edit",
    version: "1.1 angel kawaii",
    author: "Christus ✨ | Shade Angel Edit",
    countDown: 5,
    role: 0,
    shortDescription: "🌸 édition d’image IA style Angel kawaii",
    longDescription: "✨ Transforme ton image avec IA Gemini Edit",
    category: "🎨 image",
    guide: "{p}edit [prompt] (répondre à une image)"
  },

  onStart: async function ({ api, event, args, message }) {
    const prompt = args.join(" ");
    const image = event.messageReply?.attachments?.[0];

    // 💔 pas d’image
    if (!image || image.type !== "photo") {
      return message.reply(
`🌸💔 Angel Edit a besoin d'une image !

✨ Réponds à une photo + ton style
Exemple : /edit anime kawaii pastel 💖`
      );
    }

    // 💔 pas de prompt
    if (!prompt) {
      return message.reply(
`💫✨ Donne un style magique !

Exemple : /edit angel glow anime aesthetic 🌸`
      );
    }

    // 🎨 réaction loading edit
    api.setMessageReaction("🎨", event.messageID, () => {}, true);

    const processingMsg = await message.reply(
      "🌸✨ Angel Edit transforme ton image… patience 💖🎨"
    );

    const imgPath = path.join(__dirname, "cache", `${Date.now()}_angel_edit.jpg`);

    try {

      const apiURL = `https://gemini-edit-omega.vercel.app/edit?prompt=${encodeURIComponent(prompt)}&image=${encodeURIComponent(image.url)}`;

      const res = await axios.get(apiURL, { responseType: "arraybuffer" });

      await fs.ensureDir(path.dirname(imgPath));
      await fs.writeFile(imgPath, Buffer.from(res.data));

      // 💾 success reaction
      api.setMessageReaction("💾", event.messageID, () => {}, true);

      await api.unsendMessage(processingMsg.messageID);

      return message.reply({
        body: `💖✨ Angel Edit terminé !
🌸 Style : ${prompt}`,
        attachment: fs.createReadStream(imgPath)
      });

    } catch (err) {
      console.log("Angel EDIT error:", err.message);

      // ❌ fail reaction
      api.setMessageReaction("❌", event.messageID, () => {}, true);

      await api.unsendMessage(processingMsg.messageID);

      return message.reply(
        "💔✨ Oops… Angel Edit a échoué, réessaie encore 💖"
      );

    } finally {
      if (fs.existsSync(imgPath)) {
        await fs.remove(imgPath);
      }
    }
  }
};
