const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const { createCanvas, loadImage } = require("canvas");

module.exports = {
  config: {
    name: "lyrics",
    aliases: ["paroles"],
    version: "4.0 Portrait",
    author: "Shade × Gemini",
    countDown: 5,
    role: 0,
    shortDescription: "Affiche les paroles dans une carte au format portrait vertical.",
    category: "media",
    guide: "{p}lyrics [nom de la chanson]"
  },

  onStart: async function ({ message, args, event }) {
    const query = args.join(" ");

    if (!query) {
      return message.reply("⚠️ Veuillez spécifier un nom de chanson.\nExemple : !lyrics Eminem Lose Yourself");
    }

    const loading = await message.reply("⏳ Recherche et génération de la carte portrait...");

    try {
      // Appel à ton API de paroles
      const apiUrl = `https://zetbot-page.onrender.com/api/lyrics?query=${encodeURIComponent(query)}`;
      const response = await axios.get(apiUrl, { timeout: 10000 });
      const data = response.data;

      if (!data || (!data.lyrics && !data.title)) {
        await message.unsend(loading.messageID);
        return message.reply("❌ Aucune parole ou chanson trouvée pour cette recherche.");
      }

      const cache = path.join(__dirname, "cache");
      await fs.ensureDir(cache);

      // ==========================================
      // 📐 CONFIGURATION STRICTEMENT PORTRAIT (DROIT)
      // ==========================================
      const canvasWidth = 500;   // Largeur fixe (format debout)
      const canvasHeight = 850;  // Hauteur allongée pour contenir les paroles en dessous
      const padding = 25;

      const canvas = createCanvas(canvasWidth, canvasHeight);
      const ctx = canvas.getContext("2d");

      // 1. Fond arrière NOIR PUR
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      // 2. Intégration de la pochette d'album (Carré droit et centré en haut)
      const coverUrl = data.image || data.thumbnail || data.thumb;
      const coverSize = 300; 
      const coverX = (canvasWidth - coverSize) / 2;
      const coverY = 40;

      if (coverUrl) {
        try {
          // Téléchargement temporaire de la pochette
          const tmpCoverPath = path.join(cache, `lyric_thumb_${Date.now()}.jpg`);
          const resImg = await axios({ url: coverUrl, responseType: "stream", timeout: 5000 });
          
          await new Promise((resolve, reject) => {
            const stream = fs.createWriteStream(tmpCoverPath);
            resImg.data.pipe(stream);
            stream.on("finish", resolve);
            stream.on("error", reject);
          });

          const img = await loadImage(tmpCoverPath);

          // Rendu de l'image droite (découpe centrée pour éviter toute déformation)
          ctx.save();
          ctx.beginPath();
          ctx.rect(coverX, coverY, coverSize, coverSize);
          ctx.clip();

          const imgRatio = img.width / img.height;
          let drawWidth, drawHeight, offsetX, offsetY;

          if (imgRatio > 1) {
            drawHeight = coverSize;
            drawWidth = coverSize * imgRatio;
            offsetX = coverX - (drawWidth - coverSize) / 2;
            offsetY = coverY;
          } else {
            drawWidth = coverSize;
            drawHeight = coverSize / imgRatio;
            offsetX = coverX;
            offsetY = coverY - (drawHeight - coverSize) / 2;
          }

          ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
          ctx.restore();

          // Suppression du fichier temporaire de la pochette
          try { fs.unlinkSync(tmpCoverPath); } catch (_) {}

        } catch (err) {
          // Fallback si la pochette échoue : rectangle gris neutre
          ctx.fillStyle = "#1a1a1a";
          ctx.fillRect(coverX, coverY, coverSize, coverSize);
        }
      } else {
        // Pas d'image disponible : cadre vide
        ctx.fillStyle = "#1a1a1a";
        ctx.fillRect(coverX, coverY, coverSize, coverSize);
      }

      // Cadre blanc très fin autour de la photo
      ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
      ctx.lineWidth = 2;
      ctx.strokeRect(coverX, coverY, coverSize, coverSize);

      // 3. Zone de textes (Titre & Artiste)
      ctx.textAlign = "center";
      
      // Titre
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 26px Arial";
      const titleText = data.title || query;
      ctx.fillText(titleText.length > 30 ? titleText.substring(0, 27) + "..." : titleText, canvasWidth / 2, coverY + coverSize + 45);

      // Artiste
      ctx.fillStyle = "#1db954"; // Vert style lecteur de musique
      ctx.font = "bold 18px Arial";
      const artistText = data.artist || "Artiste Inconnu";
      ctx.fillText(artistText.length > 35 ? artistText.substring(0, 32) + "..." : artistText, canvasWidth / 2, coverY + coverSize + 75);

      // Ligne de séparation droite
      ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(padding, coverY + coverSize + 100);
      ctx.lineTo(canvasWidth - padding, coverY + coverSize + 100);
      ctx.stroke();

      // 4. Rendu des Paroles (Affichage textuel droit et aligné sous la ligne)
      ctx.textAlign = "left";
      ctx.fillStyle = "#e0e0e0";
      ctx.font = "16px Arial";

      const rawLyrics = data.lyrics || "Aucune parole disponible.";
      const cleanLyrics = rawLyrics.replace(/\\n/g, "\n");
      // Tronquer si le texte est trop massif pour tenir dans la zone portrait basse
      const maxCharacters = 600;
      const lyricsSnippet = cleanLyrics.length > maxCharacters ? cleanLyrics.slice(0, maxCharacters) + "\n\n[...]" : cleanLyrics;

      // Application du retour à la ligne automatique dans la zone dédiée
      const startLyricsY = coverY + coverSize + 130;
      wrapText(ctx, lyricsSnippet, padding, startLyricsY, canvasWidth - (padding * 2), 24);

      // 5. Sauvegarde et envoi du rendu final
      const outPath = path.join(cache, `lyrics_portrait_${Date.now()}.jpg`);
      fs.writeFileSync(outPath, canvas.toBuffer("image/jpeg"));

      await message.reply({
        body: `🎵 Voici la fiche portrait de « ${data.title || query} »`,
        attachment: fs.createReadStream(outPath)
      });

      // Nettoyage de l'image finale générée
      setTimeout(() => {
        try { if (fs.existsSync(outPath)) fs.unlinkSync(outPath); } catch (_) {}
      }, 3500);

      if (loadingId) {
        try { await message.unsend(loadingId); } catch (_) {}
      }

    } catch (e) {
      console.error(e);
      if (loadingId) {
        try { await message.unsend(loadingId); } catch (_) {}
      }
      return message.reply("❌ Une erreur est survenue lors du traitement des paroles.");
    }
  }
};

// Fonction de gestion des retours à la ligne respectant les sauts d'origine (\n)
function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const lines = text.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const words = lines[i].split(" ");
    let currentLine = "";

    for (let n = 0; n < words.length; n++) {
      const testLine = currentLine + words[n] + " ";
      const metrics = ctx.measureText(testLine);

      if (metrics.width > maxWidth && n > 0) {
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
