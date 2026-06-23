const { createCanvas, loadImage } = require("canvas");
const fs = require("fs-extra");
const path = require("path");

// 🌸 TON UID OWNER ICI
const OWNER_ID = "61573867120837";

module.exports = {
  config: {
    name: "developer",
    aliases: ["dev"],
    version: "2.5 Canvas-Reply",
    author: "Shade × Gemini",
    countDown: 5,
    role: 0,
    description: {
      fr: "Gérer les développeurs du bot (Owner uniquement) avec affichage Canvas"
    },
    category: "owner",
    guide: {
      fr: "{p}{n} list → Liste graphique des développeurs\n{p}{n} add <uid/@tag/reply> → Ajouter un développeur\n{p}{n} remove <uid/@tag/reply> → Retirer un développeur"
    }
  },

  onStart: async function ({ api, message, args, usersData, event }) {
    const { config } = global.GoatBot;
    if (!config.developer) config.developer = [];

    const { senderID, threadID, messageID, mentions, type, messageReply } = event;
    const isOwner = senderID === OWNER_ID;
    const cmd = (args[0] || "").toLowerCase();

    // ==========================================
    // 🎨 MODE 1 : LISTE DES DEVS (CANVAS)
    // ==========================================
    if (cmd === "list" || cmd === "-l") {
      if (config.developer.length === 0) {
        return message.reply("🌸 Aucun développeur enregistré pour le moment.");
      }

      // Limiter à 4 développeurs sur l'image pour un rendu propre
      const activeDevs = config.developer.slice(0, 4);

      // Dimensions de la carte graphique
      const width = 1200;
      const height = 500;
      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext("2d");

      try {
        // Fond technologique / Cyberpunk
        const bg = await loadImage("https://files.catbox.moe/2xr9j4.jpg");
        ctx.drawImage(bg, 0, 0, width, height);
      } catch (e) {
        // Dégradé de secours si l'image ne charge pas
        const grad = ctx.createLinearGradient(0, 0, width, height);
        grad.addColorStop(0, "#0f0226");
        grad.addColorStop(1, "#1c0444");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);
      }

      // Overlay sombre translucide
      ctx.fillStyle = "rgba(12, 4, 28, 0.75)";
      ctx.fillRect(0, 0, width, height);

      // Titre principal
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#c084fc";
      ctx.font = "bold 38px Arial";
      ctx.fillText("👑 BOT DEVELOPERS & ADMINISTRATION 👑", width / 2, 60);

      // Ligne séparatrice
      ctx.fillStyle = "rgba(192, 132, 252, 0.3)";
      ctx.fillRect(width / 2 - 250, 95, 500, 2);

      // Alignement dynamique des profils de développeurs
      const cardWidth = 220;
      const totalCardsWidth = activeDevs.length * cardWidth + (activeDevs.length - 1) * 40;
      let startX = (width - totalCardsWidth) / 2 + cardWidth / 2;
      const centerY = 270;

      for (const uid of activeDevs) {
        let name = "Développeur";
        let avatarUrl = `https://graph.facebook.com/${uid}/picture?width=500&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
        
        try {
          name = await usersData.getName(uid) || "Développeur";
        } catch (e) {}

        ctx.save();
        
        // Dessin du cercle pour la photo de profil
        ctx.beginPath();
        ctx.arc(startX, centerY - 30, 80, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.clip();

        try {
          const avatar = await loadImage(avatarUrl);
          ctx.drawImage(avatar, startX - 80, centerY - 110, 160, 160);
        } catch (e) {
          // Si l'avatar échoue, fond violet par défaut pour le rond
          ctx.fillStyle = "#c084fc";
          ctx.fill();
        }

        ctx.restore();

        // Bordure lumineuse autour de l'avatar
        ctx.strokeStyle = "#38bdf8";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(startX, centerY - 30, 82, 0, Math.PI * 2, true);
        ctx.stroke();

        // Affichage du nom abrégé sous l'avatar
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 22px Arial";
        const displayName = name.length > 14 ? name.substring(0, 12) + ".." : name;
        ctx.fillText(displayName, startX, centerY + 90);

        // Sous-texte UID
        ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
        ctx.font = "14px Arial";
        ctx.fillText(`ID: ${uid}`, startX, centerY + 120);

        startX += cardWidth + 40;
      }

      // Sauvegarde de l'image générée dans le dossier cache
      const cacheDir = path.join(__dirname, "cache");
      if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });
      const pathSave = path.join(cacheDir, `devs_${Date.now()}.png`);

      fs.writeFileSync(pathSave, canvas.toBuffer("image/png"));

      return api.sendMessage(
        {
          body: `✨ **[ÉQUIPE EN PLACE]**\nVoici la liste officielle des développeurs accrédités sur ce bot.\nTotal : ${config.developer.length} membre(s).`,
          attachment: fs.createReadStream(pathSave)
        },
        threadID,
        () => { try { fs.unlinkSync(pathSave); } catch (e) {} },
        messageID
      );
    }

    // ==========================================
    // 🔒 EXTRACTION DES UIDS (MENTION / ARGS / REPLY)
    // ==========================================
    let uids = [];
    
    // Cas 1 : Ajout ou suppression par Reply
    if (type === "message_reply" && messageReply.senderID) {
      uids.push(messageReply.senderID);
    } 
    // Cas 2 : Par mention taguée
    else if (Object.keys(mentions).length > 0) {
      uids = Object.keys(mentions);
    } 
    // Cas 3 : Par écriture directe de l'UID en argument
    else if (args.length > 1) {
      uids = args.slice(1).filter(x => !isNaN(x));
    }

    // ==========================================
    // ➕ MODE 2 : AJOUTER UN DEV
    // ==========================================
    if (cmd === "add" || cmd === "-a") {
      if (!isOwner) return message.reply("⛔ Seul le propriétaire suprême (OWNER) peut utiliser cette fonction.");
      if (uids.length === 0) return message.reply("🌸 Veuillez spécifier un UID, taguer quelqu'un ou répondre (reply) à son message.");

      const added = [];
      const already = [];

      for (const uid of uids) {
        if (config.developer.includes(uid)) {
          already.push(uid);
        } else {
          config.developer.push(uid);
          added.push(uid);
        }
      }

      fs.writeFileSync(global.client.dirConfig, JSON.stringify(config, null, 2));

      const names = await Promise.all(added.map(uid => usersData.getName(uid).catch(() => "Inconnu")));

      return message.reply(
        (added.length ? "💖 **[ACCÈS ACCORDÉ]**\nNouveau(x) développeur(s) ajouté(s) :\n" + names.map((n, i) => `• ${n} (\`${added[i]}\`)`).join("\n") : "") +
        (already.length ? "\n\n💫 Déjà présent dans la liste des développeurs." : "")
      );
    }

    // ==========================================
    // ➖ MODE 3 : RETIRER UN DEV
    // ==========================================
    if (cmd === "remove" || cmd === "-r" || cmd === "delete") {
      if (!isOwner) return message.reply("⛔ Seul le propriétaire suprême (OWNER) peut utiliser cette fonction.");
      if (uids.length === 0) return message.reply("💔 Veuillez spécifier un UID, taguer quelqu'un ou répondre (reply) à son message.");

      const removed = [];
      const notDev = [];

      for (const uid of uids) {
        if (config.developer.includes(uid)) {
          config.developer = config.developer.filter(x => x !== uid);
          removed.push(uid);
        } else {
          notDev.push(uid);
        }
      }

      fs.writeFileSync(global.client.dirConfig, JSON.stringify(config, null, 2));

      const names = await Promise.all(removed.map(uid => usersData.getName(uid).catch(() => "Inconnu")));

      return message.reply(
        (removed.length ? "🌸 **[ACCÈS RÉVOQUÉ]**\nDéveloppeur(s) supprimé(s) :\n" + names.map((n, i) => `• ${n} (\`${removed[i]}\`)`).join("\n") : "") +
        (notDev.length ? "\n\n💔 Cet utilisateur n'est pas enregistré comme développeur." : "")
      );
    }

    return message.SyntaxError();
  }
};
