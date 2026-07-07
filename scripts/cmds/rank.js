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

// Fonction pour abréger l'argent avec l'ajout du suffixe Q
function formatShortMoney(num) {
  if (num >= 1e15) return (num / 1e15).toFixed(1).replace(/\.0$/, "") + "Q";
  if (num >= 1e12) return (num / 1e12).toFixed(1).replace(/\.0$/, "") + "T";
  if (num >= 1e9) return (num / 1e9).toFixed(1).replace(/\.0$/, "") + "B";
  if (num >= 1e6) return (num / 1e6).toFixed(1).replace(/\.0$/, "") + "M";
  if (num >= 1e3) return (num / 1e3).toFixed(1).replace(/\.0$/, "") + "K";
  return num.toString();
}

async function drawRankCard(data) {
  const W = 1100, H = 450;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");

  // 🌌 Arrière-plan Premium Sombre
  ctx.fillStyle = "#0d0e15";
  ctx.fillRect(0, 0, W, H);

  // 🔮 Grand cercle lumineux en arrière-plan (Effet Glow)
  const glowGrad = ctx.createRadialGradient(200, 225, 50, 200, 225, 400);
  glowGrad.addColorStop(0, "rgba(108, 92, 231, 0.25)");
  glowGrad.addColorStop(1, "rgba(13, 14, 21, 0)");
  ctx.fillStyle = glowGrad;
  ctx.fillRect(0, 0, W, H);

  // 🛡️ Conteneur principal transparent/futuriste
  ctx.fillStyle = "rgba(255, 255, 255, 0.03)";
  roundRect(ctx, 30, 30, W - 60, H - 60, 30);
  ctx.fill();
  ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // 🔘 Dessin de l'Avatar (Aligné à gauche)
  const avX = 160, avY = 200, radius = 95;
  ctx.save();
  ctx.beginPath();
  ctx.arc(avX, avY, radius, 0, Math.PI * 2);
  ctx.clip();
  ctx.drawImage(data.avatar, avX - radius, avY - radius, radius * 2, radius * 2);
  ctx.restore();

  // ⭕ Contour de l'avatar avec dégradé Néon Violet/Cyan
  const borderGrad = ctx.createLinearGradient(avX - radius, avY, avX + radius, avY);
  borderGrad.addColorStop(0, "#a29bfe");
  borderGrad.addColorStop(1, "#00cec9");
  ctx.strokeStyle = borderGrad;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(avX, avY, radius + 3, 0, Math.PI * 2);
  ctx.stroke();

  // 🏷️ Pseudo & Nom d'utilisateur
  ctx.textAlign = "left";
  ctx.font = "bold 44px Arial";
  ctx.fillStyle = "#ffffff";
  ctx.fillText(data.name, 310, 110);
  ctx.font = "22px Arial";
  ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
  ctx.fillText(`@${data.username}`, 310, 145);

  // 📊 Affichage des Ranks & Badges (Style Rectangles de Statistiques)
  const drawStatBox = (x, y, w, h, label, value, color) => {
    ctx.fillStyle = "rgba(255, 255, 255, 0.02)";
    roundRect(ctx, x, y, w, h, 15);
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
    ctx.stroke();
    ctx.font = "16px Arial";
    ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
    ctx.fillText(label, x + 20, y + 32);
    ctx.font = "bold 24px Arial";
    ctx.fillStyle = color;
    ctx.fillText(value, x + 20, y + 68);
  };

  // Première ligne de stats
  drawStatBox(310, 180, 220, 85, "NIVEAU ACTUEL", `Niv. ${data.level}`, "#6c5ce7");
  drawStatBox(550, 180, 220, 85, "CLASSEMENT EXP", `#${data.rank}`, "#00cec9");
  drawStatBox(790, 180, 240, 85, "CLASSEMENT CA$H", `#${data.moneyRank || "N/A"}`, "#e17055");

  // Deuxième ligne de stats avec format abrégé appliqué au portefeuille
  drawStatBox(310, 285, 220, 85, "PORTEFEUILLE", `${formatShortMoney(data.money)}$`, "#00b894");
  drawStatBox(550, 285, 220, 85, "GENRE / PROFIL", data.gender.split(" ")[0], "#fd79a8");
  drawStatBox(790, 285, 240, 85, "UID DU COMPTE", data.uid, "#ffeaa7");

  // 📈 Barre de progression globale en bas
  const barX = 70, barY = 405, barW = W - 140, barH = 14;  
  
  // Fond de la barre
  ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
  roundRect(ctx, barX, barY, barW, barH, 7);
  ctx.fill();

  // Remplissage de la barre
  const progressPercent = Math.min(data.exp / data.requiredExp, 1);
  if (progressPercent > 0) {
    const progressGrad = ctx.createLinearGradient(barX, 0, barX + barW, 0);
    progressGrad.addColorStop(0, "#6c5ce7");
    progressGrad.addColorStop(1, "#00cec9");
    ctx.fillStyle = progressGrad;
    roundRect(ctx, barX, barY, barW * progressPercent, barH, 7);
    ctx.fill();
  }

  // Texte au-dessus de la barre de progression
  ctx.font = "bold 16px Arial";
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "left";
  ctx.fillText(`EXP: ${data.exp.toLocaleString()} / ${data.requiredExp.toLocaleString()}`, barX, barY - 12);  
  ctx.textAlign = "right";
  ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
  ctx.fillText(`${Math.round(progressPercent * 100)}%`, barX + barW, barY - 12);

  // 📅 Horodatage du système en filigrane discret
  ctx.font = "14px Arial";
  ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
  ctx.textAlign = "center";
  ctx.fillText(
    `Généré le ${moment().tz("Africa/Abidjan").format("DD/MM/YYYY à HH:mm")}`,
    W / 2,
    23
  );

  const fileName = `premium_rank_${data.uid}_${randomString(5)}.png`;
  const filePath = path.join(__dirname, "cache", fileName);
  if (!fs.existsSync(path.dirname(filePath))) fs.mkdirSync(path.dirname(filePath));
  fs.writeFileSync(filePath, canvas.toBuffer("image/png"));
  return filePath;
}

