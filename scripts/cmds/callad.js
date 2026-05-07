const { getStreamsFromAttachment } = global.utils;

const mediaTypes = ["photo", "png", "animated_image", "video", "audio"];

module.exports = {
  config: {
    name: "callad",
    version: "angel-2.0",
    author: "Angel ✨",
    countDown: 5,
    role: 0,
    description: {
      fr: "💌 Envoie un message kawaii directement aux admins du bot"
    },
    category: "💖 support angel",
    guide: {
      fr: "callad <message> 💌"
    }
  },

  langs: {
    fr: {
      missingMessage: "🌸💔 Écris ton message avant d’envoyer aux anges admins !",
      noAdmin: "💔 Aucun ange admin n’est disponible actuellement…",
      success: "💖 Message envoyé aux anges admins (%1) 🌸",
      failed: "💔 Erreur lors de l’envoi à %1 admin(s)"
    }
  },

  onStart: async function ({ args, message, event, usersData, threadsData, api, commandName, getLang }) {
    const { config } = global.GoatBot;

    if (!args[0]) return message.reply(getLang("missingMessage"));
    if (!config.adminBot.length) return message.reply(getLang("noAdmin"));

    const senderID = event.senderID;
    const senderName = await usersData.getName(senderID);
    const isGroup = event.isGroup;

    const groupName = isGroup
      ? (await threadsData.get(event.threadID)).threadName
      : "Private Chat";

    const angelHeader =
`🌸💌 𝐀𝐍𝐆𝐄𝐋 𝐒𝐔𝐏𝐏𝐎𝐑𝐓 💌🌸

👤 Utilisateur : ${senderName}
🆔 ID : ${senderID}
💬 Contexte : ${groupName}

━━━━━━━━━━━━━━━
💖 Message :
${args.join(" ")}
━━━━━━━━━━━━━━━`;

    const formMessage = {
      body: angelHeader,
      mentions: [{
        id: senderID,
        tag: senderName
      }],
      attachment: await getStreamsFromAttachment(
        [...event.attachments, ...(event.messageReply?.attachments || [])]
          .filter(i => mediaTypes.includes(i.type))
      )
    };

    let success = 0;
    let failed = 0;

    for (const adminID of config.adminBot) {
      try {
        const msg = await api.sendMessage(formMessage, adminID);

        global.GoatBot.onReply.set(msg.messageID, {
          commandName,
          type: "userToAdmin",
          threadID: event.threadID,
          userID: senderID,
          messageIDSender: event.messageID
        });

        success++;
      } catch (e) {
        failed++;
      }
    }

    return message.reply(
`🌸💖 𝐀𝐍𝐆𝐄𝐋 𝐒𝐔𝐏𝐏𝐎𝐑𝐓 💖🌸

✨ Envoyé aux admins : ${success}
💔 Échec : ${failed}

Merci d’avoir contacté les anges admin 💌`
    );
  },

  onReply: async function ({ event, api, message, Reply, usersData, commandName, args }) {
    const senderName = await usersData.getName(event.senderID);

    switch (Reply.type) {

      case "userToAdmin": {
        const replyMsg =
`💌 𝐑𝐄𝐏𝐎𝐍𝐒𝐄 𝐀𝐍𝐆𝐄𝐋 💌

👑 Admin → ${senderName}
━━━━━━━━━━━━━━━
${args.join(" ")}
━━━━━━━━━━━━━━━`;

        return api.sendMessage(replyMsg, Reply.threadID, (err, info) => {
          if (!err) {
            global.GoatBot.onReply.set(info.messageID, {
              commandName,
              type: "adminReply",
              threadID: event.threadID
            });
          }
        }, Reply.messageIDSender);
      }

      case "adminReply": {
        const userMsg =
`🌸💌 𝐀𝐍𝐆𝐄𝐋 𝐑𝐄𝐏𝐋𝐘 💌🌸

👤 Admin : ${senderName}
━━━━━━━━━━━━━━━
${args.join(" ")}
━━━━━━━━━━━━━━━`;

        return api.sendMessage(userMsg, Reply.threadID, (err, info) => {
          if (!err) {
            global.GoatBot.onReply.set(info.messageID, {
              commandName,
              type: "userToAdmin"
            });
          }
        }, Reply.messageIDSender);
      }

    }
  }
};
