const OWNER_ID = "61573867120837";

module.exports = {
  config: {
    name: "setprefix",
    version: "1.0",
    author: "Shade × ChatGPT",
    role: 2, // Admin/Owner uniquement
    category: "admin",
    shortDescription: "Change le préfixe du bot et avertit tous les groupes",
    guide: "{pn} [nouveau préfixe]"
  },

  onStart: async function ({ api, event, args, message, threadsData }) {
    const { senderID } = event;

    // 🔒 SÉCURITÉ STRICTE
    if (senderID !== OWNER_ID) {
      return message.reply("❌ Accès refusé. Cette commande est réservée au propriétaire principal.");
    }

    const newPrefix = args[0];

    if (!newPrefix) {
      return message.reply("💡 Veuillez spécifier un nouveau préfixe.\nExemple : `/setprefix !`");
    }

    if (newPrefix.length > 3) {
      return message.reply("⚠️ Le préfixe est trop long (maximum 3 caractères).");
    }

    message.reply(`⏳ Modification du préfixe en "${newPrefix}" et diffusion de l'annonce en cours...`);

    try {
      // 1. Récupération de tous les groupes actifs
      const inboxList = await api.getThreadList(100, null, ["INBOX"]);
      const groupThreads = inboxList.filter(thread => thread.isGroup && thread.isSubscribed);

      let successCount = 0;
      const announcement = `📢 **ANNONCE SYSTÈME** 📢\n\nMon créateur vient de changer mon préfixe !\n\n🔹 Nouveau préfixe : \`${newPrefix}\`\n\nVeuillez désormais taper \`${newPrefix}\` devant vos commandes pour m'utiliser. ✨`;

      for (const thread of groupThreads) {
        try {
          // 2. Modification du préfixe dans la configuration du groupe pour GoatBot
          if (threadsData && typeof threadsData.set === "function") {
            const threadData = await threadsData.get(thread.threadID) || {};
            await threadsData.set(thread.threadID, {
              ...threadData,
              prefix: newPrefix
            });
          }

          // 3. Envoi du message d'annonce dans le groupe
          await api.sendMessage(announcement, thread.threadID);
          successCount++;
        } catch (err) {
          // Échec silencieux pour un groupe spécifique (Ex: bot bloqué/expulsé entre-temps)
          console.error(`Impossible de mettre à jour le groupe ${thread.threadID}:`, err);
        }
      }

      return message.reply(`✅ **Mise à jour globale terminée**\n\n• Préfixe modifié et annonce envoyée avec succès dans **${successCount}** groupes.`);

    } catch (error) {
      console.error(error);
      return message.reply("💔 Une erreur générale est survenue lors du changement de préfixe.");
    }
  }
};
