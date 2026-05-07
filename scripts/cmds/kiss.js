const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");
const { createCanvas, loadImage } = require("canvas");

const bgURL = "https://files.catbox.moe/20pg09.jpg";
const localBgPath = path.join(__dirname, "cache", "angel_kiss_bg.jpg");

const avatarConfig = {
  boy: { x: 255, y: 50, size: 110 },
  girl: { x: 367, y: 160, size: 100 }
};

module.exports = {
  config: {
    name: "kiss",
    version: "💖 Angel 3.0",
    author: "Christus ✨ | Angel Edit by Shade",
    countDown: 5,
    role: 0,
    description: "💋 Bisou Angel kawaii entre deux cœurs liés 🌸✨",
    category: "🌸 angel-love",
    guide: {
      en: "{pn} @tag ou reply — faire un bisou angel 💋"
    }
  },

  langs: {
    en: {
      noTag: "🌸 Choisis un cœur à embrasser 💋 (tag ou reply)"
    }
  },

  onStart: async function ({ event, message, usersData, getLang }) {
    const uid1 = event.senderID;
    let uid2 = Object.keys(event.mentions)[0];

    if (!uid2 && event.messageReply?.senderID)
      uid2 = event.messageReply.senderID;

    if (!uid2)
      return message.reply("🌸 " + getLang("noTag"));

    try {
      const name1 = await usersData.getName(uid1) || "Angel";
      const name2 = await usersData.getName(uid2) || "Soul";

      // 🌸 Background angel cache
      await fs.ensureDir(path.dirname(localBgPath));
      if (!fs.existsSync(localBgPath)) {
        const bg = await axios.get(bgURL, { responseType: "arraybuffer" });
        fs.writeFileSync(localBgPath, bg.data);
      }

      const [av1, av2] = await Promise.all([
        usersData.getAvatarUrl(uid1),
        usersData.getAvatarUrl(uid2)
      ]);

      const [img1, img2, bgImg] = await Promise.all([
        loadImage(av1).catch(() => null),
        loadImage(av2).catch(() => null),
        loadImage(localBgPath)
      ]);

      if (!img1 || !img2)
        return message.reply("💔 Impossible de charger les énergies angel...");

      const canvas = createCanvas(bgImg.width, bgImg.height);
      const ctx = canvas.getContext("2d");

      // 🌸 Background
      ctx.drawImage(bgImg, 0, 0);

      // ✨ Glow helper
      function drawGlowCircle(img, x, y, size) {
        ctx.save();

        // soft glow
        ctx.shadowColor = "rgba(255,182,255,0.8)";
        ctx.shadowBlur = 25;

        ctx.beginPath();
        ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();

        ctx.drawImage(img, x, y, size, size);
        ctx.restore();
      }

      drawGlowCircle(img1, avatarConfig.boy.x, avatarConfig.boy.y, avatarConfig.boy.size);
      drawGlowCircle(img2, avatarConfig.girl.x, avatarConfig.girl.y, avatarConfig.girl.size);

      // 💖 Texte Angel
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 28px Arial";
      ctx.textAlign = "center";
      ctx.shadowColor = "#ffb6ff";
      ctx.shadowBlur = 15;

      ctx.fillText("🌸 Angel Kiss 🌸", bgImg.width / 2, 60);

      ctx.font = "22px Arial";
      ctx.fillText(`${name1} 💞 ${name2}`, bgImg.width / 2, 100);

      ctx.shadowBlur = 0;

      // 💾 Save
      const savePath = path.join(__dirname, "tmp");
      await fs.ensureDir(savePath);

      const file = path.join(savePath, `${uid1}_${uid2}_angel_kiss.png`);
      fs.writeFileSync(file, canvas.toBuffer("image/png"));

      return message.reply({
        body:
`💋 𝑨𝒏𝒈𝒆𝒍 𝑲𝒊𝒔𝒔 🌸✨

💖 ${name1} × ${name2}
🌸 Un baiser écrit par le destin…
🕊️ Les cœurs se sont touchés doucement 💞`,

        attachment: fs.createReadStream(file)
      });

    } catch (e) {
      return message.reply("💔 L’énergie angel a échoué à créer le bisou...");
    }
  }
};
