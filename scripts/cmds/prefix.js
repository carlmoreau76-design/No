const { createCanvas, loadImage } = require("canvas");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "prefix",
    version: "1.1.0",
    author: "Shade × Gemini",
    countDown: 3,
    role: 0,
    shortDescription: { fr: "Affiche le préfixe du bot avec une carte stylisée" },
    category: "settings",
    guide: { fr: "prefix" }
  },

  // S'exécute sur tous les messages pour détecter le mot "prefix"
  onChat: async function ({ api, event, usersData }) {
    const { threadID, messageID, senderID, body } = event;

    // Détection stricte (sans casse) du mot unique "prefix"
    if (!body || body.toLowerCase().trim() !== "prefix") return;

    // Récupération dynamique du préfixe et du nom de l'utilisateur
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
      // 🔮 Image de fond
      const background = await loadImage("https://files.catbox.moe/2xr9j4.jpg");
      ctx.drawImage(background, 0, 0, width, height);
    } catch (e) {
      // Fond de secours si Catbox est instable
      ctx.fillStyle = "#0c011a";
      ctx.fillRect(0, 0, width, height);
    }

    // 🌫️ Overlay sombre global (Ambiance Cyberpunk)
    ctx.fillStyle = "rgba(10, 3, 24, 0.70)";
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
    
    // Remplissage flou de la boîte
    ctx.fillStyle = "rgba(255, 255, 255, 0.04)";
    ctx.fill();
    // Bordure néon fine
    ctx.strokeStyle = "rgba(192, 132, 252, 0.25)";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    // 👑 TITRE PRINCIPAL (Dégradé Néon)
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    
    const titleGrad = ctx.createLinearGradient(width / 2 - 300, 0, width / 2 + 300, 0);
    titleGrad.addColorStop(0, "#c084fc"); // Violet magique
    titleGrad.addColorStop(0.5, "#ffffff"); // Blanc pur
    titleGrad.addColorStop(1, "#38bdf8"); // Cyan électrique
    
    ctx.fillStyle = titleGrad;
    ctx.font = "bold 42px Arial";
    ctx.fillText("SYSTEM CONFIGURATION", width / 2, 130);

    // ✨ Séparateur lumineux sous le titre
    ctx.fillStyle = "rgba(192, 132, 252, 0.4)";
    ctx.fillRect(width / 2 - 150, 175, 300, 3);

    // 📊 AFFICHAGE DU PRÉFIXE EN GROS
    ctx.fillStyle = "#ffffff";
    ctx.font = "30px Arial";
    ctx.fillText("Le préfixe actuel est :", width / 2, 240);

    // Bulle pour le symbole du préfixe
    ctx.fillStyle = "rgba(56, 189, 248, 0.1)";
    ctx.fillRect(width / 2 - 60, 280, 120, 90);
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 1;
    ctx.strokeRect(width / 2 - 60, 280, 120, 90);

    ctx.fillStyle = "#38bdf8";
    ctx.font = "bold 65px Arial";
    ctx.fillText(currentPrefix, width / 2, 325);

    // 👤 INFO USER & TIME
    ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
    ctx.font = "24px Arial";
    ctx.fillText(`Demandé par : ${userName}`, width / 2, 420);

    // Date & Heure actuelles au format propre français
    const now = new Date();
    const timeStr = now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
    const dateStr = now.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
    
    ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
    ctx.font = "italic 20px Arial";
    ctx.fillText(`Session synchronisée le ${dateStr} à ${timeStr}`, width / 2, 480);

    // 🖥️ Mini footer
    ctx.fillStyle = "rgba(192, 132, 252, 0.6)";
    ctx.font = "bold 16px Arial";
    ctx.fillText("SHADE'S BOT OPERATIONAL NETWORK", width / 2, 540);

    // 💾 Sauvegarde temporaire sécurisée
    const cacheDir = path.join(__dirname, "cache");
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });
    const pathSave = path.join(cacheDir, `prefix_${senderID}_${Date.now()}.png`);
    
    const buffer = canvas.toBuffer("image/png");
    fs.writeFileSync(pathSave, buffer);

    // Envoi du message avec l'image
    return api.sendMessage(
      {
        body: `⚙️ **[CONFIGURATION SYSTÈME]**\n━━━━━━━━━━━━━━━━━━\n» Préfixe actuel :  [ **${currentPrefix}** ]\n» Statut : Opérationnel 🟢\n━━━━━━━━━━━━━━━━━━\n💡 _Tapez le préfixe suivi du nom d'une commande pour l'exécuter._`,
        attachment: fs.createReadStream(pathSave)
      },
      threadID,
      () => {
        try { fs.unlinkSync(pathSave); } catch (err) {}
      },
      messageID
    );
  },

  // Permet de guider si quelqu'un essaie d'utiliser le préfixe devant la commande
  onStart: async function ({ api, event }) {
    return api.sendMessage("💡 Astuce : Pas besoin de symbole ! Écrivez simplement « **prefix** » dans le chat pour voir la configuration.", event.threadID, event.messageID);
  }
};
