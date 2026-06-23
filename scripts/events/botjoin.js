const { createCanvas, loadImage } = require("canvas");
const fs = require("fs-extra");
const path = require("path");

// 👑 Vos informations configurées
const ownerInfo = {
  name: "ヾ Kαɪ.夜",
  facebook: "https://www.facebook.com/shade.userX",
  instagram: "x.shade108",
  supportGroup: "꒰ა 𝘚𝘶𝘱𝘱𝘰ʳᵗ 𝘣𝘪𝘦𝘯𝒕𝒐̂𝒕 𝘥𝘪𝘴𝘱𝘰𝘯𝘪𝘣𝘭𝑒 ໒꒱"
};

module.exports = {
  config: {
    name: "botjoin",
    version: "2.2.0",
    author: "Gemini & Angel System",
    role: 0,
    description: "Génère une bannière de présentation graphique haut de gamme lorsque le bot est intégré à un groupe.",
    category: "events"
  },

  // Évite l'erreur "Function onStart is missing!" lors du chargement
  onStart: async function () {},

  onEvent: async function ({ api, event, prefix }) {
    // Filtrer pour ne déclencher le script que si le bot lui-même est ajouté
    if (event.logMessageType !== "log:subscribe") return;

    const { threadID, logMessageData } = event;
    const botID = api.getCurrentUserID();
    
    // Vérifier si l'UID du bot fait partie des nouveaux arrivants
    const isBotAdded = logMessageData.addedParticipants.some(p => p.userFbId === botID);
    if (!isBotAdded) return;

    const nickNameBot = global.GoatBot.config.nickNameBot || "Angel Bot ✨";

    // Changement de pseudo automatique du Bot
    try {
      await api.changeNickname(nickNameBot, threadID, botID);
    } catch (e) {
      console.log("Impossible de changer le pseudo du bot :", e);
    }

    try {
      // Collecte des données du salon
      const threadInfo = await api.getThreadInfo(threadID);
      const groupName = threadInfo.threadName || "Nouveau Secteur";
      const memberCount = threadInfo.participantIDs.length;

      // Génération de la bannière technologique avec l'ATH Cyberpunk
      const imagePath = await generateBotJoinBanner(groupName, memberCount, prefix, threadID);

      // Message Premium incluant tes coordonnées d'owner
      const msg = `╭ ◜◝ ͡ ◜◝ ͡ ◝╮
♡ 𝘼𝙣𝙜𝙚𝙡 𝘽𝙤𝙩 ♡
╰ ◟◞ ͜ ◟◞ ╯

🎀 𝐓𝐡𝐚𝐧𝐤 𝐲𝐨υ 𝐟𝐨𝐫 𝐢𝐧𝐯𝐢𝐭𝐢𝐧𝐠 𝐦𝐞

🔹 𝐏𝐫𝐞𝐟𝐢𝐱 : ${prefix}
🔸 𝐔𝐬𝐞 : ${prefix}help

💫 𝐈’𝐦 𝐀𝐧𝐠𝐞λ 𝐁𝐨𝐭

╭══════════════╮
👑 𝐎𝐰𝐧𝐞𝐫 : ${ownerInfo.name}
🌐 𝐅𝐚𝐜𝐞𝐛𝐨𝐨𝐤 : ${ownerInfo.facebook}
✈️ 𝐈𝐧𝐬𝐭𝐚𝐠𝐫𝐚𝐦 : ${ownerInfo.instagram}
🤖 𝐒𝐮𝐩𝐩𝐨𝐫𝐭 : ${ownerInfo.supportGroup}
╰══════════════╯

✨ 𝐀𝐥𝐰𝐚𝐲𝐬 𝐚𝐜𝐭𝐢𝐯𝐞 • 𝐒𝐭𝐚𝐲 𝐜𝐮𝐭𝐞 ✨`;

      // Envoi du message d'initialisation avec la pièce jointe
      await api.sendMessage({
        body: msg,
        attachment: fs.createReadStream(imagePath)
      }, threadID);

      // Nettoyage instantané du cache
      setTimeout(() => {
        try { if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath); } catch (e) {}
      }, 3500);

    } catch (err) {
      console.error("[BOTJOIN SYSTEM ERR]", err);
    }
  }
};

