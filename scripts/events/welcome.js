const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "welcome",
    version: "2.5 Premium",
    author: "Angel System & Gemini",
    category: "events"
  },

  onStart: async function ({ api, event }) {
    if (event.logMessageType !== "log:subscribe") return;

    const { threadID, logMessageData } = event;
    const newUsers = logMessageData.addedParticipants;
    const botID = api.getCurrentUserID();

    // Ignorer si c'est le bot lui-même qui rejoint le groupe
    if (newUsers.some(u => u.userFbId === botID)) return;

    try {
      const threadInfo = await api.getThreadInfo(threadID);
      const groupName = threadInfo.threadName || "Secteur Inconnu";
      const memberCount = threadInfo.participantIDs.length;

      for (const user of newUsers) {
        const userId = user.userFbId;
        const fullName = user.fullName;

        try {
          // Formatage de la date et de l'heure locale
          const timeStr = new Date().toLocaleString("fr-FR", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
            hour12: false,
          });

          // Récupération dynamique de la photo de profil en Haute Définition
          const userAvatar = `https://graph.facebook.com/${userId}/picture?width=400&height=400&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
          // Image de fond par défaut (celle spécifiée dans votre exemple)
          const backgroundUrl = "https://i.ibb.co/4YBNyvP/images-76.jpg";

          // Construction de l'URL pour votre nouvelle API
          const apiUrl = `https://zetbot-page.onrender.com/api/welcome?username=${encodeURIComponent(fullName)}&avatarUrl=${encodeURIComponent(userAvatar)}&groupname=${encodeURIComponent(groupName)}&bg=${encodeURIComponent(backgroundUrl)}&memberCount=${memberCount}`;

          const tmp = path.join(__dirname, "..", "cache");
          await fs.ensureDir(tmp);

          const imagePath = path.join(tmp, `welcome_${userId}_${Date.now()}.png`);

          // Téléchargement de la carte d'accueil
          const response = await axios.get(apiUrl, { responseType: "arraybuffer", timeout: 10000 });
          fs.writeFileSync(imagePath, response.data);

          const msg =
`╭ ◜◝ ͡ ◜◝ ͡ ◝╮
♡ 𝘼𝙣𝙜𝙚𝙡 𝘽𝙤𝙩 ♡
╰ ◟◞ ͜ ◟◞ ╯

꒰ა ✦ 𝐖𝐞𝐥𝐜𝐨𝐦𝐞 ✦ ໒꒱

✧ 𝐇𝐞𝐥𝐥𝐨 ${fullName}
✧ 𝐖𝐞𝐥𝐜𝐨𝐦𝐞 𝐭𝐨 ${groupName}
✧ 𝐌e𝐦𝐛𝐞𝐫 𝐍𝐨: ${memberCount}

✦ 𝐄𝐧𝐣𝐨𝐲 𝐭𝐡𝐞 𝐠𝐫𝐨υ𝐩 ✦
━━━━━━━━━━━━━━
⏰ ${timeStr}`;

          // Envoi de l'image d'accueil avec une mention
          await api.sendMessage({
            body: msg,
            attachment: fs.createReadStream(imagePath),
            mentions: [{ tag: fullName, id: userId }]
          }, threadID);

          // Nettoyage du fichier temporaire du cache
          try { if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath); } catch (e) {}

        } catch (err) {
          console.error(`❌ Error generating welcome card for ${userId}:`, err);
        }
      }
    } catch (gErr) {
      console.error("❌ Error fetching thread info:", gErr);
    }
  }
};
