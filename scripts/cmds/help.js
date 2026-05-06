const { commands } = global.GoatBot;
const config = global.GoatBot.config;

module.exports = {
  config: {
    name: "help",
    version: "7.1",
    author: "Shade",
    countDown: 2,
    role: 0,
    shortDescription: { en: "Angel auto menu" },
    category: "info",
    guide: { en: "help" }
  },

  onStart: async function ({ message }) {

    const imageURL = "https://i.imgur.com/7g7Yd8v.png";

    const categories = {};

    for (let [name, cmd] of commands) {
      const cat = cmd?.config?.category || "other";

      if (!categories[cat]) categories[cat] = [];
      categories[cat].push(name);
    }

    let menu = `
━━━━━━━━━━━━━━
Angel 𝙲𝚘𝚖𝚖𝚊𝚗𝚍𝚜 💖:
━━━━━━━━━━━━━━
`;

    for (const cat of Object.keys(categories).sort()) {
      menu += `┍─━〔 ✦ | ${cat.toUpperCase()} 〕\n`;

      const cmds = categories[cat]
        .sort()
        .map(c => `╎ᯓ✧ ${c}`)
        .join("\n");

      menu += cmds + "\n";
      menu += `┕━─────୨ৎ─────━ᥫ᭡\n`;
    }

    menu += `
╭──────୨ৎ──────╮
╎ 🔢 Total: ${commands.size}
╎ ⚡ Prefix: ${config.prefix || "!"}
╎ 👑 Owner: SHADE
╰──────୨ৎ──────╯
`;

    try {
      return message.reply({
        body: menu,
        attachment: await global.utils.getStreamFromURL(imageURL)
      });
    } catch (e) {
      // fallback si image bug
      return message.reply(menu);
    }
  }
};
