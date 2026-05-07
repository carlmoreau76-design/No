const axios = require("axios");
const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "edit",
    version: "1.0",
    author: "Christus ✨ | Angel Kawaii Edit by Shade",
    countDown: 5,
    role: 0,
    shortDescription: "🌸 édition d’image IA style Angel kawaii",
    longDescription: "✨ Transforme ton image avec une IA magique style kawaii angel",
    category: "🎨 angel-ai",
    guide: "{p}edit [prompt] (répondre à une image)"
  },

  onStart: async function ({ api, event, args, message }) {
    const prompt = args.join(" ");
    const repliedImage = event.messageReply?.attachments?.[0];

    // 💖 vérif image
    if (!repliedImage || repliedImage.type !== "photo") {
      return message.reply(
        "🌸💔 Oops Angel kawaii a besoin d’une image !\n\n✨ Réponds à une photo + ajoute ton style magique\nExemple : /edit style anime kawaii pastel 💖"
      );
    }

    // 💖 vérif prompt
    if (!prompt) {
      return message.reply(
        "💫✨ Donne-moi un style magique à appliquer !\n\nExemple : /edit style angel kawaii glow pastel 🌸💎"
      );
    }

    const processingMsg = await message.reply("🌸✨ Angel kawaii travaille sur ta magie… patience 💖");

    const imgPath = path.join(__dirname, "cache", `${Date.now()}_angel_edit.jpg`);

    try {
      const imgURL = repliedImage.url;

      const apiURL = `https://dev.oculux.xyz/api/fluxkontext?prompt=${encodeURIComponent(prompt)}&ref=${encodeURIComponent(imgURL)}`;

      const res = await axios.get(apiURL, { responseType: "arraybuffer" });

      await fs.ensureDir(path.dirname(imgPath));
      await fs.writeFile(imgPath, Buffer.from(res.data, "binary"));

      await api.unsendMessage(processingMsg.messageID);

      return message.reply({
        body: `💖✨ Angel kawaii a transformé ton image !\n🌸 Style appliqué : ${prompt}`,
        attachment: fs.createReadStream(imgPath)
      });

    } catch (err) {
      console.error("Angel EDIT error :", err);

      await api.unsendMessage(processingMsg.messageID);

      return message.reply("💔✨ Oops… la magie a échoué. Réessaie encore Angel 💖");
    } finally {
      if (fs.existsSync(imgPath)) {
        await fs.remove(imgPath);
      }
    }
  }
};
