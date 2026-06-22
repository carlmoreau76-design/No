/**
 * @author Shade & AI
 * @title Ajout d'argent Émeraude Premium
 * @name addmoney
 * @class addmoney
 * @version 1.0.1
 * @description Ajoute de l'argent à soi-même ou à un utilisateur via reply, avec le thème émeraude.
 * @usage addmoney [montant] (en réponse ou seul)
 */

const { createCanvas, loadImage } = require("canvas");  
const path = require("path");  
const fs = require("fs");  
const axios = require("axios");

// Système d'abréviation intelligent identique à balancec
function formatMoney(amount) {
    const absoluteNum = Number(amount);
    if (isNaN(absoluteNum) || absoluteNum === 0) return "0";
    if (absoluteNum < 1000) return `${absoluteNum}`;
    
    const suffixes = ["", "K", "M", "B", "T", "Qa", "Qi"];
    let i = Math.floor(Math.log10(absoluteNum) / 3);
    
    if (i >= suffixes.length) {
        i = suffixes.length - 1;
    }
    
    const formatted = (absoluteNum / Math.pow(1000, i)).toFixed(1);
    return `${formatted.replace(/\.0$/, "")} ${suffixes[i]}`;
}

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

module.exports = {
  config: {  
    name: "addmoney",
    version: "1.0.1",  
    role: 2, // Réservé aux Admins du bot
    author: "Shade & AI",  
    description: "Ajoute de l'argent à soi-même ou à la personne à qui on répond",  
    category: "admin",  
    guide: {
      fr: "{p}{n} [montant] ou en répondant à un utilisateur : {p}{n} [montant]"
    },  
    countDown: 2  
  },

  onStart: async function ({ api, event, args, usersData }) {  
    const { threadID, messageID, senderID, type, messageReply } = event;  
    
    let targetID = senderID; 
    let amountStr = args[0];

    if (type === "message_reply" && messageReply) {
      targetID = messageReply.senderID;
      amountStr = args[0];
    }

    const amountToAdd = parseInt(amountStr);

    if (isNaN(amountToAdd) || amountToAdd < 0) {
      return api.sendMessage("❌ Veuillez entrer un montant numérique valide.\nExemple : /addmoney 5000", threadID, messageID);  
    }
    
    // Récupération des données existantes
    let targetData = await usersData.get(targetID) || {};
    if (targetData.money === undefined) targetData.money = 0;

    // ATTENTION : C'est ici qu'on FAIT UNE ADDITION (+=) au lieu d'un remplacement (=)
    targetData.money += amountToAdd;
    
    // Sauvegarde en base de données
    await usersData.set(targetID, { money: targetData.money, data: targetData.data || {}, exp: targetData.exp || 0 });
    
    const targetName = (await usersData.getName(targetID)) || "Utilisateur";
    
    const cacheDir = path.join(__dirname, "cache");
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

    // === GÉNÉRATION DE L'INTERFACE CANVAS ===  
    const canvas = createCanvas(850, 350);  
    const ctx = canvas.getContext("2d");  
    
    const bgGrad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    bgGrad.addColorStop(0, '#0a0f0d');
    bgGrad.addColorStop(0.3, '#0d1f17');
    bgGrad.addColorStop(0.6, '#0f2a1d');
    bgGrad.addColorStop(1, '#0a0f0d');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const glow = ctx.createRadialGradient(canvas.width/2, canvas.height/2, 50, canvas.width/2, canvas.height/2, 300);
    glow.addColorStop(0, "rgba(34, 197, 94, 0.15)");
    glow.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = 'rgba(34, 197, 94, 0.2)';
    ctx.lineWidth = 2;
    drawRoundedRect(ctx, 12, 12, canvas.width - 24, canvas.height - 24, 20);
    ctx.stroke();

    ctx.save();
    ctx.fillStyle = "rgba(10, 15, 13, 0.6)";
    ctx.strokeStyle = "rgba(34, 197, 94, 0.1)";
    ctx.lineWidth = 1;
    drawRoundedRect(ctx, 30, 30, canvas.width - 60, canvas.height - 60, 16);
    ctx.fill(); ctx.stroke();
    ctx.restore();
    
    const token = "6628568379%7Cc1e620fa708a1d5696fb991c1bde5662";
    const avatarUrl = `https://graph.facebook.com/${targetID}/picture?width=512&height=512&access_token=${token}`;

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
    
    ctx.save();
    ctx.fillStyle = "#ffffff";  
    ctx.font = "bold 28px sans-serif";  
    ctx.textAlign = "center";
    ctx.shadowColor = 'rgba(34, 197, 94, 0.4)';
    ctx.shadowBlur = 8;
    ctx.fillText("CASH ADDED TO ACCOUNT", canvas.width / 2, 65);  
    ctx.restore();
    
    ctx.save();
    const balanceGradient = ctx.createLinearGradient(300, 0, 550, 0);
    balanceGradient.addColorStop(0, '#4ade80');
    balanceGradient.addColorStop(0.5, '#22c55e');
    balanceGradient.addColorStop(1, '#16a34a');
    ctx.fillStyle = balanceGradient;  
    ctx.font = "bold 38px monospace";  
    ctx.textAlign = "center";
    // On affiche le nouveau solde total final
    ctx.fillText(`+ $${formatMoney(amountToAdd)} (Total: $${formatMoney(targetData.money)})`, canvas.width / 2, 250);  
    ctx.restore();
    
    ctx.fillStyle = "#ffffff";  
    ctx.font = "bold 16px sans-serif";  
    ctx.textAlign = "center";
    ctx.fillText(targetName.toUpperCase().slice(0, 25), canvas.width / 2, 285);  
    
    ctx.fillStyle = "rgba(187, 247, 208, 0.4)";  
    ctx.font = "600 11px monospace";  
    ctx.fillText("ADMIN FUNDS INJECTION SUCCESSFUL", canvas.width / 2, 315);  
    
    const pathSave = path.join(cacheDir, `addmoney_${targetID}.png`);  
    fs.writeFileSync(pathSave, canvas.toBuffer("image/png"));

    const confirmationMsg = targetID === senderID 
      ? `⚙️ Ajouté **$${formatMoney(amountToAdd)}** à ton portefeuille ! Nouveau solde : **$${formatMoney(targetData.money)}**`
      : `⚙️ Ajouté **$${formatMoney(amountToAdd)}** au portefeuille de **${targetName}** ! Nouveau solde : **$${formatMoney(targetData.money)}**`;

    return api.sendMessage({  
      body: confirmationMsg,  
      attachment: fs.createReadStream(pathSave)  
    }, threadID, () => {
      try { if (fs.existsSync(pathSave)) fs.unlinkSync(pathSave); } catch (err) {}
    }, messageID);  
  }
};
