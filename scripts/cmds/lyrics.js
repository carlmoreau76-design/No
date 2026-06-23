const axios = require("axios");
const fs = require("fs");
const path = require("path");
const canvas = require("canvas");

module.exports = {
  config: {
    name: "lyrics",
    aliases: ["paroles"],
    version: "2.5 Premium",
    author: "Aryan Chauhan & Shade × Gemini",
    role: 0,
    category: "media",
    longDescription: { fr: "Obtenir les paroles d'une chanson avec sa pochette d'album depuis l'API ZetBot." },
    guide: { fr: "{pn} [nom de la chanson]" }
  },

  onStart: async function ({ api, event, args, message }) {
    try {
      const songName = args.join(" ");
      if (!songName) return message.reply("❌ Veuillez fournir un nom de chanson.");

      const loading = await message.reply("⏳ Recherche des paroles sur votre API... 🎵");

      // 🛰️ Intégration de ton API personnalisée
      const monUrlApi = `https://zetbot-page.onrender.com/api/lyrics?query=${encodeURIComponent(songName)}`;
      
      const response = await axios.get(monUrlApi, { timeout: 8000 });
      const data = response.data;

      // Unsend du chargement
      try { await message.unsend(loading.messageID); } catch(e) {}

      // Vérification basique des données reçues
      if (!data || (!data.lyrics && !data.title)) {
        return message.reply("❌ Aucune parole trouvée pour cette chanson.");
      }

      // Gestion de l'image de fond et de la pochette d'album
      const bgUrl = "https://i.imgur.com/4M7QYqH.jpg";
      let bg, img;
      
      try {
        bg = await canvas.loadImage(bgUrl);
      } catch(e) {
        // Fond noir de secours si imgur est inaccessible
        bg = canvas.createCanvas(800, 800);
        const bgCtx = bg.getContext("2d");
        bgCtx.fillStyle = "#121212";
        bgCtx.fillRect(0, 0, 800, 800);
      }

      // Récupération de l'image de la pochette (souvent fournie sous "image", "thumbnail" ou "thumb")
      const coverUrl = data.image || data.thumbnail || data.thumb;
      if (coverUrl) {
        try {
          img = await canvas.loadImage(coverUrl);
        } catch (e) {
          coverUrl = null; // En cas d'erreur de chargement, on passe au fallback
        }
      }

      const c = canvas.createCanvas(800, 800);
      const ctx = c.getContext("2d");

      // Dessin des images sur le Canva
      ctx.drawImage(bg, 0, 0, 800, 800);
      
      if (coverUrl && img) {
        ctx.drawImage(img, 50, 50, 200, 200);
        // Fine bordure blanche autour de la pochette
        ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
        ctx.lineWidth = 3;
        ctx.strokeRect(50, 50, 200, 200);
      } else {
        // Carré gris par défaut si aucune image n'est disponible
        ctx.fillStyle = "#282828";
        ctx.fillRect(50, 50, 200, 200);
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 20px Arial";
        ctx.fillText("NO IMAGE", 90, 160);
      }

      // Texte : Titre et Artiste
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 32px Arial";
      const titleText = data.title || songName;
      ctx.fillText(titleText.length > 25 ? titleText.substring(0, 22) + "..." : titleText, 280, 110);

      ctx.fillStyle = "#1db954"; // Vert Spotify moderne pour l'artiste
      ctx.font = "bold 24px Arial";
      const artistText = data.artist || "Artiste Inconnu";
      ctx.fillText(artistText.length > 30 ? artistText.substring(0, 27) + "..." : artistText, 280, 160);

      // Séparateur horizontal graphique
      ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(50, 275); ctx.lineTo(750, 275); ctx.stroke();

      // Traitement et affichage des paroles (limitées pour éviter le débordement vertical)
      const rawLyrics = data.lyrics || "Les paroles n'ont pas pu être chargées.";
      const cleanLyrics = rawLyrics.replace(/\\n/g, "\n"); // Corrige les sauts de ligne échappés
      const lyricsSnippet = cleanLyrics.length > 900 ? cleanLyrics.slice(0, 850) + "\n\n[...Paroles tronquées...]" : cleanLyrics;
      
      ctx.fillStyle = "#ffffff";
      ctx.font = "20px Arial";
      wrapText(ctx, lyricsSnippet, 50, 315, 700, 28);

      // Création propre du fichier temporaire pour l'envoi
      const cacheDir = path.join(__dirname, "cache");
      if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true });
      }
      const filePath = path.join(cacheDir, `lyrics_${event.senderID}_${Date.now()}.png`);

      fs.writeFileSync(filePath, c.toBuffer("image/png"));

      // Envoi de la réponse avec suppression sécurisée
      return message.reply({
        body: `🎵 Paroles de « ${data.title || songName} » générées via votre API !`,
        attachment: fs.createReadStream(filePath)
      }, () => {
        try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch(e) {}
      });

    } catch (e) {
      console.error(e);
      return message.reply("❌ Une erreur est survenue lors de la communication avec l'API : " + (e.response?.data?.error || e.message));
    }
  }
};

// Fonction de retour à la ligne automatique améliorée prenant en charge les \n originaux
function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const lines = text.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const words = lines[i].split(" ");
    let currentLine = "";

    for (let n = 0; n < words.length; n++) {
      const testLine = currentLine + words[n] + " ";
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;

      if (testWidth > maxWidth && n > 0) {
        ctx.fillText(currentLine, x, y);
        currentLine = words[n] + " ";
        y += lineHeight;
      } else {
        currentLine = testLine;
      }
    }
    ctx.fillText(currentLine, x, y);
    y += lineHeight;
  }
          }
