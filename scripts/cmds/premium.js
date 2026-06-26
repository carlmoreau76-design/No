const fs = require("fs");
const path = require("path");
const axios = require("axios");
const { createCanvas, loadImage } = require("canvas");

const DB_FILE = path.join(__dirname, "premium_codes.json");
const FB_TOKEN = "6628568379%7Cc1e620fa708a1d5696fb991c1bde5662";

function loadCodes() {
  if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, "{}");
  return JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
}

function saveCodes(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

module.exports = {
  config: {
    name: "premium",
    version: "6.5",
    author: "Shade x Hori",
    role: 2, // Seuls les Admins Généraux du bot peuvent utiliser cette commande
    category: "system",
    description: {
      fr: "Gestion sélective du statut premium avec des conditions de ciblage strictes.",
      en: "Selective premium status management with strict targeting conditions."
    }
  },

  onStart: async function ({ message, args, event, usersData }) {
    if (!args[0]) {
      return message.reply("Dis, tu as oublié l'action ! 🙄 Utilise : add, remove, check, list ou redeem ! ✨");
    }

    const type = args[0].toLowerCase();
    let targetID = null;

    // --- 🎯 GESTION STRICTE DES ENTRÉES UTILISATEUR ---
    if (type === "add") {
      // ADD accepte : Tag OU Reply OU UID manuel
      targetID =
        event.mentions && Object.keys(event.mentions || {}).length > 0
          ? Object.keys(event.mentions)[0]
          : event.messageReply
          ? event.messageReply.senderID
          : args[1];
    } else if (type === "remove" || type === "check") {
      // REMOVE et CHECK acceptent UNIQUEMENT : Tag OU UID manuel
      targetID =
        event.mentions && Object.keys(event.mentions || {}).length > 0
          ? Object.keys(event.mentions)[0]
          : args[1];
    }

    if (!targetID && type !== "list" && type !== "redeem") {
      if (type === "remove") {
        return message.reply("Heu... Pour retirer un accès, tu dois obligatoirement mentionner (tag) l'utilisateur ou écrire son UID directement ! Pas de reply ici. 😤");
      }
      return message.reply("Heu... Je ne trouve pas cet utilisateur. Tu as bien mentionné quelqu'un, répondu à un message ou mis un ID valide ? 🤔");
    }

    let data = {};
    if (targetID) {
      data = await usersData.get(targetID) || { data: {} };
      if (!data.data) data.data = {};
    }

    // --- 💎 ACTION : ADD ---
    if (type === "add") {
      // Récupère les jours sur args[2] si c'est un tag/UID manuel, ou args[1] si c'est un reply
      let daysInput = event.messageReply ? args[1] : args[2];
      const days = parseInt(daysInput) || 7;

      data.data.premium = true;
      data.data.premiumUntil = Date.now() + days * 24 * 60 * 60 * 1000;

      await usersData.set(targetID, data);
      return message.reply(`✨ Oh lala, quelle classe ! L'utilisateur (ID: ${targetID}) fait maintenant partie du club PREMIUM pour ${days} jours ! 💖 Ne t'y habitue pas trop non plus ! 😉`);
    }

    // --- ❌ ACTION : REMOVE ---
    if (type === "remove") {
      data.data.premium = false;
      data.data.premiumUntil = null;

      await usersData.set(targetID, data);
      return message.reply(`💔 Oops ! C'est fini le traitement de faveur. Le statut Premium a été retiré pour l'UID ${targetID}. Retour à la normale ! 😜`);
    }

    // --- 🌸 ACTION : CHECK ---
    if (type === "check") {
      const now = Date.now();
      const isPremium = data?.data?.premium && (!data?.data?.premiumUntil || data.data.premiumUntil > now);

      if (isPremium) {
        const remaining = data.data.premiumUntil ? Math.ceil((data.data.premiumUntil - now) / (1000 * 60 * 60 * 24)) : "l'infini";
        return message.reply(`💎 Validé ! Cet utilisateur est bien PREMIUM ! Il lui reste environ ${remaining} jour(s). Quelle chance... ✨`);
      } else {
        return message.reply("❌ Désolée, mais cet utilisateur est un membre tout à fait ordinaire ! Pas de passe-droit ici. 🤫");
      }
    }

    // --- 🎟️ ACTION : REDEEM ---
    if (type === "redeem") {
      const code = args[1];
      if (!code) return message.reply("Tu essaies d'activer du vent ? Donne-moi un code premium valide ! 🙄");

      let codes = loadCodes();
      if (!codes[code]) {
        return message.reply("Argh ! Ce code est complètement faux ou a déjà expiré ! Retente ta chance. 😤");
      }

      const days = codes[code];
      let senderData = await usersData.get(event.senderID) || { data: {} };
      if (!senderData.data) senderData.data = {};

      senderData.data.premium = true;
      senderData.data.premiumUntil = (senderData.data.premiumUntil && senderData.data.premiumUntil > Date.now() ? senderData.data.premiumUntil : Date.now()) + days * 86400000;

      await usersData.set(event.senderID, senderData);
      delete codes[code];
      saveCodes(codes);

      return message.reply(`🎉 Code activé avec succès ! Tu gagnes +${days} jours PREMIUM ! Profites-en bien, c'est Hori qui régale ! ✨💖`);
    }

    // --- 📋 ACTION : LIST (AVEC CANVAS LUXE & AVATARS) ---
    if (type === "list") {
      let all = [];
      try {
        all = await usersData.getAll() || [];
      } catch {
        return message.reply("Aïe, ma mémoire flanche... Impossible de récupérer la liste des membres ! 💔");
      }

      const list = all.filter(u => u?.data?.premium && (!u?.data?.premiumUntil || u.data.premiumUntil > Date.now()));

      if (!list.length) {
        return message.reply("C'est bien calme ici... Aucun utilisateur n'est PREMIUM pour le moment ! 🌸");
      }

      message.reply("Attends deux secondes, je sors le registre VIP... ⏳✨");

      const width = 1000;
      const rowHeight = 100;
      const headerHeight = 180;
      const height = headerHeight + (list.length * rowHeight) + 40;

      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext("2d");

      const bgGradient = ctx.createLinearGradient(0, 0, width, height);
      bgGradient.addColorStop(0, "#0f0c1b");
      bgGradient.addColorStop(0.5, "#18122b");
      bgGradient.addColorStop(1, "#0d0214");
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, width, height);

      ctx.strokeStyle = "rgba(255, 105, 180, 0.15)";
      ctx.lineWidth = 3;
      ctx.strokeRect(15, 15, width - 30, height - 30);

      ctx.font = "bold 45px 'Segoe UI', Arial, sans-serif";
      const titleGrad = ctx.createLinearGradient(0, 0, width, 0);
      titleGrad.addColorStop(0.3, "#ff79c6");
      titleGrad.addColorStop(0.7, "#bd93f9");
      ctx.fillStyle = titleGrad;
      ctx.textAlign = "center";
      ctx.fillText("💎 HORI'S LUXURY PREMIUM LIST 💎", width / 2, 85);

      ctx.font = "italic 20px Arial";
      ctx.fillStyle = "#8be9fd";
      ctx.fillText(`Membres privilégiés en date d'aujourd'hui • Total : ${list.length}`, width / 2, 125);

      let y = headerHeight;

      for (let i = 0; i < list.length; i++) {
        const u = list[i];
        const name = u.name || `Utilisateur inconnu (${u.userID})`;
        
        ctx.fillStyle = i % 2 === 0 ? "rgba(255, 255, 255, 0.04)" : "rgba(255, 255, 255, 0.01)";
        ctx.fillRect(40, y - 20, width - 80, rowHeight - 10);

        ctx.font = "bold 28px Arial";
        ctx.fillStyle = "#ffb86c";
        ctx.textAlign = "left";
        ctx.fillText(`#${i + 1}`, 60, y + 35);

        const avatarUrl = `https://graph.facebook.com/${u.userID}/picture?width=200&access_token=${FB_TOKEN}`;
        try {
          const imgBuffer = await axios.get(avatarUrl, { responseType: "arraybuffer" });
          const img = await loadImage(Buffer.from(imgBuffer.data));

          ctx.save();
          ctx.beginPath();
          ctx.arc(160, y + 25, 35, 0, Math.PI * 2, true);
          ctx.closePath();
          ctx.clip();
          ctx.drawImage(img, 125, y - 10, 70, 70);
          ctx.restore();

          ctx.strokeStyle = "#ffb86c";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(160, y + 25, 36, 0, Math.PI * 2, true);
          ctx.stroke();
        } catch {
          ctx.fillStyle = "#ff79c6";
          ctx.beginPath();
          ctx.arc(160, y + 25, 35, 0, Math.PI * 2, true);
          ctx.fill();
        }

        ctx.font = "bold 26px 'Segoe UI', Arial";
        ctx.fillStyle = "#ffffff";
        ctx.fillText(name, 220, y + 25);

        ctx.font = "18px Arial";
        if (!u.data.premiumUntil) {
          ctx.fillStyle = "#50fa7b";
          ctx.fillText("👑 ACCÈS À VIE", 220, y + 53);
        } else {
          const dateStr = new Date(u.data.premiumUntil).toLocaleDateString("fr-FR");
          ctx.fillStyle = "#ff5555";
          ctx.fillText(`📅 Jusqu'au : ${dateStr}`, 220, y + 53);
        }

        ctx.fillStyle = "rgba(189, 147, 249, 0.2)";
        ctx.fillRect(width - 170, y + 10, 110, 30);
        ctx.font = "bold 14px Arial";
        ctx.fillStyle = "#bd93f9";
        ctx.textAlign = "center";
        ctx.fillText("ACTIVE VIP", width - 115, y + 30);

        y += rowHeight;
      }

      const file = path.join(__dirname, "premium_list_luxe.png");
      fs.writeFileSync(file, canvas.toBuffer("image/png"));

      return message.reply({
        body: "Et voilà la liste ! Ils ont pas la classe mes petits protégés ? 😎💎",
        attachment: fs.createReadStream(file)
      }, () => {
        if (fs.existsSync(file)) fs.unlinkSync(file);
      });
    }

    return message.reply("Hum... Tu parles une autre langue ? Je ne comprends pas cette sous-commande. 🤨");
  }
};
