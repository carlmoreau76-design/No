const fs = require("fs-extra");
const { utils } = global;

module.exports = {
  config: {
    name: "prefix",
    version: "1.4",
    author: "Shade ✨ Angel Edition",
    countDown: 5,
    role: 0,
    description: "🌸 Change the bot prefix with Angel kawaii style 💖",
    category: "🌸 Angel Config",
    guide: {
      vi: "🌸 {pn} <prefix mới> ✨",
      en: "🌸 {pn} <new prefix> 💖",
      fr: "🌸 {pn} <nouveau préfixe> ✨"
    }
  },

  langs: {
    vi: {
      reset: "🌸 Prefix reset về mặc định: %1",
      onlyAdmin: "👑 Chỉ admin bot mới có quyền 🌸",
      confirmGlobal: "💖 Réagis pour confirmer le changement global 🌸",
      confirmThisThread: "🌸 Réagis pour confirmer dans ce chat 💬",
      successGlobal: "👑 Prefix système changé en: %1 💖",
      successThisThread: "🌸 Prefix du groupe changé en: %1 💬",
      myPrefix: "🌸💖 Hey %1 !\n➥ 🌐 Global: %2\n➥ 💬 Chat: %3\n💖 Je suis %4 à ton service 🌸"
    },

    en: {
      reset: "🌸 Your prefix reset to default: %1",
      onlyAdmin: "👑 Only bot admin can do this 🌸",
      confirmGlobal: "💖 React to confirm global prefix change 🌸",
      confirmThisThread: "🌸 React to confirm this chat prefix 💬",
      successGlobal: "👑 Global prefix changed to: %1 💖",
      successThisThread: "🌸 This chat prefix changed to: %1 💬",
      myPrefix: "🌸💖 Hey %1 !\n➥ 🌐 Global: %2\n➥ 💬 Chat: %3\n💖 I'm %4 at your service 🌸"
    },

    fr: {
      reset: "🌸 Préfixe réinitialisé : %1",
      onlyAdmin: "👑 Seuls les admins bot peuvent changer ça 🌸",
      confirmGlobal: "💖 Réagis pour confirmer changement global 🌸",
      confirmThisThread: "🌸 Réagis pour confirmer dans ce groupe 💬",
      successGlobal: "👑 Préfixe global changé : %1 💖",
      successThisThread: "🌸 Préfixe du groupe changé : %1 💬",
      myPrefix: "🌸💖 Hey %1 !\n➥ 🌐 Global : %2\n➥ 💬 Groupe : %3\n💖 Je suis %4 à ton service 🌸"
    }
  },

  onStart: async function ({ message, role, args, commandName, event, threadsData, getLang }) {
    if (!args[0])
      return message.SyntaxError();

    if (args[0] == "reset") {
      await threadsData.set(event.threadID, null, "data.prefix");
      return message.reply(getLang("reset", global.GoatBot.config.prefix));
    }

    const newPrefix = args[0];

    const formSet = {
      commandName,
      author: event.senderID,
      newPrefix
    };

    if (args[1] === "-g") {
      if (role < 2)
        return message.reply(getLang("onlyAdmin"));
      formSet.setGlobal = true;
    } else {
      formSet.setGlobal = false;
    }

    return message.reply(
      args[1] === "-g"
        ? "💖🌸 Confirme le changement global en réagissant ✨"
        : "🌸💬 Confirme le changement dans ce chat en réagissant 💖",
      (err, info) => {
        formSet.messageID = info.messageID;
        global.GoatBot.onReaction.set(info.messageID, formSet);
      }
    );
  },

  onReaction: async function ({ message, threadsData, event, Reaction, getLang }) {
    const { author, newPrefix, setGlobal } = Reaction;

    if (event.userID !== author) return;

    if (setGlobal) {
      global.GoatBot.config.prefix = newPrefix;
      fs.writeFileSync(global.client.dirConfig, JSON.stringify(global.GoatBot.config, null, 2));
      return message.reply(`👑🌸 Prefix global changé en : ${newPrefix} 💖`);
    } else {
      await threadsData.set(event.threadID, newPrefix, "data.prefix");
      return message.reply(`🌸💬 Prefix du chat changé en : ${newPrefix} 💖`);
    }
  },

  onChat: async function ({ event, message, usersData }) {
    if (event.body && event.body.toLowerCase() === "prefix") {
      const userName = await usersData.getName(event.senderID);
      const botName = global.GoatBot.config.nickNameBot || "Angel Bot";

      return message.reply(
        `🌸💖 Hey ${userName} !\n` +
        `➥ 🌐 Global: ${global.GoatBot.config.prefix}\n` +
        `➥ 💬 Chat: ${utils.getPrefix(event.threadID)}\n` +
        `💖 Je suis ${botName} à ton service 🌸`
      );
    }
  }
};
