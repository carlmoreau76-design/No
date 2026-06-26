const { createCanvas, loadImage } = require("canvas");
const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");

module.exports = {
  config: {
    name: "botjoin",
    version: "3.0.0",
    author: "Shade × Gemini",
    role: 0,
    description: "Génère une bannière de présentation Hori Sakuras avec l'avatar du bot lors de son intégration.",
    category: "events"
  },

  onStart: async function () {},

  onEvent: async function ({ api, event, prefix }) {
    if (event.logMessageType !== "log:subscribe") return;

    const { threadID, logMessageData } = event;
    const botID = api.getCurrentUserID();
    
    const isBotAdded = logMessageData.addedParticipants.some(p => p.userFbId === botID);
    if (!isBotAdded) return;

    try {
      const threadInfo = await api.getThreadInfo(threadID);
      const groupName = threadInfo.threadName || "Nouveau Secteur";
      const memberCount = threadInfo.participantIDs.length;

      // Génération de la bannière vectorielle style Hori
      const imagePath = await generateHoriJoinBanner(groupName, memberCount, prefix, threadID, botID);

      await api.sendMessage({
        body: `✨ 🌸 **[ INITIALISATION DU SYSTÈME ]** 🌸 ✨\n━━━━━━━━━━━━━━━━━━━━━━━━━━\nBonjour à tous ! Merci de m'avoir configuré dans **${groupName}**.\n\n⚙️ **Statut :** En ligne et opérationnel 🟢\n📌 **Mon Préfixe actuel :** [ **${prefix}** ]\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n💡 _Tapez \`${prefix}help\` pour découvrir l'intégralité de mes modules administratifs et de divertissement._`,
        attachment: fs.createReadStream(imagePath)
      }, threadID);

      setTimeout(() => {
        try { if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath); } catch (e) {}
      }, 5000);

    } catch (err) {
      console.error("[BOTJOIN SYSTEM ERR]", err);
    }
  }
};

