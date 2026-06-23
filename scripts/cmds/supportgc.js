module.exports = {
  config: {
    name: "supportgc",
    aliases: ["supportgroup", "support"],
    version: "1.1",
    author: "Saimx69x × Gemini",
    countDown: 5,
    role: 0, // Accessible à tous les membres
    description: "Ajoute l'utilisateur au groupe de support officiel pour obtenir de l'aide et des mises à jour.",
    category: "utility",
    guide: {
      fr: "{p}{n}"
    }
  },

  onStart: async function ({ api, event, threadsData, message }) {
    const { senderID, threadID, messageID } = event;
    
    // 📢 REMPLACE CE NUMÉRO PAR L'ID DE TON PROPRE GROUPE DE SUPPORT
    const supportGroupThreadID = "2311426919273668";

    try {
      // Tentative de récupération des membres via les données de GoatBot ou l'API Facebook
      let threadInfo;
      try {
        threadInfo = await threadsData.get(supportGroupThreadID) || await api.getThreadInfo(supportGroupThreadID);
      } catch (e) {
        threadInfo = await api.getThreadInfo(supportGroupThreadID);
      }

      // Vérification si l'utilisateur est déjà dans le groupe cible
      const members = threadInfo.members || threadInfo.participantIDs || [];
      const isMember = Array.isArray(members) 
        ? members.some(m => (m.userID === senderID || m === senderID) && (m.inGroup !== false))
        : false;

      if (isMember) {
        return message.reply("⚠️ Vous faites déjà partie de notre groupe de support officiel.");
      }

      // Ajout de l'utilisateur au groupe de support
      await api.addUserToGroup(senderID, supportGroupThreadID);

      return message.reply("✅ **[ACCÈS ACCORDÉ]**\nVous avez été ajouté avec succès au groupe de support officiel. Bienvenue parmi nous ! ✨");

    } catch (error) {
      console.error("Erreur SupportGC :", error);

      return message.reply(
        "❌ **[ÉCHEC DE L'INVITATION]**\n\nImpossible de vous ajouter automatiquement au groupe de support.\n\n" +
        "💡 **Raisons possibles :**\n" +
        "1. Vos paramètres de confidentialité Facebook bloquent les invitations des inconnus.\n" +
        "2. Le bot n'est pas ami avec vous.\n\n" +
        "👉 _Solution : Envoyez une demande d'ami au bot ou ouvrez vos invitations privées, puis réessayez._"
      );
    }
  }
};
