const a = require("axios");
const f = require("fs");
const p = require("path");

const u = "http://65.109.80.126:20409/aryan/4k";

module.exports = {
  config: {
    name: "4k",
    aliases: ["upscale"],
    version: "1.1",
    role: 0,
    author: "Shade",
    countDown: 10,
    longDescription: "🌸 Améliore une image en qualité 4K magique ✨",
    category: "image",
    guide: {
      en: "${pn} reply to an image ✨"
    }
  },

  onStart: async function ({ message, event }) {

    if (
      !event.messageReply ||
      !event.messageReply.attachments ||
      !event.messageReply.attachments[0] ||
      event.messageReply.attachments[0].type !== "photo"
    ) {
      return message.reply("🌸 Oops ! Réponds à une image pour la transformer en 4K ✨📸");
    }

    const i = event.messageReply.attachments[0].url;
    const t = p.join(__dirname, "cache", `angel_4k_${Date.now()}.png`);
    let m;

    try {
      const r = await message.reply("🌸✨ Transformation magique en cours... patience 💫");
      m = r.messageID;

      const d = await a.get(`${u}?imageUrl=${encodeURIComponent(i)}`);
      if (!d.data.status) throw new Error(d.data.message || "API error");

      const x = await a.get(d.data.enhancedImageUrl, { responseType: "stream" });
      const w = f.createWriteStream(t);
      x.data.pipe(w);

      await new Promise((res, rej) => {
        w.on("finish", res);
        w.on("error", rej);
      });

      await message.reply({
        body: "💖✨ Yay ! Ton image est maintenant en 4K ultra kawaii 🌸",
        attachment: f.createReadStream(t),
      });

    } catch (e) {
      console.error("Upscale Error:", e);
      message.reply("💔 Oops... la magie a échoué. Réessaie plus tard 🌸");
    } finally {
      if (m) message.unsend(m);
      if (f.existsSync(t)) f.unlinkSync(t);
    }
  }
};
