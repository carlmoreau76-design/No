const OWNER_UID = "61573867120837";

module.exports = {
  config: {
    name: "unsend",
    version: "1.0",
    author: "Shade",
    role: 0,
    shortDescription: "Supprime un message du bot via reply",
    category: "system"
  },

  onStart: async function ({ api, event, message }) {
    if (event.senderID !== OWNER_UID)
      return message.reply("❌ accès refusé...");

    if (!event.messageReply)
      return message.reply("⚠️ réponds à un message du bot");

    try {
      await api.unsendMessage(event.messageReply.messageID);
      message.reply("🧹 message supprimé 🌸");
    } catch (err) {
      message.reply("❌ impossible de supprimer ce message");
    }
  }
};
