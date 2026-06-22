const axios = require("axios");

module.exports = {
  config: {
    name: "spy",
    aliases: ["angelspy", "scan", "profile", "info"],
    version: "4.0.0",
    role: 0, // Accessible à tout le monde
    author: "Christus ✨ + Angel × Gemini edit",
    description: "🌸 Rapport complet de profil avec avatar (Soi-même ou cible via reply/tag/UID)",
    category: "utility",
    countDown: 5,
  },

  onStart: async function ({ event, message, usersData, api, args }) {
    try {
      // 🎯 Détection de la cible (Argument ID, Tag, Reply, ou soi-même)
      const uid =
        args[0]?.match(/^\d+$/)
          ? args[0]
          : Object.keys(event.mentions || {})[0]
          || event.messageReply?.senderID
          || event.senderID;

      // Récupération des données Facebook et Database de GoatBot
      const fb = (await api.getUserInfo(uid))?.[uid] || {};
      const db = await usersData.get(uid) || {};

      const name = fb.name || db.name || "Sujet Inconnu";
      const username = fb.vanity ? `@${fb.vanity}` : "Aucun";

      // 🖼️ Récupération de la photo de profil avec Fallback sécurisé
      let avatarUrl;
      try {
        avatarUrl = await usersData.getAvatarUrl(uid);
      } catch {
        avatarUrl = `https://graph.facebook.com/${uid}/picture?type=large` || "https://i.imgur.com/TPHk4Qu.png";
      }

      // ⚧️ Détermination du genre
      let gender = "🌸 Inconnu";
      if (fb.gender === 1 || fb.gender === "female") gender = "💖 Femme";
      if (fb.gender === 2 || fb.gender === "male") gender = "💙 Homme";

      // 📊 Données Économiques / Activité
      const money = db.money || 0;
      const exp = db.exp || 0;
      const level = db.level || 0;

      // 🏆 Calcul des classements globaux (Ranks)
      const allUsers = await usersData.getAll() || [];
      
      const expRank = allUsers
        .slice()
        .sort((a, b) => (b.exp || 0) - (a.exp || 0))
        .findIndex(u => String(u.userID) === String(uid)) + 1;

      const moneyRank = allUsers
        .slice()
        .sort((a, b) => (b.money || 0) - (a.money || 0))
        .findIndex(u => String(u.userID) === String(uid)) + 1;

      // 🕒 Horodatage basé sur Kinshasa
      const now = new Date().toLocaleString("fr-FR", {
        timeZone: "Africa/Kinshasa",
        hour12: false
      });

      // 💬 Analyse d'Aura personnalisée selon le niveau ou le genre
      let aura = "Stable & Pure ✨";
      if (level > 20) aura = "Surpuissante / Élite 👑";
      if (money > 500000) aura = "Capitaliste Flamboyante 💸";

      // 📄 Construction du rapport textuel stylisé
      const report = `
╭─── 🌸💖 𝗔𝗡𝗚𝗘𝗟 𝗦𝗖𝗔𝗡 𝗥𝗘𝗣𝗢𝗥𝗧 💖🌸 ───╮

👤 𝗜𝗡𝗙𝗢𝗥𝗠𝗔𝗧𝗜𝗢𝗡 𝗣𝗥𝗢𝗙𝗜𝗟
━━━━━━━━━━━━━━━━━━
💖 Nom : ${name}
🆔 UID : ${uid}
🏷️ Username : ${username}
⚧️ Genre : ${gender}
🌐 Lien : https://facebook.com/${uid}

📊 𝗦𝗧𝗔𝗧𝗨𝗧 𝗠𝗔𝗧𝗥𝗜𝗖𝗘
━━━━━━━━━━━━━━━━━━
💰 Économie : ${money.toLocaleString()}$
⭐ Expérience : ${exp.toLocaleString()} xp
📈 Niveau Global : Lvl ${level}

🏆 𝗖𝗟𝗔𝗦𝗦𝗘𝗠𝗘𝗡𝗧 𝗦𝗘𝗖𝗧𝗘𝗨𝗥
━━━━━━━━━━━━━━━━━━
✨ Rang d'Activité : #${expRank || "?"} / ${allUsers.length}
💸 Rang de Richesse : #${moneyRank || "?"} / ${allUsers.length}

💬 𝗔𝗡𝗔𝗟𝗬𝗦𝗘 𝗦𝗬𝗦𝗧𝗘𝗠
━━━━━━━━━━━━━━━━━━
🔮 Diagnostic Aura : ${aura}
⚡ Statut Réseau : Connecté
🟢 Intégrité : 100% Fonctionnel

🕒 𝗧𝗜𝗠𝗘𝗦𝗧𝗔𝗠𝗣
━━━━━━━━━━━━━━━━━━
📅 Scan effectué le : ${now}

╰─── 💖 ANGEL SYSTEM ONLINE 🌸 ───╯
`;

      // Récupération du flux de l'image pour l'envoyer en pièce jointe
      const stream = await global.utils.getStreamFromURL(avatarUrl);

      return message.reply({
        body: report.trim(),
        attachment: stream
      });

    } catch (e) {
      console.error("SPY CMD ERROR:", e);
      return message.reply("🌸💔 Erreur lors de l'exécution du Angel Scan...");
    }
  }
};
