const { commands } = global.GoatBot;
const config = global.GoatBot.config;
const axios = require("axios");

function toBold(text) {
  const map = {
    a:"𝐚", b:"𝐛", c:"𝐜", d:"𝐝", e:"𝐞", f:"𝐟", g:"𝐠", h:"𝐡", i:"𝐢", j:"𝐣",
    k:"𝐤", l:"𝐥", m:"𝐦", n:"𝐧", o:"𝐨", p:"𝐩", q:"𝐪", r:"𝐫", s:"𝐬", t:"𝐭",
    u:"𝐮", v:"𝐯", w:"𝐰", x:"𝐱", y:"𝐲", z:"𝐳"
  };
  return text.split("").map(c => map[c.toLowerCase()] || c).join("");
}

function formatCategory(cat) {
  const map = {
    owner: "👑 OWNER",
    admin: "🛡️ ADMINISTRATION",
    economy: "💰 ÉCONOMIE",
    ai: "🤖 IA",
    angelsys: "⭐ ANGEL SYSTEM",
    image: "🎨 IMAGES",
    media: "🎵 MÉDIA",
    game: "🎮 GAMES",
    utility: "📜 UTILITAIRES",
    download: "📦 DOWNLOAD",
    security: "🔒 SÉCURITÉ",
    settings: "⚙️ CONFIG",
    other: "❓ AUTRE"
  };

  return map[cat.toLowerCase()] || `❓ ${cat.toUpperCase()}`;
}

module.exports = {
  config: {
    name: "help",
    version: "10.0",
    author: "Shade",
    countDown: 2,
    role: 0,
    category: "info",
    guide: "help [commande]"
  },

  onStart: async function ({ message, args }) {

    const imageURL = "https://files.catbox.moe/ihbb9m.png";
    let streamData;

    try {
      const res = await axios.get(imageURL, { responseType: "stream" });
      streamData = res.data;
    } catch {}

    // ───── DÉTAIL COMMANDE ─────
    if (args[0]) {
      const search = args[0].toLowerCase();

      const cmd = commands.get(search) ||
        Array.from(commands.values())
          .find(c => c.config?.aliases?.includes(search));

      if (!cmd) return message.reply("❌ Commande introuvable.");

      const c = cmd.config;

      return message.reply({
        body: `
╭─ ⋆｡˚ ♡ 𝐂𝐎𝐌𝐌𝐀𝐍𝐃 𝐃𝐄𝐓𝐀𝐈𝐋𝐒 ♡ ˚｡⋆ ─╮
✨ Nom : ${c.name.toUpperCase()}
📝 Desc : ${c.shortDescription?.en || "Aucune"}
🏷️ Catégorie : ${c.category || "other"}
⏳ Cooldown : ${c.countDown || 0}s
🔐 Permission : ${c.role === 2 ? "Admin" : c.role === 1 ? "Modérateur" : "Utilisateur"}
╰──────────────────────────╯

💡 Utilisation :
➤ ${config.prefix || ""}${c.guide?.en || c.name}
        `,
        attachment: streamData
      });
    }

    // ───── MENU ─────
    const cats = {};

    for (const [name, cmd] of commands) {
      const cat = cmd?.config?.category || "other";

      if (!cats[cat]) cats[cat] = [];
      cats[cat].push(name);
    }

    let menu = `🔍 ${toBold("Available Commands")} 🧰 (${commands.size})\n`;

    for (const cat of Object.keys(cats).sort()) {
      menu += `\n${formatCategory(cat)} (${cats[cat].length})\n\n`;

      let line = "";
      cats[cat].sort().forEach((cmd, i) => {
        line += `📄 ${cmd}  `;
        if ((i + 1) % 3 === 0) {
          menu += line + "\n";
          line = "";
        }
      });

      if (line) menu += line + "\n";
    }

    const p = config.prefix || "!";

    menu += `\n➜ ${toBold("Help")}: ${p}help <cmd>`;
    menu += `\n➜ ${toBold("Owner")} @𝐒𝐡𝐚𝐝𝐞 🪐`;

    return message.reply({
      body: menu,
      attachment: streamData
    });
  }
};
