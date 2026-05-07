const axios = require("axios");
const { createCanvas, loadImage } = require("canvas");
const fs = require("fs");
const path = require("path");

const baseUrl = "https://raw.githubusercontent.com/Saim12678/Saim69/1a8068d7d28396dbecff28f422cb8bc9bf62d85f/font";

module.exports = {
  config: {
    name: "pair",
    aliases: ["lovepair", "match"],
    author: "Christus ✨ | Angel Edit by Shade",
    version: "1.0 Angel",
    role: 0,
    category: "💘 angel-love",
    shortDescription: {
      fr: "🌸 Trouve ton duo kawaii du destin 💞"
    },
    longDescription: {
      fr: "💘 Génère un couple aléatoire avec un style angel kawaii ultra doux 🌸✨"
    },
    guide: {
      fr: "{p}{n} — découvrir ton duo du destin 💞"
    }
  },

  onStart: async function ({ api, event, usersData }) {
    try {
      const senderData = await usersData.get(event.senderID);
      let senderName = senderData.name;

      const threadData = await api.getThreadInfo(event.threadID);
      const users = threadData.userInfo;

      const myData = users.find(u => u.id === event.senderID);
      if (!myData || !myData.gender) {
        return api.sendMessage("🌸 Impossible de lire ton énergie du cœur 💔", event.threadID, event.messageID);
      }

      const myGender = myData.gender.toUpperCase();
      let candidates = [];

      if (myGender === "MALE") {
        candidates = users.filter(u => u.gender === "FEMALE" && u.id !== event.senderID);
      } else if (myGender === "FEMALE") {
        candidates = users.filter(u => u.gender === "MALE" && u.id !== event.senderID);
      } else {
        return api.sendMessage("🌙 Ton énergie est mystérieuse… impossible de matcher 💫", event.threadID, event.messageID);
      }

      if (!candidates.length) {
        return api.sendMessage("💔 Aucun cœur compatible trouvé dans ce monde 🌸", event.threadID, event.messageID);
      }

      const match = candidates[Math.floor(Math.random() * candidates.length)];
      let matchName = match.name;

      // Font (optionnel)
      let fontMap = {};
      try {
        const { data } = await axios.get(`${baseUrl}/21.json`);
        fontMap = data;
      } catch {}

      const convert = (t) => t.split("").map(c => fontMap[c] || c).join("");

      senderName = convert(senderName);
      matchName = convert(matchName);

      const width = 800;
      const height = 400;
      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext("2d");

      // 🌸 Background kawaii
      const bg = await loadImage("https://files.catbox.moe/29jl5s.jpg");
      ctx.drawImage(bg, 0, 0, width, height);

      const img1 = await loadImage(
        `https://graph.facebook.com/${event.senderID}/picture?width=720&height=720`
      );
      const img2 = await loadImage(
        `https://graph.facebook.com/${match.id}/picture?width=720&height=720`
      );

      function circle(ctx, img, x, y, size) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(img, x, y, size, size);
        ctx.restore();
      }

      circle(ctx, img1, 380, 40, 170);
      circle(ctx, img2, 600, 200, 170);

      const file = path.join(__dirname, "angel_pair.png");
      const out = fs.createWriteStream(file);
      canvas.createPNGStream().pipe(out);

      out.on("finish", () => {
        const love = Math.floor(Math.random() * 31) + 70;

        const msg =
`🌸 𝑨𝒏𝒈𝒆𝒍 𝑷𝒂𝒊𝒓 𝑴𝒂𝒈𝒊𝒄 💞✨

💖 ${senderName}
💖 ${matchName}

🌷 Le destin a doucement lié vos chemins…
🕊️ Énergie compatible : ${love}%

💌 "Deux cœurs, une seule étoile…" ✨`;

        api.sendMessage(
          {
            body: msg,
            attachment: fs.createReadStream(file)
          },
          event.threadID,
          () => fs.unlinkSync(file),
          event.messageID
        );
      });

    } catch (e) {
      api.sendMessage("💔 Une erreur a brisé la magie angel…", event.threadID, event.messageID);
    }
  }
};
