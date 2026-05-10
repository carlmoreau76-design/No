const { commands } = global.GoatBot;
const config = global.GoatBot.config;

// petit convertisseur italic
function toItalic(text) {
  const map = {
    a: "𝘢", b: "𝘣", c: "𝘤", d: "𝘥", e: "𝘦",
    f: "𝘧", g: "𝘨", h: "𝘩", i: "𝘪", j: "𝘫",
    k: "𝘬", l: "𝘭", m: "𝘮", n: "𝘯", o: "𝘰",
    p: "𝘱", q: "𝘲", r: "𝘳", s: "𝘴", t: "𝘵",
    u: "𝘶", v: "𝘷", w: "𝘸", x: "𝘹", y: "𝘺", z: "𝘻",
    A: "𝘈", B: "𝘉", C: "𝘊", D: "𝘋", E: "𝘌",
    F: "𝘍", G: "𝘎", H: "𝘏", I: "𝘐", J: "𝘑",
    K: "𝘒", L: "𝘓", M: "𝘔", N: "𝘕", O: "𝘖",
    P: "𝘗", Q: "𝘘", R: "𝘙", S: "𝘚", T: "𝘛",
    U: "𝘜", V: "𝘝", W: "𝘞", X: "𝘟", Y: "𝘠", Z: "𝘡"
  };

  return text.split("").map(c => map[c] || c).join("");
}

module.exports = {
  config: {
    name: "help",
    version: "7.4",
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
        .map(c => `╎ ✧ ${toItalic(c)}`) // 👈 ICI MODIF
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
      return message.reply(menu);
    }
  }
};
