const { createCanvas, loadImage } = require("canvas");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "prefix",
    version: "1.2.0",
    author: "Shade × Gemini",
    countDown: 3,
    role: 0,
    shortDescription: { fr: "Affiche le préfixe du bot avec une carte stylisée Hori" },
    category: "settings",
    guide: { fr: "prefix" }
  },

  onChat: async function ({ api, event, usersData }) {
    const { threadID, messageID, senderID, body } = event;

    if (!body || body.toLowerCase().trim() !== "prefix") return;

    const currentPrefix = global.GoatBot?.config?.prefix || ".";
    let userName = "Utilisateur";
    try {
      userName = await usersData.getName(senderID) || "Utilisateur";
    } catch (e) {}

    // Dimensions Canvas
    const width = 1200;
    const height = 650;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    try {
      // 🌸 Nouvelle Image de fond (Hori Kyoko)
      const background = await loadImage("https://i.imgur.com/pUCStOk.jpeg");
      
      // Ajustement intelligent pour centrer proprement l'image sans la déformer
      const imgRatio = background.width / background.height;
      const canvasRatio = width / height;
      let renderWidth, renderHeight, xOffset, yOffset;

      if (imgRatio > canvasRatio) {
        renderHeight = height;
        renderWidth = background.width * (height / background.height);
        xOffset = (width - renderWidth) / 2;
        yOffset = 0;
      } else {
        renderWidth = width;
        renderHeight = background.height * (width / background.width);
        xOffset = 0;
        yOffset = (height - renderHeight) / 2;
      }

      ctx.drawImage(background, xOffset, yOffset, renderWidth, renderHeight);
    } catch (e) {
      ctx.fillStyle = "#1a0f1a";
      ctx.fillRect(0, 0, width, height);
    }

    // 🌫️ Overlay sombre pour garantir la lisibilité du texte
    ctx.fillStyle = "rgba(15, 10, 20, 0.65)";
    ctx.fillRect(0, 0, width, height);

    // 🛡️ Boîte centrale effet "Glassmorphism"
    const boxX = 100;
    const boxY = 60;
    const boxWidth = 1000;
    const boxHeight = 530;
    const radius = 24;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(boxX + radius, boxY);
    ctx.lineTo(boxX + boxWidth - radius, boxY);
    ctx.quadraticCurveTo(boxX + boxWidth, boxY, boxX + boxWidth, boxY + radius);
    ctx.lineTo(boxX + boxWidth, boxY + boxHeight - radius);
    ctx.quadraticCurveTo(boxX + boxWidth, boxY + boxHeight, boxX + boxWidth - radius, boxY + boxHeight);
    ctx.lineTo(boxX + radius, boxY + boxHeight);
    ctx.quadraticCurveTo(boxX, boxY + boxHeight, boxX, boxY + boxHeight - radius);
    ctx.lineTo(boxX, boxY + radius);
    ctx.quadraticCurveTo(boxX, boxY, boxX + radius, boxY);
    ctx.closePath();
    
    ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
    ctx.fill();
    ctx.strokeStyle = "rgba(244, 63, 94, 0.3)"; // Teinte rose/rouge douce pour correspondre à Hori
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    // 👑 TITRE PRINCIPAL (Dégradé assorti)
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    
    const titleGrad = ctx.createLinearGradient(width / 2 - 300, 0, width / 2 + 300, 0);
    titleGrad.addColorStop(0, "#f43f5e"); // Rose vif
    titleGrad.addColorStop(0.5, "#ffffff"); // Blanc pur
    titleGrad.addColorStop(1, "#fb923c"); // Orange doux
    
    ctx.fillStyle = titleGrad;
    ctx.font = "bold 42px Arial";
    ctx.fillText("HORI SYSTEM CONFIGURATION", width / 2, 130);

    // ✨ Séparateur lumineux sous le titre
    ctx.fillStyle = "rgba(244, 63, 94, 0.4)";
    ctx.fillRect(width / 2 - 150, 175, 300, 3);

    // 📊 AFFICHAGE DU PRÉFIXE EN GROS
    ctx.fillStyle = "#ffffff";
    ctx.font = "30px Arial";
    ctx.fillText("Le préfixe actuel est :", width / 2, 240);

    // Bulle pour le symbole du préfixe
    ctx.fillStyle = "rgba(244, 63, 94, 0.15)";
    ctx.fillRect(width / 2 - 60, 280, 120, 90);
    ctx.strokeStyle = "#f43f5e";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(width / 2 - 60, 280, 120, 90);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 65px Arial";
    ctx.fillText(currentPrefix, width / 2, 325);

    // 👤 INFO USER & TIME
    ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
    ctx.font = "24px Arial";
    ctx.fillText(`Demandé par : ${userName}`, width / 2, 420);

    const now = new Date();
    const timeStr = now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
    const dateStr = now.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
    
    ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
    ctx.font = "italic 20px Arial";
    ctx.fillText(`Session synchronisée le ${dateStr} à ${timeStr}`, width / 2, 480);

    // 🖥️ Mini footer
    ctx.fillStyle = "rgba(244, 63, 94, 0.7)";
    ctx.font = "bold 16px Arial";
    ctx.fillText("SHADE'S BOT OPERATIONAL NETWORK", width / 2, 540);

    // 💾 Sauvegarde temporaire
    const cacheDir = path.join(__dirname, "cache");
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });
    const pathSave = path.join(cacheDir, `prefix_${senderID}_${Date.now()}.png`);
    
    const buffer = canvas.toBuffer("image/png");
    fs.writeFileSync(pathSave, buffer);

    // Envoi du message avec l'image générée
    return api.sendMessage(
      {
        body: `✨ 🌸 **[ CONFIGURATION SYSTEME ]** 🌸 ✨\n━━━━━━━━━━━━━━━━━━━━━━\n» **Préfixe actuel :** [ **${currentPrefix}** ]\n» **Statut :** Opérationnel 🟢\n━━━━━━━━━━━━━━━━━━━━━━\n💡 _Tapez le préfixe suivi du nom d'une commande pour l'exécuter._`,
        attachment: fs.createReadStream(pathSave)
      },
      threadID,
      () => {
        try { fs.unlinkSync(pathSave); } catch (err) {}
      },
      messageID
    );
  },

  onStart: async function ({ api, event }) {
    return api.sendMessage("💡 Astuce : Pas besoin de symbole ! Écrivez simplement « **prefix** » dans le chat pour voir la configuration.", event.threadID, event.messageID);
  }
};
