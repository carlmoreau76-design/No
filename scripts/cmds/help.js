const { commands } = global.GoatBot;

module.exports = {
  config: {
    name: "help",
    version: "6.0",
    author: "Shade",
    countDown: 2,
    role: 0,
    shortDescription: { en: "Show all commands" },
    category: "info",
    guide: { en: "help | help angel" }
  },

  onStart: async function ({ message, args, event }) {

    // 🔥 HELP ANGEL (IMAGE + MENU)
    if (args[0]?.toLowerCase() === "angel") {

      const imageURL = "https://i.imgur.com/TON_IMAGE.png"; // ⚠️ remplace

      const menu = `
━━━━━━━━━━━━━━
𝙰𝚟𝚊𝚒𝚕𝚊𝚋𝚕𝚎 𝙲𝚘𝚖𝚖𝚊𝚗𝚍𝚜:
━━━━━━━━━━━━━━
┍─━〔 🤖 | 𝐀𝐈 〕
╎ᯓ✧. ai
╎ᯓ✧. ask
╎ᯓ✧. gemini
┕━─────୨ৎ─────━ᥫ᭡
┍─━〔 💖 | LOVE 〕
╎ᯓ✧. kiss
╎ᯓ✧. hug
╎ᯓ✧. couple
┕━─────୨ৎ─────━ᥫ᭡
┍─━〔 🎮 | GAME 〕
╎ᯓ✧. quiz
╎ᯓ✧. ttt
┕━─────୨ৎ─────━ᥫ᭡

╭──────୨ৎ──────╮
╎ ⚡️ Prefix: !
╎ 👑 Owner: SHADE
╰──────୨ৎ──────╯
`;

      const msg = await message.reply({
        body: "💖 Angel Menu",
        attachment: await global.utils.getStreamFromURL(imageURL)
      });

      global.GoatBot.onReply.set(msg.messageID, {
        commandName: "help",
        type: "angelMenu",
        author: event.senderID,
        menu
      });

      return;
    }

    // 📚 HELP NORMAL
    let body = "📚 LISTE DES COMMANDES\n\n";

    const categories = {};

    for (let [name, cmd] of commands) {
      const cat = cmd.config.category || "Autre";
      if (!categories[cat]) categories[cat] = [];
      categories[cat].push(name);
    }

    for (const cat of Object.keys(categories)) {
      body += `📂 ${cat}\n`;
      body += categories[cat].map(c => `• ${c}`).join(" ") + "\n\n";
    }

    body += `🔢 Total: ${commands.size}\n`;
    body += `⚡ Prefix: *`;

    return message.reply(body);
  },

  // 🔥 REPLY SUR IMAGE
  onReply: async function ({ message, Reply }) {
    if (Reply.type === "angelMenu") {
      return message.reply(Reply.menu);
    }
  }
};
