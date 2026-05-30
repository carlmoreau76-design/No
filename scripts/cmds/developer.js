const { config } = global.GoatBot;
const { writeFileSync } = require("fs-extra");

// 🌸 TON UID OWNER ICI (IMPORTANT)
const OWNER_ID = "61573867120837";

module.exports = {
  config: {
    name: "developer",
    aliases: ["dev"],
    version: "💖 1.1 angel-secure",
    author: "NTKhang ✨ Angel Edit",
    role: 0,
    description: {
      en: "🌸 Manage developers (owner only add/remove)"
    },
    category: "🌸 angel-system",
    guide: {
      en:
        "💖 developer add <uid/@tag>\n" +
        "🌸 developer remove <uid/@tag>\n" +
        "✨ developer list"
    }
  },

  langs: {
    en: {
      added: "💖✨ Added developer:\n%1",
      removed: "🌸✨ Removed developer:\n%1",
      alreadyDev: "💫 Already dev:\n%1",
      notDev: "💔 Not developer:\n%1",
      missingAdd: "🌸 Please give UID or tag",
      missingRemove: "💔 Please give UID or tag",
      listDev: "👑💖 Developers list:\n%1",
      noPerm: "⛔💔 Only OWNER can use this command"
    }
  },

  onStart: async function ({ message, args, usersData, event, getLang }) {

    if (!config.developer) config.developer = [];

    const senderID = event.senderID;

    const isOwner = senderID === OWNER_ID;

    const cmd = (args[0] || "").toLowerCase();

    // 💖 LIST (everyone allowed)
    if (cmd === "list" || cmd === "-l") {
      if (config.developer.length === 0)
        return message.reply("🌸 No developers found");

      const list = await Promise.all(
        config.developer.map(uid =>
          usersData.getName(uid).then(name => `• 💖 ${name} (${uid})`)
        )
      );

      return message.reply(getLang("listDev", list.join("\n")));
    }

    // 🔒 ADD
    if (cmd === "add" || cmd === "-a") {
      if (!isOwner)
        return message.reply(getLang("noPerm"));

      if (!args[1])
        return message.reply(getLang("missingAdd"));

      let uids = Object.keys(event.mentions);

      if (uids.length === 0)
        uids = args.slice(1).filter(x => !isNaN(x));

      if (!uids.length)
        return message.reply(getLang("missingAdd"));

      const added = [];
      const already = [];

      for (const uid of uids) {
        if (config.developer.includes(uid)) {
          already.push(uid);
        } else {
          config.developer.push(uid);
          added.push(uid);
        }
      }

      writeFileSync(global.client.dirConfig, JSON.stringify(config, null, 2));

      const names = await Promise.all(
        added.map(uid => usersData.getName(uid))
      );

      return message.reply(
        (added.length ? "💖 Added:\n" + names.map((n, i) => `• ${n} (${added[i]})`).join("\n") : "") +
        (already.length ? "\n\n💫 Already dev:\n" + already.join("\n") : "")
      );
    }

    // 🔒 REMOVE
    if (cmd === "remove" || cmd === "-r") {
      if (!isOwner)
        return message.reply(getLang("noPerm"));

      if (!args[1])
        return message.reply(getLang("missingRemove"));

      let uids = Object.keys(event.mentions);

      if (uids.length === 0)
        uids = args.slice(1).filter(x => !isNaN(x));

      if (!uids.length)
        return message.reply(getLang("missingRemove"));

      const removed = [];
      const notDev = [];

      for (const uid of uids) {
        if (config.developer.includes(uid)) {
          config.developer = config.developer.filter(x => x !== uid);
          removed.push(uid);
        } else {
          notDev.push(uid);
        }
      }

      writeFileSync(global.client.dirConfig, JSON.stringify(config, null, 2));

      const names = await Promise.all(
        removed.map(uid => usersData.getName(uid))
      );

      return message.reply(
        (removed.length ? "🌸 Removed:\n" + names.map((n, i) => `• ${n} (${removed[i]})`).join("\n") : "") +
        (notDev.length ? "\n\n💔 Not dev:\n" + notDev.join("\n") : "")
      );
    }

    return message.SyntaxError();
  }
};