module.exports = {
  config: {
    name: "rank",
    version: "PREMIUM-2.2",
    author: "Shade × ChatGPT × Gemini",
    countDown: 5,
    role: 0,
    shortDescription: "Affiche votre carte de niveau premium",
    category: "utility",
    guide: "{pn} [@mention ou vide]"
  },

  onStart: async function ({ api, event, args, usersData, message }) {
    try {
      const { senderID, mentions, messageReply } = event;
      const uid = Object.keys(mentions)[0] || args[0] || messageReply?.senderID || senderID;

      const allUsers = await usersData.getAll();
      const sortedExp = allUsers
        .map(u => ({ id: u.userID, exp: u.exp || 0 }))
        .sort((a, b) => b.exp - a.exp);
      const rank = sortedExp.findIndex(u => u.id === uid) + 1;

      const sortedMoney = [...allUsers].sort((a, b) => (b.money || 0) - (a.money || 0));
      const moneyRank = sortedMoney.findIndex(u => u.userID === uid) + 1;

      const userData = await usersData.get(uid);
      if (!userData) return message.reply("❌ Utilisateur introuvable.");

      const uInfo = await api.getUserInfo(uid);
      const info = uInfo[uid];
      if (!info) return message.reply("❌ Impossible de charger les informations Facebook.");

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
        name: info.name || "Utilisateur",
        uid,
        username: info.vanity || "Non défini",
        gender: ["Inconnu", "Fille 🙋🏻‍♀️", "Garçon 🙋🏻‍♂️"][info.gender] || "Inconnu",
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
      message.reply("❌ Une erreur est survenue lors de la création de la carte.");
    }
  }
};
