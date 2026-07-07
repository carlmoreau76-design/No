const { Command } = require('goatbot');
const axios = require('axios');

module.exports = new Command({
  name: "quote",
  version: "1.2.0",
  description: "Envoie une citation d'anime aléatoire",
  usage: "quote",
  category: "utility",
  role: 0,
  cooldown: 3,

  async execute({ message }) {
    try {
      await message.reply("📜 Recherche d'une citation d'anime...");
      
      const { data } = await axios.get(
        "https://zetbot-page.onrender.com/api/api/animequotes",
        { timeout: 8000 }
      );

      if (!data || !data.quote_fr) {
        return message.reply("❌ Aucune citation trouvée.");
      }

      const character = data.character || "Personnage inconnu";
      const quoteFr = data.quote_fr;

      return message.reply(
        `╭─ 🪐 𝗔𝗡𝗜𝗠𝗘 𝗤𝗨𝗢𝗧𝗘 ────────╮\n` +
        `│\n` +
        `│ "${quoteFr}"\n` +
        `│\n` +
        `│ ✍️ ${character}\n` +
        `╰──────────────────────────╯`
      );

    } catch (error) {
      console.error("[QUOTE ERROR]", error.message);
      return message.reply(
        "❌ Impossible de récupérer une citation pour le moment.\nRéessaie dans quelques secondes."
      );
    }
  }
});
