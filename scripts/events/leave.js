const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "leave",
    version: "3.0 Canvas",
    author: "Shade × Gemini",
    category: "events"
  },

  langs: {
    en: {
      session1: "𝗺𝗼𝗿𝗻𝗶𝗻𝗴",
      session2: "𝗻𝗼𝗼𝗻",
      session3: "𝗮𝗳𝘁𝗲𝗿𝗻𝗼𝗼𝗻",
      session4: "𝗲𝘃𝗲𝗻𝗶𝗻𝗴",
      leaveType1: "𝗹𝗲𝗳𝘁",
      leaveType2: "𝘄𝗮𝘀 𝗸𝗶𝗰𝗸𝗲𝗱 𝗳𝗿𝗼𝗺",
      defaultLeaveMessage:
`∧＿∧
( ｡•́︿•̀｡ ) 💔
/っ💌

╭━━━〔 🌸 𝗚𝗼𝗼𝗱𝗯𝘆𝗲 🌸 〕━━━╮
➜ {userName}
➜ {type} 𝘁𝗵𝗲 𝗴𝗿𝗼𝘂𝗽

⌚ 𝗧𝗶𝗺𝗲: {time}
🌙 𝗦𝗲𝘀𝘀𝗶𝗼𝗻: {session}
🏡 𝗚𝗿𝗼𝘂𝗽: {threadName}
╰━━━━━━━━━━━━━━━━━━╯

(｡•́︿•̀｡)
𝗔𝗻𝗴𝗲𝗹 𝘄𝗶𝗹𝗹 𝗺𝗶𝘀𝘀 𝘆𝗼𝘂...`
    }
  },

  onStart: async function ({ threadsData, message, event, api, usersData, getLang }) {
    if (event.logMessageType !== "log:unsubscribe") return;

    const { threadID } = event;
    const threadData = await threadsData.get(threadID);

    // Ignorer si l'envoi des messages de départ est désactivé dans le salon
    if (threadData && threadData.settings && threadData.settings.sendLeaveMessage === false) return;

    const { leftParticipantFbId } = event.logMessageData;
    const botID = api.getCurrentUserID();

    // Ignorer si c'est le bot lui-même qui quitte ou se fait exclure
    if (leftParticipantFbId == botID) return;

    try {
      // Collecte des données du groupe et de l'utilisateur
      const threadInfo = await api.getThreadInfo(threadID);
      const threadName = threadInfo.threadName || "Secteur Inconnu";
      const memberCount = threadInfo.participantIDs.length;
      const userName = await usersData.getName(leftParticipantFbId);

      // Calcul des données temporelles
      const date = new Date();
      const hours = date.getHours();
      const minutes = String(date.getMinutes()).padStart(2, "0");
      const timeFormatted = `${hours}:${minutes}`;

      let leaveMessage = getLang("defaultLeaveMessage");

      // Structuration textuelle du message
      leaveMessage = leaveMessage
        .replace(/\{userName\}|\{userNameTag\}/g, userName)
        .replace(
          /\{type\}/g,
          leftParticipantFbId == event.author
            ? getLang("leaveType1")
            : getLang("leaveType2")
        )
        .replace(/\{threadName\}|\{boxName\}/g, threadName)
        .replace(/\{time\}/g, timeFormatted)
        .replace(
          /\{session\}/g,
          hours <= 10
            ? getLang("session1")
            : hours <= 12
            ? getLang("session2")
            : hours <= 18
            ? getLang("session3")
            : getLang("session4")
        );

      const form = { body: leaveMessage, mentions: [] };

      // Ajout des configurations graphiques pour votre API
      const userAvatar = `https://graph.facebook.com/${leftParticipantFbId}/picture?width=400&height=400&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
      const backgroundUrl = "https://i.ibb.co/4YBNyvP/images-76.jpg";

      // Appel de votre API spécifique avec les clés demandées : pp, nama, bg, member
      const apiUrl = `https://zetbot-page.onrender.com/api/goodbye?pp=${encodeURIComponent(userAvatar)}&nama=${encodeURIComponent(userName)}&bg=${encodeURIComponent(backgroundUrl)}&member=${memberCount}`;

      const tmp = path.join(__dirname, "..", "cache");
      await fs.ensureDir(tmp);
      const imagePath = path.join(tmp, `leave_${leftParticipantFbId}_${Date.now()}.png`);

      try {
        // Téléchargement et enregistrement du rendu d'adieu
        const response = await axios.get(apiUrl, { responseType: "arraybuffer", timeout: 10000 });
        fs.writeFileSync(imagePath, response.data);
        form.attachment = fs.createReadStream(imagePath);
      } catch (apiErr) {
        console.error("❌ Impossible de charger l'image d'adieu depuis l'API :", apiErr.message);
      }

      // Expédition globale
      await message.send(form);

      // Suppression propre du cache d'arrière-plan
      setTimeout(() => {
        try { if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath); } catch (e) {}
      }, 5000);

    } catch (err) {
      console.error("❌ Error running leave event:", err);
    }
  }
};
