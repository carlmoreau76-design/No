const CREATOR_UID = "61573867120837"; // ton UID

function frame(msg) {
  return `╭━━━(｡•̀ᴗ-)✧━━━╮
💖 𝗥𝗘𝗦𝗘𝗧 𝗕𝗔𝗡𝗞 💖
╰━━━━━━━━━━━━━━╯

${msg}

╰━━━(✧˙꒳˙✧)━━━╯`;
}

module.exports = {
  config: {
    name: "resetbank",
    version: "1.0",
    author: "Shade",
    role: 2,
    category: "admin",
    shortDescription: "Reset total des banques (owner only)"
  },

  onStart: async function ({ message, event, usersData }) {
    const senderID = event.senderID;

    // 🔒 sécurité owner
    if (senderID !== CREATOR_UID) {
      return message.reply(frame("❌ Tu n’as pas accès à cette commande, désolé…"));
    }

    message.reply(frame("⏳ Reset en cours… veuillez patienter un instant nya~ 💫"));

    try {
      const allUsers = await usersData.getAll();

      for (let user of allUsers) {
        if (!user.data) user.data = {};
        if (!user.data.bank) user.data.bank = {};

        user.data.bank.balance = 0;
        user.data.bank.loan = 0;
        user.data.bank.transactions = [];

        await usersData.set(user.userID, user.data);
      }

      return message.reply(frame("✨ Reset terminé !\n💳 Toutes les banques sont revenues à zéro nya~ 💖"));
    } catch (err) {
      console.log(err);
      return message.reply(frame("💔 Oups… erreur pendant le reset"));
    }
  }
};
