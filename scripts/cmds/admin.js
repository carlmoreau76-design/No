/**
 * @author Shade & AI
 * @title Gestion des Administrateurs Émeraude Premium
 * @name admin
 * @class admin
 * @version 1.0.1
 * @description Gère la liste des administrateurs du bot avec rendu visuel Canvas Émeraude.
 * @usage admin [list / add / remove]
 */

const { createCanvas, loadImage } = require("canvas");  
const path = require("path");  
const fs = require("fs-extra");  
const axios = require("axios");

const SUPREME_ADMIN = "61573867120837";

function drawRoundedRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
}

// Fonction de génération d'interface Canvas Émeraude
async function createAdminCard(title, userName, userId) {
    const canvas = createCanvas(850, 350);  
    const ctx = canvas.getContext("2d");  
    
    // Fond Matrix Dégradé Émeraude
    const bgGrad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    bgGrad.addColorStop(0, '#0a0f0d');
    bgGrad.addColorStop(0.3, '#0d1f17');
    bgGrad.addColorStop(0.6, '#0f2a1d');
    bgGrad.addColorStop(1, '#0a0f0d');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Lueur verte au centre
    const glow = ctx.createRadialGradient(canvas.width/2, canvas.height/2, 50, canvas.width/2, canvas.height/2, 300);
    glow.addColorStop(0, "rgba(34, 197, 94, 0.15)");
    glow.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Double bordure fine de sécurité
    ctx.strokeStyle = 'rgba(34, 197, 94, 0.2)';
    ctx.lineWidth = 2;
    drawRoundedRect(ctx, 12, 12, canvas.width - 24, canvas.height - 24, 20);
    ctx.stroke();

    // Boîte principale translucide
    ctx.save();
    ctx.fillStyle = "rgba(10, 15, 13, 0.6)";
    ctx.strokeStyle = "rgba(34, 197, 94, 0.1)";
    ctx.lineWidth = 1;
    drawRoundedRect(ctx, 30, 30, canvas.width - 60, canvas.height - 60, 16);
    ctx.fill(); ctx.stroke();
    ctx.restore();
    
    // Avatar
    const token = "6628568379%7Cc1e620fa708a1d5696fb991c1bde5662";
    const avatarUrl = `https://graph.facebook.com/${userId}/picture?width=512&height=512&access_token=${token}`;
    const avSize = 130;
    const picX = canvas.width / 2;
    const picY = 145;

    try {
      const res = await axios.get(avatarUrl, { responseType: "arraybuffer", timeout: 10000 });
      const img = await loadImage(Buffer.from(res.data));
      
      ctx.save();
      ctx.beginPath();
      ctx.arc(picX, picY, avSize / 2, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(img, picX - avSize/2, picY - avSize/2, avSize, avSize);
      ctx.restore();

      ctx.save();
      ctx.shadowColor = '#22c55e';
      ctx.shadowBlur = 15;
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(picX, picY, avSize / 2, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
    } catch (e) {
      ctx.fillStyle = '#16a34a';
      ctx.beginPath(); ctx.arc(picX, picY, avSize / 2, 0, Math.PI * 2); ctx.fill();
    }
    
    // En-tête / Action
    ctx.save();
    ctx.fillStyle = "#ffffff";  
    ctx.font = "bold 26px sans-serif";  
    ctx.textAlign = "center";
    ctx.shadowColor = 'rgba(34, 197, 94, 0.4)';
    ctx.shadowBlur = 8;
    ctx.fillText(title, canvas.width / 2, 65);  
    ctx.restore();
    
    // Nom au format Premium
    ctx.save();
    const nameGradient = ctx.createLinearGradient(300, 0, 550, 0);
    nameGradient.addColorStop(0, '#4ade80');
    nameGradient.addColorStop(0.5, '#22c55e');
    nameGradient.addColorStop(1, '#16a34a');
    ctx.fillStyle = nameGradient;  
    ctx.font = "bold 32px sans-serif";  
    ctx.textAlign = "center";
    ctx.fillText(userName.toUpperCase().slice(0, 22), canvas.width / 2, 255);  
    ctx.restore();
    
    // UID de l'utilisateur
    ctx.fillStyle = "rgba(255, 255, 255, 0.7)";  
    ctx.font = "600 16px monospace";  
    ctx.textAlign = "center";
    ctx.fillText(`UID: ${userId}`, canvas.width / 2, 285);  
    
    // Pied de page
    ctx.fillStyle = "rgba(187, 247, 208, 0.4)";  
    ctx.font = "600 11px monospace";  
    ctx.fillText("SECURITY PRIVILEGES GATEWAY MODIFIED", canvas.width / 2, 315);  
    
    return canvas.toBuffer("image/png");
}

module.exports = {
  config: {  
    name: "admin",  
    version: "1.0.1",  
    role: 2, 
    author: "Shade & AI",  
    description: "Ajoute, supprime ou liste les administrateurs du bot",  
    category: "system",  
    guide: {
      fr: "{p}{n} list\n{p}{n} add [@tag / reply / uid]\n{p}{n} remove [uid]"
    },  
    countDown: 2  
  },

  onStart: async function ({ api, event, args, usersData }) {  
    const { threadID, messageID, senderID, type, messageReply, mentions } = event;  
    const action = args[0]?.toLowerCase();

    if (!action || !["list", "add", "remove"].includes(action)) {
      return api.sendMessage("❌ Action invalide. Utilisez : list, add, ou remove.", threadID, messageID);
    }

    const configPath = path.join(process.cwd(), "config.json");
    let botConfig = {};
    if (fs.existsSync(configPath)) {
        botConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    }
    if (!botConfig.adminBot) botConfig.adminBot = [];

    // --- CASE 1 : LIST ---
    if (action === "list") {
      if (botConfig.adminBot.length === 0) {
        return api.sendMessage("💡 Aucun administrateur n'est enregistré pour le moment.", threadID, messageID);
      }
      
      let msg = "👑 **LISTE DES ADMINISTRATEURS DU BOT** 👑\n━━━━━━━━━━━━━━━━━━━━━\n";
      for (let i = 0; i < botConfig.adminBot.length; i++) {
        const uid = botConfig.adminBot[i];
        const name = await usersData.getName(uid) || "Utilisateur inconnu";
        msg += `${i + 1}. ${name}\n🔗 UID: ${uid}\n\n`;
      }
      return api.sendMessage(msg, threadID, messageID);
    }

    // --- CASE 2 : REMOVE ---
    if (action === "remove") {
      if (senderID.toString() !== SUPREME_ADMIN) {
        return api.sendMessage("⛔ Droits insuffisants. Seul le Fondateur Suprême (61573867120837) peut révoquer des admins.", threadID, messageID);
      }

      let targetID = args[1]; 
      
      if (!targetID && type === "message_reply" && messageReply) {
        targetID = messageReply.senderID;
      } else if (!targetID && mentions && Object.keys(mentions).length > 0) {
        targetID = Object.keys(mentions)[0];
      }

      if (!targetID || isNaN(targetID)) {
        return api.sendMessage("❌ Veuillez spécifier un UID valide à supprimer de la liste.", threadID, messageID);
      }

      if (!botConfig.adminBot.includes(targetID)) {
        return api.sendMessage("❌ Cet utilisateur n'est pas dans la liste des administrateurs.", threadID, messageID);
      }

      botConfig.adminBot = botConfig.adminBot.filter(id => id !== targetID);
      fs.writeFileSync(configPath, JSON.stringify(botConfig, null, 2), "utf-8");
      
      // Synchronisation globale multi-versions de structures de serveurs GoatBot
      if (global.config) global.config.adminBot = botConfig.adminBot;
      if (global.GoatBot && global.GoatBot.config) global.GoatBot.config.adminBot = botConfig.adminBot;

      const targetName = await usersData.getName(targetID) || "Ancien Admin";
      
      const cacheDir = path.join(__dirname, "cache");
      if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });
      
      const buffer = await createAdminCard("ADMINISTRATOR PRIVILEGES REVOKED", targetName, targetID);
      const pathSave = path.join(cacheDir, `admin_remove_${targetID}.png`);
      fs.writeFileSync(pathSave, buffer);

      return api.sendMessage({
        body: `🗑️ **${targetName}** a été retiré de la liste des administrateurs.`,
        attachment: fs.createReadStream(pathSave)
      }, threadID, () => { if (fs.existsSync(pathSave)) fs.unlinkSync(pathSave); }, messageID);
    }

    // --- CASE 3 : ADD ---
    if (action === "add") {
      let targetID = null;

      if (type === "message_reply" && messageReply) {
        targetID = messageReply.senderID;
      } else if (mentions && Object.keys(mentions).length > 0) {
        targetID = Object.keys(mentions)[0];
      } else if (args[1] && !isNaN(args[1])) {
        targetID = args[1].trim();
      }

      if (!targetID) {
        return api.sendMessage("❌ Cible introuvable. Répondez à un message, mentionnez (@tag) ou tapez un UID directement.", threadID, messageID);
      }

      if (botConfig.adminBot.includes(targetID)) {
        return api.sendMessage("💡 Cet utilisateur est déjà administrateur.", threadID, messageID);
      }

      botConfig.adminBot.push(targetID);
      fs.writeFileSync(configPath, JSON.stringify(botConfig, null, 2), "utf-8");
      
      // Synchronisation globale multi-versions
      if (global.config) global.config.adminBot = botConfig.adminBot;
      if (global.GoatBot && global.GoatBot.config) global.GoatBot.config.adminBot = botConfig.adminBot;

      const targetName = await usersData.getName(targetID) || "Nouvel Admin";

      const cacheDir = path.join(__dirname, "cache");
      if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });
      
      const buffer = await createAdminCard("NEW ADMINISTRATOR APPOINTED", targetName, targetID);
      const pathSave = path.join(cacheDir, `admin_add_${targetID}.png`);
      fs.writeFileSync(pathSave, buffer);

      return api.sendMessage({
        body: `✨ **${targetName}** a été promu administrateur du bot avec succès !`,
        attachment: fs.createReadStream(pathSave)
      }, threadID, () => { if (fs.existsSync(pathSave)) fs.unlinkSync(pathSave); }, messageID);
    }
  }
};