// ==========================================================
// 🎨 MOTEUR GRAPHIQUE CANVAS : STYLE HORI SAKURA BANNER
// ==========================================================
async function generateHoriJoinBanner(groupName, memberCount, prefix, threadID, botID) {
  const width = 1100;
  const height = 550;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  // 1. Fond principal dégradé Hori (Prune profond à rose corail)
  const bgGrad = ctx.createLinearGradient(0, 0, width, height);
  bgGrad.addColorStop(0, '#4c0519'); 
  bgGrad.addColorStop(0.5, '#881337'); 
  bgGrad.addColorStop(1, '#f43f5e'); 
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // Helper pour dessiner des silhouettes de fleurs de cerisier (Sakura)
  function drawSakuraPetal(cx, cy, r) {
    ctx.save();
    ctx.beginPath();
    ctx.translate(cx, cy);
    for (let i = 0; i < 5; i++) {
        ctx.rotate(Math.PI * 2 / 5);
        ctx.moveTo(0, 0);
        ctx.bezierCurveTo(-r/2, -r, -r, -r*1.5, 0, -r*1.2);
        ctx.bezierCurveTo(r, -r*1.5, r/2, -r, 0, 0);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // Dessin des décors Sakuras en arrière-plan
  ctx.fillStyle = 'rgba(251, 113, 133, 0.15)';
  drawSakuraPetal(120, 100, 45);
  drawSakuraPetal(980, 120, 50);
  drawSakuraPetal(150, 460, 35);
  drawSakuraPetal(950, 430, 40);

  // 2. Double bordure fine néon asymétrique (Cyan et Rose Hori)
  ctx.strokeStyle = '#22d3ee'; 
  ctx.lineWidth = 3;
  ctx.strokeRect(15, 15, width - 30, height - 30);

  ctx.strokeStyle = '#f43f5e'; 
  ctx.lineWidth = 2;
  ctx.strokeRect(22, 22, width - 44, height - 44);

  // 3. Dessin des cercles néons de gauche pour l'avatar
  const centerX = 230;
  const centerY = height / 2;
  const avatarRadius = 85;

  // Halo lumineux extérieur
  ctx.save();
  ctx.shadowColor = "#22d3ee";
  ctx.shadowBlur = 25;
  ctx.strokeStyle = "#22d3ee";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(centerX, centerY, avatarRadius + 12, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // Cercle intérieur rose
  ctx.strokeStyle = "#f43f5e";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(centerX, centerY, avatarRadius + 4, 0, Math.PI * 2);
  ctx.stroke();

  // 4. Récupération et incrustation dynamique de la photo de profil du bot
  try {
    const botAvatarUrl = `https://graph.facebook.com/${botID}/picture?width=400&height=400&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
    const response = await axios.get(botAvatarUrl, { responseType: 'arraybuffer' });
    const imgBuffer = Buffer.from(response.data, 'binary');
    const botImg = await loadImage(imgBuffer);

    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, avatarRadius, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(botImg, centerX - avatarRadius, centerY - avatarRadius, avatarRadius * 2, avatarRadius * 2);
    ctx.restore();
  } catch (e) {
    // Remplacement si l'API graphique échoue momentanément
    ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
    ctx.beginPath();
    ctx.arc(centerX, centerY, avatarRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 40px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("BOT", centerX, centerY);
  }

  // 5. Grand panneau d'information vitré (Glassmorphism de droite)
  const boxX = 410;
  const boxY = 60;
  const boxW = 630;
  const boxH = 420;

  ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(boxX, boxY, boxW, boxH, [0, 24, 24, 24]);
  } else {
    ctx.rect(boxX, boxY, boxW, boxH);
  }
  ctx.fill();
  ctx.strokeStyle = 'rgba(244, 63, 94, 0.35)';
  ctx.lineWidth = 2;
  ctx.stroke();

  // 6. Textes internes (Style Hori aligné)
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';

  // Titre principal de la carte
  const titleGrad = ctx.createLinearGradient(boxX + 40, 0, boxX + 450, 0);
  titleGrad.addColorStop(0, '#ffffff');
  titleGrad.addColorStop(0.5, '#f43f5e');
  titleGrad.addColorStop(1, '#fb923c');
  ctx.fillStyle = titleGrad;
  ctx.font = 'bold 42px Arial';
  ctx.fillText("SYSTEM INITIALIZED", boxX + 40, boxY + 45);

  // Message de configuration
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 24px Arial';
  ctx.fillText("Merci de m'avoir configuré", boxX + 40, boxY + 125);

  // Nom du groupe
  ctx.fillStyle = '#fecdd3';
  ctx.font = '24px Arial';
  const cleanGroup = groupName.length > 25 ? groupName.substring(0, 23) + "..." : groupName;
  ctx.fillText(`📍 Salon : ${cleanGroup} ✧`, boxX + 40, boxY + 175);

  // Nombre de membres détectés
  ctx.fillStyle = '#99f6e4';
  ctx.font = '20px Arial';
  ctx.fillText(`👥 Analyse : ${memberCount} synchronisés`, boxX + 40, boxY + 230);

  // 7. Conteneur stylisé pour le préfixe (Badge horizontal en bas)
  const badgeX = boxX + 40;
  const badgeY = boxY + 295;
  const badgeW = 480;
  const badgeH = 65;

  ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 12);
  } else {
    ctx.rect(badgeX, badgeY, badgeW, badgeH);
  }
  ctx.fill();
  ctx.strokeStyle = '#f43f5e';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Texte à l'intérieur du badge de commande
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 22px Arial';
  ctx.fillText(`COMMAND PREFIX: ${prefix}`, badgeX + (badgeW / 2), badgeY + (badgeH / 2));

  // 8. Pied de page global (Footer de la carte)
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.font = 'bold 13px Arial';
  ctx.fillText('🌸 HORI-STYLE SYSTEM SUPPORT • CHAT BOT JOIN 🌸', width / 2, height - 40);

  // Enregistrement sur l'espace disque temporaire
  const cacheDir = path.join(__dirname, "..", "cache");
  await fs.ensureDir(cacheDir);
  const pathSave = path.join(cacheDir, `botjoin_${threadID}_${Date.now()}.png`);
  fs.writeFileSync(pathSave, canvas.toBuffer("image/png"));
  return pathSave;
}
