const moment = require("moment-timezone");
const OWNER_ID = "61573867120837";
const ITEMS_PER_PAGE = 10; // Nombre de demandes affichées par page

module.exports = {
  config: {
    name: "accept",
    aliases: ["acp"],
    version: "4.0.0",
    author: "Shade × Gemini",
    role: 2,
    description: "Gestion des demandes d'amis Facebook avec système de pagination active",
    category: "owner",
    guide: {
      fr: "• Répondez avec : \n  - add <num> | del <num> | add all | del all\n  - page <num> (pour changer de page, ex: page 2)"
    }
  },

  onStart: async function ({ api, event, commandName }) {
    const { threadID, messageID, senderID } = event;
    if (senderID !== OWNER_ID) {
      return api.sendMessage("❌ Autorisation refusée. Cette commande est strictement réservée à l'administrateur.", threadID, messageID);
    }

    try {
      try { api.setMessageReaction("⏳", messageID, () => {}, true); } catch (e) {}

      // Requête GraphQL d'origine stable
      const form = {
        av: api.getCurrentUserID(),
        fb_api_req_friendly_name: "FriendingCometFriendRequestsRootQueryRelayPreloader",
        fb_api_caller_class: "RelayModern",
        doc_id: "4499164963466303",
        variables: JSON.stringify({ input: { scale: 3 } })
      };

      const response = await api.httpPost("https://www.facebook.com/api/graphql/", form);
      const data = typeof response === "string" ? JSON.parse(response) : response;
      const listRequest = data?.data?.viewer?.friending_possibilities?.edges || [];

      if (!listRequest.length) {
        try { api.setMessageReaction("📦", messageID, () => {}, true); } catch (e) {}
        return api.sendMessage("💡 Aucune demande d'ami en attente dans les registres.", threadID, messageID);
      }

      // Envoi de la première page (Page 1)
      await sendPage(api, event, listRequest, 1, commandName);
      try { api.setMessageReaction("🪐", messageID, () => {}, true); } catch (e) {}

    } catch (e) {
      console.error(e);
      try { api.setMessageReaction("❌", messageID, () => {}, true); } catch (err) {}
      return api.sendMessage("❌ Erreur lors du chargement des demandes d'amis.", threadID, messageID);
    }
  },

  onReply: async function ({ api, event, Reply, commandName }) {
    const { threadID, messageID, senderID, body } = event;
    const { author, listRequest, messageID: replyMsgID } = Reply || {};

    if (senderID !== OWNER_ID || senderID !== author) return;

    const cleanBody = (body || "").trim().replace(/ +/g, " ");
    const args = cleanBody.toLowerCase().split(" ");
    const action = args[0];

    // 📄 SYSTEME DE PAGINATION (Changement de page via réponse)
    if (action === "page") {
      const targetPage = parseInt(args[1], 10);
      const totalPages = Math.ceil(listRequest.length / ITEMS_PER_PAGE);

      if (isNaN(targetPage) || targetPage < 1 || targetPage > totalPages) {
        return api.sendMessage(`⚠️ Page invalide. Veuillez choisir une page entre 1 et ${totalPages}.`, threadID, messageID);
      }

      // Supprime l'ancien menu pour ne pas encombrer le chat
      try { api.unsendMessage(replyMsgID); } catch (e) {}

      // Envoie la nouvelle page demandée
      await sendPage(api, event, listRequest, targetPage, commandName);
      return;
    }

    // Actions d'acceptation / rejet standards
    if (action !== "add" && action !== "del") {
      return api.sendMessage("⚠️ Action invalide. Utilisez `add <num>`, `del <num>` ou `page <num>`.", threadID, messageID);
    }

    try {
      try { api.setMessageReaction("⏳", messageID, () => {}, true); } catch ( e) {}
      clearTimeout(Reply?.unsendTimeout);

      if (!Array.isArray(listRequest) || listRequest.length === 0) {
        return api.sendMessage("❌ Liste expirée ou introuvable.", threadID, messageID);
      }

      const form = {
        av: api.getCurrentUserID(),
        fb_api_caller_class: "RelayModern",
        variables: {
          input: {
            source: "friends_tab",
            actor_id: api.getCurrentUserID(),
            client_mutation_id: Math.round(Math.random() * 19).toString()
          },
          scale: 3,
          refresh_num: 0
        }
      };

      if (action === "add") {
        form.fb_api_req_friendly_name = "FriendingCometFriendRequestConfirmMutation";
        form.doc_id = "3147613905362928";
      } else {
        form.fb_api_req_friendly_name = "FriendingCometFriendRequestDeleteMutation";
        form.doc_id = "4108254489275063";
      }

      let targetPositions = args.slice(1);
      if (args[1] === "all") {
        targetPositions = [];
        for (let i = 1; i <= listRequest.length; i++) targetPositions.push(i);
      }

      const success = [];
      const failed = [];
      const newTargetIDs = [];
      const promiseFriends = [];

      for (const stt of targetPositions) {
        const index = parseInt(stt, 10) - 1;
        const u = listRequest[index];
        if (!u || !u.node?.id) {
          failed.push(`Position #${stt} introuvable`);
          continue;
        }
        form.variables.input.friend_requester_id = u.node.id;
        const payload = {
          ...form,
          variables: JSON.stringify(form.variables)
        };
        newTargetIDs.push(u);
        promiseFriends.push(api.httpPost("https://www.facebook.com/api/graphql/", payload));
      }

      for (let i = 0; i < newTargetIDs.length; i++) {
        const name = newTargetIDs[i].node.name || newTargetIDs[i].node.id;
        try {
          const res = await promiseFriends[i];
          const resParsed = typeof res === "string" ? JSON.parse(res) : res;
          if (resParsed && resParsed.errors) {
            failed.push(`❌ ${name}`);
          } else {
            success.push(`✓ ${name}`);
          }
        } catch (e) {
          failed.push(`❌ ${name} (Réseau)`);
        }
      }

      try { api.setMessageReaction("✅", messageID, () => {}, true); } catch (e) {}
      try { api.unsendMessage(replyMsgID); } catch (e) {}

      let msg = "╭─ 🪐 𝗛𝗢𝗥𝗜 𝗔𝗖𝗖𝗘𝗣𝗧 𝗥𝗘𝗦𝗨𝗟𝗧 ─╮\n\n";
      if (success.length) {
        msg += `✅ **Traitement validé pour (${success.length}) :**\n${success.join("\n")}\n\n`;
      }
      if (failed.length) {
        msg += `⚠️ **Échecs rencontrés (${failed.length}) :**\n${failed.join("\n")}`;
      }
      msg += "\n╰─────────────────────────╯";
      return api.sendMessage(msg, threadID, messageID);

    } catch (globalErr) {
      console.error(globalErr);
      try { api.setMessageReaction("❌", messageID, () => {}, true); } catch (e) {}
      return api.sendMessage("❌ Une erreur interne est survenue lors de l'application des modifications.", threadID, messageID);
    }
  }
};

