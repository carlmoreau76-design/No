const { createCanvas, loadImage } = require("canvas");
const fs = require("fs-extra");
const path = require("path");
const moment = require("moment-timezone");

const OWNER_ID = "61573867120837"; // Votre UID Administrateur Suprême
const FB_TOKEN = "6628568379%7Cc1e620fa708a1d5696fb991c1bde5662"; // Token pour l'API Graph (Avatars)

// Utilitaire : Générer une bannière d'action fluide (Ban / Unban)
async function generateActionBanner(uid, name, actionType, reason = "") {
  const canvas = createCanvas(1000, 300);
  const ctx = canvas.getContext("2d");

  // Fond dégradé dynamique selon l'action administrative
  const grad = ctx.createLinearGradient(0, 0, 1000, 300);
  if (actionType === "BAN") {
    grad.addColorStop(0, "#260505");
    grad.addColorStop(1, "#800000");
  } else {
    grad.addColorStop(0, "#052605");
    grad.addColorStop(1, "#00802b");
  }
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1000, 300);

  // Overlay translucide et bordure décorative
  ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
  ctx.fillRect(0, 0, 1000, 300);
  ctx.strokeStyle = actionType === "BAN" ? "#ff4d4d" : "#4dff4d";
  ctx.lineWidth = 6;
  ctx.strokeRect(15, 15, 970, 270);

  // Traitement et affichage de la photo de profil (Avatar)
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
    ctx.fillStyle = actionType === "BAN" ? "#ff4d4d" : "#4dff4d";
    ctx.fill();
  }
  ctx.restore();

  // Bordure blanche autour de la photo de profil
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(avatarX, avatarY, radius + 2, 0, Math.PI * 2);
  ctx.stroke();

  // Alignement et rendu des textes informatifs
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";

  ctx.font = "bold 24px Arial";
  ctx.fillStyle = actionType === "BAN" ? "#ff4d4d" : "#4dff4d";
  ctx.fillText(`[ACTION ADMINISTRATIVE : ${actionType}]`, 280, 80);

  ctx.font = "bold 36px Arial";
  ctx.fillStyle = "#ffffff";
  ctx.fillText(name.length > 25 ? name.substring(0, 23) + "..." : name, 280, 135);

  ctx.font = "20px Arial";
  ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
  ctx.fillText(`UID : ${uid}`, 280, 185);

  ctx.font = "italic 20px Arial";
  ctx.fillStyle = actionType === "BAN" ? "#ffcccc" : "#ccffcc";
  ctx.fillText(actionType === "BAN" ? `Raison : ${reason.substring(0, 45)}` : "Statut : Accès global au bot réhabilité.", 280, 235);

  const cacheDir = path.join(__dirname, "cache");
  await fs.ensureDir(cacheDir);
  const pathSave = path.join(cacheDir, `user_action_${uid}_${Date.now()}.png`);
  await fs.writeFile(pathSave, canvas.toBuffer("image/png"));
  return pathSave;
}

