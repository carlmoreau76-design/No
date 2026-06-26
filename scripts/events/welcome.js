const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "welcome",
    version: "2.6 Hori Style",
    author: "Angel System & Gemini",
    category: "events"
  },

  onStart: async function ({ api, event }) {
    if (event.logMessageType !== "log:subscribe") return;

    const { threadID, logMessageData } = event;
    const newUsers = logMessageData.addedParticipants;
    const botID = api.getCurrentUserID();

    if (newUsers.some(u => u.userFbId === botID)) return;

    try {
      const threadInfo = await api.getThreadInfo(threadID);
      const groupName = threadInfo.threadName || "Secteur Inconnu";
      const memberCount = threadInfo.participantIDs.length;

      for (const user of newUsers) {
        const userId = user.userFbId;
        const fullName = user.fullName;

        try {
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

          // Récupération de l'avatar et utilisation de l'API externe d'origine
          const userAvatar = `https://graph.facebook.com/${userId}/picture?width=400&height=400&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
          const backgroundUrl = "https://i.ibb.co/4YBNyvP/images-76.jpg";

          const apiUrl = `https://zetbot-page.onrender.com/api/welcome?username=${encodeURIComponent(fullName)}&avatarUrl=${encodeURIComponent(userAvatar)}&groupname=${encodeURIComponent(groupName)}&bg=${encodeURIComponent(backgroundUrl)}&memberCount=${memberCount}`;

          const tmp = path.join(__dirname, "..", "cache");
          await fs.ensureDir(tmp);

          const imagePath = path.join(tmp, `welcome_${userId}_${Date.now()}.png`);

          // Téléchargement via ton API habituelle
          const response = await axios.get(apiUrl, { responseType: "arraybuffer", timeout: 10000 });
          fs.writeFileSync(imagePath, response.data);

          // Nouveau look textuel Hori Style
          const msg =
`✨ 🌸 **[ NOUVEAU SIGNAL D'ARRIVÉE ]** 🌸 ✨
━━━━━━━━━━━━━━━━━━━━━━━━━━
꒰ა ✦ **WELCOME PROTOCOL** ✦ ໒꒱

» 👤 **Utilisateur :** ${fullName}
» 💬 **Bienvenue dans :** ${groupName}
» 📊 **Index de présence :** Membre n° ${memberCount}

✦ _Installe-toi confortablement et respecte les règles du groupe !_ ✦
━━━━━━━━━━━━━━━━━━━━━━━━━━
⏰ Synchronisé le : ${timeStr}`;

          await api.sendMessage({
            body: msg,
            attachment: fs.createReadStream(imagePath),
            mentions: [{ tag: fullName, id: userId }]
          }, threadID);

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
