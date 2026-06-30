const { writeFileSync } = require("fs-extra");
const { createCanvas, loadImage } = require("canvas");
const fs = require("fs-extra");
const path = require("path");

const OWNER_ID = "61573867120837"; // 🔒 Ton ID exclusif

module.exports = {
  config: {
    name: "vip",
    aliases: ["vipmember", "viplist"],
    version: "4.2.0",
    author: "Shade × Gemini",
    countDown: 5,
    role: 0, 
    description: "💎 Gestion du club VIP Privé avec base de données persistante et Canvas",
    category: "system",
    guide: {
      fr: "{p}{n} list → Afficher le club VIP (Public)\n{p}{n} add [@tag | uid | reply] → Inscrire un VIP (Owner Only)\n{p}{n} remove [@tag | uid | reply] → Révoquer un VIP (Owner Only)"
    }
  },

  onStart: async function ({ message, args, event, api, usersData }) {
    const { threadID, messageID, senderID } = event;
    
    try {
      // Utilisation du stockage global persistant pour éviter les wipes au déploiement
      if (!global.client.vipStorage) {
        global.client.vipStorage = [];
      }
      
      // On essaie de synchroniser si une variable globale existe déjà dans GoatBot
      let vipList = global.client.vipStorage;

      const action = args[0]?.toLowerCase();

      // --- COMMANDES ADMINISTRATIVES (OWNER ONLY) ---
      if (["add", "-a", "remove", "-r"].includes(action)) {
        if (senderID !== OWNER_ID) {
          try { api.setMessageReaction("❌", messageID, () => {}, true); } catch(e){}
          return message.reply("⛔ **[ACCÈS REFUSÉ]** Ce terminal de configuration VIP est strictement réservé au Fondateur.");
        }

        let uids = Object.keys(event.mentions || {}).length
          ? Object.keys(event.mentions)
          : event.messageReply
            ? [event.messageReply.senderID]
            : args.slice(1).filter(id => /^\d+$/.test(id));

        if (!uids.length) {
          return message.reply("⚠️ **[CIBLE MANQUANTE]** Veuillez mentionner un utilisateur, faire un reply ou entrer son UID.");
        }

        try { api.setMessageReaction("⏳", messageID, () => {}, true); } catch(e){}

        if (action === "add" || action === "-a") {
          let added = [];
          let already = [];

          for (const id of uids) {
            if (vipList.includes(id)) {
              already.push(id);
            } else {
              vipList.push(id);
              added.push(id);
            }
          }

          global.client.vipStorage = vipList;
          
          // Sauvegarde dans un fichier hors du dossier de build si possible, ou via l'utilitaire GoatBot
          try {
            // Tente de sauvegarder dans le config global au cas où l'hébergeur maintient les fichiers (ex: VPS)
            global.GoatBot.config.vipuser = vipList;
            writeFileSync(global.client.dirConfig, JSON.stringify(global.GoatBot.config, null, 2));
          } catch(e){}

          try { api.setMessageReaction("👑", messageID, () => {}, true); } catch(e){}
          return message.reply(`🔱 **[VIP REGISTER]**\n━━━━━━━━━━━━━━━━━\n🟩 Nouveaux membres accrédités : ${added.length}\n⚠️ Sujets déjà présents : ${already.length}`);
        }

        if (action === "remove" || action === "-r") {
          let removed = [];

          vipList = vipList.filter(id => {
            if (uids.includes(id)) {
              removed.push(id);
              return false;
            }
            return true;
          });

          global.client.vipStorage = vipList;

          try {
            global.GoatBot.config.vipuser = vipList;
            writeFileSync(global.client.dirConfig, JSON.stringify(global.GoatBot.config, null, 2));
          } catch(e){}

          try { api.setMessageReaction("🗑️", messageID, () => {}, true); } catch(e){}
          return message.reply(`🔱 **[VIP REVOCATION]**\n━━━━━━━━━━━━━━━━━\n🟥 Accréditations VIP révoquées : ${removed.length}`);
        }
      }

      // --- COMMANDE PUBLIQUE : LIST CARD LUXE ---
      if (action === "list" || action === "-l") {
        if (!vipList.length) {
          return message.reply("📡 **[DATABASE]** Aucun membre VIP n'est actuellement enregistré dans le club.");
        }

        try { api.setMessageReaction("⏳", messageID, () => {}, true); } catch(e){}

        const vipsToShow = vipList.slice(0, 6);
        const width = 900;
        const height = 150 + (vipsToShow.length * 110);
        
        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext("2d");

        const bgGrad = ctx.createLinearGradient(0, 0, width, height);
        bgGrad.addColorStop(0, "#0d0d0d");
        bgGrad.addColorStop(0.5, "#1a160d");
        bgGrad.addColorStop(1, "#0a0a0a");
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, width, height);

        ctx.strokeStyle = "#d4af37";
        ctx.lineWidth = 5;
        ctx.strokeRect(10, 10, width - 20, height - 20);

        ctx.save();
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 38px sans-serif";
        ctx.textAlign = "center";
        ctx.shadowColor = "#d4af37";
        ctx.shadowBlur = 15;
        ctx.fillText("⚜️ THE PRIVILEGED CLUB - VIP ⚜️", width / 2, 75);
        ctx.restore();

        ctx.strokeStyle = "rgba(212, 175, 55, 0.4)";
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(50, 105); ctx.lineTo(width - 50, 105); ctx.stroke();

        let yPos = 160;
        for (let i = 0; i < vipsToShow.length; i++) {
          const uid = vipsToShow[i];
          const name = await usersData.getName(uid) || "Membre Élite";

          ctx.fillStyle = "rgba(255, 255, 255, 0.03)";
          ctx.fillRect(40, yPos - 45, width - 80, 90);
          ctx.strokeStyle = "rgba(212, 175, 55, 0.15)";
          ctx.strokeRect(40, yPos - 45, width - 80, 90);

          let avatarImg;
          try {
            const avatarUrl = await usersData.getAvatarUrl(uid);
            avatarImg = await loadImage(avatarUrl);
          } catch(e) {
            try {
              avatarImg = await loadImage(`https://graph.facebook.com/${uid}/picture?type=large`);
            } catch(err) {
              avatarImg = await loadImage("https://files.catbox.moe/w9df05.png");
            }
          }

          ctx.save();
          ctx.shadowColor = "#d4af37";
          ctx.shadowBlur = 10;
          ctx.strokeStyle = "#d4af37";
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(100, yPos, 35, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();

          ctx.save();
          ctx.beginPath();
          ctx.arc(100, yPos, 33, 0, Math.PI * 2);
          ctx.clip();
          ctx.drawImage(avatarImg, 67, yPos - 33, 66, 66);
          ctx.restore();

          ctx.textAlign = "left";
          ctx.fillStyle = "#ffffff";
          ctx.font = "bold 24px sans-serif";
          ctx.fillText(`${i + 1}. ${name}`, 170, yPos - 5);

          ctx.fillStyle = "#d4af37";
          ctx.font = "600 16px monospace";
          ctx.fillText(`UID: ${uid}`, 170, yPos + 22);

          ctx.textAlign = "right";
          ctx.font = "italic bold 18px sans-serif";
          ctx.fillStyle = "#d4af37";
          ctx.fillText("✨ EXCLUSIVE", width - 70, yPos + 5);

          yPos += 110;
        }

        const filePath = path.join(__dirname, `vip_card_${Date.now()}.png`);
        const out = fs.createWriteStream(filePath);
        const stream = canvas.createPNGStream();
        stream.pipe(out);

        out.on("finish", () => {
          try { api.setMessageReaction("💎", messageID, () => {}, true); } catch(e){}
          api.sendMessage({
            body: `💎 **[VIP EXCLUSIVE LIST]** Accès au salon d'honneur accordé.`,
            attachment: fs.createReadStream(filePath)
          }, threadID, () => fs.unlinkSync(filePath), messageID);
        });
        return;
      }

      return message.reply("💡 **[INFO VIP]** Options disponibles :\n• `vip list` : Voir le salon d'honneur.\n• `vip add [@tag / reply]` : Ajouter un membre émérite.\n• `vip remove [@tag / reply]` : Destituer un VIP.");

    } catch (err) {
      console.error("VIP ERROR:", err);
      try { api.setMessageReaction("❌", messageID, () => {}, true); } catch(e){}
      return message.reply("❌ Une erreur critique est survenue dans la compilation de la matrice VIP.");
    }
  }
};
