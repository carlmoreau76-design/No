const { commands } = global.GoatBot;
const config = global.GoatBot.config;
const axios = require("axios");

// 💠 italic font
function toItalic(text) {
  const map = {
    a:"𝘢", b:"𝘣", c:"𝘤", d:"𝘥", e:"𝘦",
    f:"𝘧", g:"𝘨", h:"𝘩", i:"𝘪", j:"𝘫",
    k:"𝘬", l:"𝘭", m:"𝘮", n:"𝘯", o:"𝘰",
    p:"𝘱", q:"𝘲", r:"𝘳", s:"𝘴", t:"𝘵",
    u:"𝘶", v:"𝘷", w:"𝘸", x:"𝘹", y:"𝘺", z:"𝘻"
  };

  return text.split("").map(c => map[c] || c).join("");
}

module.exports = {
  config: {
    name: "help",
    version: "7.5",
    author: "Shade",
    countDown: 2,
    role: 0,
    shortDescription: { en: "Kawaii help menu" },
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

      menu += `\n┏━〔 🌷 ${cat.toUpperCase()} 〕\n`;

      menu += categories[cat]
        .sort()
        .map(c => `╎ ✧ ${toItalic(c)}`)
        .join("\n");

      menu += `\n┗━━━━━━━━━━━━━━━\n`;
    }

    menu += `
╭──── ♡ ANGEL INFO ♡ ────╮
🔢 Total : ${commands.size}
👑 Owner : SHADE
💫 Stay cute, stay kind
╰────────────────────╯
`;

    try {
      const stream = await axios.get(imageURL, { responseType: "stream" });

      return message.reply({
        body: menu,
        attachment: stream.data
      });

    } catch (e) {
      return message.reply(menu);
    }
  }
};
