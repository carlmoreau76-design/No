module.exports = {
  config: {
    name: "angelmsg",
    version: "1.0",
    author: "Shade",
    role: 2,
    description: "Envoyer un message en privé aux utilisateurs",
    category: "utility",
    guide: {
      en: "{pn} <uid> <message>"
    }
  },

  onStart: async function ({ api, event, args }) {
    const OWNER_ID = "61573867120837";

    if (event.senderID !== OWNER_ID)
      return api.sendMessage("❌ Owner only", event.threadID);

    const uid = args[0];
    const msg = args.slice(1).join(" ");

    if (!uid || !msg)
      return api.sendMessage("❌ Usage: angelmsg <uid> <message>", event.threadID);

    try {
      await api.sendMessage(
        `💌 Message de Angel Bot:\n\n${msg}`,
        uid
      );

      return api.sendMessage("✅ Message envoyé en privé ✨", event.threadID);

    } catch (e) {
      return api.sendMessage("❌ Impossible d'envoyer le message", event.threadID);
    }
  }
};
