module.exports = {
  config: {
    name: "out",
    aliases: ["leave"],
    version: "1.1",
    author: "Christus",
    countDown: 5,
    role: 3, // admin bot only
    shortDescription: {
      en: "Angel leaves the group"
    },
    category: "owner",
    guide: {
      en: "{pn} — Angel quitte le groupe 🌸"
    }
  },

  onStart: async function ({ api, event, args }) {
    try {
      const ownerID = "61573867120837"; // 🔒 TON ID

      // sécurité: seul toi peux faire quitter
      if (event.senderID !== ownerID) {
        return api.sendMessage(
          "🌸 𝘼𝙣𝙜𝙚𝙡 : désolée… seul mon créateur peut me demander ça 💔",
          event.threadID,
          event.messageID
        );
      }

      await api.sendMessage(
        "🌸💔 𝘼𝙣𝙜𝙚𝙡 : d'accord… je m'éloigne doucement du groupe...\nPrenez soin de vous ✨",
        event.threadID
      );

      setTimeout(() => {
        api.removeUserFromGroup(api.getCurrentUserID(), event.threadID);
      }, 800);

    } catch (err) {
      console.error(err);
      api.sendMessage(
        "❌ Angel n’a pas réussi à quitter le groupe…",
        event.threadID
      );
    }
  }
};
