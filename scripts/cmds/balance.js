/**
 * @author Shade
 * @title Balance Canvas v2
 * @name balance
 * @class balance
 * @version 2.0.0
 * @description Affiche votre solde sous forme de carte bancaire stylisée via Canvas (sans Currencies).
 * @usage balance
 */

const { createCanvas, loadImage } = require("canvas");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "balance",
    aliases: ["bal", "$", "cash"],
    version: "2.0.0",
    author: "Shade",
    countDown: 2,
    role: 0,
    description: "Balance style carte bancaire avec usersData",
    category: "economy",
    guide: {
      en: "{p}balance - Afficher votre carte bancaire"
    }
  },

  onStart: async function ({ api, event, usersData }) {
    const { threadID, messageID, senderID } = event;

    // Récupération et initialisation sécurisée des données de l'utilisateur
    async function getUserProfile(id) {
      let userData = await usersData.get(id);
      if (!userData) userData = {};
      if (!userData.data) userData.data = {};
      
      // Initialisation par défaut si inexistant
      if (userData.money === undefined) userData.money = 500; 
      if (userData.data.bank === undefined) userData.data.bank = { balance: 0 };
      
      return userData;
    }

    try {
      let senderProfile = await getUserProfile(senderID);
      const money = senderProfile.money || 0;
      
      // Récupération du nom d'affichage de l'utilisateur (GoatBot)
      const name = global.data?.userName?.get(senderID) || `User-${senderID.substring(0, 5)}`;

      // Récupération et calcul du classement complet via usersData
      const allData = await usersData.getAll() || [];
      const sorted = allData
        .map(u => ({
          id: u.id,
          money: u.money || 0
        }))
        .sort((a, b) => b.money - a.money);

      const rank = sorted.findIndex(u => u.id === senderID) + 1;

      // --- Dessin du Canvas ---
      const width = 850, height = 540;
      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext("2d");

      // Fond de l'image
      ctx.fillStyle = "#0b0e14";
      ctx.fillRect(0, 0, width, height);

      // Structure de la carte bancaire
      ctx.fillStyle = "#1a1e27";
      ctx.fillRect(100, 140, 650, 400);

      // Affichage du montant disponible
      ctx.fillStyle = "#e5e7eb";
      ctx.font = "bold 48px Arial";
      ctx.fillText(`${money.toLocaleString()} $`, 160, 350);

      // Affichage du nom du détenteur
      ctx.font = "24px Arial";
      ctx.fillText(name.toUpperCase(), 160, 420);

      // Badge de classement dynamique
      ctx.fillStyle = rank <= 3 ? "#f5c542" : "#22c55e";
      ctx.fillRect(560, 410, 140, 40);

      ctx.fillStyle = "#0b0e14";
      ctx.font = "bold 22px Arial";
      ctx.fillText(`RANK #${rank || 'N/A'}`, 590, 435);

      // Chargement sécurisé de l'avatar Facebook
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
        // Fallback graphique en cas d'erreur réseau / indisponibilité de l'image
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(700, 320, 35, 0, Math.PI * 2);
        ctx.fill();
      }

      // Gestion du dossier cache temporaire
      const cacheDir = path.join(__dirname, "cache");
      if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

      const pathSave = path.join(cacheDir, `bal_${senderID}.png`);
      fs.writeFileSync(pathSave, canvas.toBuffer("image/png"));

      // Expédition de l'interface visuelle générée
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
      return api.sendMessage(`Erreur interne : ${error.message}`, threadID, messageID);
    }
  }
};
