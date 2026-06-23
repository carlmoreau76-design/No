const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const { createCanvas, loadImage } = require("canvas");

module.exports = {
  config: {
    name: "pin",
    version: "4.0 Portrait Gallery",
    author: "Shade × Gemini",
    countDown: 5,
    role: 0,
    shortDescription: "💖 Pinterest portrait gallery",
    longDescription: "🌸 Galerie d'images au format strictement vertical (Portrait), fond noir, navigation par page.",
    category: "image",
    guide: "{p}pin <recherche>"
  },

  onStart: async function ({ message, args, event }) {
    const query = args.join(" ");

    if (!query) {
      return message.reply("🌸 Pinterest Portrait\n\nUtilisation:\n!pin Naruto");
    }

    const loading = await message.reply("⏳ Génération de la galerie verticale...");

    try {
      // Appel à ton API personnalisée (Demande de 100 images max pour gérer les pages)
      const apiUrl = `https://zetbot-page.onrender.com/api/pinterest?query=${encodeURIComponent(query)}&limit=100`;
      const response = await axios.get(apiUrl, { timeout: 8000 });

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

      allImages = allImages.filter(Boolean);

      // Lancement de la première page de la galerie verticale
      await this.sendVerticalGrid({ message, event, query, allImages, currentPage: 1, loadingId: loading.messageID });

    } catch (e) {
      console.error(e);
      await message.unsend(loading.messageID);
      return message.reply("❌ Une erreur est survenue lors du chargement des images.");
    }
  },

  sendVerticalGrid: async function ({ message, event, query, allImages, currentPage, loadingId }) {
    const cache = path.join(__dirname, "cache");
    await fs.ensureDir(cache);

    const imagesPerPage = 20; 
    const startIndex = (currentPage - 1) * imagesPerPage;
    const endIndex = startIndex + imagesPerPage;
    
    const pageImages = allImages.slice(startIndex, endIndex);

    if (pageImages.length === 0) {
      return message.reply("🌸 Fin des images disponibles.");
    }

    // ==========================================
    // 📐 CONFIGURATION DE LA GALERIE VERTICALE
    // ==========================================
    // Structure : 4 colonnes de large, 5 lignes de haut = 20 images
    const cols = 4;
    const rows = Math.ceil(pageImages.length / cols);
    
    const cellWidth = 240;   // Largeur de chaque vignette (Format debout)
    const cellHeight = 360;  // Hauteur de chaque vignette (Format debout)
    const padding = 15;      // Espace entre les images
    
    const headerHeight = 80; // Espace en haut pour le titre
    const footerHeight = 40; // Espace de sécurité en bas

    // Dimensions globales du Canva : STRICTEMENT DROIT / VERTICAL
    const canvasWidth = (cellWidth * cols) + (padding * (cols + 1));
    const canvasHeight = headerHeight + (cellHeight * rows) + (padding * (rows + 1)) + footerHeight;

    const canvas = createCanvas(canvasWidth, canvasHeight);
    const ctx = canvas.getContext("2d");

    // 1. Fond arrière NOIR PUR (comme demandé)
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. Texte de l'en-tête de la galerie
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 28px Arial";
    ctx.fillText(`📊 GALERIE : ${query.toUpperCase()}`, padding, 45);
    
    ctx.fillStyle = "#aaaaaa";
    ctx.font = "20px Arial";
    ctx.textAlign = "right";
    ctx.fillText(`Page ${currentPage} / ${Math.ceil(allImages.length / imagesPerPage)}`, canvasWidth - padding, 45);
    ctx.textAlign = "left"; // Reset l'alignement

    const downloadedPaths = [];

    // 3. Boucle de rendu des images de la galerie
    for (let i = 0; i < pageImages.length; i++) {
      const imgUrl = pageImages[i];
      const filePath = path.join(cache, `v_pin_${Date.now()}_p${currentPage}_${i}.jpg`);

      // Calcul des positions X et Y sur la grille verticale
      const colIndex = i % cols;
      const rowIndex = Math.floor(i / cols);
      
      const x = padding + colIndex * (cellWidth + padding);
      const y = headerHeight + padding + rowIndex * (cellHeight + padding);

      try {
        const response = await axios({ url: imgUrl, responseType: "stream", timeout: 6000 });
        await new Promise((res, rej) => {
          const stream = fs.createWriteStream(filePath);
          response.data.pipe(stream);
          stream.on("finish", res);
          stream.on("error", rej);
        });

        downloadedPaths.push(filePath);

        const img = await loadImage(filePath);

        // Intégration intelligente (Découpe/Remplissage pour respecter le format vertical sans écraser la photo)
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

        // Ajout d'une fine bordure grise pour délimiter proprement les cadres
        ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, cellWidth, cellHeight);

        // Petit badge d'indexation (Numéro de l'image) en haut à gauche de chaque case
        ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
        ctx.fillRect(x + 5, y + 5, 45, 35);
        
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 20px Arial";
        ctx.fillText(`${i + 1}`, x + 15, y + 30);

      } catch (err) {
        console.log("Image ignorée ou inaccessible :", imgUrl);
        downloadedPaths.push(null);
        
        // Boîtier vide de secours si l'image plante
        ctx.fillStyle = "#111111";
        ctx.fillRect(x, y, cellWidth, cellHeight);
        ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
        ctx.strokeRect(x, y, cellWidth, cellHeight);
        ctx.fillStyle = "#555555";
        ctx.font = "16px Arial";
        ctx.fillText("Échec", x + cellWidth / 3, y + cellHeight / 2);
      }
    }

    const outPath = path.join(cache, `vertical_grid_${Date.now()}.jpg`);
    fs.writeFileSync(outPath, canvas.toBuffer("image/jpeg"));

    const responseText = `📱 GALERIE PORTRAIT (DESSUS-DESSOUS)

🔎 Terme : ${query}
📄 Emplacement : Page ${currentPage}

👉 Réponds avec le numéro [1-${pageImages.length}] pour extraire l'image seule en HD.
👉 Réponds avec "page ${currentPage + 1}" pour faire défiler vers la suite !`;

    await message.reply({
      body: responseText,
      attachment: fs.createReadStream(outPath)
    }, (err, info) => {
      if (err) return;

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
      await message.unsend(loadingId);
    }
  },

  onReply: async function ({ event, Reply, message, args }) {
    if (event.senderID !== Reply.author) return;

    const input = args.join(" ").toLowerCase().trim();

    // 1. Défilement vers une autre page (ex: "page 2")
    if (input.startsWith("page")) {
      const targetPage = parseInt(input.replace("page", "").trim());

      if (isNaN(targetPage) || targetPage < 1) {
        return message.reply("❌ Spécifie un format de page correct.");
      }

      const loading = await message.reply(`⏳ Chargement de la page ${targetPage}...`);
      
      return this.sendVerticalGrid({
        message,
        event,
        query: Reply.query,
        allImages: Reply.allImages,
        currentPage: targetPage,
        loadingId: loading.messageID
      });
    }

    // 2. Extraction d'un chiffre précis
    const index = parseInt(input) - 1;

    if (!isNaN(index) && Reply.currentPageImages && index >= 0 && index < Reply.currentPageImages.length) {
      const imagePath = Reply.currentPageImages[index];

      if (!imagePath || !fs.existsSync(imagePath)) {
        return message.reply("❌ Impossible de récupérer cette photo ou le lien source a expiré.");
      }

      return message.reply({
        body: `✨ Voici la photo [${index + 1}] issue de la page ${Reply.currentPage}`,
        attachment: fs.createReadStream(imagePath)
      });
    }

    return message.reply("💡 Commande inconnue. Tapez un chiffre (1-20) pour choisir une image ou 'page X' (ex: page 2) pour changer de vue.");
  }
};
