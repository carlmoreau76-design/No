const axios = require("axios");
const fs = require("fs");
const path = require("path");
const youtubeSearch = require("scraped-youtube-search");

// Objet temporaire pour mémoriser les recherches par utilisateur
if (!global.singCache) {
  global.singCache = new Map();
}

module.exports = {
  config: {
    name: "sing",
    aliases: ["chante", "music"],
    version: "1.0",
    author: "Shade",
    role: 0,
    category: "media",
    longDescription: { fr: "Recherche une musique, affiche la pochette, et l'envoie au format audio au reply." },
    guide: { fr: "{pn} [nom de la chanson]\nEnsuite, réponds (reply) au message avec le numéro de ton choix." }
  },

  onStart: async function ({ api, event, args, message }) {
    const userID = event.senderID;
    const query = args.join(" ");

    // ÉTAPE 1 : Si l'utilisateur tape ".sing chanson"
    if (query) {
      try {
        message.reply("🔍 Recherche de la chanson en cours...");
        
        // Recherche sur YouTube (gratuite et sans clé API)
        const results = await youtubeSearch.search(query);
        const videos = results.slice(0, 3); // On prend les 3 premiers résultats

        if (videos.length === 0) {
          return message.reply("❌ Aucune chanson trouvée.");
        }

        // Sauvegarde des résultats en mémoire pour ce joueur
        global.singCache.set(userID, videos);

        let msgBody = "🎵 Voici les résultats trouvés :\n\n";
        let attachments = [];

        // On prépare le texte et on récupère les images des miniatures
        for (let i = 0; i < videos.length; i++) {
          msgBody += `${i + 1}. 📌 ${videos[i].title}\n⏱️ Durée : ${videos[i].duration}\n\n`;
        }
        msgBody += "👉 Réponds (reply) à ce message avec le NUMÉRO (1, 2 ou 3) pour écouter !";

        return message.reply(msgBody);

      } catch (err) {
        console.error(err);
        return message.reply("💔 Erreur lors de la recherche.");
      }
    }
  },

  // ÉTAPE 2 : Gestion du reply sur le choix du numéro
  onReply: async function ({ api, event, Reply, message }) {
    const userID = event.senderID;
    const choice = event.body.trim();

    // On vérifie que l'utilisateur a bien des musiques en cache
    if (!global.singCache.has(userID)) return;
    const userVideos = global.singCache.get(userID);

    const index = parseInt(choice) - 1;
    if (isNaN(index) || index < 0 || index >= userVideos.length) {
      return message.reply("❌ Choix invalide. Écris simplement 1, 2 ou 3.");
    }

    const selectedVideo = userVideos[index];
    
    // Nettoie le cache pour cet utilisateur
    global.singCache.delete(userID);

    // 1️⃣ RÉACTION SABLIER SUR TON MESSAGE ⏳
    api.setMessageReaction("⏳", event.messageID, () => {}, true);

    const cacheDir = path.join(__dirname, "cache");
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }
    const audioPath = path.join(cacheDir, `sing_${userID}_${Date.now()}.mp3`);

    try {
      // Pour éviter les modules complexes qui plantent, on utilise une API de conversion externe gratuite
      const convertApiUrl = `https://api.dreadful-dev.repl.co/ytdl?url=${encodeURIComponent(selectedVideo.url)}&format=mp3`;
      
      const response = await axios({
        method: "GET",
        url: convertApiUrl,
        responseType: "stream"
      });

      const writer = fs.createWriteStream(audioPath);
      response.data.pipe(writer);

      writer.on("finish", async () => {
        // 2️⃣ RÉACTION CASQUE AUDIO QUAND LE TÉLÉCHARGEMENT EST FINI 🎧
        api.setMessageReaction("🎧", event.messageID, () => {}, true);

        // 3️⃣ ENVOI DE LA CHANSON MP3
        return message.reply({
          body: `🎶 Voici ton morceau : ${selectedVideo.title}\nBonne écoute !`,
          attachment: fs.createReadStream(audioPath)
        }, () => {
          // Suppression du fichier audio temporaire après envoi
          if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath);
        });
      });

      writer.on("error", (err) => {
        throw err;
      });

    } catch (e) {
      console.error(e);
      api.setMessageReaction("❌", event.messageID, () => {}, true);
      if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath);
      return message.reply("💔 Impossible de télécharger la musique. Le convertisseur est peut-être hors-ligne.");
    }
  }
};
