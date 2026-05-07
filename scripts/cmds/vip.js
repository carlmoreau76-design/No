const { config } = global.GoatBot;
const { writeFileSync } = require("fs-extra");

// 🌸 TON ID OWNER
const OWNER_ID = "61573867120837";

module.exports = {
  config: {
    name: "vip",
    version: "angel-locked",
    author: "Angel ✨",
    countDown: 5,
    role: 0,
    description: {
      fr: "💎 Système VIP sécurisé (owner only)"
    },
    category: "💖 angel admin"
  },

  onStart: async function ({ message, args, event }) {

    // 🔒 LOCK TOTAL
    if (event.senderID !== OWNER_ID) {
      return message.reply("🌸💔 Accès refusé… seul l’Angel Owner peut utiliser ça 💎");
    }

    if (!config.vipuser) config.vipuser = [];

    switch (args[0]) {

      case "add":
      case "-a": {
        let uids = Object.keys(event.mentions).length
          ? Object.keys(event.mentions)
          : event.messageReply
            ? [event.messageReply.senderID]
            : args.slice(1);

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

      case "remove":
      case "-r": {
        let uids = Object.keys(event.mentions).length
          ? Object.keys(event.mentions)
          : args.slice(1);

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

      case "list":
      case "-l": {
        if (!config.vipuser.length)
          return message.reply("🌸 Aucun VIP pour le moment…");

        return message.reply(
`💎 ANGEL VIP LIST 💎

• ${config.vipuser.join("\n• ")}`
        );
      }

      default:
        return message.reply(
`🌸 COMMANDES VIP :

vip add @user
vip remove @user
vip list`
        );
    }
  }
};
