const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "leave",
    version: "3.1.0 Hori Edition",
    author: "Shade × Gemini",
    category: "events"
  },

  langs: {
    en: {
      session1: "Matin",
      session2: "Midi",
      session3: "Après-midi",
      session4: "Soirée",
      leaveType1: "a quitté de son plein gré",
      leaveType2: "a été retiré du personnel de",
      defaultLeaveMessage:
`✨ 🌸 **[ LOGOUT PROTOCOL ACTIVATED ]** 🌸 ✨
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
꒰ა ✦ **GOODBYE SYSTEM** ✦ ໒꒱

» 👤 **Utilisateur :** {userName}
» 🚪 **Statut :** {type} le groupe

» 🏡 **Salon :** {threadName}
» ⏰ **Heure :** {time} ({session})
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💡 _Le terminal de connexion a été réinitialisé pour cet utilisateur._`
    }
  },

  onStart: async function ({ threadsData, message, event, api, usersData, getLang }) {
    if (event.logMessageType !== "log:unsubscribe") return;

    const { threadID } = event;
    const threadData = await threadsData.get(threadID);

    if (threadData && threadData.settings && threadData.settings.sendLeaveMessage === false) return;

    const { leftParticipantFbId } = event.logMessageData;
    const botID = api.getCurrentUserID();

    if (leftParticipantFbId == botID) return;

    try {
      const threadInfo = await api.getThreadInfo(threadID);
      const threadName = threadInfo.threadName || "Secteur Inconnu";
      const memberCount = threadInfo.participantIDs.length;
      const userName = await usersData.getName(leftParticipantFbId);

      const date = new Date();
      const hours = date.getHours();
      const minutes = String(date.getMinutes()).padStart(2, "0");
      const timeFormatted = `${hours}:${minutes}`;

      let leaveMessage = getLang("defaultLeaveMessage");

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

      const userAvatar = `https://graph.facebook.com/${leftParticipantFbId}/picture?width=400&height=400&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
      const backgroundUrl = "https://i.ibb.co/4YBNyvP/images-76.jpg";

      // Conserve l'appel exact à ton API externe
      const apiUrl = `https://zetbot-page.onrender.com/api/goodbye?pp=${encodeURIComponent(userAvatar)}&nama=${encodeURIComponent(userName)}&bg=${encodeURIComponent(backgroundUrl)}&member=${memberCount}`;

      const tmp = path.join(__dirname, "..", "cache");
      await fs.ensureDir(tmp);
      const imagePath = path.join(tmp, `leave_${leftParticipantFbId}_${Date.now()}.png`);

      try {
        const response = await axios.get(apiUrl, { responseType: "arraybuffer", timeout: 10000 });
        fs.writeFileSync(imagePath, response.data);
        form.attachment = fs.createReadStream(imagePath);
      } catch (apiErr) {
        console.error("❌ Impossible de charger l'image d'adieu depuis l'API :", apiErr.message);
      }

      await message.send(form);

      setTimeout(() => {
        try { if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath); } catch (e) {}
      }, 5000);

    } catch (err) {
      console.error("❌ Error running leave event:", err);
    }
  }
};
