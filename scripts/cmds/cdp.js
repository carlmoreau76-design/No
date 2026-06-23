const axios = require("axios");

module.exports = {
  config: {
    name: "cdp",
    aliases: ["coupledp"],
    version: "1.1",
    author: "Saimx69x × Gemini",
    countDown: 5,
    role: 0,
    shortDescription: "Random Couple DP",
    longDescription: "Envoie une photo de profil assortie pour les couples (Boy & Girl).",
    category: "image",
    guide: "{p}cdp"
  },

  onStart: async function ({ api, event, message }) {
    try {
      // 1. Récupération de l'URL de base depuis GitHub
      const githubRawUrl = "https://raw.githubusercontent.com/Saim-x69x/sakura/main/ApiUrl.json";
      const apiRes = await axios.get(githubRawUrl);
      const baseUrl = apiRes.data.apiv1;

      if (!baseUrl) throw new Error("Impossible de récupérer la base de l'API");

      // 2. Appel à l'API de couple DP
      const res = await axios.get(`${baseUrl}/api/cdp2`);
      const { garçon, fille, boy, girl } = res.data;

      // Gestion des variantes de clés de l'API (français ou anglais selon la réponse)
      const urlBoy = boy || garçon;
      const urlGirl = girl || fille;

      if (!urlBoy || !urlGirl) {
        return message.reply("❌ Les liens d'images reçus sont invalides ou manquants.");
      }

      // 3. Téléchargement des deux images en flux simultanés
      const [streamBoy, streamGirl] = await Promise.all([
        axios.get(urlBoy, { responseType: "stream" }),
        axios.get(urlGirl, { responseType: "stream" })
      ]);

      // 4. Envoi des deux photos assorties dans le même message
      return api.sendMessage(
        {
          body: "✨ Voici vos photos de profil de couple assorties ! 👩‍❤️‍👨",
          attachment: [streamBoy.data, streamGirl.data]
        },
        event.threadID,
        event.messageID
      );

    } catch (e) {
      console.error("[CDP SYSTEM ERROR]", e);
      return api.sendMessage(
        "❌ Une erreur est survenue lors de la récupération des images. Veuillez réessayer plus tard.", 
        event.threadID, 
        event.messageID
      );
    }
  }
};
