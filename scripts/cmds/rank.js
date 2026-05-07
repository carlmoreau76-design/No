const fs = require("fs");
const path = require("path");
const moment = require("moment-timezone");
const { createCanvas, loadImage } = require("canvas");

const deltaNext = 5;

function expToLevel(exp) {
  return Math.floor((1 + Math.sqrt(1 + 8 * exp / deltaNext)) / 2);
}

function levelToExp(level) {
  return Math.floor(((level ** 2 - level) * deltaNext) / 2);
}

function randomString(length) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

async function drawRankCard(data) {
  const W = 1200, H = 600;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");

  // 🌸 Angel pastel background
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#ffe6f7");
  bg.addColorStop(0.5, "#e6f0ff");
  bg.addColorStop(1, "#fffaff");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // ✨ sparkles
  for (let i = 0; i < 120; i++) {
    ctx.beginPath();
    ctx.arc(Math.random() * W, Math.random() * H, Math.random() * 2.5, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,182,255,0.35)";
    ctx.fill();
  }

  // 💗 frame glow
  ctx.save();
  ctx.shadowColor = "#ffb6ff";
  ctx.shadowBlur = 40;
  ctx.strokeStyle = "rgba(255,182,255,0.5)";
  ctx.lineWidth = 10;
  roundRect(ctx, 20, 20, W - 40, H - 40, 50);
  ctx.stroke();
  ctx.restore();

  const centerX = 600, centerY = 170, radius = 100;

  // 👼 halo
  ctx.beginPath();
  ctx.arc(centerX, centerY - 120, 60, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(255,255,255,0.9)";
  ctx.lineWidth = 8;
  ctx.shadowColor = "#ffd6ff";
  ctx.shadowBlur = 20;
  ctx.stroke();

  // 💖 avatar
  ctx.save();
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.clip();
  ctx.drawImage(data.avatar, centerX - radius, centerY - radius, radius * 2, radius * 2);
  ctx.restore();

  // 💞 name
  ctx.font = "bold 48px Arial";
  ctx.fillStyle = "#ff66cc";
  ctx.textAlign = "center";
  ctx.shadowColor = "#ffffff";
  ctx.shadowBlur = 20;
  ctx.fillText(`💖 ${data.name} 💖`, W / 2, 330);

  // 🌸 left stats
  const leftX = 140, topY = 380, gap = 42;
  ctx.font = "28px Arial";
  ctx.fillStyle = "#ff66cc";

  [
    `🆔 UID: ${data.uid}`,
    `💗 Level: ${data.level}`,
    `✨ EXP: ${data.exp} / ${data.requiredExp}`,
    `💰 Money: ${data.money}`,
    `🏆 Rank: #${data.rank}`
  ].forEach((t, i) => ctx.fillText(t, leftX, topY + i * gap));

  // 💎 right stats
  const rightX = 700;
  ctx.fillStyle = "#66ccff";

  [
    `💎 Money Rank: #${data.moneyRank || "N/A"}`,
    `👑 Nickname: ${data.nickname || data.name}`,
    `🌸 Gender: ${data.gender}`,
    `💫 Username: ${data.username}`
  ].forEach((t, i) => ctx.fillText(t, rightX, topY + i * gap));

  // 💌 footer
  ctx.font = "20px Arial";
  ctx.fillStyle = "#999";
  ctx.textAlign = "center";
  ctx.fillText(
    `💌 Angel Rank • ${moment().tz("Africa/Abidjan").format("YYYY-MM-DD HH:mm")}`,
    W / 2,
    H - 25
  );

  const fileName = `angel_rank_${data.uid}_${randomString(5)}.png`;
  const filePath = path.join(__dirname, "cache", fileName);

  if (!fs.existsSync(path.dirname(filePath))) fs.mkdirSync(path.dirname(filePath));

  fs.writeFileSync(filePath, canvas.toBuffer("image/png"));
  return filePath;
}

module.exports = {
  config: {
    name: "rank",
    version: "ANGEL-1.0",
    author: "Angel Shade ✨",
    countDown: 5,
    role: 0,
    shortDescription: "Angel kawaii rank card 💖",
    category: "rank",
    guide: "{pn} [@mention or blank]"
  },

  onStart: async function ({ api, event, args, usersData, message }) {
    try {
      const { senderID, mentions, messageReply } = event;
      const uid = Object.keys(mentions)[0] || args[0] || messageReply?.senderID || senderID;

      const allUsers = await usersData.getAll();

      const sortedExp = allUsers
        .map(u => ({ id: u.userID, exp: u.exp || 0, money: u.money || 0 }))
        .sort((a, b) => b.exp - a.exp);

      const rank = sortedExp.findIndex(u => u.id === uid) + 1;

      const sortedMoney = [...allUsers].sort((a, b) => (b.money || 0) - (a.money || 0));
      const moneyRank = sortedMoney.findIndex(u => u.userID === uid) + 1;

      const userData = await usersData.get(uid);
      if (!userData) return message.reply("❌ User not found.");

      const uInfo = await api.getUserInfo(uid);
      const info = uInfo[uid];
      if (!info) return message.reply("❌ Failed to fetch info.");

      const exp = userData.exp || 0;
      const level = expToLevel(exp);
      const nextExp = levelToExp(level + 1);
      const currentExp = levelToExp(level);

      let avatar;
      try {
        avatar = await loadImage(await usersData.getAvatarUrl(uid));
      } catch {
        avatar = await loadImage("https://i.imgur.com/I3VsBEt.png");
      }

      const filePath = await drawRankCard({
        avatar,
        name: info.name || "User",
        uid,
        username: info.vanity || "Not Set",
        gender: ["Unknown", "Girl 🙋🏻‍♀️", "Boy 🙋🏻‍♂️"][info.gender] || "Unknown",
        nickname: userData.nickname || info.name,
        level,
        exp: exp - currentExp,
        requiredExp: nextExp - currentExp,
        money: userData.money || 0,
        rank,
        moneyRank
      });

      await message.reply({
        attachment: fs.createReadStream(filePath)
      });

      setTimeout(() => {
        try {
          fs.unlinkSync(filePath);
        } catch {}
      }, 30000);

    } catch (e) {
      console.log(e);
      message.reply("❌ Error generating angel rank.");
    }
  }
};
