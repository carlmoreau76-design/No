const axios = require("axios");

module.exports = {
  config: {
    name: "imgur",
    version: "✨ 1.1 angel kawaii",
    author: "Christus ✨ Shade Edit",
    countDown: 3,
    role: 0,
    shortDescription: "🌸 Upload image/vidéo sur Imgur",
    longDescription: "💖 Réponds à une image ou envoie une URL pour l’envoyer sur Imgur",
    category: "utility ",
    guide: "{pn} reply image/vidéo ou lien 🌸"
  },

  onStart: async function ({ api, event, args }) {
    const { threadID, messageID, messageReply } = event;

    const send = (text) =>
      api.sendMessage(`🌸✨ ${text}`, threadID, messageID);

    try {
      let mediaUrl = "";

      // 📸 reply image
      if (messageReply?.attachments?.length > 0) {
        mediaUrl = messageReply.attachments[0].url;
      }

      // 🔗 url
      else if (args.length > 0) {
        mediaUrl = args.join(" ");
      }

      if (!mediaUrl) {
        return send("❌ Réponds à une image/vidéo ou donne un lien valide 💔✨");
      }

      // ⏳ reaction loading
      api.setMessageReaction("⏳", messageID, () => {}, true);

      const res = await axios.get(
        `http://65.109.80.126:20409/aryan/imgur?url=${encodeURIComponent(mediaUrl)}`
      );

      const link = res.data?.imgur;

      if (!link) {
        api.setMessageReaction("❌", messageID, () => {}, true);
        return send("💔✨ Upload échoué sur Imgur...");
      }

      // ✅ success reaction
      api.setMessageReaction("✅", messageID, () => {}, true);

      return api.sendMessage(
        `╭───────────────✦
│ 🌸 𝗜𝗠𝗚𝗨𝗥 𝗨𝗣𝗟𝗢𝗔𝗗 𝗔𝗡𝗚𝗘𝗟 ✨
├────────────────
│ 💖 Lien : ${link}
├────────────────
│ ⏳ Status : Upload terminé
│ 🤖 Bot : Angel system ✨
╰───────────────✦`,
        threadID,
        messageID
      );

    } catch (err) {
      console.error("Imgur error:", err);
      api.setMessageReaction("❌", messageID, () => {}, true);

      return send("⚠️ Une erreur est survenue pendant l’upload 💔✨");
    }
  }
};
