const fs = require("fs-extra");

const OWNER_ID = "61573867120837"; // 💖 toi seul

module.exports = {
 config: {
  name: "setting",
  version: "angel-1.0",
  author: "Christus ✨ + Angel edit",
  countDown: 5,
  role: 2,
  shortDescription: {
   fr: "🌸 Panneau Angel kawaii du bot"
  },
  longDescription: {
   fr: "🌸 Interface kawaii de contrôle du bot (version angel)"
  },
  category: "admin",
  guide: {
   fr: "Tape la commande pour ouvrir le panneau 🌸"
  }
 },

 langs: {
  fr: {
   panelTitle: "🌸 𝗔𝗡𝗚𝗘𝗟 𝗖𝗢𝗡𝗧𝗥𝗢𝗟 𝗣𝗔𝗡𝗘𝗟 🌸",
   noPerm: "⛔ Tu n’es pas autorisé à utiliser cette commande ✨",
   select: "💌 Réponds avec un numéro"
  }
 },

 onStart: async function ({ message, event, getLang }) {

  // 🔒 sécurité owner
  if (event.senderID !== OWNER_ID)
   return message.reply(getLang("noPerm"));

  const panel = `
╔🌸 𝗔𝗡𝗚𝗘𝗟 𝗖𝗢𝗡𝗧𝗥𝗢𝗟 𝗣𝗔𝗡𝗘𝗟 🌸╗
║
║ ✨ 𝗕𝗼𝘁 𝗠𝗮𝗻𝗮𝗴𝗲𝗺𝗲𝗻𝘁
║
║ 💫 ➊ Prefix du bot
║ 🤖 ➋ Nom du bot
║ 👑 ➌ Admins (OWNER ONLY)
║ 🌐 ➍ Langue
║
║ ⚙️ 𝗦𝘆𝘀𝘁𝗲̀𝗺𝗲
║ 🔁 ➎ Auto restart
║ 🆙 ➏ Update check
║ 🚫 ➐ Users bannis
║ 🚫 ➑ Groups bannis
║
║ 📡 𝗚𝗲𝘀𝘁𝗶𝗼𝗻
║ 📢 ➒ Broadcast
║ 🔍 ➓ Search UID
║ 🧭 ⓫ Search group
║ 🎭 ⓬ Group emoji
║ 📝 ⓭ Group name
║ 📊 ⓮ Group info
║
║ 💖 Réponds avec un numéro
╚══════════════════════╝
`;

  return message.reply(panel);
 },

 onReply: async function ({ api, event, message, Reply, usersData, threadsData, getLang }) {

  // 🔒 sécurité owner partout
  if (event.senderID !== OWNER_ID)
   return message.reply(getLang("noPerm"));

  const choice = event.body;

  switch (choice) {

   case "3": {
    const admins = global.GoatBot.config.adminBot || [];
    return message.reply(
     "👑 ADMIN LIST (ANGEL LOCKED)\n\n" +
     admins.map(id => `• ${id}`).join("\n")
    );
   }

   case "9":
    return message.reply("📢 Envoie ton message angel broadcast ✨");

   case "10":
    return message.reply("🔍 Envoie le nom pour chercher UID ✨");

   case "11":
    return message.reply("🧭 Envoie le nom du groupe ✨");

   case "12":
    return message.reply("🎭 Envoie le nouvel emoji ✨");

   case "13":
    return message.reply("📝 Envoie le nouveau nom du groupe ✨");

   case "14": {
    const thread = await threadsData.get(event.threadID);
    return message.reply(
`📊 ANGEL GROUP INFO ✨

💬 Nom : ${thread.threadName}
🆔 ID : ${thread.threadID}
👥 Membres : ${thread.members.length}
🛡️ Admins : ${thread.adminIDs.length}`
    );
   }

   default:
    return message.reply("💫 Option invalide angel ✨");
  }
 }
};
