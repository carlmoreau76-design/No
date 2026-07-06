const axios = require("axios");

// Liste des catégories autorisées (SFW) pour protéger le bot du ban Messenger
const ALLOWED_CATEGORIES = [
  "maid", 
  "waifu", 
  "marin-kitagawa", 
  "mori-calliope", 
  "raiden-shogun", 
  "kamisato-ayaka", 
  "uniform", 
  "selfies",
  "oppai",
  "kamisato-ayaka", 
  "ass", 
  "hentai", 
  "milf", 
  "oral", 
  "paizuri", 
  "ecchi", 
  "ero"
];

module.exports = {
  config: {
    name: "waifu2",
    aliases: ["wf2"],
    version: "2.0.0",
    author: "Shade × Gemini",
    countDown: 5,
    role: 0,
    description: "🌸 Génère une image de waifu selon la catégorie choisie",
    category: "image",
    guide: {
      fr: "{p}{n} [catégorie] : Affiche une image.\nCatégories valides : maid, waifu, marin-kitagawa, mori-calliope, raiden-shogun, kamisato-ayaka, uniform, selfies"
    }
  },

  onStart: async function ({ message, args, event, api }) {
    const { threadID, messageID } = event;
    let category = args[0]?.toLowerCase();

    // Si aucune catégorie n'est entrée, on en prend une propre au hasard
    if (!category) {
      category = ALLOWED_CATEGORIES[Math.floor(Math.random() * ALLOWED_CATEGORIES.length)];
    }

    // Sécurité : Si l'utilisateur demande une catégorie non autorisée ou sensible
    if (!ALLOWED_CATEGORIES.includes(category)) {
      return message.reply(`❌ Catégorie non autorisée ou invalide.\n\n✨ **Options disponibles :**\n${ALLOWED_CATEGORIES.join(", ")}`);
    }

    const apiUrl = `https://free-goat-api.onrender.com/waifu2?category=${category}`;

    try {
      try { api.setMessageReaction("⏳", messageID, () => {}, true); } catch(e){}

      // Appel de l'API avec la catégorie en paramètre
      const response = await axios.get(apiUrl, { responseType: "stream" });

      await api.sendMessage({
        body: `🌸 **[WAIFU]** Catégorie : *${category}*`,
        attachment: response.data
      }, threadID, messageID);

      try { api.setMessageReaction("✨", messageID, () => {}, true); } catch(e){}

    } catch (error) {
      console.error("Erreur avec l'API Waifu2 :", error);
      try { api.setMessageReaction("❌", messageID, () => {}, true); } catch(e){}
      return message.reply("❌ Impossible de récupérer l'image. L'API est peut-être saturée, réessaye dans un instant.");
    }
  }
};
