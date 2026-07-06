const { commands } = global.GoatBot;
const config = global.GoatBot.config;

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
    owner: "👑 𝐎𝐖𝐍𝐄𝐑",
    admin: "🛡️ 𝐀𝐃𝐌𝐈𝐍𝐈𝐒𝐓𝐑𝐀𝐓𝐈𝐎𝐍",
    economy: "💰 𝐄́𝐂𝐎𝐍𝐎𝐌𝐈𝐄",
    ai: "🤖 𝐈𝐀",
    system: "🪐 𝐇𝐎𝐑𝐈 𝐒𝐘𝐒𝐓𝐄𝐌",
    image: "🎨 𝐈𝐌𝐀𝐆𝐄𝐒",
    media: "🎵 𝐌𝐄́𝐃𝐈𝐀",
    game: "🎮 𝐆𝐀𝐌𝐄𝐒",
    utility: "📜 𝐔𝐓𝐈𝐋𝐈𝐓𝐀𝐈𝐑𝐄𝐒",
    download: "📦 𝐃𝐎𝐖𝐍𝐋𝐎𝐀𝐃",
    security: "🔒 𝐒𝐄́𝐂𝐔𝐑𝐈𝐓𝐄́",
    settings: "⚙️ 𝐂𝐎𝐍𝐅𝐈𝐆",
    other: "❓ 𝐀𝐔𝐓𝐑𝐄"
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
    category: "system",
    guide: "help [commande]"
  },
  onStart: async function ({ message, args }) {
    
    // ───── DÉTAIL COMMANDE ─────
    if (args[0]) {
      const search = args[0].toLowerCase();
      const cmd = commands.get(search) ||
        Array.from(commands.values())
          .find(c => c.config?.aliases?.includes(search));
      if (!cmd) return message.reply("❌ Commande introuvable.");
      const c = cmd.config;
      return message.reply({
        body: `╭─ 🪐 𝐇𝐎𝐑𝐈 𝐒𝐘𝐒𝐓𝐄𝐌 𝐃𝐄𝐓𝐀𝐈𝐋𝐒 🪐 ─╮\n✨ Nom : ${c.name.toUpperCase()}\n📝 Desc : ${c.shortDescription?.en || "Aucune"}\n🏷️ Catégorie : ${c.category || "other"}\n⏳ Cooldown : ${c.countDown || 0}s\n🔐 Permission : ${c.role === 2 ? "Admin" : c.role === 1 ? "Modérateur" : "Utilisateur"}\n╰──────────────────────────╯\n💡 Utilisation :\n➤ ${config.prefix || ""}${c.guide?.en || c.name}`
      });
    }

    // ───── MENU ─────
    const cats = {};
    for (const [name, cmd] of commands) {
      const cat = cmd?.config?.category || "other";
      if (!cats[cat]) cats[cat] = [];
      cats[cat].push(name);
    }

    let menu = `🪐 𝐇𝐎𝐑𝐈 𝐒𝐘𝐒𝐓𝐄𝐌 𝐂𝐎𝐌𝐌𝐀𝐍𝐃𝐒 (${commands.size})\n`;
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
    menu += `\n🪐 𝐇𝐞𝐥𝐩: ${p}help <cmd>`;
    menu += `\n🪐 𝐎𝐰𝐧𝐞𝐫: @𝐒𝐡𝐚𝐝𝐞 🪐`;

    return message.reply({
      body: menu
    });
  }
};
