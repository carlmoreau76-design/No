const moment = require("moment-timezone");

const OWNER_ID = "61573867120837";

module.exports = {
  config: {
    name: "accept",
    aliases: ["acp"],
    version: "3.1 angel stable fix",
    author: "Shade ✨ Fix",
    role: 2,
    description: "🌸 Gestion des demandes d’amis Facebook",
    category: "owner",
    guide: {
      en: "{pn} add <num> | del <num> | add all | del all"
    }
  },

  onReply: async function ({ message, Reply, event, api }) {
    try {

      const { author, listRequest, messageID } = Reply || {};

      if (event.senderID !== OWNER_ID) {
        return api.sendMessage("🌸⛔ Owner only", event.threadID);
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

        const n = parseInt(num);
        if (!n || n < 1 || n > listRequest.length) {
          failed.push(`❌ #${num} invalide`);
          continue;
        }

        const user = listRequest[n - 1];

        if (!user?.node?.id) {
          failed.push(`❌ #${num} introuvable`);
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

          console.log("FB RESPONSE:", res);

          const lower = String(res).toLowerCase();

          const ok =
            !lower.includes("error") &&
            !lower.includes("fail");

          if (ok) {
            success.push(`✨ ${isAdd ? "Accepté" : "Refusé"} → ${user.node.name}`);
          } else {
            failed.push(`❌ Échec → ${user.node.name}`);
          }

        } catch (e) {
          console.log("ERROR:", e);
          failed.push(`❌ Error → ${user.node.name}`);
        }
      }

      api.setMessageReaction("✅", event.messageID, () => {}, true);

      let msg = "🌸💖 𝗔𝗡𝗚𝗘𝗟 𝗔𝗖𝗖𝗘𝗣𝗧 💖🌸\n\n";

      if (success.length) msg += success.join("\n") + "\n\n";
      if (failed.length) msg += failed.join("\n");

      return api.sendMessage(
        msg || "❌ Rien traité 💔",
        event.threadID,
        messageID
      );

    } catch (e) {
      console.log("GLOBAL ERROR:", e);
      api.setMessageReaction("❌", event.messageID, () => {}, true);
      return api.sendMessage("❌ Erreur système 💔", event.threadID);
    }
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

      let data = {};
      try {
        data = typeof response === "string"
          ? JSON.parse(response)
          : response;
      } catch {}

      const listRequest =
        data?.data?.viewer?.friending_possibilities?.edges || [];

      if (!listRequest.length) {
        api.setMessageReaction("💔", event.messageID, () => {}, true);
        return api.sendMessage("🌸 Aucune demande 💖", event.threadID);
      }

      let msg =
        "╔═══ 💖 𝗔𝗡𝗚𝗘𝗟 𝗥𝗘𝗤𝗨𝗘𝗦𝗧𝗦 💖 ═══╗\n\n";

      listRequest.forEach((u, i) => {
        msg += `💠 ${i + 1}. ${u.node.name}\n`;
        msg += `🆔 ${u.node.id}\n`;
        msg += `🔗 https://www.facebook.com/${u.node.id}\n`;
        msg += "━━━━━━━━━━━━━━━\n";
      });

      msg += "\n🌸 add <num>\n💔 del <num>\n✨ add all\n❌ del all";

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
      return api.sendMessage("❌ Erreur loading 💔", event.threadID);
    }
  }
};
