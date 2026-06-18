const { createCanvas, loadImage } = require("canvas");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "prefix",
    version: "1.0.1",
    author: "Shade",
    countDown: 3,
    role: 0,
    shortDescription: { en: "Affiche le système de prefix du bot" },
    category: "settings",
    guide: { en: "prefix" }
  },

  // Cette fonction s'exécute sur TOUS les messages pour détecter le mot sans préfixe
  onChat: async function ({ api, event }) {
    const { threadID, messageID, senderID, body } = event;

    // Si le message n'est pas exactement "prefix" (indépendant de la casse), on ne fait rien
    if (!body || body.toLowerCase() !== "prefix") return;

    // Récupération dynamique du préfixe du bot
    const currentPrefix = global.GoatBot?.config?.prefix || ".";

    const width = 1200;
    const height = 600;

    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    try {
      // 🔮 Background image
      const background = await loadImage("https://files.catbox.moe/2xr9j4.jpg");
      ctx.drawImage(background, 0, 0, width, height);
    } catch (e) {
      // En cas de problème de lien, met un fond uni pour éviter le crash
      ctx.fillStyle = "#140028";
      ctx.fillRect(0, 0, width, height);
    }

    // 🌫 Overlay sombre violet
    ctx.fillStyle = "rgba(20, 0, 40, 0.65)";
    ctx.fillRect(0, 0, width, height);

    // ✨ Title
    ctx.fillStyle = "#c084fc";
    ctx.font = "bold 50px Arial";
    ctx.textAlign = "center";
    ctx.fillText("⚉ SHADE'S BOT PREFIX SYSTEM ⚉", width / 2, 120);

    // 📌 Infos
    ctx.fillStyle = "#ffffff";
    ctx.font = "30px Arial";

    ctx.fillText(`User: ${senderID}`, width / 2, 200);
    ctx.fillText(`Global Prefix: ${currentPrefix}`, width / 2, 260);
    ctx.fillText(`Chat Prefix: ${currentPrefix}`, width / 2, 320);

    // ⏰ Time
    const now = new Date();
    const time = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    ctx.fillText(`Time: ${time}`, width / 2, 380);

    // 📅 Date
    const date = now.toDateString();
    ctx.fillText(`Date: ${date}`, width / 2, 440);

    // 💾 Gestion sécurisée du dossier cache
    const cacheDir = path.join(__dirname, "cache");
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

    const pathSave = path.join(cacheDir, `prefix_${senderID}.png`);
    
    const buffer = canvas.toBuffer("image/png");
    fs.writeFileSync(pathSave, buffer);

    return api.sendMessage(
      {
        attachment: fs.createReadStream(pathSave),
        body: "⚉ SHADE PREFIX SYSTEM ⚉"
      },
      threadID,
      () => {
        try { fs.unlinkSync(pathSave); } catch (err) {}
      },
      messageID
    );
  },

  // Laisser un onStart vide ou avec un message pour éviter le crash du chargeur de commandes
  onStart: async function ({ api, event }) {
    return api.sendMessage("Tapez simplement « prefix » sans aucun symbole pour voir le système.", event.threadID, event.messageID);
  }
};
