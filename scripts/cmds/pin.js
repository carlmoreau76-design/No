const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const { createCanvas, loadImage } = require("canvas");

module.exports = {
  config: {
    name: "pin",
    version: "4.5 Gallery",
    author: "Shade × Gemini",
    countDown: 5,
    role: 0,
    shortDescription: "Pinterest Gallery Grid",
    longDescription: "Affiche une grille verticale d'images provenant de Pinterest avec navigation par page et sélection par numéro.",
    category: "image",
    guide: "{p}pin [recherche]"
  },

  onStart: async function ({ message, args, event }) {
    const query = args.join(" ");

    if (!query) {
      return message.reply("⚠️ Veuillez spécifier un terme de recherche.\nExemple : !pin chat");
    }

    const loading = await message.reply("⏳ Recherche et génération de la galerie...");

    try {
      // Appel à ton API Pinterest (Demande de 100 images max pour gérer le défilement)
      const apiUrl = `https://zetbot-page.onrender.com/api/pinterest?query=${encodeURIComponent(query)}&limit=100`;
      const response = await axios.get(apiUrl, { timeout: 10000 });

      let allImages = [];
      if (Array.isArray(response.data)) {
        allImages = response.data;
      } else if (response.data && Array.isArray(response.data.results)) {
        allImages = response.data.results;
      } else if (response.data && typeof response.data === 'object') {
        allImages = Object.values(response.data).filter(val => typeof val === 'string' && val.startsWith('http'));
      }

      if (!allImages || allImages.length === 0) {
        await message.unsend(loading.messageID);
        return message.reply("❌ Aucun résultat trouvé pour cette recherche.");
      }

      // Nettoyer la liste des liens
      allImages = allImages.filter(Boolean);

      // Génération de la première page
      await this.sendGridPage({ message, event, query, allImages, currentPage: 1, loadingId: loading.messageID });

    } catch (e) {
      console.error(e);
      await message.unsend(loading.messageID);
      return message.reply("❌ Une erreur est survenue lors de la communication avec l'API Pinterest.");
    }
  },

  sendGridPage: async function ({ message, event, query, allImages, currentPage, loadingId }) {
    const cache = path.join(__dirname, "cache");
    await fs.ensureDir(cache);

    const imagesPerPage = 20; 
    const startIndex = (currentPage - 1) * imagesPerPage;
    const endIndex = startIndex + imagesPerPage;
    
    const pageImages = allImages.slice(startIndex, endIndex);

    if (pageImages.length === 0) {
      if (loadingId) await message.unsend(loadingId);
      return message.reply("📋 Fin des images disponibles pour cette recherche.");
    }

    // Configuration géométrique de la grille verticale (4 colonnes x 5 lignes = 20 images)
    const cols = 4;
    const rows = Math.ceil(pageImages.length / cols);
    
    const cellWidth = 240;   // Proportion verticale (debout)
    const cellHeight = 360;  
    const padding = 15;      
    
    const headerHeight = 90; 
    const footerHeight = 30; 

    const canvasWidth = (cellWidth * cols) + (padding * (cols + 1));
    const canvasHeight = headerHeight + (cellHeight * rows) + (padding * (rows + 1)) + footerHeight;

    const canvas = createCanvas(canvasWidth, canvasHeight);
    const ctx = canvas.getContext("2d");

    // Fond arrière Noir Uni Strict
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Titre de l'interface
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 30px Arial";
    ctx.fillText(`🔍 RECHERCHE : ${query.toUpperCase()}`, padding, 50);
    
    ctx.fillStyle = "#aaaaaa";
    ctx.font = "22px Arial";
    ctx.textAlign = "right";
    const totalPages = Math.ceil(allImages.length / imagesPerPage);
    ctx.fillText(`Page ${currentPage} / ${totalPages}`, canvasWidth - padding, 50);
    ctx.textAlign = "left"; 

    const downloadedPaths = [];

    // Téléchargement et intégration des vignettes dans la grille
    for (let i = 0; i < pageImages.length; i++) {
      const imgUrl = pageImages[i];
      const filePath = path.join(cache, `pin_thumb_${Date.now()}_p${currentPage}_${i}.jpg`);

      const colIndex = i % cols;
      const rowIndex = Math.floor(i / cols);
      
      const x = padding + colIndex * (cellWidth + padding);
      const y = headerHeight + padding + rowIndex * (cellHeight + padding);

      try {
        const res = await axios({ url: imgUrl, responseType: "stream", timeout: 5000 });
        await new Promise((resolve, reject) => {
          const stream = fs.createWriteStream(filePath);
          res.data.pipe(stream);
          stream.on("finish", resolve);
          stream.on("error", reject);
        });

        downloadedPaths.push(filePath);
        const img = await loadImage(filePath);

        // Découpe intelligente centrée pour respecter le ratio vertical sans déformer l'image original
        ctx.save();
        ctx.beginPath();
        ctx.rect(x, y, cellWidth, cellHeight);
        ctx.clip();

        const imgRatio = img.width / img.height;
        const cellRatio = cellWidth / cellHeight;
        let drawWidth, drawHeight, offsetX, offsetY;

        if (imgRatio > cellRatio) {
          drawHeight = cellHeight;
          drawWidth = cellHeight * imgRatio;
          offsetX = x - (drawWidth - cellWidth) / 2;
          offsetY = y;
        } else {
          drawWidth = cellWidth;
          drawHeight = cellWidth / imgRatio;
          offsetX = x;
          offsetY = y - (drawHeight - cellHeight) / 2;
        }

        ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
        ctx.restore();

        // Contour de délimitation de la case
        ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, cellWidth, cellHeight);

        // Badge du numéro
        ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
        ctx.fillRect(x + 8, y + 8, 45, 45);
        
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 24px Arial";
        ctx.textAlign = "center";
        ctx.fillText(`${i + 1}`, x + 30, y + 38);
        ctx.textAlign = "left"; 

      } catch (err) {
        downloadedPaths.push(null);
        ctx.fillStyle = "#1c1c1c";
        ctx.fillRect(x, y, cellWidth, cellHeight);
        ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
        ctx.strokeRect(x, y, cellWidth, cellHeight);
      }
    }

    const outPath = path.join(cache, `pin_grid_p${currentPage}_${Date.now()}.jpg`);
    fs.writeFileSync(outPath, canvas.toBuffer("image/jpeg"));

    const instructions = `📱 GALERIE PINTEREST\n━━━━━━━━━━━━━━━━━\n✨ Terme : ${query}\n📄 Emplacement : Page ${currentPage} / ${totalPages}\n\n👉 Répondez avec un numéro [1-${pageImages.length}] pour obtenir l'image seule.\n👉 Répondez avec "page ${currentPage + 1}" pour afficher les images suivantes.`;

    await message.reply({
      body: instructions,
      attachment: fs.createReadStream(outPath)
    }, (err, info) => {
      if (err) return;

      // Sauvegarde de l'état dans la session globale de GoatBot pour capturer les réponses
      global.GoatBot.onReply.set(info.messageID, {
        commandName: this.config.name,
        author: event.senderID,
        query: query,
        allImages: allImages,
        currentPage: currentPage,
        currentPageImages: downloadedPaths
      });
    });

    if (loadingId) {
      try { await message.unsend(loadingId); } catch (_) {}
    }
  },

  onReply: async function ({ event, Reply, message, args }) {
    // Seul l'auteur initial de la recherche peut interagir avec sa propre galerie
    if (event.senderID !== Reply.author) return;

    const input = args.join(" ").toLowerCase().trim();

    // Gestion du changement de page (ex: "page 2")
    if (input.startsWith("page")) {
      const targetPage = parseInt(input.replace("page", "").trim());

      if (isNaN(targetPage) || targetPage < 1) {
        return message.reply("❌ Numéro de page invalide.");
      }

      const loading = await message.reply(`⏳ Chargement de la page ${targetPage}...`);
      
      return this.sendGridPage({
        message,
        event,
        query: Reply.query,
        allImages: Reply.allImages,
        currentPage: targetPage,
        loadingId: loading.messageID
      });
    }

    // Extraction d'un numéro d'image précis
    const index = parseInt(input) - 1;

    if (!isNaN(index) && Reply.currentPageImages && index >= 0 && index < Reply.currentPageImages.length) {
      const imagePath = Reply.currentPageImages[index];

      if (!imagePath || !fs.existsSync(imagePath)) {
        return message.reply("❌ Cette image n'est pas disponible ou son cache a expiré.");
      }

      return message.reply({
        body: `✨ Voici l'image [${index + 1}] demandée (Page ${Reply.currentPage})`,
        attachment: fs.createReadStream(imagePath)
      });
    }

    return message.reply("💡 Option non reconnue. Entrez un numéro (1-20) pour afficher une image ou 'page [numéro]' pour naviguer.");
  }
};
