const fs = require("fs-extra");
const axios = require("axios");
const path = require("path");

module.exports = {
  config: {
    name: "groupinfo",
    aliases: ["boxinfo"],
    version: "1.1",
    author: "Christus",
    countDown: 5,
    role: 0,
    shortDescription: "🌸 infos du groupe kawaii",
    longDescription: "Affiche les informations du groupe avec un style kawaii ✨",
    category: "groupe",
  },

  onStart: async function ({ api, event }) {
    try {
      const threadInfo = await api.getThreadInfo(event.threadID);

      const memCount = threadInfo.participantIDs.length;
      const genderMale = [];
      const genderFemale = [];
      const genderUnknown = [];
      const adminList = [];

      for (const user of threadInfo.userInfo) {
        const gender = user.gender;
        if (gender === "MALE") genderMale.push(user);
        else if (gender === "FEMALE") genderFemale.push(user);
        else genderUnknown.push(user.name);
      }

      for (const admin of threadInfo.adminIDs) {
        const info = await api.getUserInfo(admin.id);
        adminList.push(info[admin.id].name);
      }

      const approvalMode = threadInfo.approvalMode ? "💖 Activé" : "💔 Désactivé";
      const emoji = threadInfo.emoji || "🌸";

      const imageURL = threadInfo.imageSrc || null;

      const msg =
`╭─🌸 𝗚𝗥𝗢𝗨𝗣 𝗜𝗡𝗙𝗢 🌸─╮
✨ Nom : ${threadInfo.threadName || "Groupe sans nom"}
🆔 ID : ${threadInfo.threadID}
💬 Emoji : ${emoji}
📨 Messages : ${threadInfo.messageCount.toLocaleString()}
👥 Membres : ${memCount}

╭─💖 Statistiques 💖─╮
👨 Hommes : ${genderMale.length}
👩 Femmes : ${genderFemale.length}
❔ Inconnu : ${genderUnknown.length}
🛡️ Admins : ${threadInfo.adminIDs.length}
🔒 Mode : ${approvalMode}
╰────────────────╯

╭─👑 Admins 👑─╮
${adminList.map(name => `• ${name}`).join("\n")}
╰────────────────╯

🌸 Bot : Angel System`;

      const cachePath = path.join(__dirname, "cache", "groupinfo.jpg");
      fs.ensureDirSync(path.join(__dirname, "cache"));

      if (imageURL) {
        const response = await axios.get(imageURL, { responseType: "arraybuffer" });
        fs.writeFileSync(cachePath, Buffer.from(response.data, "binary"));

        await api.sendMessage(
          {
            body: msg,
            attachment: fs.createReadStream(cachePath),
          },
          event.threadID,
          () => fs.unlinkSync(cachePath),
          event.messageID
        );
      } else {
        await api.sendMessage(msg, event.threadID, event.messageID);
      }

    } catch (err) {
      console.error(err);
      api.sendMessage(
        "💔 erreur groupe info 🌸",
        event.threadID,
        event.messageID
      );
    }
  },
};
