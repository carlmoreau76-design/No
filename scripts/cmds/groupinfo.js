const fs = require("fs-extra");
const axios = require("axios");
const path = require("path");

module.exports = {
  config: {
    name: "groupinfo",
    aliases: ["boxinfo", "ginfo"],
    version: "1.2.0",
    author: "Christus × Gemini",
    countDown: 5,
    role: 0,
    description: "📊 Afficher les informations détaillées du groupe",
    category: "utility",
    guide: {
      fr: "{p}{n} : Permet d'obtenir un rapport complet sur le groupe actuel."
    }
  },

  onStart: async function ({ api, event, message }) {
    const { threadID, messageID } = event;
    const cacheDir = path.join(process.cwd(), "cache");
    const cachePath = path.join(cacheDir, `group_${threadID}_${Date.now()}.jpg`);

    try {
      // Récupération des données du groupe
      const threadInfo = await api.getThreadInfo(threadID);
      const { threadName, participantIDs, userInfo, adminIDs, messageCount, approvalMode, emoji, imageSrc } = threadInfo;

      const memCount = participantIDs.length;
      let genderMale = 0;
      let genderFemale = 0;
      let genderUnknown = 0;

      // Comptage des genres sécurisé
      if (userInfo && Array.isArray(userInfo)) {
        for (const user of userInfo) {
          if (user.gender === "MALE") genderMale++;
          else if (user.gender === "FEMALE") genderFemale++;
          else genderUnknown++;
        }
      } else if (typeof userInfo === "object") {
        for (const id in userInfo) {
          if (userInfo[id].gender === "MALE") genderMale++;
          else if (userInfo[id].gender === "FEMALE") genderFemale++;
          else genderUnknown++;
        }
      }

      // Récupération propre des noms des administrateurs
      const adminList = [];
      const adminCount = adminIDs ? adminIDs.length : 0;

      if (adminCount > 0) {
        for (const admin of adminIDs) {
          try {
            const id = admin.id || admin;
            if (id) {
              const info = await api.getUserInfo(id);
              if (info[id] && info[id].name) {
                adminList.push(info[id].name);
              }
            }
          } catch (e) {
            // Ignorer silencieusement un admin si introuvable
          }
        }
      }

      const modeApprobation = approvalMode ? "✓ Activé" : "✗ Désactivé";
      const boxEmoji = emoji || "🌐";

      // Construction du message au style propre et pro
      let msg = `╭─ 🪐 𝗚𝗥𝗢𝗨𝗣 𝗜𝗡𝗙𝗢𝗥𝗠𝗔𝗧𝗜𝗢𝗡𝗦 ─╮\n`;
      msg += `│ 👤 Nom : ${threadName || "Groupe sans nom"}\n`;
      msg += `│ 🆔 ID GC : ${threadID}\n`;
      msg += `│ 💬 Émoticône : ${boxEmoji}\n`;
      msg += `│ 📩 Messages : ${messageCount ? messageCount.toLocaleString() : "0"}\n`;
      msg += `│ 👥 Membres : ${memCount}\n`;
      msg += `├─ 📊 𝗦𝗧𝗔𝗧𝗜𝗦𝗧𝗜𝗤𝗨𝗘𝗦 ───────┤\n`;
      msg += `│ 👨 Hommes : ${genderMale}\n`;
      msg += `│ 👩 Femmes : ${genderFemale}\n`;
      msg += `│ ❔ Inconnus : ${genderUnknown}\n`;
      msg += `│ 🛡️ Admins : ${adminCount}\n`;
      msg += `│ 🔒 Approbation : ${modeApprobation}\n`;
      
      if (adminList.length > 0) {
        msg += `├─ 👑 𝗔𝗗𝗠𝗜𝗡𝗜𝗦𝗧𝗥𝗔𝗧𝗘𝗨𝗥𝗦 ────┤\n`;
        adminList.forEach(name => {
          msg += `│ • ${name}\n`;
        });
      }
      msg += `╰─────────────────────────╯`;

      // Gestion de l'image de groupe (Avatar)
      if (imageSrc) {
        fs.ensureDirSync(cacheDir);
        const response = await axios.get(imageSrc, { responseType: "arraybuffer" });
        fs.writeFileSync(cachePath, Buffer.from(response.data, "binary"));

        return api.sendMessage({
          body: msg,
          attachment: fs.createReadStream(cachePath)
        }, threadID, () => {
          if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
        }, messageID);
      } else {
        return api.sendMessage(msg, threadID, messageID);
      }

    } catch (err) {
      console.error("Erreur commande groupinfo :", err);
      if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
      return api.sendMessage("❌ Une erreur interne est survenue lors de la récupération des informations du groupe.", threadID, messageID);
    }
  }
};
