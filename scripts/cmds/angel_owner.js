module.exports = {
  config: {
    name: "angel",
    version: "1.1",
    author: "Angel Shade",
    role: 0,
    category: "owner",
    description: "🌸 Panel secret Angel (owner only)"
  },

  onStart: async function ({ message, event, args }) {

    const OWNER_ID = "61573867120837";

    // 🚫 sécurité owner
    if (event.senderID !== OWNER_ID) {
      return message.reply({
        body: "🌸⛔ Accès refusé… ce pouvoir appartient uniquement à mon créateur 💖",
        mentions: [{
          tag: "mon créateur",
          id: OWNER_ID
        }]
      });
    }

    const cmd = args[0]?.toLowerCase();

    // 🌸 menu principal
    if (!cmd) {
      return message.reply({
        body: `🌸💖 𝐀𝐍𝐆𝐄𝐋 𝐒𝐄𝐂𝐑𝐄𝐓 𝐏𝐀𝐍𝐄𝐋 💖🌸

👑 Owner: @mon créateur
✨ System: ONLINE

┏━━━━━━❀━━━━━━┓
  🌸 COMMANDES ANGEL 🌸
┗━━━━━━❀━━━━━━┛

💖 angel stats → état du bot
💫 angel mode → mode kawaii
👑 angel lock → sécuriser système

🌸 Tape une commande ✨`,
        mentions: [{
          tag: "mon créateur",
          id: OWNER_ID
        }]
      });
    }

    // 💖 stats
    if (cmd === "stats") {
      return message.reply(`
🌸💖 𝐀𝐍𝐆𝐄𝐋 𝐒𝐓𝐀𝐓𝐔𝐒 💖🌸

✨ Bot: ONLINE
💫 Mode: Angel kawaii
👑 Owner: ACTIF
🌸 Protection: MAX
      `);
    }

    // 💫 mode kawaii
    if (cmd === "mode") {
      return message.reply(`
💫🌸 𝐀𝐍𝐆𝐄𝐋 𝐌𝐎𝐃𝐄 🌸💫

💖 Douceur activée
✨ Énergie Angel en cours
🌸 Tout devient kawaii
      `);
    }

    // 👑 lock
    if (cmd === "lock") {
      return message.reply(`
👑🌸 𝐋𝐎𝐂𝐊 𝐀𝐂𝐓𝐈𝐕𝐄 🌸👑

💖 Système protégé
🌸 Accès limité au créateur
✨ Sécurité maximale
      `);
    }

    return message.reply("🌸 Commande inconnue… utilise `angel` 💖");
  }
};
