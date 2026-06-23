const { createCanvas, loadImage } = require("canvas");
const fs = require("fs-extra");
const path = require("path");
const moment = require("moment-timezone");

const OWNER_ID = "61573867120837"; // Votre ID Exclusif
const FB_TOKEN = "6628568379%7Cc1e620fa708a1d5696fb991c1bde5662"; // Token pour les avatars

// Fonction utilitaire pour générer les bannières d'action (Ban / Unban)
async function generateActionBanner(uid, name, actionType, reason = "") {
  const canvas = createCanvas(1000, 300);
  const ctx = canvas.getContext("2d");

  // Fond dégradé dynamique selon l'action
  const grad = ctx.createLinearGradient(0, 0, 1000, 300);
  if (actionType === "BAN") {
    grad.addColorStop(0, "#1a0505");
    grad.addColorStop(1, "#660000");
  } else {
    grad.addColorStop(0, "#051a05");
    grad.addColorStop(1, "#006622");
  }
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1000, 300);

  // Overlay sombre et bordure
  ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
  ctx.fillRect(0, 0, 1000, 300);
  ctx.strokeStyle = actionType === "BAN" ? "#ff3333" : "#33ff33";
  ctx.lineWidth = 6;
  ctx.strokeRect(15, 15, 970, 270);

  // Rendu de l'avatar circulaire
  const avatarUrl = `https://graph.facebook.com/${uid}/picture?width=300&height=300&access_token=${FB_TOKEN}`;
  const avatarX = 150, avatarY = 150, radius = 80;
  
  ctx.save();
  ctx.beginPath();
  ctx.arc(avatarX, avatarY, radius, 0, Math.PI * 2);
  ctx.clip();
  try {
    const img = await loadImage(avatarUrl);
    ctx.drawImage(img, avatarX - radius, avatarY - radius, radius * 2, radius * 2);
  } catch (e) {
    ctx.fillStyle = actionType === "BAN" ? "#ff3333" : "#33ff33";
    ctx.fill();
  }
  ctx.restore();

  // Bordure avatar
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(avatarX, avatarY, radius + 2, 0, Math.PI * 2);
  ctx.stroke();

  // Textes descriptifs
  ctx.textAlign = "left";
  ctx.fillStyle = "#ffffff";
  
  ctx.font = "bold 24px Arial";
  ctx.fillStyle = actionType === "BAN" ? "#ff3333" : "#33ff33";
  ctx.fillText(`[PROTOCOLE SÉCURITÉ : ${actionType}]`, 280, 80);

  ctx.font = "bold 36px Arial";
  ctx.fillStyle = "#ffffff";
  ctx.fillText(name.length > 25 ? name.substring(0, 23) + "..." : name, 280, 135);

  ctx.font = "20px Arial";
  ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
  ctx.fillText(`ID de la cible : ${uid}`, 280, 180);

  if (actionType === "BAN") {
    ctx.font = "italic 20px Arial";
    ctx.fillStyle = "#ffcccc";
    ctx.fillText(`Raison : ${reason.substring(0, 50)}`, 280, 225);
  } else {
    ctx.font = "italic 20px Arial";
    ctx.fillStyle = "#ccffcc";
    ctx.fillText("Statut : Accès de nouveau autorisé au terminal.", 280, 225);
  }

  const cacheDir = path.join(__dirname, "cache");
  await fs.ensureDir(cacheDir);
  const pathSave = path.join(cacheDir, `ban_action_${uid}_${Date.now()}.png`);
  await fs.writeFile(pathSave, canvas.toBuffer("image/png"));
  return pathSave;
}

