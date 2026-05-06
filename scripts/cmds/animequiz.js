const axios = require("axios");

async function toFont(text, id = 22) {
  try {
    const GITHUB_RAW = "https://raw.githubusercontent.com/Saim-x69x/sakura/main/ApiUrl.json";
    const rawRes = await axios.get(GITHUB_RAW);
    const apiBase = rawRes.data.apiv1;

    const apiUrl = `${apiBase}/api/font?id=${id}&text=${encodeURIComponent(text)}`;
    const { data } = await axios.get(apiUrl);
    return data.output || text;
  } catch (e) {
    return text;
  }
}

module.exports = {
  config: {
    name: "animequiz",
    aliases: ["animeqz", "aniquiz", "aniqz"],
    version: "1.0",
    author: "Shade",
    countDown: 10,
    role: 0,
    category: "jeu",
    guide: { fr: "{pn} — Devinez le personnage d'anime !" }
  },

  onStart: async function ({ api, event }) {
    try {
      const GITHUB_RAW = "https://raw.githubusercontent.com/Saim-x69x/sakura/main/ApiUrl.json";
      const rawRes = await axios.get(GITHUB_RAW);
      const quizApiBase = rawRes.data.apiv1;

      const { data } = await axios.get(`${quizApiBase}/api/animequiz`);
      const { image, options, answer } = data;

      const imageStream = await axios({
        method: "GET",
        url: image,
        responseType: "stream"
      });

      const body = await toFont(`🌸🎌 𝐀𝐧𝐠𝐞𝐥 𝐀𝐧𝐢𝐦𝐞 𝐐𝐮𝐢𝐳 💖
━━━━━━━━━━━━━━
✨ Devinez le personnage d’anime !

🅐 ${options.A}
🅑 ${options.B}
🅒 ${options.C}
🅓 ${options.D}

⏳ 1 minute 30 pour répondre 🌸
💞 3 essais disponibles !
👉 Répondez avec A / B / C / D 💖`);

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
              try { await api.unsendMessage(info.messageID); } catch {}
              global.GoatBot.onReply.delete(info.messageID);
            }
          }, 90000);
        },
        event.messageID
      );

    } catch (err) {
      const failMsg = await toFont("🌸💔 Impossible de charger le quiz anime…");
      api.sendMessage(failMsg, event.threadID, event.messageID);
    }
  },

  onReply: async function ({ api, event, Reply, usersData }) {
    let { author, correctAnswer, messageID, chances } = Reply;
    const reply = event.body?.trim().toUpperCase();

    if (event.senderID !== author) {
      const msg = await toFont("🌸⚠️ Ce quiz n’est pas pour toi !");
      return api.sendMessage(msg, event.threadID, event.messageID);
    }

    if (!reply || !["A", "B", "C", "D"].includes(reply)) {
      const msg = await toFont("🌸❌ Réponds avec A, B, C ou D !");
      return api.sendMessage(msg, event.threadID, event.messageID);
    }

    // 💖 BONNE RÉPONSE
    if (reply === correctAnswer) {
      try { await api.unsendMessage(messageID); } catch {}

      const rewardCoin = 350;
      const rewardExp = 120;

      const userData = (await usersData.get(event.senderID)) || { money: 0, exp: 0 };
      userData.money += rewardCoin;
      userData.exp += rewardExp;
      await usersData.set(event.senderID, userData);

      const correctMsg = await toFont(`🌸💖 𝐒𝐮𝐠𝐨𝐢 ! 𝐀𝐧𝐠𝐞𝐥 𝐰𝐢𝐧𝐧𝐞𝐫 💖

🎯 Bonne réponse !
💰 +${rewardCoin} coins
🌟 +${rewardExp} EXP

👑 Tu es un vrai fan d’anime Angel 🌸✨`);

      global.GoatBot.onReply.delete(messageID);

      return api.sendMessage(correctMsg, event.threadID, event.messageID);
    }

    // ❌ FAUX
    chances--;

    if (chances > 0) {
      global.GoatBot.onReply.set(messageID, { ...Reply, chances });

      const wrongTryMsg = await toFont(`🌸💔 𝐎𝐨𝐩𝐬 𝐀𝐧𝐠𝐞𝐥…

❌ Mauvaise réponse !
⏳ Il te reste ${chances} chance(s) 💞

👉 Essaie encore 🌸`);

      return api.sendMessage(wrongTryMsg, event.threadID, event.messageID);
    }

    // 💀 FIN
    try { await api.unsendMessage(messageID); } catch {}

    const wrongMsg = await toFont(`🌸😢 𝐀𝐧𝐠𝐞𝐥 𝐐𝐮𝐢𝐳 𝐅𝐢𝐧𝐢𝐬𝐡…

❌ Plus de chances…
💔 La bonne réponse était : ${correctAnswer}

✨ Reviens plus fort Angel 🌸`);

    return api.sendMessage(wrongMsg, event.threadID, event.messageID);
  }
};
