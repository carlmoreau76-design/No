const axios = require("axios");

const OWNER_ID = "61573867120837";

module.exports = {
  config: {
    name: "spy",
    aliases: ["angelspy", "scan", "profile"],
    version: "angel-3.0",
    role: 0,
    author: "Christus ✨ + Angel edit",
    description: "🌸 Rapport complet de profil style Angel scan",
    category: "info",
    countDown: 8,
  },

  onStart: async function ({ event, message, usersData, api, args }) {
    try {

      const uid =
        args[0]?.match(/^\d+$/)
          ? args[0]
          : Object.keys(event.mentions || {})[0]
          || event.messageReply?.senderID
          || event.senderID;

      const fb = (await api.getUserInfo(uid))?.[uid] || {};
      const db = await usersData.get(uid);

      const name = fb.name || db?.name || "Inconnu";

      let avatar;
      try {
        avatar = await usersData.getAvatarUrl(uid);
      } catch {
        avatar = "https://i.imgur.com/TPHk4Qu.png";
      }

      let gender = "🌸 Inconnu";
      if (fb.gender === 1) gender = "💖 Femme";
      if (fb.gender === 2) gender = "💙 Homme";

      const money = db?.money || 0;
      const exp = db?.exp || 0;
      const level = db?.level || 0;

      const all = await usersData.getAll();

      const expRank =
        all
          .slice()
          .sort((a, b) => (b.exp || 0) - (a.exp || 0))
          .findIndex(u => String(u.userID) === String(uid)) + 1;

      const moneyRank =
        all
          .slice()
          .sort((a, b) => (b.money || 0) - (a.money || 0))
          .findIndex(u => String(u.userID) === String(uid)) + 1;

      const now = new Date().toLocaleString("fr-FR", {
        timeZone: "Africa/Kinshasa"
      });

      const report = `
╭─── 🌸💖 𝗔𝗡𝗚𝗘𝗟 𝗦𝗖𝗔𝗡 𝗥𝗘𝗣𝗢𝗥𝗧 💖🌸 ───╮

👤 𝗜𝗡𝗙𝗢𝗥𝗠𝗔𝗧𝗜𝗢𝗡 𝗣𝗥𝗢𝗙𝗜𝗟
━━━━━━━━━━━━━━
💖 Nom : ${name}
🆔 ID : ${uid}
⚧️ Genre : ${gender}
🌐 Profil : ${fb.profileUrl || "Non disponible"}

📊 𝗦𝗧𝗔𝗧𝗨𝗧 𝗕𝗢𝗧
━━━━━━━━━━━━━━
💰 Argent : ${money}$
⭐ XP : ${exp}
📈 Niveau : ${level}

🏆 𝗖𝗟𝗔𝗦𝗦𝗘𝗠𝗘𝗡𝗧
━━━━━━━━━━━━━━
✨ Rank XP : #${expRank || "?"}
💸 Rank Money : #${moneyRank || "?"}

💬 𝗔𝗡𝗔𝗟𝗬𝗦𝗘 𝗔𝗡𝗚𝗘𝗟
━━━━━━━━━━━━━━
🌸 Énergie détectée : douce & stable
💖 Aura : positive
✨ Statut : actif

🕒 𝗥𝗔𝗣𝗣𝗢𝗥𝗧 𝗦𝗖𝗔𝗡
━━━━━━━━━━━━━━
📅 ${now}

╰─── 💖 ANGEL SYSTEM ONLINE 🌸 ───╯
`;

      return message.reply({
        body: report,
        attachment: await global.utils.getStreamFromURL(avatar),
      });

    } catch (e) {
      return message.reply("🌸💔 Angel scan error…");
    }
  }
};
