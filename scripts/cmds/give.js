/** * @author Shade & AI * @title Transfert d'argent Canvas Premium (Émeraude) * @name give * @class give * @version 1.4.0 * @description Donne de l'argent de portefeuille à un autre utilisateur avec le design émeraude officiel de la Balance Card. * @usage give [@tag/reply] [montant] */
const { createCanvas, loadImage } = require("canvas");  
const path = require("path");  
const fs = require("fs");  
const axios = require("axios");

// Convertit les abréviations (1k, 1.5M, 2T) en nombres réels
function parseAmount(input) {
    if (!input) return null;
    const cleanInput = input.trim().toUpperCase();
    const match = cleanInput.match(/^([0-9.]+)\s*([KMBTQAISG]?)$/);
    if (!match) return null;

    const value = parseFloat(match[1]);
    const suffix = match[2];

    const multipliers = {
        'K': 1000,
        'M': 1000000,
        'B': 1000000000,
        'T': 100000000000,
        'QA': 100000000000000,
        'QI': 100000000000000000
    };

    if (suffix && multipliers[suffix]) {
        return Math.floor(value * multipliers[suffix]);
    }
    return Math.floor(value);
}

// Même système d'abréviation intelligent que la Balance Card
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
      name: "give",
      version: "1.4.0",
      role: 0,     
      author: "Shade & AI",      
      description: "Donne de l'argent via tag ou réponse avec gestion des abréviations (k, M, B, T) et interface Émeraude",      
      category: "economy",      
      guide: {
      fr: "{p}{n} [@tag] [montant] ou en répondant à un message : {p}{n} [montant]"
    },      
      countDown: 3
    },  
  onStart: async function ({ api, event, args, usersData }) {
      const { threadID, messageID, senderID, mentions, type, messageReply } = event;
          
    let targetID = null;
    let rawAmount = null;

    // 1. Détection de la cible et extraction de l'argument du montant
    if (type === "message_reply" && messageReply) {
      targetID = messageReply.senderID;
      rawAmount = args[0];
    } else if (mentions && Object.keys(mentions).length > 0) {
      targetID = Object.keys(mentions)[0];
      const filterArgs = args.filter(arg => !arg.includes("@"));
      rawAmount = filterArgs[0];
    }

    // Conversion de la chaîne (ex: "1k") en nombre (ex: 1000)
    let amount = parseAmount(rawAmount);

    // Validation des données d'entrée
    if (!targetID) {
      return api.sendMessage("❌ Tag la personne ou réponds à son message pour lui donner de l'argent 🫶", threadID, messageID);
    }
    if (targetID === senderID) {
      return api.sendMessage("❌ L'auto-donation est bloquée par la banque centrale.", threadID, messageID);
    }
    if (!amount || isNaN(amount) || amount <= 0) {
      return api.sendMessage("❌ Montant invalide.\nExemples : /give @nom 5k ou /give 1.5M\nEn réponse : /give 500", threadID, messageID);
    }
        
    // 2. Récupération et structuration des profils financiers
    let senderData = await usersData.get(senderID) || {};
    let targetData = await usersData.get(targetID) || {};
    if (senderData.money === undefined) senderData.money = 0;
    if (targetData.money === undefined) targetData.money = 0;
    if (senderData.money < amount) {
      return api.sendMessage(`❌ Fonds insuffisants dans ton portefeuille. (Solde actuel : ${formatMoney(senderData.money)} $)`, threadID, messageID);
    }
        
    // 3. Débit / Crédit et mise à jour de la base de données
    senderData.money -= amount;
    targetData.money += amount;
        
    await usersData.set(senderID, { money: senderData.money, data: senderData.data || {}, exp: senderData.exp || 0 });
    await usersData.set(targetID, { money: targetData.money, data: targetData.data || {}, exp: targetData.exp || 0 });
        
    // Récupération des pseudos
    const senderName = (await usersData.getName(senderID)) || "Donateur Anonyme";
    const targetName = (await usersData.getName(targetID)) || "Bénéficiaire";
        
    // Initialisation sécurisée du dossier cache
    const cacheDir = path.join(__dirname, "cache");
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });
    
    // === GÉNÉRATION DE L'INTERFACE CANVAS ===
    const canvas = createCanvas(850, 350);
    const ctx = canvas.getContext("2d");
          
    // Fond Matrix Dégradé
    const bgGrad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    bgGrad.addColorStop(0, '#0a0f0d');
    bgGrad.addColorStop(0.3, '#0d1f17');
    bgGrad.addColorStop(0.6, '#0f2a1d');
    bgGrad.addColorStop(1, '#0a0f0d');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Effet d'ambiance lueur verte au centre
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
        
    // Token sécurisé Graph API
    const token = "6628568379%7Cc1e620fa708a1d5696fb991c1bde5662";
    const senderAvatarUrl = `https://graph.facebook.com/${senderID}/picture?width=512&height=512&access_token=${token}`;
    const targetAvatarUrl = `https://graph.facebook.com/${targetID}/picture?width=512&height=512&access_token=${token}`;
    const avSize = 120;
    const sX = 140, sY = 175;
    const tX = 710, tY = 175;
    
    // Rendu des avatars
    async function drawAvatar(url, x, y) {
      try {
        const res = await axios.get(url, { responseType: "arraybuffer", timeout: 10000 });
        const img = await loadImage(Buffer.from(res.data));
                
        ctx.save();
        ctx.beginPath();
        ctx.arc(x, y, avSize / 2, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(img, x - avSize/2, y - avSize/2, avSize, avSize);
        ctx.restore();
        
        // Cercle émeraude
        ctx.save();
        ctx.shadowColor = '#22c55e';
        ctx.shadowBlur = 10;
        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 4;
        ctx.beginPath(); ctx.arc(x, y, avSize / 2, 0, Math.PI * 2); ctx.stroke();
        ctx.restore();
      } catch (e) {
        ctx.fillStyle = '#16a34a';
        ctx.beginPath(); ctx.arc(x, y, avSize / 2, 0, Math.PI * 2); ctx.fill();
      }
    }
    await drawAvatar(senderAvatarUrl, sX, sY); 
    await drawAvatar(targetAvatarUrl, tX, tY); 
         
    // Ligne centrale de liaison Émeraude
    ctx.save();
    ctx.shadowColor = "#22c55e";
    ctx.shadowBlur = 10;
        
    const lineGrad = ctx.createLinearGradient(sX + 80, 0, tX - 80, 0);
    lineGrad.addColorStop(0, "rgba(74, 222, 128, 0.2)");
    lineGrad.addColorStop(0.5, "#22c55e");
    lineGrad.addColorStop(1, "rgba(22, 163, 74, 0.6)");
        
    ctx.strokeStyle = lineGrad;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(sX + 80, 175);
    ctx.lineTo(tX - 80, 175);
    ctx.stroke();
    ctx.restore();
        
    // En-tête style carte bancaire
    ctx.save();
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 28px sans-serif";
    ctx.textAlign = "center";
    ctx.shadowColor = 'rgba(34, 197, 94, 0.4)';
    ctx.shadowBlur = 8;
    ctx.fillText("WIRE TRANSFER COMPLETED", canvas.width / 2, 85);
    ctx.restore();
        
    // Montant Vert Émeraude
    ctx.save();
    const balanceGradient = ctx.createLinearGradient(300, 0, 550, 0);
    balanceGradient.addColorStop(0, '#4ade80');
    balanceGradient.addColorStop(0.5, '#22c55e');
    balanceGradient.addColorStop(1, '#16a34a');
    ctx.fillStyle = balanceGradient;
    ctx.font = "bold 46px monospace";
    ctx.textAlign = "center";
    ctx.fillText(`$${formatMoney(amount)}`, canvas.width / 2, 190);
    ctx.restore();
        
    // Noms des comptes
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 18px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(senderName.toUpperCase().slice(0, 12), sX, sY + avSize/2 + 30);
    ctx.fillText(targetName.toUpperCase().slice(0, 12), tX, tY + avSize/2 + 30);
          
    // Pied de page
    ctx.fillStyle = "rgba(187, 247, 208, 0.4)";
    ctx.font = "600 13px monospace";
    ctx.fillText("SECURED BY APEX DIGITAL GATEWAY", canvas.width / 2, 295);
          
    // Sauvegarde et envoi
    const pathSave = path.join(cacheDir, `give_emerald_${senderID}_${targetID}.png`);
    fs.writeFileSync(pathSave, canvas.toBuffer("image/png"));
    return api.sendMessage({
        body: `💸 **${senderName}** a transféré **$${formatMoney(amount)}** sur le compte de **${targetName}** !`,
        attachment: fs.createReadStream(pathSave)
      }, threadID, () => {
      try { if (fs.existsSync(pathSave)) fs.unlinkSync(pathSave); } catch (err) {}
    }, messageID);
  }
};
