module.exports = {
  config: {
    name: "group",
    aliases: ["groups", "grouplist", "leavegc"],
    version: "1.0.0",
    author: "Shade × Gemini",
    role: 2, // Limité aux Admins du bot / Owner
    category: "owner",
    description: "Affiche la liste des groupes du bot et permet de les quitter à distance.",
    guide: {
      fr: "{p}{n} [numéro de page] → Affiche la liste des groupes\nEnsuite, répondez (reply) au message de la liste avec : kick [numéro du groupe] pour que le bot quitte ce groupe."
    }
  },

  onStart: async function ({ api, event, args, message }) {
    const { threadID, messageID } = event;

    try {
      // Récupération de la liste des salons actifs de la session
      const inbox = await api.getThreadList(100, null, ["INBOX"]) || [];
      const groupList = inbox.filter(t => t.isGroup && t.name);

      if (groupList.length === 0) {
        return message.reply("❌ Le bot n'est présent dans aucun groupe actif.");
      }

      // Gestion de la pagination (10 groupes par page)
      const itemsPerPage = 10;
      const totalPages = Math.ceil(groupList.length / itemsPerPage);
      let page = parseInt(args[0]) || 1;

      if (page < 1) page = 1;
      if (page > totalPages) page = totalPages;

      const startIdx = (page - 1) * itemsPerPage;
      const endIdx = startIdx + itemsPerPage;
      const paginatedGroups = groupList.slice(startIdx, endIdx);

      // Stockage temporaire des IDs de cette page pour la session de reply
      global.client = global.client || {};
      global.client.groupCache = global.client.groupCache || {};
      global.client.groupCache[threadID] = groupList.map(g => g.threadID);

      let msg = `👥 **[LISTE DES GROUPES — PAGE ${page}/${totalPages}]**\n━━━━━━━━━━━━━━━━━━━━━\n`;
      
      paginatedGroups.forEach((group, index) => {
        const globalIndex = startIdx + index + 1;
        msg += `${globalIndex}. 👥 **${group.name}**\n   🆔 TID : \`${group.threadID}\`\n   👥 Membres : ${group.participantIDs?.length || "Inconnu"}\n\n`;
      });

      msg += `━━━━━━━━━━━━━━━━━━━━━\n💡 **Pour quitter un groupe :** Répondez à ce message avec : \`kick [numéro]\` (Ex: \`kick 3\`)`;
      
      return message.reply(msg);

    } catch (err) {
      console.error(err);
      return message.reply("❌ Une erreur est survenue lors de la récupération de la liste des groupes.");
    }
  },

  // --- GESTION DU REPLY POUR QUITTER ---
  onChat: async function ({ api, event, message }) {
    const { type, messageReply, body, threadID, messageID, senderID } = event;

    // Sécurité : Vérifier s'il s'agit d'un reply et si le texte commence par "kick"
    if (type !== "message_reply" || !body || !body.toLowerCase().startsWith("kick")) return;

    // Vérification des droits d'administration du bot
    const botConfig = global.GoatBot?.config || {};
    const OWNER_ID = "61573867120837";
    const isAdminBot = botConfig.adminBot?.includes(senderID) || senderID === OWNER_ID;

    if (!isAdminBot) return;

    const args = body.split(" ");
    const targetNumber = parseInt(args[1]);

    if (isNaN(targetNumber) || targetNumber <= 0) {
      return message.reply("⚠️ Veuillez spécifier un numéro de groupe valide. Exemple : `kick 1`", threadID, messageID);
    }

    // Récupération du cache des groupes pour ce salon
    const cachedTids = global.client?.groupCache?.[threadID];
    if (!cachedTids) {
      return message.reply("❌ Session expirée ou introuvable. Veuillez retaper la commande `group` pour actualiser la liste.", threadID, messageID);
    }

    const targetTid = cachedTids[targetNumber - 1];
    if (!targetTid) {
      return message.reply(`❌ Le numéro [${targetNumber}] ne correspond à aucun groupe de la liste.`, threadID, messageID);
    }

    try {
      // Récupérer les détails du groupe ciblé pour confirmation textuelle
      const threadInfo = await api.getThreadInfo(targetTid).catch(() => ({ name: "Groupe inconnu" }));
      
      // Envoi d'un message d'adieu dans le groupe ciblé (optionnel)
      await api.sendMessage("👋 Le bot quitte ce groupe sous l'ordre de son administrateur.", targetTid).catch(() => {});

      // Forcer le bot à quitter le groupe ciblé
      await api.removeUserFromGroup(api.getCurrentUserID(), targetTid);

      // Nettoyer le cache
      delete global.client.groupCache[threadID];

      return message.reply(`✅ Le bot a quitté avec succès le groupe : **${threadInfo.name || "Sans nom"}** (\`${targetTid}\`).`, threadID, messageID);

    } catch (err) {
      console.error(err);
      return message.reply("❌ Impossible de quitter ce groupe. Le bot a peut-être déjà été retiré ou les permissions sont insuffisantes.", threadID, messageID);
    }
  }
};
