const axios = require("axios");
const { createCanvas, loadImage } = require("canvas");
const fs = require("fs");
const path = require("path");

const fontBase = "https://raw.githubusercontent.com/Saim12678/Saim69/1a8068d7d28396dbecff28f422cb8bc9bf62d85f/font";

module.exports = {
  config: {
    name: "pair2",
    version: "angel-1.0",
    author: "Angel ✨",
    role: 0,
    category: "💞 angel love",
    shortDescription: {
      fr: "💞 Lien du destin entre deux âmes du groupe"
    },
    longDescription: {
      fr: "🌸 Crée un couple aléatoire avec compatibilité et image romantique Angel style"
    },
    guide: {
      fr: "{p}{n} → découvre ton lien du destin 💞"
    }
  },

  onStart: async function ({ api, event, usersData }) {
    try {
      const senderData = await usersData.get(event.senderID);
      let senderName = senderData.name;

      const thread = await api.getThreadInfo(event.threadID);
      const users = thread.userInfo;

      const me = users.find(u => u.id === event.senderID);
      if (!me || !me.gender)
        return api.sendMessage("🌸 Impossible de lire ton destin… (genre introuvable)", event.threadID);

      let pool = [];
      if (me.gender === "MALE") {
        pool = users.filter(u => u.gender === "FEMALE" && u.id !== event.senderID);
      } else if (me.gender === "FEMALE") {
        pool = users.filter(u => u.gender === "MALE" && u.id !== event.senderID);
      } else {
        return api.sendMessage("🌸 Ton énergie est neutre… impossible de créer un lien 💔", event.threadID);
      }

      if (!pool.length)
        return api.sendMessage("💔 Aucun destin compatible trouvé…", event.threadID);

      const partner = pool[Math.floor(Math.random() * pool.length)];
      let partnerName = partner.name;

      let fontMap = {};
      try {
        const { data } = await axios.get(`${fontBase}/21.json`);
        fontMap = data;
      } catch {}

      const style = (t) =>
        t.split("").map(c => fontMap[c] || c).join("");

      senderName = style(senderName);
      partnerName = style(partnerName);

      const width = 735;
      const height = 411;
      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext("2d");

      const bg = await loadImage("https://files.catbox.moe/4l3pgh.jpg");
      ctx.drawImage(bg, 0, 0, width, height);

      const avatar1 = await loadImage(
        `https://graph.facebook.com/${event.senderID}/picture?width=720&height=720`
      );
      const avatar2 = await loadImage(
        `https://graph.facebook.com/${partner.id}/picture?width=720&height=720`
      );

      const drawCircle = (img, x, y, size) => {
        ctx.save();
        ctx.beginPath();
        ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(img, x, y, size, size);
        ctx.restore();
      };

      drawCircle(avatar1, 64, 111, 123);
      drawCircle(avatar2, width - 499, 111, 123);

      const file = path.join(__dirname, "angel_pair.png");
      const stream = fs.createWriteStream(file);
      canvas.createPNGStream().pipe(stream);

      stream.on("finish", () => {
        const love = Math.floor(Math.random() * 31) + 70;

        const msg =
`💞🌸 𝐀𝐍𝐆𝐄𝐋 𝐃𝐄𝐒𝐓𝐈𝐍𝐘 𝐋𝐈𝐍𝐊 🌸💞

🎀 ${senderName}
💖 ${partnerName}

🌙 Deux âmes se sont croisées dans l’univers…
💫 Peut-être que le destin vous unit déjà…

💘 Compatibilité : ${love}%`;

        api.sendMessage(
          {
            body: msg,
            attachment: fs.createReadStream(file)
          },
          event.threadID,
          () => fs.unlinkSync(file)
        );
      });

    } catch (e) {
      api.sendMessage("🌸 Une erreur a perturbé le destin… 💔", event.threadID);
    }
  }
};
