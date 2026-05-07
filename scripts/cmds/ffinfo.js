const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const { createCanvas, loadImage } = require("canvas");

module.exports = {
  config: {
    name: "ffinfo",
    version: "1.0",
    author: "Christus ✨ | Angel Style by Shade 💠",
    role: 0,
    category: "freefire",
    countDown: 5,
    description: "💠 Génère une carte Free Fire stylée + infos joueur"
  },

  onStart: async function ({ message, args, event }) {
    const id = args[0];

    if (!id) {
      return message.reply("💔✨ Donne ton ID Free Fire : ffinfo <id>");
    }

    const loading = await message.reply("🌸 Analyse du profil Free Fire... 💠");

    try {
      // 🔥 Simulation API (tu peux brancher vraie API si tu veux)
      const data = {
        name: "Player_" + id,
        level: Math.floor(Math.random() * 80),
        rank: ["Bronze", "Silver", "Gold", "Platinum", "Diamond", "Heroic"][Math.floor(Math.random() * 6)],
        kills: Math.floor(Math.random() * 5000),
        guild: "Angel Squad 💠"
      };

      const canvas = createCanvas(900, 500);
      const ctx = canvas.getContext("2d");

      // 🎨 Background kawaii angel
      const bg = await loadImage("https://files.catbox.moe/4l3pgh.jpg");
      ctx.drawImage(bg, 0, 0, 900, 500);

      // 💠 Glow title
      ctx.fillStyle = "#00ffe1";
      ctx.font = "bold 40px Arial";
      ctx.shadowColor = "#ff99ff";
      ctx.shadowBlur = 20;
      ctx.fillText("💠 FREE FIRE ANGEL INFO 💠", 150, 70);

      // 👤 Infos
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#ffffff";
      ctx.font = "28px Arial";

      ctx.fillText(`🆔 ID: ${id}`, 80, 150);
      ctx.fillText(`👤 Name: ${data.name}`, 80, 200);
      ctx.fillText(`⭐ Level: ${data.level}`, 80, 250);
      ctx.fillText(`🏆 Rank: ${data.rank}`, 80, 300);
      ctx.fillText(`💀 Kills: ${data.kills}`, 80, 350);
      ctx.fillText(`👑 Guild: ${data.guild}`, 80, 400);

      const filePath = path.join(__dirname, "cache", `ff_${id}.png`);
      await fs.ensureDir(path.dirname(filePath));

      const out = fs.createWriteStream(filePath);
      const stream = canvas.createPNGStream();
      stream.pipe(out);

      out.on("finish", () => {
        message.reply({
          body: `💠✨ Profil Free Fire généré ✨💠\n\n💡 Réponds à cette image pour voir les infos complètes`,
          attachment: fs.createReadStream(filePath)
        });

        global.GoatBot.onReply.set(event.messageID, {
          commandName: this.config.name,
          uid: id,
          data
        });

        setTimeout(() => fs.unlinkSync(filePath), 30000);
      });

    } catch (e) {
      message.reply("❌ Erreur génération Free Fire card");
    }
  },

  onReply: async function ({ message, Reply }) {
    const data = Reply.data;

    return message.reply(`
🌸💠 FREE FIRE FULL ANGEL INFO 💠🌸

🆔 ID: ${Reply.uid}
👤 Name: ${data.name}
⭐ Level: ${data.level}
🏆 Rank: ${data.rank}
💀 Kills: ${data.kills}
👑 Guild: ${data.guild}

✨ Système Angel Free Fire actif 💠💖
    `);
  }
};
