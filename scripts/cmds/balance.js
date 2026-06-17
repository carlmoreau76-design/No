const { createCanvas, loadImage } = require("canvas");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "balance",
    aliases: ["bal", "$", "cash"],
    version: "1.1.0",
    hasPermssion: 0,
    credits: "Meta AI",
    description: "Balance style carte bancaire",
    commandCategory: "economy",
    usages: "/bal",
    cooldowns: 2
  },

  // 1. On intègre Currencies dans les paramètres d'entrée
  onStart: async function ({ api, event, Currencies }) {
    const { threadID, messageID, senderID } = event;

    try {
      // 2. Récupération des données économiques de l'utilisateur
      let userData = await Currencies.getData(senderID);

      // Si l'utilisateur n'existe pas encore dans l'économie
      if (!userData) {
        await Currencies.setData(senderID, { money: 1000 });
        userData = { money: 1000 };
      }

      const money = userData.money || 0;
      const name = senderID;

      // 3. Récupération de tout le classement
      const allData = await Currencies.getAll(['money']);

      const sorted = (allData || [])
        .map(u => ({
          id: u.userID,
          money: u.money || 0
        }))
        .sort((a, b) => b.money - a.money);

      const rank = sorted.findIndex(u => u.id === senderID) + 1;

      // --- Génération du visuel Canvas ---
      const width = 850, height = 540;
      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext("2d");

      ctx.fillStyle = "#0b0e14";
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = "#1a1e27";
      ctx.fillRect(100, 140, 650, 400);

      ctx.fillStyle = "#e5e7eb";
      ctx.font = "bold 48px Arial";
      ctx.fillText(`${money.toLocaleString()} $`, 160, 350);

      ctx.font = "24px Arial";
      ctx.fillText(name.toUpperCase(), 160, 420);

      ctx.fillStyle = rank <= 3 ? "#f5c542" : "#22c55e";
      ctx.fillRect(560, 410, 140, 40);

      ctx.fillStyle = "#0b0e14";
      ctx.font = "bold 22px Arial";
      ctx.fillText(`RANK #${rank || 'N/A'}`, 590, 435);

      // Chargement sécurisé de l'avatar
      try {
        const avatar = await loadImage(
          `https://graph.facebook.com/${senderID}/picture?width=256&height=256`
        );
        ctx.save();
        ctx.beginPath();
        ctx.arc(700, 320, 35, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(avatar, 665, 285, 70, 70);
        ctx.restore();
      } catch (e) {
        console.log("Impossible de charger l'avatar Facebook");
      }

      const cacheDir = path.join(__dirname, "cache");
      if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

      const pathSave = path.join(cacheDir, `bal_${senderID}.png`);
      fs.writeFileSync(pathSave, canvas.toBuffer("image/png"));

      return api.sendMessage(
        { attachment: fs.createReadStream(pathSave) },
        threadID,
        () => {
          try { fs.unlinkSync(pathSave); } catch (err) {}
        },
        messageID
      );

    } catch (error) {
      console.error(error);
      return api.sendMessage(`Une erreur est survenue : ${error.message}`, threadID, messageID);
    }
  }
};
