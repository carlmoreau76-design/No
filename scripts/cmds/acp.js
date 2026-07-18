const moment = require("moment-timezone");
const OWNER_ID = "61573867120837";

module.exports = {
  config: {
    name: "accept",
    aliases: ["acp"],
    version: "3.5 angel fixed",
    author: "Shade × Gemini ✨",
    role: 2,
    description: "🌸 Gestion des demandes d’amis Facebook (Payload Stable)",
    category: "owner",
    guide: {
      fr: "Répondez avec : add <num> | del <num> | add all | del all"
    }
  },

  onStart: async function ({ api, event, commandName }) {
    const { threadID, messageID, senderID } = event;
    if (senderID !== OWNER_ID) {
      return api.sendMessage("🌸⛔ Cette commande est réservée à mon Owner.", threadID, messageID);
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
        try { api.setMessageReaction("💔", messageID, () => {}, true); } catch (e) {}
        return api.sendMessage("🌸 Aucune demande d'ami en attente 💖", threadID, messageID);
      }

      let msg = "╔═══ 🪐 𝗛𝗢𝗥𝗜 𝗔𝗖𝗖𝗘𝗣𝗧 🪐 ═══╗\n\n";
      listRequest.forEach((u, i) => {
        const timeStr = u.time ? moment(u.time * 1000).tz("Africa/Kinshasa").format("DD/MM/YYYY HH:mm:ss") : "Inconnu";
        msg += `💠 ${i + 1}. ${u.node?.name || "Utilisateur Facebook"}\n`;
        msg += `🆔 ${u.node?.id}\n`;
        msg += `📅 Date : ${timeStr}\n`;
        msg += `🔗 https://www.facebook.com/${u.node?.id}\n`;
        msg += "━━━━━━━━━━━━━━━\n";
      });

      msg += "\n🌸 **Pour interagir, répondez à ce message avec :**\n• `add <num>` (ex: add 1)\n• `del <num>` (ex: del 1)\n• `add all` ou `del all`";
      
      const sent = await api.sendMessage(msg, threadID, messageID);
      
      global.GoatBot?.onReply?.set(sent.messageID, {
        commandName,
        author: senderID,
        listRequest,
        messageID: sent.messageID,
        unsendTimeout: setTimeout(() => {
          try { api.unsendMessage(sent.messageID); } catch (e) {}
        }, 120000) // S'efface automatiquement après 2 minutes
      });

      try { api.setMessageReaction("🪐", messageID, () => {}, true); } catch (e) {}
    } catch (e) {
      console.error(e);
      try { api.setMessageReaction("❌", messageID, () => {}, true); } catch (err) {}
      return api.sendMessage("❌ Erreur lors du chargement des demandes 💔", threadID, messageID);
    }
  },

  onReply: async function ({ api, event, Reply }) {
    const { threadID, messageID, senderID, body } = event;
    const { author, listRequest, messageID: replyMsgID } = Reply || {};
    
    if (senderID !== OWNER_ID || senderID !== author) return;

    const args = (body || "").trim().replace(/ +/g, " ").toLowerCase().split(" ");
    const action = args[0];

    if (action !== "add" && action !== "del") {
      return api.sendMessage("⚠️ Action invalide. Utilisez `add` ou `del`.", threadID, messageID);
    }

    try {
      try { api.setMessageReaction("⏳", messageID, () => {}, true); } catch (e) {}
      clearTimeout(Reply?.unsendTimeout);

      if (!Array.isArray(listRequest) || listRequest.length === 0) {
        return api.sendMessage("❌ Liste expirée ou introuvable 💔", threadID, messageID);
      }

      // Structure des variables calquée sur le modèle fonctionnel
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
        form.doc_id = "3147613905362928"; // Doc ID fonctionnel
      } else {
        form.fb_api_req_friendly_name = "FriendingCometFriendRequestDeleteMutation";
        form.doc_id = "4108254489275063"; // Doc ID fonctionnel
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

      // Préparation et parallélisation des requêtes HTTP
      for (const stt of targetPositions) {
        const index = parseInt(stt, 10) - 1;
        const u = listRequest[index];
        if (!u || !u.node?.id) {
          failed.push(`Pos #${stt} Introuvable`);
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

      // Résolution et analyse des statuts de retour
      for (let i = 0; i < newTargetIDs.length; i++) {
        const name = newTargetIDs[i].node.name || newTargetIDs[i].node.id;
        try {
          const res = await promiseFriends[i];
          const resParsed = typeof res === "string" ? JSON.parse(res) : res;
          if (resParsed && resParsed.errors) {
            failed.push(`❌ ${name}`);
          } else {
            success.push(`✨ ${name}`);
          }
        } catch (e) {
          failed.push(`❌ ${name} (Réseau)`);
        }
      }

      try { api.setMessageReaction("✅", messageID, () => {}, true); } catch (e) {}
      try { api.unsendMessage(replyMsgID); } catch (e) {} // Nettoie le menu d'invitation initial

      let msg = "🪐 𝗛𝗢𝗥𝗜 𝗔𝗖𝗖𝗘𝗣𝗧 𝗥𝗘𝗦𝗨𝗟𝗧 🪐\n\n";
      if (success.length) {
        msg += `✅ **Action réussie pour ${success.length} personne(s) :**\n${success.join("\n")}\n\n`;
      }
      if (failed.length) {
        msg += `⚠️ **Échecs rencontrés (${failed.length}) :**\n${failed.join("\n")}`;
      }
      return api.sendMessage(msg, threadID, messageID);
    } catch (globalErr) {
      console.error(globalErr);
      try { api.setMessageReaction("❌", messageID, () => {}, true); } catch (e) {}
      return api.sendMessage("❌ Une erreur interne est survenue lors du traitement 💔", threadID, messageID);
    }
  }
};
