const OWNER_UID = "61573867120837"; // 💖 Ton UID Admin

module.exports = {
  config: {
    name: "join",
    version: "3.2 angel kawaii",
    author: "Christus × Shade 💖",
    countDown: 5,
    role: 2,
    shortDescription: { en: "💖 Join group angel system" },
    category: "owner",
    guide: { en: "join [page|next|prev]" },
  },

  onStart: async function ({ api, event, args }) {
    const { threadID, messageID, senderID } = event;

    try {
      // 💖 SÉCURITÉ UID
      if (senderID !== OWNER_UID) {
        return api.sendMessage(
          "⛔💔 Désolé mon amour… tu n’as pas la permission d’utiliser cette commande 💖✨",
          threadID,
          messageID
        );
      }

      // Récupération de la liste des conversations du bot
      const groupList = await api.getThreadList(400, null, ["INBOX"]);
      const filteredList = groupList.filter(g => g.isGroup && g.isSubscribed);

      if (!filteredList.length) {
        return api.sendMessage("💔✨ Aucun groupe trouvé…", threadID, messageID);
      }

      const pageSize = 10; // Réduit à 10 pour une meilleure lisibilité sur mobile
      const totalPages = Math.ceil(filteredList.length / pageSize);

      if (!global.joinPage) global.joinPage = {};
      
      let page = 1;
      if (args[0]) {
        const input = args[0].toLowerCase();
        if (input === "next") page = (global.joinPage[threadID] || 1) + 1;
        else if (input === "prev") page = (global.joinPage[threadID] || 1) - 1;
        else if (input.includes("/")) page = parseInt(input.split("/")[0]) || 1;
        else page = parseInt(input) || 1;
      }

      if (page < 1) page = 1;
      if (page > totalPages) page = totalPages;

      global.joinPage[threadID] = page;

      const startIndex = (page - 1) * pageSize;
      const currentGroups = filteredList.slice(startIndex, startIndex + pageSize);

      // Création de la liste
      const formatted = currentGroups.map((g, i) => {
        const globalIndex = startIndex + i + 1;
        return `💖 ${globalIndex}. 『${g.threadName || "🌸 Groupe sans nom"}』\n👥 Membres: ${g.participantIDs?.length || 0}\n🆔 ${g.threadID}\n`;
      });

      const message = [
        "╭─────────────💖",
        "│ 🌸 ANGEL GROUP JOIN",
        "│──────────────────",
        formatted.join("\n"),
        "│──────────────────",
        `│ 📄 Page ${page}/${totalPages} 💖`,
        "│ 🌸 Réponds avec le numéro global pour rejoindre",
        "╰─────────────💖"
      ].join("\n");

      const sentMessage = await api.sendMessage(message, threadID, messageID);

      // Configuration native de la fonction onReply de GoatBot
      global.GoatBot?.onReply?.set(sentMessage.messageID, {
        commandName: "join",
        messageID: sentMessage.messageID,
        author: senderID,
        list: filteredList
      });

    } catch (e) {
      console.error(e);
      api.sendMessage("💔✨ Erreur de chargement de la liste…", threadID, messageID);
    }
  },

  onReply: async function ({ api, event, Reply }) {
    const { threadID, messageID, senderID, body } = event;
    const { author, list } = Reply;

    // Sécurité stricte sur l'auteur de la commande
    if (senderID !== OWNER_UID || senderID !== author) return;

    const chosenIndex = parseInt(body.trim(), 10);
    
    if (isNaN(chosenIndex) || chosenIndex < 1 || chosenIndex > list.length) {
      return api.sendMessage("💔✨ Numéro invalide ou hors limites…", threadID, messageID);
    }

    // Récupération ciblée dans la liste globale complète pour éviter le bug de page
    const selectedGroup = list[chosenIndex - 1];

    try {
      api.sendMessage(`⏳ Tentative d'accès à 『${selectedGroup.threadName || "Ce groupe"}』...`, threadID, messageID);

      // Méthode 1 : Ajout direct classique
      await api.addUserToGroup(senderID, selectedGroup.threadID);
      
      return api.sendMessage(
        `💖✨ Succès ! Tu as été ajouté directement à 『${selectedGroup.threadName || "Groupe"}』 🌸`,
        threadID,
        messageID
      );

    } catch (directError) {
      console.log("L'ajout direct a échoué, tentative via lien d'invitation...");

      // Méthode 2 de secours : Création et envoi d'un lien d'intégration
      try {
        // Demande au framework de récupérer ou créer le lien de groupe
        const groupData = await api.getThreadInfo(selectedGroup.threadID);
        
        // Si le mode d'approbation est actif ou si le lien est disponible
        if (groupData && groupData.approvalMode === false || groupData.approvalMode === true) {
          
          // Format standard d'un lien d'invitation Facebook de groupe Messenger
          const inviteLink = `https://m.me/j/${selectedGroup.threadID}/`;
          
          return api.sendMessage(
            `⚠️ L'ajout direct est bloqué par Facebook.\n\n🔗 **Voici ton lien d'accès magique :**\n${inviteLink}\n\n🌸 Clique dessus pour rejoindre le groupe de ton choix !`,
            threadID,
            messageID
          );
        }
      } catch (linkError) {
        console.error(linkError);
      }

      return api.sendMessage(
        `💔✨ Impossible de t'ajouter à 『${selectedGroup.threadName}』.\n\n💡 _Raison : Le bot n'est pas Administrateur de ce groupe ou tes paramètres de confidentialité Facebook rejettent les invitations de bots._`,
        threadID,
        messageID
      );
    }
  }
};
