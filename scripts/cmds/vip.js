const { writeFileSync } = require("fs-extra");

// 🌸 TON ID OWNER
const OWNER_ID = "61573867120837";

module.exports = {
  config: {
    name: "vip",
    version: "angel-stable",
    author: "Angel ✨",
    countDown: 5,
    role: 0,
    description: {
      fr: "💎 Système VIP sécurisé (owner only)"
    },
    category: "💖 angel admin"
  },

  onStart: async function ({ message, args, event }) {
    try {
      const config = global.GoatBot.config;
      config.vipuser = config.vipuser || [];

      // 🔒 OWNER LOCK
      if (event.senderID !== OWNER_ID) {
        return message.reply("🌸💔 Accès refusé… seul l’Angel Owner peut utiliser ça 💎");
      }

      const action = args[0];

      switch (action) {

        // ➕ ADD VIP
        case "add":
        case "-a": {
          let uids = Object.keys(event.mentions || {}).length
            ? Object.keys(event.mentions)
            : event.messageReply
              ? [event.messageReply.senderID]
              : args.slice(1).filter(id => /^\d+$/.test(id));

          if (!uids.length)
            return message.reply("⚠️ Mentionne ou donne un ID.");

          let added = [];
          let already = [];

          for (const id of uids) {
            if (config.vipuser.includes(id)) already.push(id);
            else {
              config.vipuser.push(id);
              added.push(id);
            }
          }

          writeFileSync(global.client.dirConfig, JSON.stringify(config, null, 2));

          return message.reply(
`💎🌸 ANGEL VIP 🌸💎

✨ Ajoutés : ${added.length}
⚠️ Déjà VIP : ${already.length}`
          );
        }

        // ➖ REMOVE VIP
        case "remove":
        case "-r": {
          let uids = Object.keys(event.mentions || {}).length
            ? Object.keys(event.mentions)
            : args.slice(1).filter(id => /^\d+$/.test(id));

          if (!uids.length)
            return message.reply("⚠️ Mentionne ou donne un ID.");

          let removed = [];

          config.vipuser = config.vipuser.filter(id => {
            if (uids.includes(id)) {
              removed.push(id);
              return false;
            }
            return true;
          });

          writeFileSync(global.client.dirConfig, JSON.stringify(config, null, 2));

          return message.reply(
`💔🌸 ANGEL VIP 🌸💔

✨ Retirés : ${removed.length}`
          );
        }

        // 📋 LIST
        case "list":
        case "-l": {
          if (!config.vipuser.length)
            return message.reply("🌸 Aucun VIP pour le moment…");

          return message.reply(
`💎 ANGEL VIP LIST 💎

${config.vipuser.map((id, i) => `${i + 1}. ${id}`).join("\n")}`
          );
        }

        // ❓ HELP
        default:
          return message.reply(
`🌸 COMMANDES VIP :

vip add @user / id
vip remove @user / id
vip list`
          );
      }

    } catch (err) {
      console.error("VIP ERROR:", err);
      return message.reply("❌ Erreur VIP system.");
    }
  }
};
