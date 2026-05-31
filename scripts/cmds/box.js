module.exports = {
  config: {
    name: "box",
    version: "1.4 angel kawaii pro",
    author: "Shade ✨ Angel Edit",
    role: 0,
    shortDescription: "📦 Gestion du groupe kawaii",
    category: "group"
  },

  onStart: async function ({ api, event, message }) {

    try {
      const info = await api.getThreadInfo(event.threadID);

      const box = `
╭───────────────✦
│ 📦 𝗚𝗘𝗦𝗧𝗜𝗢𝗡 𝗗𝗨 𝗚𝗥𝗢𝗨𝗣𝗘
├────────────────
│ 🏷️ Nom : ${info.threadName}
│ 😀 Emoji : ${info.emoji || "😊"}
│ 👥 Membres : ${info.participantIDs.length}
│ 👑 Admins : ${info.adminIDs.length}
│ 🔐 Approbation : ${info.approvalMode ? "🔴 ACTIVÉ" : "🟢 DÉSACTIVÉ"}
├────────────────
│ 1️⃣ Changer le nom du groupe
│ 2️⃣ Changer la photo du groupe
│ 3️⃣ Changer l’emoji du groupe
│ 4️⃣ Voir l’UID du groupe
│ 5️⃣ Voir tous les membres
│ 6️⃣ Informations du groupe
├────────────────
👉 Réponds avec un chiffre 💖✨
      `;

      const msg = await message.reply(box);

      global.GoatBot.onReply.set(msg.messageID, {
        commandName: this.config.name,
        author: event.senderID,
        threadID: event.threadID
      });

    } catch (err) {
      console.error(err);
      message.reply("💔✨ Erreur box groupe...");
    }
  },

  onReply: async function ({ api, event, Reply, message }) {

    if (event.senderID !== Reply.author) {
      return message.reply("💔✨ Tu n’es pas autorisé");
    }

    const choice = event.body;
    const info = await api.getThreadInfo(event.threadID);

    // 🆔 UID
    if (choice === "4") {
      return message.reply(`🆔 UID du groupe:\n${event.threadID}`);
    }

    // 👥 ALL MEMBERS
    if (choice === "5") {
      return message.reply(`👥 Membres (${info.participantIDs.length}):\n\n${info.participantIDs.join("\n")}`);
    }

    // 💖 GROUP INFO (AVEC GARÇONS / FILLES)
    if (choice === "6") {

      let male = 0;
      let female = 0;
      let unknown = 0;

      try {
        const users = await Promise.all(
          info.userInfo.map(u => api.getUserInfo(u.id))
        );

        users.forEach(u => {
          const gender = u[u.id]?.gender;

          if (gender === "MALE") male++;
          else if (gender === "FEMALE") female++;
          else unknown++;
        });

      } catch (e) {
        unknown = info.participantIDs.length;
      }

      return message.reply(`
💖✨ INFORMATIONS GROUPE

🏷️ Nom : ${info.threadName}
😀 Emoji : ${info.emoji || "😊"}

👥 Total : ${info.participantIDs.length}
👨 Garçons : ${male}
👩 Filles : ${female}
❓ Inconnu : ${unknown}

👑 Admins : ${info.adminIDs.length}
🔐 Approbation : ${info.approvalMode ? "ACTIVÉ" : "DÉSACTIVÉ"}

🆔 ID : ${event.threadID}
      `);
    }

    // 🏷️ NAME
    if (choice === "1") {
      return message.reply("🏷️ Envoie le nouveau nom 💖", (err, msg) => {
        global.GoatBot.onReply.set(msg.messageID, {
          commandName: "box_name",
          author: event.senderID
        });
      });
    }

    // 🖼️ PHOTO
    if (choice === "2") {
      return message.reply("🖼️ Envoie une image 💖", (err, msg) => {
        global.GoatBot.onReply.set(msg.messageID, {
          commandName: "box_photo",
          author: event.senderID
        });
      });
    }

    // 😀 EMOJI
    if (choice === "3") {
      return message.reply("😀 Envoie un emoji 💖", (err, msg) => {
        global.GoatBot.onReply.set(msg.messageID, {
          commandName: "box_emoji",
          author: event.senderID
        });
      });
    }
  }
};