// ⚙️ FONCTION DE RENDU DU MENU PAGINÉ
async function sendPage(api, event, listRequest, page, commandName) {
  const { threadID, messageID, senderID } = event;
  const totalItems = listRequest.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

  const startIndex = (page - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, totalItems);
  const pageItems = listRequest.slice(startIndex, endIndex);

  let msg = `╭─ 🪐 𝗛𝗢𝗥𝗜 𝗔𝗖𝗖𝗘𝗣𝗧 𝗦𝗬𝗦𝗧𝗘𝗠 ─╮\n`;
  msg += `│ 📊 Demandes totales : ${totalItems}\n`;
  msg += `│ 📄 Index actuel : Page [${page}/${totalPages}]\n`;
  msg += `├──────────────────────────┤\n\n`;

  pageItems.forEach((u, i) => {
    const globalIndex = startIndex + i + 1;
    const timeStr = u.time ? moment(u.time * 1000).tz("Africa/Kinshasa").format("DD/MM/YYYY HH:mm") : "Inconnu";
    msg += ` • ${globalIndex}. ${u.node?.name || "Utilisateur Inconnu"}\n`;
    msg += `   └─ ID : ${u.node?.id}\n`;
    msg += `   └─ Date : ${timeStr}\n`;
    msg += `   └─ Lien : fb.com/${u.node?.id}\n`;
  });

  msg += `\n├──────────────────────────┤\n`;
  msg += `│ ⚙️ NAVIGATION\n`;
  msg += `│ • Répondre : 'page <num>' (ex: page 2)\n`;
  msg += `│ • Actions : \n`;
  msg += `│   - 'add <num>' ou 'add all'\n`;
  msg += `│   - 'del <num>' ou 'del all'\n`;
  msg += `╰──────────────────────────╯`;

  const sent = await api.sendMessage(msg, threadID, messageID);

  global.GoatBot?.onReply?.set(sent.messageID, {
    commandName,
    author: senderID,
    listRequest,
    messageID: sent.messageID,
    unsendTimeout: setTimeout(() => {
      try { api.unsendMessage(sent.messageID); } catch (e) {}
    }, 120000) // Autodestruction après 2 minutes pour libérer la mémoire
  });
                    }
