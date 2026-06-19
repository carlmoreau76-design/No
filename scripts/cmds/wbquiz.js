const axios = require("axios");

async function toFont(text, id = 3) {
  try {
    const GITHUB_RAW = "https://raw.githubusercontent.com/Saim-x69x/sakura/main/ApiUrl.json";
    const rawRes = await axios.get(GITHUB_RAW);
    const apiBase = rawRes.data.apiv1;

    const apiUrl = `${apiBase}/api/font?id=${id}&text=${encodeURIComponent(text)}`;
    const { data } = await axios.get(apiUrl);
    return data.output || text;
  } catch (e) {
    console.error("Erreur API font :", e.message);
    return text;
  }
}

module.exports = {
  config: {
    name: "wbquiz",
    aliases: ["windbreakerquiz", "wbqz", "windbreakerqz"],
    version: "1.0",
    author: "Christus",
    countDown: 10,
    role: 0,
    category: "game",
    guide: { fr: "{pn} — Quiz pour deviner le personnage de Windbreaker" }
  },

  onStart: async function ({ api, event, usersData }) {
    try {
      const GITHUB_RAW = "https://raw.githubusercontent.com/Saim-x69x/sakura/main/ApiUrl.json";
      const rawRes = await axios.get(GITHUB_RAW);
      const quizApiBase = rawRes.data.apiv1;

      const { data } = await axios.get(`${quizApiBase}/api/windbreakerqz`);
      const { image, options, answer } = data;

      const imageStream = await axios({ method: "GET", url: image, responseType: "stream" });

      const body = await toFont(`🌸 Quiz Windbreaker ⚡
━━━━━━━━━━━━━━
📷 Devinez le personnage !

🅐 ${options.A}
🅑 ${options.B}
🅒 ${options.C}
🅓 ${options.D}

⏳ Vous avez 1 minute 30 secondes !
💡 Vous avez 3 chances ! Répondez avec A, B, C ou D.`);

      api.sendMessage(
        { body, attachment: imageStream.data },
        event.threadID,
        async (err, info) => {
          if (err) return;

          global.GoatBot.onReply.set(info.messageID, {
            commandName: this.config.name,
            type: "reply",
            messageID: info.messageID,
            author: event.senderID,
            correctAnswer: answer,
            chances: 3,
            answered: false
          });

          setTimeout(async () => {
            const quizData = global.GoatBot.onReply.get(info.messageID);
            if (quizData && !quizData.answered) {
              try {
                await api.unsendMessage(info.messageID);
                global.GoatBot.onReply.delete(info.messageID);
              } catch (e) {
                console.error("Impossible de supprimer le message du quiz :", e.message);
              }
            }
          }, 90000);
        },
        event.messageID
      );
    } catch (err) {
      console.error(err);
      const failMsg = await toFont("❌ Impossible de récupérer les données du quiz Windbreaker.");
      api.sendMessage(failMsg, event.threadID, event.messageID);
    }
  },

  onReply: async function ({ api, event, Reply, usersData }) {
    let { author, correctAnswer, messageID, chances } = Reply;
    const reply = event.body?.trim().toUpperCase();

    if (event.senderID !== author) {
      const msg = await toFont("⚠️ Ce quiz n'est pas pour vous !");
      return api.sendMessage(msg, event.threadID, event.messageID);
    }

    if (!reply || !["A", "B", "C", "D"].includes(reply)) {
      const msg = await toFont("❌ Répondez avec A, B, C ou D.");
      return api.sendMessage(msg, event.threadID, event.messageID);
    }

    if (reply === correctAnswer) {
      await api.unsendMessage(messageID);

      const rewardCoin = 400;
      const rewardExp = 150;
      const userData = await usersData.get(event.senderID);
      userData.money += rewardCoin;
      userData.exp += rewardExp;
      await usersData.set(event.senderID, userData);

      const correctMsg = await toFont(`🌸 Bonne réponse ! 🎉

✅ Réponse correcte !
💰 +${rewardCoin} Pièces
🌟 +${rewardExp} EXP

🔥 Angel approuve vos compétences !`);

      if (global.GoatBot.onReply.has(messageID)) {
        global.GoatBot.onReply.get(messageID).answered = true;
        global.GoatBot.onReply.delete(messageID);
      }

      return api.sendMessage(correctMsg, event.threadID, event.messageID);
    } else {
      chances--;

      if (chances > 0) {
        global.GoatBot.onReply.set(messageID, { ...Reply, chances });
        const wrongTryMsg = await toFont(`❌ Mauvaise réponse !
⏳ Il vous reste ${chances} chance(s). Essayez encore !`);
        return api.sendMessage(wrongTryMsg, event.threadID, event.messageID);
      } else {
        await api.unsendMessage(messageID);
        const wrongMsg = await toFont(`🥺 Plus de chances !
✅ La bonne réponse était : ${correctAnswer}`);
        return api.sendMessage(wrongMsg, event.threadID, event.messageID);
      }
    }
  }
};
