const { config } = global.GoatBot;
const { writeFileSync } = require("fs-extra");

const OWNER_ID = "61573867120837";

module.exports = {
  config: {
    name: "admin",
    version: "2.1",
    author: "Christus x Shade (Angel Edit)",
    role: 0,
    description: "👼 Angel Admin System (Owner only)",
    category: "admin",
    guide: {
      fr: "admin add / remove / list"
    }
  },

  langs: {
    fr: {
      noPermission: "🌸 ✦ ACCÈS REFUSÉ ✦\n👼 Tu n’es pas le créateur Angel",
      missing: "💫 Donne un utilisateur valide",
      added: "👑 ✧ ADMIN AJOUTÉ(S) ✧\n%1",
      removed: "💔 ✧ ADMIN RETIRÉ(S) ✧\n%1",
      listTitle: "👑 ✧ ANGEL ADMINS LIST ✧\n\n%1"
    }
  },

  onStart: async function ({ message, args, event, getLang }) {

    // 🔐 OWNER ONLY
    if (event.senderID !== OWNER_ID)
      return message.reply(getLang("noPermission"));

    const type = args[0];

    // 💖 GET USERS (mention / reply / uid)
    const getUids = () => {
      let uids = [];

      if (Object.keys(event.mentions).length > 0)
        uids = Object.keys(event.mentions);

      else if (event.messageReply)
        uids = [event.messageReply.senderID];

      else
        uids = args.slice(1).filter(x => !isNaN(x));

      return uids;
    };

    // 💖 ADD ADMIN
    if (type === "add") {
      const uids = getUids();
      if (!uids.length) return message.reply(getLang("missing"));

      let added = [];

      for (const uid of uids) {
        if (!config.adminBot.includes(uid)) {
          config.adminBot.push(uid);
          added.push(uid);
        }
      }

      writeFileSync(global.client.dirConfig, JSON.stringify(config, null, 2));

      return message.reply(
        "👼💖 ANGEL SYSTEM\n\n" +
        getLang("added", added.map(u => `✧ ${u}`).join("\n"))
      );
    }

    // 💔 REMOVE ADMIN
    if (type === "remove") {
      const uids = getUids();
      if (!uids.length) return message.reply(getLang("missing"));

      let removed = [];

      for (const uid of uids) {
        const index = config.adminBot.indexOf(uid);
        if (index !== -1) {
          config.adminBot.splice(index, 1);
          removed.push(uid);
        }
      }

      writeFileSync(global.client.dirConfig, JSON.stringify(config, null, 2));

      return message.reply(
        "💔👼 ANGEL SYSTEM\n\n" +
        getLang("removed", removed.map(u => `✧ ${u}`).join("\n"))
      );
    }

    // 🌸 LIST (NO OWNER ID DISPLAY)
    if (type === "list") {
      const list = config.adminBot
        .filter(id => id !== OWNER_ID)
        .map((u, i) => `💎 ${i + 1}. ${u}`)
        .join("\n");

      return message.reply(
        getLang("listTitle", list || "Aucun admin")
      );
    }

    return message.reply("🌸 Utilise: add / remove / list");
  }
};
