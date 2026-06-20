const OWNER_ID = "61573867120837";

module.exports = {
  config: {
    name: "setbotname",
    aliases: ["setbotnick", "botname"],
    version: "1.0",
    author: "Shade × ChatGPT",
    role: 2, // Admin/Owner uniquement
    category: "admin",
    shortDescription: "Change le pseudonyme du bot dans tous les groupes",
    guide: "{pn} [Nouveau pseudonyme]"
  },

  onStart: async function ({ api, event, args, message }) {
    const { senderID } = event;

    // 🔒 SÉCURITÉ STRICTE
    if (senderID !== OWNER_ID) {
      return message.reply("❌ Accès refusé. Cette commande est réservée au propriétaire principal.");
    }

    const newNickname = args.join(" ");

    if (!newNickname) {
      return message.reply("💡 Veuillez spécifier un nouveau pseudonyme pour le bot.\nExemple : `/setbotname Mon Super Bot`");
    }

    message.reply(`⏳ Modification du pseudonyme en "${newNickname}" dans tous les groupes en cours...`);

    try {
      // Récupère la liste de toutes les conversations actives du bot
      const inboxList = await api.getThreadList(100, null, ["INBOX"]);
      // Filtre pour ne garder que les conversations de groupe (threads)
      const groupThreads = inboxList.filter(thread => thread.isGroup && thread.isSubscribed);

      let successCount = 0;
      let failCount = 0;
      const botID = api.getCurrentUserID();

      for (const thread of groupThreads) {
        try {
          await api.changeNickname(newNickname, thread.threadID, botID);
          successCount++;
        } catch (err) {
          failCount++;
        }
      }

      return message.reply(`✅ **Mise à jour terminée**\n\n• Pseudonyme appliqué avec succès dans **${successCount}** groupes.\n${failCount > 0 ? `• Échec dans **${failCount}** groupes (permissions insuffisantes ou bugs).` : ""}`);

    } catch (error) {
      console.error(error);
      return message.reply("💔 Une erreur générale est survenue lors de la récupération des groupes.");
    }
  }
};
