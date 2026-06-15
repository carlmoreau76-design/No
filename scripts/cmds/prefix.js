const { createCanvas, loadImage } = require("canvas");
const fs = require("fs");

module.exports.config = {
  name: "prefix",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "Shade",
  description: "Affiche le système de prefix du bot",
  commandCategory: "system",
  usages: "prefix",
  cooldowns: 3
};

module.exports.run = async function ({ api, event }) {
  const width = 1200;
  const height = 600;

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  // 🔮 Background image (ton image)
  const background = await loadImage("https://files.catbox.moe/gcjsgw.jpg");
  ctx.drawImage(background, 0, 0, width, height);

  // 🌫 Overlay sombre violet
  ctx.fillStyle = "rgba(20, 0, 40, 0.65)";
  ctx.fillRect(0, 0, width, height);

  // ✨ Title
  ctx.fillStyle = "#c084fc";
  ctx.font = "bold 50px Sans";
  ctx.textAlign = "center";
  ctx.fillText("⚉ SHADE'S BOT PREFIX SYSTEM ⚉", width / 2, 120);

  // 📌 Infos
  ctx.fillStyle = "#ffffff";
  ctx.font = "30px Sans";

  ctx.fillText(`User: ${event.senderID}`, width / 2, 200);
  ctx.fillText("Global Prefix: .", width / 2, 260);
  ctx.fillText("Chat Prefix: .", width / 2, 320);

  // ⏰ Time
  const now = new Date();
  const time = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  ctx.fillText(`Time: ${time}`, width / 2, 380);

  // 📅 Date
  const date = now.toDateString();
  ctx.fillText(`Date: ${date}`, width / 2, 440);

  // 💾 Save image
  const buffer = canvas.toBuffer("image/png");
  fs.writeFileSync(__dirname + "/cache/prefix.png", buffer);

  return api.sendMessage(
    {
      attachment: fs.createReadStream(__dirname + "/cache/prefix.png"),
      body: "⚉ SHADE PREFIX SYSTEM ⚉"
    },
    event.threadID,
    event.messageID
  );
};