module.exports = {
  config: {
    name: "ban",
    aliases: ["blacklist", "block"],
    version: "4.0.0",
    author: "Shade × Gemini",
    countDown: 3,
    role: 2, // Propriétaire / Admin du bot
    description: "🛡️ Système d'exclusion et de bannissement graphique complet (Owner Only)",
    category: "admin",
    guide: {
      fr: "{p}{n} [@tag | uid | reply] [Raison] → Bannir\n{p}{n} unban [@tag | uid | reply] → Réhabiliter\n{p}{n} list → Liste graphique des bannis"
    }
  },

  // Intercepte et bloque instantanément l'exécution des membres bannis
  onChat: async function ({ api, event, threadsData }) {
    const { threadID, senderID, body } = event;
    if (!body || senderID === OWNER_ID) return;

    const threadData = await threadsData.get(threadID) || {};
    const dataBanned = threadData.data?.banned_ban || [];

    if (dataBanned.some(u => u.id == senderID)) {
      try { api.setMessageReaction("🚫", event.messageID, () => {}, true); } catch (e) {}
      return; 
    }
  },

  onStart: async function ({ message, event, args, threadsData, usersData, api }) {
    const { threadID, messageID, senderID, mentions, type, messageReply } = event;

    // Restriction stricte de sécurité à l'Owner
    if (senderID !== OWNER_ID) {
      try { api.setMessageReaction("❌", messageID, () => {}, true); } catch(e){}
      return message.reply("⛔ **[ACCÈS REFUSÉ]** Seul le Fondateur Suprême possède l'autorité d'exclusion.");
    }

    const threadData = await threadsData.get(threadID) || {};
    const dataBanned = threadData.data?.banned_ban || [];
    const action = args[0]?.toLowerCase();

    // ==========================================
    // 🔓 CASE 1 : UNBAN (RÉHABILITATION)
    // ==========================================
    if (action === "unban") {
      let target = null;
      if (type === "message_reply") target = messageReply.senderID;
      else if (Object.keys(mentions).length > 0) target = Object.keys(mentions)[0];
      else if (args[1] && !isNaN(args[1])) target = args[1];

      if (!target) return message.reply("⚠️ Veuillez spécifier un UID, taguer la cible ou faire un reply.");

      const index = dataBanned.findIndex(i => i.id == target);
      if (index === -1) return message.reply("⚠️ Ce sujet n'est pas répertorié dans la blacklist de ce groupe.");

      dataBanned.splice(index, 1);
      await threadsData.set(threadID, dataBanned, "data.banned_ban");

      const name = await usersData.getName(target) || "Utilisateur";
      const imagePath = await generateActionBanner(target, name, "UNBAN");

      try { api.setMessageReaction("🔓", messageID, () => {}, true); } catch(e){}
      return api.sendMessage({
        body: `🔓 **[RÉHABILITATION]** L'accès a été restauré pour **${name}**.`,
        attachment: fs.createReadStream(imagePath)
      }, threadID, () => { try { fs.unlinkSync(imagePath); } catch (e) {} }, messageID);
    }

    // ==========================================
    // 📊 CASE 2 : LIST (AFFICHAGE CANVAS)
    // ==========================================
    if (action === "list") {
      if (!dataBanned.length) return message.reply("📡 Aucun bannissement actif enregistré dans ce groupe.");

      // Limiter à 4 profils visibles sur la carte pour rester esthétique
      const activeDisplay = dataBanned.slice(0, 4);
      const width = 1200, height = 500;
      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext("2d");

      // Fond technologique
      ctx.fillStyle = "#0d031c";
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = "rgba(192, 132, 252, 0.05)";
      ctx.fillRect(20, 20, width - 40, height - 40);
      ctx.strokeStyle = "rgba(192, 132, 252, 0.3)";
      ctx.lineWidth = 2;
      ctx.strokeRect(20, 20, width - 40, height - 40);

      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#ff3333";
      ctx.font = "bold 36px Arial";
      ctx.fillText("💀 BLACKLIST — TERMINAL DES BANNIS 💀", width / 2, 60);

      const cardWidth = 220;
      const totalWidth = activeDisplay.length * cardWidth + (activeDisplay.length - 1) * 40;
      let startX = (width - totalWidth) / 2 + cardWidth / 2;
      const centerY = 260;

      for (const u of activeDisplay) {
        const name = await usersData.getName(u.id) || "Inconnu";
        const avatarUrl = `https://graph.facebook.com/${u.id}/picture?width=300&height=300&access_token=${FB_TOKEN}`;

        ctx.save();
        ctx.beginPath();
        ctx.arc(startX, centerY - 20, 75, 0, Math.PI * 2);
        ctx.clip();
        try {
          const img = await loadImage(avatarUrl);
          ctx.drawImage(img, startX - 75, centerY - 95, 150, 150);
        } catch (e) {
          ctx.fillStyle = "#ff3333";
          ctx.fill();
        }
        ctx.restore();

        ctx.strokeStyle = "#ff3333";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(startX, centerY - 20, 77, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 20px Arial";
        ctx.fillText(name.length > 14 ? name.substring(0, 12) + ".." : name, startX, centerY + 85);

        ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
        ctx.font = "13px Arial";
        ctx.fillText(`ID: ${u.id}`, startX, centerY + 115);

        ctx.fillStyle = "#ffcccc";
        ctx.font = "italic 13px Arial";
        ctx.fillText(u.reason.length > 20 ? u.reason.substring(0, 18) + ".." : u.reason, startX, centerY + 140);

        startX += cardWidth + 40;
      }

      const cacheDir = path.join(__dirname, "cache");
      const pathSave = path.join(cacheDir, `ban_list_${Date.now()}.png`);
      await fs.writeFile(pathSave, canvas.toBuffer("image/png"));

      try { api.setMessageReaction("📡", messageID, () => {}, true); } catch(e){}
      return api.sendMessage({
        body: `🖥️ **[FICHIER BLACKLIST]**\nTotal de sujets déconnectés dans ce groupe : ${dataBanned.length}`,
        attachment: fs.createReadStream(pathSave)
      }, threadID, () => { try { fs.unlinkSync(pathSave); } catch (e) {} }, messageID);
    }

    // ==========================================
    // 💀 CASE 3 : BAN TARGET (EXCLUSION)
    // ==========================================
    let target = null;
    let reasonText = "";

    if (type === "message_reply") {
      target = messageReply.senderID;
      reasonText = args.join(" ").trim();
    } else if (Object.keys(mentions).length > 0) {
      target = Object.keys(mentions)[0];
      // On retire la mention textuelle brute des arguments pour isoler la raison
      const mentionName = mentions[target];
      reasonText = args.join(" ").replace(mentionName, "").replace("@", "").trim();
    } else if (args[0] && !isNaN(args[0])) {
      target = args[0];
      reasonText = args.slice(1).join(" ").trim();
    }

    if (!target) return message.reply("⚠️ Configuration de cible incorrecte. Indiquez un UID, mentionnez l'utilisateur ou répondez à son message.");
    if (target == senderID) return message.reply("❌ Auto-destruction impossible. Vous ne pouvez pas vous bannir vous-même.");
    if (dataBanned.some(u => u.id == target)) return message.reply("⚠️ Ce sujet est déjà répertorié comme banni.");

    const name = await usersData.getName(target) || "Sujet Indexé";
    const time = moment().tz("Africa/Kinshasa").format("HH:mm [le] DD/MM/YYYY");
    const reason = reasonText || "Aucune raison spécifiée (Protocole Standard)";

    dataBanned.push({ id: target, reason: reason, time: time });
    await threadsData.set(threadID, dataBanned, "data.banned_ban");

    const imagePath = await generateActionBanner(target, name, "BAN", reason);
    try { api.setMessageReaction("🚫", messageID, () => {}, true); } catch(e){}
    
    return api.sendMessage({
      body: `🟩 **[SÉCURITÉ ENCLENCHÉE]** Le sujet **${name}** a été banni du terminal avec succès.`,
      attachment: fs.createReadStream(imagePath)
    }, threadID, () => { try { fs.unlinkSync(imagePath); } catch (e) {} }, messageID);
  }
};
