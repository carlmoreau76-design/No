const axios = require("axios");

module.exports = {
  config: {
    name: "anime",
    aliases: ["ani", "animesearch"],
    version: "2.0 angel",
    author: "Shade ✨",
    role: 0,
    category: "game",
    countDown: 5,
    longDescription: "Recherche anime + détails + image après sélection",
    guide: {
      en: "{pn} <nom anime>"
    }
  },

  onStart: async function ({ api, event, args, message }) {
    try {

      const query = args.join(" ");
      if (!query) {
        return message.reply("💡 Donne un nom d’anime !");
      }

      api.setMessageReaction("⏳", event.messageID, () => {}, true);

      const res = await axios.get(
        `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&limit=10`
      );

      const results = res.data.data;

      if (!results || !results.length) {
        return message.reply("❌ Aucun anime trouvé");
      }

      let msg = "🎬 𝗔𝗡𝗜𝗠𝗘 𝗥𝗘𝗦𝗨𝗟𝗧𝗦\n\n";

      results.forEach((a, i) => {
        msg += `💠 ${i + 1}. ${a.title}\n`;
      });

      msg += "\n💬 Réponds avec un numéro";

      const sent = await message.reply(msg);

      global.GoatBot.onReply.set(sent.messageID, {
        commandName: "anime",
        author: event.senderID,
        results
      });

      api.setMessageReaction("✅", event.messageID, () => {}, true);

    } catch (e) {
      console.log(e);
      api.setMessageReaction("❌", event.messageID, () => {}, true);
      return message.reply("💔 Erreur anime API");
    }
  },

  onReply: async function ({ api, event, Reply, message }) {
    try {

      if (event.senderID !== Reply.author) return;

      const index = parseInt(event.body);

      if (isNaN(index) || index < 1 || index > Reply.results.length) {
        return message.reply("❌ Numéro invalide");
      }

      const anime = Reply.results[index - 1];

      api.setMessageReaction("⏳", event.messageID, () => {}, true);

      const imgUrl = anime.images.jpg.large_image_url;

      const info =
`🎬 ${anime.title}

📺 Episodes: ${anime.episodes || "?"}
🎭 Type: ${anime.type || "?"}
📅 Status: ${anime.status || "?"}
⏱️ Duration: ${anime.duration || "?"}

📝 ${anime.synopsis?.slice(0, 500) || "Pas de synopsis"}`;

      const file = await axios({
        url: imgUrl,
        responseType: "stream"
      });

      api.setMessageReaction("🖼️", event.messageID, () => {}, true);

      return message.reply({
        body: info,
        attachment: file.data
      });

    } catch (e) {
      console.log(e);
      api.setMessageReaction("❌", event.messageID, () => {}, true);
      return message.reply("💔 Erreur lors du détail anime");
    }
  }
};
