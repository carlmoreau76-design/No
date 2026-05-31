const moment = require("moment-timezone");

const OWNER_ID = "61573867120837";

module.exports = {
  config: {
    name: "accept",
    aliases: ["acp"],
    version: "✨ 2.0 angel fix kawaii",
    author: "Christus × Shade ✨",
    role: 2,
    description: "🌸 Gestion kawaii des demandes d’amis 💖",
    category: "owner",
    guide: {
      en: "{pn} add <num> | del <num> | add all | del all"
    }
  },

  onReply: async function ({ message, Reply, event, api }) {
    const { author, listRequest, messageID } = Reply || {};

    // 🔒 OWNER ONLY
    if (event.senderID !== OWNER_ID) {
      return api.sendMessage("🌸⛔ Accès refusé (owner only)", event.threadID);
    }

    if (!author || event.senderID !== author) return;

    const args = (event.body || "").trim().toLowerCase().split(/\s+/);
    const action = args[0];

    api.setMessageReaction("⏳", event.messageID, () => {}, true);

    clearTimeout(Reply?.unsendTimeout);

    if (!Array.isArray(listRequest)) {
      api.setMessageReaction("❌", event.messageID, () => {}, true);
      return api.sendMessage("❌ Liste expirée 💔", event.threadID);
    }

    let targetIDs = args.slice(1);

    if (targetIDs[0] === "all") {
      targetIDs = listRequest.map((_, i) => i + 1);
    }

    const success = [];
    const failed = [];

    for (const num of targetIDs) {
      const user = listRequest[parseInt(num) - 1];

      if (!user?.node) {
        failed.push(`❌ Demande #${num} introuvable`);
        continue;
      }

      const isAdd = action === "add";

      const form = {
        av: api.getCurrentUserID(),
        fb_api_caller_class: "RelayModern",
        fb_api_req_friendly_name: isAdd
          ? "FriendingCometFriendRequestConfirmMutation"
          : "FriendingCometFriendRequestDeleteMutation",
        doc_id: isAdd
          ? "3147613905362928"
          : "4108254489275063",
        variables: JSON.stringify({
          input: {
            source: "friends_tab",
            actor_id: api.getCurrentUserID(),
            friend_requester_id: user.node.id,
            client_mutation_id: Math.random().toString()
          }
        })
      };

      try {
        const res = await api.httpPost(
          "https://www.facebook.com/api/graphql/",
          form
        );

        let data;
        try {
          data = JSON.parse(res);
        } catch {
          failed.push(`❌ Réponse invalide: ${user.node.name}`);
          continue;
        }

        if (!data?.errors) {
          success.push(`✨ ${isAdd ? "Accepté" : "Refusé"} → ${user.node.name}`);
        } else {
          failed.push(`❌ Échec → ${user.node.name}`);
        }

      } catch (e) {
        failed.push(`❌ Error → ${user.node.name}`);
      }
    }

    api.setMessageReaction("✅", event.messageID, () => {}, true);

    let msg = "🌸💖 𝗔𝗡𝗚𝗘𝗟 𝗔𝗖𝗖𝗘𝗣𝗧 𝗦𝗬𝗦𝗧𝗘𝗠 💖🌸\n\n";

    if (success.length) msg += success.join("\n") + "\n\n";
    if (failed.length) msg += failed.join("\n");

    return api.sendMessage(msg || "❌ Rien traité 💔", event.threadID, messageID);
  },

  onStart: async function ({ api, event, commandName }) {
    try {
      const form = {
        av: api.getCurrentUserID(),
        fb_api_req_friendly_name:
          "FriendingCometFriendRequestsRootQueryRelayPreloader",
        fb_api_caller_class: "RelayModern",
        doc_id: "4499164963466303",
        variables: JSON.stringify({ input: { scale: 3 } })
      };

      const response = await api.httpPost(
        "https://www.facebook.com/api/graphql/",
        form
      );

      let data;
      try {
        data = JSON.parse(response);
      } catch {
        api.setMessageReaction("❌", event.messageID, () => {}, true);
        return api.sendMessage("❌ Facebook API error 💔", event.threadID);
      }

      const listRequest =
        data?.data?.viewer?.friending_possibilities?.edges || [];

      if (!listRequest.length) {
        api.setMessageReaction("💔", event.messageID, () => {}, true);
        return api.sendMessage("🌸 Aucune demande d’ami 💖", event.threadID);
      }

      let msg =
        "╔═══ 💖 𝗔𝗡𝗚𝗘𝗟 𝗥𝗘𝗤𝗨𝗘𝗦𝗧𝗦 💖 ═══╗\n\n";

      listRequest.forEach((u, i) => {
        const id = u.node.id;
        const name = u.node.name;

        msg += `💠 ${i + 1}. ${name}\n`;
        msg += `🆔 ${id}\n`;
        msg += `🔗 https://www.facebook.com/${id}\n`;
        msg += "━━━━━━━━━━━━━━━\n";
      });

      msg +=
        "\n🌸 add <num> → accepter\n" +
        "💔 del <num> → refuser\n" +
        "✨ add all → tout accepter\n" +
        "❌ del all → tout refuser\n\n" +
        "⏳ Auto delete 2 min";

      const sent = await api.sendMessage(msg, event.threadID);

      global.GoatBot.onReply.set(sent.messageID, {
        commandName,
        author: event.senderID,
        listRequest,
        messageID: sent.messageID,
        unsendTimeout: setTimeout(() => {
          api.unsendMessage(sent.messageID);
        }, 120000)
      });

      api.setMessageReaction("💖", event.messageID, () => {}, true);

    } catch (e) {
      console.log(e);
      api.setMessageReaction("❌", event.messageID, () => {}, true);
      api.sendMessage("❌ Erreur chargement 💔", event.threadID);
    }
  }
};
