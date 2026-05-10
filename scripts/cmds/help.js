const { commands } = global.GoatBot;
const config = global.GoatBot.config;

module.exports = {
  config: {
    name: "help",
    version: "7.3",
    author: "Shade",
    countDown: 2,
    role: 0,
    shortDescription: { en: "Angel kawaii menu" },
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
╭─ ⋆｡˚ ♡ 𝗔𝗡𝗚𝗘𝗟 𝗕𝗢𝗧 ♡ ˚｡⋆ ─╮
🌸 Menu Commands
⚡ Prefix : ${config.prefix || "!"}
╰────────────────────╯
`;

    for (const cat of Object.keys(categories).sort()) {
      menu += `
┏━〔 🌷 ${cat.toUpperCase()} 〕
`;

      menu += categories[cat]
        .sort()
        .map(c => `╎ ✧ ${c}`)
        .join("\n");

      menu += `
┗━━━━━━━━━━━━━━━
`;
    }

    menu += `
╭──── ♡ ANGEL INFO ♡ ────╮
🔢 Total : ${commands.size}
👑 Owner : SHADE
💫 Stay cute, stay kind
╰────────────────────╯
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
