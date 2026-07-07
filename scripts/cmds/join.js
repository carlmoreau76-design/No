module.exports = {
  config: {
    name: "join",
    version: "4.0.0",
    author: "Christus × Shade × Gemini",
    countDown: 5,
    role: 2, // 🛡️ Accès restreint nativement aux Admins/Owners du bot
    description: "🪐 Rejoindre l'un des groupes où le bot est présent",
    category: "utility",
    guide: {
      en: "{p}{n} [page | next | prev]"
    }
  },

  onStart: async function ({ api, event, args, message }) {
    const { threadID, messageID, senderID } = event;

    try {
      // Récupération de la liste des conversations du bot
      const groupList = await api.getThreadList(400, null, ["INBOX"]);
      const filteredList = groupList.filter(g => g.isGroup && g.isSubscribed);

      if (!filteredList.length) {
        return message.reply("❌ Aucun groupe trouvé dans la base de données du bot.");
      }

      const pageSize = 10; 
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

      // Construction de la liste formatée (Style épuré)
      const formatted = currentGroups.map((g, i) => {
        const globalIndex = startIndex + i + 1;
        return `│ [${globalIndex}] ${g.threadName || "Groupe sans nom"}\n│ 👥 Membres : ${g.participantIDs?.length || 0}\n│ 🆔 ${g.threadID}\n│`;
      });

      let msg = `╭─ 🪐 𝗛𝗢𝗥𝗜 𝗦𝗬𝗦𝗧𝗘𝗠 - 𝗚𝗥𝗢𝗨𝗣 𝗟𝗜𝗦𝗧 ─╮\n`;
      msg += formatted.join("\n");
      msg += `\n├─────────────────────────────────────────┤\n`;
      msg += `│ 📄 Page : ${page}/${totalPages}\n`;
      msg += `│ 💡 Répondez avec le numéro pour intégrer le groupe\n`;
      msg += `╰─────────────────────────────────────────╯`;

      const sentMessage = await api.sendMessage(msg, threadID, messageID);

      // Configuration du gestionnaire de réponse (onReply)
      global.GoatBot?.onReply?.set(sentMessage.messageID, {
        commandName: this.config.name,
        messageID: sentMessage.messageID,
        author: senderID,
        list: filteredList
      });

    } catch (e) {
      console.error(e);
      return message.reply("❌ Erreur lors du chargement de la liste des serveurs.");
    }
  },

  onReply: async function ({ api, event, Reply, message }) {
    const { threadID, messageID, senderID, body } = event;
    const { author, list } = Reply;

    // Vérification de sécurité sur l'auteur initial du menu
    if (senderID !== author) return;

    const chosenIndex = parseInt(body.trim(), 10);
        
    if (isNaN(chosenIndex) || chosenIndex < 1 || chosenIndex > list.length) {
      return message.reply("❌ Index invalide ou hors limites.");
    }

    const selectedGroup = list[chosenIndex - 1];

    try {
      await message.reply(`⏳ Tentative d'intégration à : "${selectedGroup.threadName || "Ce groupe"}"...`);
      
      // Méthode 1 : Ajout direct
      await api.addUserToGroup(senderID, selectedGroup.threadID);
            
      return api.sendMessage(
        `✓ Intégration réussie ! Vous avez été ajouté au groupe "${selectedGroup.threadName || "Groupe"}".`,
        threadID,
        messageID
      );
    } catch (directError) {
      console.log("L'ajout direct a échoué, génération d'une alternative...");

      // Méthode 2 : Lien de secours
      try {
        const groupData = await api.getThreadInfo(selectedGroup.threadID);
                
        if (groupData) {
          const inviteLink = `https://m.me/j/${selectedGroup.threadID}/`;
                    
          return api.sendMessage(
            `⚠️ L'ajout direct est restreint par les règles de confidentialité Facebook.\n\n🔗 Passerelle alternative :\n${inviteLink}\n\nCliquez sur le lien ci-dessus pour rejoindre manuellement.`,
            threadID,
            messageID
          );
        }
      } catch (linkError) {
        console.error(linkError);
      }

      return api.sendMessage(
        `❌ Opération avortée.\n\nLe bot n'a pas pu configurer d'accès pour "${selectedGroup.threadName}". Assurez-vous que le bot dispose des droits d'administration ou modifiez vos options de confidentialité Facebook.`,
        threadID,
        messageID
      );
    }
  }
};