// ==========================================================
// 🎨 MOTEUR GRAPHIQUE CANVAS (PRÉSENTATION DU BOT)
// ==========================================================
async function generateBotJoinBanner(groupName, memberCount, prefix, threadID) {
  const width = 1100;
  const height = 500;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  // 1. Fond Cyberpunk abstrait violet et néon profond
  const bgGrad = ctx.createLinearGradient(0, 0, width, height);
  bgGrad.addColorStop(0, "#0a041a");
  bgGrad.addColorStop(0.5, "#1b0933");
  bgGrad.addColorStop(1, "#030f26");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // 2. Grille de données futuriste (ATH / HUD Effect)
  ctx.strokeStyle = "rgba(0, 242, 254, 0.04)";
  ctx.lineWidth = 1.5;
  for (let i = 0; i < width; i += 40) {
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, height); ctx.stroke();
  }
  for (let j = 0; j < height; j += 40) {
    ctx.beginPath(); ctx.moveTo(0, j); ctx.lineTo(width, j); ctx.stroke();
  }

  // 3. Cadre géométrique néon à angles coupés
  ctx.strokeStyle = "rgba(168, 85, 247, 0.4)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(35, 50);
  ctx.lineTo(width - 50, 35);
  ctx.lineTo(width - 35, 50);
  ctx.lineTo(width - 35, height - 50);
  ctx.lineTo(width - 50, height - 35);
  ctx.lineTo(35, height - 35);
  ctx.closePath();
  ctx.stroke();

  // 4. Logo central symbolique (Intelligence Artificielle en ligne)
  const centerX = 220;
  const centerY = height / 2;
  
  ctx.save();
  ctx.shadowColor = "#00f2fe";
  ctx.shadowBlur = 30;
  ctx.fillStyle = "rgba(0, 242, 254, 0.1)";
  ctx.beginPath(); ctx.arc(centerX, centerY, 90, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  ctx.strokeStyle = "#00f2fe";
  ctx.lineWidth = 4;
  ctx.beginPath(); ctx.arc(centerX, centerY, 90, 0, Math.PI * 2); ctx.stroke();

  // Dessin d'un mini-ATH interne au cercle
  ctx.strokeStyle = "rgba(168, 85, 247, 0.7)";
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(centerX, centerY, 102, 0.2, Math.PI * 1.4); ctx.stroke();
  ctx.beginPath(); ctx.arc(centerX, centerY, 102, Math.PI + 0.2, Math.PI * 1.9); ctx.stroke();

  // Icône texte IA au centre du cercle
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 48px Arial Black";
  ctx.fillText("AI", centerX, centerY);

  // 5. Section d'affichage des textes informatifs (Alignés à gauche)
  ctx.textAlign = "left";
  const textStartX = 390;

  // En-tête de protocole
  ctx.fillStyle = "#ff007f";
  ctx.font = "bold 16px Courier New";
  ctx.fillText("📡 // BOT_CORE_SYSTEM : ONLINE_ESTABLISHED", textStartX, height / 2 - 100);

  // Titre principal de salutation
  const mainGrad = ctx.createLinearGradient(textStartX, 0, textStartX + 450, 0);
  mainGrad.addColorStop(0, "#ffffff");
  mainGrad.addColorStop(1, "#00f2fe");
  ctx.fillStyle = mainGrad;
  ctx.font = "bold 46px sans-serif";
  ctx.fillText("SYSTEM INITIALIZED", textStartX, height / 2 - 45);

  // Insertion du nom du groupe connecté
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 26px Arial";
  const cleanGroup = groupName.length > 30 ? groupName.substring(0, 28) + "..." : groupName;
  ctx.fillText(`📍 Salon : ${cleanGroup}`, textStartX, height / 2 + 15);

  // Nombre de membres détectés à l'arrivée
  ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
  ctx.font = "19px sans-serif";
  ctx.fillText(`👥 Analyse : ${memberCount} utilisateurs synchronisés`, textStartX, height / 2 + 55);

  // 6. Affichage du badge d'utilisation du préfixe
  const badgeText = `COMMAND PREFIX : ${prefix}`;
  ctx.font = "bold 15px Courier New";
  const textWidth = ctx.measureText(badgeText).width;

  ctx.fillStyle = "rgba(255, 0, 127, 0.1)";
  ctx.strokeStyle = "rgba(255, 0, 127, 0.4)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(textStartX, height / 2 + 95, textWidth + 24, 32, 4);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#ff007f";
  ctx.fillText(badgeText, textStartX + 12, height / 2 + 112);

  // 7. Enregistrement sur l'espace disque temporaire
  const cacheDir = path.join(__dirname, "cache");
  await fs.ensureDir(cacheDir);
  const pathSave = path.join(cacheDir, `botjoin_${threadID}_${Date.now()}.png`);
  await fs.writeFile(pathSave, canvas.toBuffer("image/png"));
  return pathSave;
}