module.exports = {
  config: {
    name: "user",
    aliases: ["users", "manageuser"],
    version: "2.0.0",
    author: "NTKhang × Gemini",
    countDown: 3,
    role: 3, // Réservé exclusivement à l'administration du bot
    description: "Gestion avancée de la base d'utilisateurs avec rendus graphiques Canvas.",
    category: "admin",
    guide: {
      fr: "{p}{n} list [numéro de page] → Affiche la table des utilisateurs (20 par page)\n{p}{n} ban <numéro | uid | @tag | reply> [Raison] → Bannir un utilisateur\n{p}{n} unban <numéro | uid | @tag | reply] → Débannir un utilisateur\n{p}{n} find <nom> → Rechercher un profil"
    }
  },

  // Écouteur en arrière-plan : Interception des réponses (Replies) pour la pagination
  onChat: async function ({ api, event, message, usersData }) {
    const { type, messageReply, body, threadID, messageID, senderID } = event;
    if (senderID !== OWNER_ID || type !== "message_reply" || !body) return;

    // Détection de la commande de changement de page : "page X"
    if (body.toLowerCase().startsWith("page ")) {
      const targetPage = parseInt(body.split(" ")[1]);
      if (!isNaN(targetPage)) {
        // Redirection virtuelle vers le gestionnaire principal onStart
        return this.onStart({
          args: ["list", targetPage.toString()],
          usersData, message, event, api
        });
      }
    }
  },

  onStart: async function ({ args, usersData, message, event, api }) {
    const { threadID, messageID, senderID, mentions, type, messageReply } = event;

    // Protection stricte : Seul l'Owner configuré a accès à ce module sensible
    if (senderID !== OWNER_ID) {
      return message.reply("⛔ **[ACCÈS SUPRÊME REQUIS]** Seul l'Administrateur Principal possède les privilèges requis.");
    }

    const subCommand = args[0]?.toLowerCase();

    // Initialisation globale du cache temporaire pour la sélection par numéros d'index
    global.client = global.client || {};
    global.client.userManagementCache = global.client.userManagementCache || [];

    // ==========================================
    // 📊 SUB-COMMAND : LIST (AFFICHAGE CANVAS INTERACTIF)
    // ==========================================
    if (subCommand === "list" || subCommand === "-l") {
      const allUsers = await usersData.getAll();
      if (!allUsers.length) return message.reply("📡 La base de données utilisateur est actuellement vide.");

      // Mise à jour du cache global de référence ordonné
      global.client.userManagementCache = allUsers.map(u => ({ id: u.userID, name: u.name || "Utilisateur" }));

      const itemsPerPage = 20;
      const totalPages = Math.ceil(allUsers.length / itemsPerPage);
      let page = parseInt(args[1]) || 1;

      if (page < 1) page = 1;
      if (page > totalPages) page = totalPages;

      const startIdx = (page - 1) * itemsPerPage;
      const paginatedUsers = allUsers.slice(startIdx, startIdx + itemsPerPage);

      // Configuration structurelle du Canvas graphique (Bannière étendue)
      const width = 1200, height = 750;
      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext("2d");

      // Fond technologique sombre
      ctx.fillStyle = "#090314";
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = "rgba(147, 51, 234, 0.04)";
      ctx.fillRect(30, 30, width - 60, height - 60);
      ctx.strokeStyle = "rgba(147, 51, 234, 0.25)";
      ctx.lineWidth = 2;
      ctx.strokeRect(30, 30, width - 60, height - 60);

      // Titre du tableau de bord
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#a855f7";
      ctx.font = "bold 36px Arial";
      ctx.fillText(`📊 CORE BOT SYSTEM — USER REGISTRY (PAGE ${page}/${totalPages})`, width / 2, 70);

      // Génération de la grille sur 2 colonnes pour une visibilité optimale
      ctx.textAlign = "left";
      ctx.font = "bold 18px Arial";

      paginatedUsers.forEach((user, index) => {
        const globalIndex = startIdx + index + 1;
        const isBanned = user.banned?.status === true;
        
        // Détermination des coordonnées x, y selon l'index de la liste
        const col = index < 10 ? 0 : 1;
        const row = index % 10;
        
        const posX = col === 0 ? 80 : 640;
        const posY = 150 + row * 52;

        // Indicateur visuel du statut de l'utilisateur (Vert = Actif, Rouge = Banni)
        ctx.fillStyle = isBanned ? "#ef4444" : "#22c55e";
        ctx.beginPath();
        ctx.arc(posX, posY, 7, 0, Math.PI * 2);
        ctx.fill();

        // Rendu textuel de la ligne d'information
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 19px Arial";
        ctx.fillText(`${globalIndex}.`, posX + 20, posY);

        ctx.font = "18px Arial";
        const cleanName = (user.name || "Inconnu").length > 22 ? (user.name || "Inconnu").substring(0, 20) + ".." : (user.name || "Inconnu");
        ctx.fillText(cleanName, posX + 60, posY);

        ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
        ctx.font = "15px Arial";
        ctx.fillText(`(${user.userID})`, posX + 290, posY);
      });

      const cacheDir = path.join(__dirname, "cache");
      await fs.ensureDir(cacheDir);
      const pathSave = path.join(cacheDir, `user_list_${Date.now()}.png`);
      await fs.writeFile(pathSave, canvas.toBuffer("image/png"));

      return api.sendMessage({
        body: `🖥️ **[REGISTRE UTILISATEURS]** Total enregistrés : **${allUsers.length}**\n━━━━━━━━━━━━━━━━━━━━━━\n💡 **Actions rapides :**\n» Pour bannir : \`user ban [numéro]\` (Ex: \`user ban 4\`)\n» Pour changer de page : Répondez (reply) à ce message avec : \`page [numéro]\``,
        attachment: fs.createReadStream(pathSave)
      }, threadID, () => { try { fs.unlinkSync(pathSave); } catch (e) {} }, messageID);
    }

    // ==========================================
    // 💀 SUB-COMMAND : BAN (SÉCURISATION & EXCLUSION)
    // ==========================================
    if (subCommand === "ban" || subCommand === "-b") {
      let targetUid = null;
      let reasonText = "";

      // Analyse et résolution dynamique de la cible (Index du cache, Reply, Tag ou UID direct)
      const potentialIndex = parseInt(args[1]);
      
      if (!isNaN(potentialIndex) && global.client.userManagementCache[potentialIndex - 1]) {
        targetUid = global.client.userManagementCache[potentialIndex - 1].id;
        reasonText = args.slice(2).join(" ").trim();
      } else if (type === "message_reply") {
        targetUid = messageReply.senderID;
        reasonText = args.slice(1).join(" ").trim();
      } else if (Object.keys(mentions).length > 0) {
        targetUid = Object.keys(mentions)[0];
        reasonText = args.slice(1).join(" ").replace(mentions[targetUid], "").replace("@", "").trim();
      } else if (args[1] && !isNaN(args[1])) {
        targetUid = args[1];
        reasonText = args.slice(2).join(" ").trim();
      }

      if (!targetUid) return message.reply("⚠️ Spécifiez un numéro de la liste, un UID valide, mentionnez l'utilisateur ou répondez à son message.");
      if (targetUid === senderID) return message.reply("❌ Auto-bannissement non autorisé par le système.");

      const reason = reasonText || "Alerte de sécurité — Violation des règles du système.";
      const userData = await usersData.get(targetUid) || {};
      
      if (userData.banned?.status) {
        return message.reply(`⚠️ Cet utilisateur est déjà banni.\n» Raison : ${userData.banned.reason}\n» Date : ${userData.banned.date}`);
      }

      const timeStr = moment().tz("Africa/Kinshasa").format("HH:mm:ss [le] DD/MM/YYYY");
      await usersData.set(targetUid, { banned: { status: true, reason, date: timeStr } });

      const name = userData.name || global.client.userManagementCache.find(u => u.id === targetUid)?.name || "Utilisateur Indexé";
      const imagePath = await generateActionBanner(targetUid, name, "BAN", reason);

      return api.sendMessage({
        body: `🟩 **[PROTOCOLE LOCK ACTIVE]** L'accès global au bot a été suspendu pour **${name}**.`,
        attachment: fs.createReadStream(imagePath)
      }, threadID, () => { try { fs.unlinkSync(imagePath); } catch (e) {} }, messageID);
    }

    // ==========================================
    // 🔓 SUB-COMMAND : UNBAN (RÉHABILITATION)
    // ==========================================
    if (subCommand === "unban" || subCommand === "-u") {
      let targetUid = null;
      const potentialIndex = parseInt(args[1]);

      if (!isNaN(potentialIndex) && global.client.userManagementCache[potentialIndex - 1]) {
        targetUid = global.client.userManagementCache[potentialIndex - 1].id;
      } else if (type === "message_reply") {
        targetUid = messageReply.senderID;
      } else if (Object.keys(mentions).length > 0) {
        targetUid = Object.keys(mentions)[0];
      } else if (args[1] && !isNaN(args[1])) {
        targetUid = args[1];
      }

      if (!targetUid) return message.reply("⚠️ Spécifiez un numéro de la liste, un UID, taguer l'utilisateur ou répondez à son message.");

      const userData = await usersData.get(targetUid) || {};
      if (!userData.banned?.status) return message.reply("⚠️ Cet utilisateur n'est pas répertorié comme étant banni du système.");

      await usersData.set(targetUid, { banned: {} });

      const name = userData.name || global.client.userManagementCache.find(u => u.id === targetUid)?.name || "Utilisateur";
      const imagePath = await generateActionBanner(targetUid, name, "UNBAN");

      return api.sendMessage({
        body: `🔓 **[RÉHABILITATION COMPLÈTE]** L'utilisateur **${name}** peut à nouveau exploiter les modules du bot.`,
        attachment: fs.createReadStream(imagePath)
      }, threadID, () => { try { fs.unlinkSync(imagePath); } catch (e) {} }, messageID);
    }

    // ==========================================
    // 🔎 SUB-COMMAND : FIND / SEARCH
    // ==========================================
    if (["find", "-f", "search", "-s"].includes(subCommand)) {
      const allUsers = await usersData.getAll();
      const keyWord = args.slice(1).join(" ").toLowerCase();
      if (!keyWord) return message.reply("⚠️ Veuillez spécifier le nom ou le mot-clé à rechercher.");

      const result = allUsers.filter(item => (item.name || "").toLowerCase().includes(keyWord));
      
      if (result.length === 0) return message.reply(`❌ Aucun profil correspondant au mot-clé [${keyWord}] dans la base de données.`);

      let msg = `🔎 **[RÉSULTAT DE LA RECHERCHE]** Nombre trouvé(s) : ${result.length}\n`;
      result.forEach(u => {
        msg += `\n👤 **Nom :** ${u.name}\n🆔 **UID :** \`${u.userID}\`\n🚫 **Banni :** ${u.banned?.status ? "Oui" : "Non"}\n`;
      });
      return message.reply(msg);
    }

    return message.SyntaxError();
  }
};
