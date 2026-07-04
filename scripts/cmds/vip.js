const { writeFileSync } = require("fs-extra");
const { createCanvas, loadImage } = require("canvas");
const fs = require("fs-extra");
const path = require("path");

const OWNER_ID = "61573867120837"; // 🔒 Ton ID exclusif

module.exports = {
  config: {
    name: "vip",
    aliases: ["vipmember", "viplist"],
    version: "5.1.0",
    author: "Shade × Gemini",
    countDown: 5,
    role: 0, 
    description: "💎 Gestion du club VIP Privé avec base de données config.json et Canvas",
    category: "system",
    guide: {
      fr: "{p}{n} list → Afficher le club VIP (Public)\n{p}{n} add [@tag | uid | reply] → Inscrire un VIP (Owner Only)\n{p}{n} remove [@tag | uid | reply] → Révoquer un VIP (Owner Only)"
    }
  },

  onStart: async function ({ message, args, event, api, usersData }) {
    const { threadID, messageID, senderID } = event;
        
    try {
      // 1. Définition du chemin vers config.json
      const configPath = path.join(process.cwd(), "config.json");
      
      // Lecture à la volée du fichier de configuration
      let botConfig = {};
      if (fs.existsSync(configPath)) {
        botConfig = fs.readJsonSync(configPath);
      }
      
      // 2. Initialisation automatique de la clé si absente
      if (!Array.isArray(botConfig.vipuser)) {
        botConfig.vipuser = [];
      }
      
      // 3. Référence de la liste VIP
      let vipList = botConfig.vipuser;
      const action = args[0]?.toLowerCase();

      // --- COMMANDES ADMINISTRATIVES (OWNER ONLY) ---
      if (["add", "-a", "remove", "-r"].includes(action)) {
        if (senderID !== OWNER_ID) {
          try { api.setMessageReaction("❌", messageID, () => {}, true); } catch(e){}
          return message.reply("⛔ **[ACCÈS REFUSÉ]** Ce terminal de configuration VIP est strictement réservé au Fondateur.");
        }

        // Récupération des UIDs via : 1/ Les Mentions, 2/ Le Reply, 3/ Les UIDs écrits en texte brut
        let uids = [];
        
        if (Object.keys(event.mentions || {}).length > 0) {
          uids = Object.keys(event.mentions);
        } else if (event.messageReply) {
          uids = [event.messageReply.senderID];
        } else {
          // Filtre tous les arguments après l'action pour ne garder que ceux qui sont purement numériques (UIDs)
          uids = args.slice(1).filter(id => /^\d+$/.test(id));
        }

        if (!uids || uids.length === 0) {
          return message.reply("⚠️ **[CIBLE MANQUANTE]** Veuillez mentionner un utilisateur, faire un reply ou entrer directement un UID numérique.");
        }

        try { api.setMessageReaction("⏳", messageID, () => {}, true); } catch(e){}

        // 4. ACTION : ADD VIP
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
          
          botConfig.vipuser = vipList;
          
          // Sauvegarde persistante synchrone dans config.json
          fs.writeJsonSync(configPath, botConfig, { spaces: 2 });
          
          // Synchronisation globale en mémoire
          if (global.config) global.config.vipuser = vipList;
          if (global.GoatBot && global.GoatBot.config) global.GoatBot.config.vipuser = vipList;

          try { api.setMessageReaction("👑", messageID, () => {}, true); } catch(e){}
          return message.reply(`🔱 **[VIP REGISTER]**\n━━━━━━━━━━━━━━━━━\n🟩 Nouveaux membres accrédités : ${added.length}\n⚠️ Sujets déjà présents : ${already.length}`);
        }

        // 5. ACTION : REMOVE VIP
        if (action === "remove" || action === "-r") {
          let removed = [];
          vipList = vipList.filter(id => {
            if (uids.includes(id)) {
              removed.push(id);
              return false;
            }
            return true;
          });

          botConfig.vipuser = vipList;
          
          // Sauvegarde persistante synchrone dans config.json
          fs.writeJsonSync(configPath, botConfig, { spaces: 2 });
          
          // Synchronisation globale en mémoire
          if (global.config) global.config.vipuser = vipList;
          if (global.GoatBot && global.GoatBot.config) global.GoatBot.config.vipuser = vipList;

          try { api.setMessageReaction("🗑️", messageID, () => {}, true); } catch(e){}
          return message.reply(`🔱 **[VIP REVOCATION]**\n━━━━━━━━━━━━━━━━━\n🟥 Accréditations VIP révoquées : ${removed.length}`);
        }
      }

      // 6. ACTION : LIST VIP
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

      return message.reply("💡 **[INFO VIP]** Options disponibles :\n• `vip list` : Voir le salon d'honneur.\n• `vip add [@tag / reply / UID]` : Ajouter un membre émérite.\n• `vip remove [@tag / reply / UID]` : Destituer un VIP.");
    } catch (err) {
      console.error("VIP ERROR:", err);
      try { api.setMessageReaction("❌", messageID, () => {}, true); } catch(e){}
      return message.reply("❌ Une erreur critique est survenue dans la compilation de la matrice VIP.");
    }
  }
};
