const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const { createCanvas, loadImage } = require("canvas");

module.exports = {
  config: {
    name: "pin",
    version: "3.5 portrait pro",
    author: "Shade ✨ Angel Edit × Gemini",
    countDown: 5,
    role: 0,
    shortDescription: "💖 Pinterest-style portrait grid with 20 images",
    longDescription: "🌸 Recherche d'images au format portrait (rectangle debout), 20 par page avec navigation infinie.",
    category: "image",
    guide: "{p}pin <recherche>"
  },

  onStart: async function ({ message, args, event }) {
    const query = args.join(" ");

    if (!query) {
      return message.reply("🌸💖 Pinterest PRO\n\nUtilisation:\n!pin Naruto");
    }

    const loading = await message.reply("💖🌸 Recherche Pinterest PRO... ⏳");

    try {
      // 1. Appel direct à votre API personnalisée avec une limite de 100 images pour la pagination
      const apiUrl = `https://zetbot-page.onrender.com/api/pinterest?query=${encodeURIComponent(query)}&limit=100`;
      const response = await axios.get(apiUrl, { timeout: 8000 });

      // Extraction des liens d'images (S'adapte si l'API renvoie un tableau de chaînes ou un objet complexe)
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
        return message.reply("💔 Aucun résultat trouvé Angel...");
      }

      // Filtrage de sécurité pour s'assurer que les valeurs ne soient pas nulles
      allImages = allImages.filter(Boolean);

      // Lancement de la Page 1
      await this.sendGridPage({ message, event, query, allImages, currentPage: 1, loadingId: loading.messageID });

    } catch (e) {
      console.error(e);
      await message.unsend(loading.messageID);
      return message.reply("💔 Une erreur est survenue lors de la communication avec l'API Pinterest.");
    }
  },

  sendGridPage: async function ({ message, event, query, allImages, currentPage, loadingId }) {
    const cache = path.join(__dirname, "cache");
    await fs.ensureDir(cache);

    const imagesPerPage = 20; // 🔥 20 images par page
    const startIndex = (currentPage - 1) * imagesPerPage;
    const endIndex = startIndex + imagesPerPage;
    
    const pageImages = allImages.slice(startIndex, endIndex);

    if (pageImages.length === 0) {
      return message.reply("🌸 Il n'y a plus d'images disponibles pour cette recherche.");
    }

    // Dimensions pour un format rectangle DEBOUT (Portrait)
    const imgWidth = 200;
    const imgHeight = 300; 
    const cols = 10; // 10 colonnes de large
    const rows = Math.ceil(pageImages.length / cols); // 2 lignes si 20 images

    const canvas = createCanvas(imgWidth * cols, imgHeight * rows);
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "#1e1e2f";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const downloadedPaths = [];

    for (let i = 0; i < pageImages.length; i++) {
      const imgUrl = pageImages[i];
      const filePath = path.join(cache, `pin_${Date.now()}_p${currentPage}_${i}.jpg`);

      try {
        const response = await axios({ url: imgUrl, responseType: "stream", timeout: 5000 });
        await new Promise((res, rej) => {
          const stream = fs.createWriteStream(filePath);
          response.data.pipe(stream);
          stream.on("finish", res);
          stream.on("error", rej);
        });

        downloadedPaths.push(filePath);

        const image = await loadImage(filePath);
        const x = (i % cols) * imgWidth;
        const y = Math.floor(i / cols) * imgHeight;

        // Dessine l'image étirée/ajustée dans le rectangle vertical
        ctx.drawImage(image, x, y, imgWidth, imgHeight);

        // Label noir translucide en haut à gauche de chaque case
        ctx.fillStyle = "rgba(0,0,0,0.7)";
        ctx.fillRect(x, y, 45, 40);
        
        ctx.fillStyle = "#fff";
        ctx.font = "bold 22px Arial";
        ctx.fillText(`${i + 1}`, x + 10, y + 28);

      } catch (err) {
        console.log("Skip image manquante :", imgUrl);
        downloadedPaths.push(null);
      }
    }

    const outPath = path.join(cache, `pin_grid_${Date.now()}.jpg`);
    fs.writeFileSync(outPath, canvas.toBuffer("image/jpeg"));

    const responseText = `💖🌸 PINTEREST PORTRAIT PRO

🔎 Recherche : ${query}
📄 Page : ${currentPage} / ${Math.ceil(allImages.length / imagesPerPage)}

👉 Réponds avec un numéro [1-${pageImages.length}] pour obtenir l'image.
👉 Réponds avec "page ${currentPage + 1}" pour voir la suite !`;

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

    // Gestion du changement de page (ex: reply "page 2")
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

    // Gestion de la sélection de l'image (ex: reply "14")
    const index = parseInt(input) - 1;

    if (!isNaN(index) && Reply.currentPageImages && index >= 0 && index < Reply.currentPageImages.length) {
      const imagePath = Reply.currentPageImages[index];

      if (!imagePath || !fs.existsSync(imagePath)) {
        return message.reply("💔 Désolé, cette image spécifique n'est plus accessible.");
      }

      return message.reply({
        body: `💖 Image sélectionnée [${index + 1}] - Page ${Reply.currentPage}`,
        attachment: fs.createReadStream(imagePath)
      });
    }

    return message.reply("💡 Option invalide. Écris un chiffre de 1 à 20 ou tape 'page' suivi du numéro (ex: page 2).");
  }
};
