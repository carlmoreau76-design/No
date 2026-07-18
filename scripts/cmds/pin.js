/**
 * @author Zetsu & Shade
 * @title Pinterest Catalogue Premium
 * @name pin
 * @class pinterest
 * @version 2.1.0
 * @description Recherche des images sur Pinterest sous forme de catalogue Canvas interactif par Reply.
 * @usage pinterest [terme]
 * @alt pin
 */
const { createCanvas, loadImage } = require("canvas");
const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

async function createCatalogueCanvas(imagesUrls, query, page) {
    const canvas = createCanvas(800, 1600);
    const ctx = canvas.getContext("2d");

    // Fond sombre style Épuré
    ctx.fillStyle = "#0d0e12";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // En-tête du catalogue
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 32px sans-serif";
    ctx.fillText(`📌 CATALOGUE PINTEREST : ${query.toUpperCase()}`, 40, 60);
        
    ctx.fillStyle = "#6b7280";
    ctx.font = "20px sans-serif";
    ctx.fillText(`Page ${page} • Répondez avec le [Numéro] ou "page [N°]"`, 40, 95);

    // Dessin de la grille de sous-images (2 colonnes x 5 lignes)
    const startX = 40, startY = 140;
    const itemWidth = 340, itemHeight = 260;
    const gapX = 40, gapY = 30;

    const loadedImages = await Promise.all(
        imagesUrls.map(url => loadImage(url).catch(() => null))
    );

    for (let i = 0; i < 10; i++) {
        const row = Math.floor(i / 2);
        const col = i % 2;
        const x = startX + col * (itemWidth + gapX);
        const y = startY + row * (itemHeight + gapY);

        ctx.fillStyle = "#161820";
        ctx.fillRect(x, y, itemWidth, itemHeight);

        if (loadedImages[i]) {
            ctx.drawImage(loadedImages[i], x, y, itemWidth, itemHeight);
        } else {
            ctx.fillStyle = "#374151";
            ctx.font = "18px sans-serif";
            ctx.textAlign = "center";
            ctx.fillText("Impossible de charger", x + itemWidth / 2, y + itemHeight / 2);
            ctx.textAlign = "left";
        }

        // Pastille de numérotation
        ctx.fillStyle = "#ef4444";
        ctx.fillRect(x + 10, y + 10, 45, 45);
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 22px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(String(i + 1), x + 32, y + 32);
        ctx.textAlign = "left";
        ctx.textBaseline = "alphabetic";
    }

    const cacheDir = path.join(__dirname, "cache");
    await fs.ensureDir(cacheDir);
    const cachePath = path.join(cacheDir, `pin_cat_${Date.now()}.png`);
    await fs.writeFile(cachePath, canvas.toBuffer("image/png"));
    return cachePath;
}

module.exports = {
    config: {
        name: "pin",
        aliases: ["pinterest"],
        version: "2.1.0",
        author: "Zetsu & Shade",
        countDown: 5,
        role: 0,
        category: "image",
        guide: {
            fr: "{p}{n} <recherche>\nExemple: {p}{n} naruto"
        }
    },

    onStart: async function ({ api, event, message, args, commandName }) {
        const { threadID, messageID, senderID } = event;
        const query = args.join(" ");

        if (!query) {
            return message.reply("❌ Veuillez entrer un mot-clé pour lancer la recherche interactive.");
        }

        const apiUrl = `https://zetbot-page.onrender.com/api/pinterest?query=${encodeURIComponent(query)}&limit=30`;

        try {
            const loadingMsg = await message.reply("🔍 Génération du catalogue de miniatures en cours...");
            const response = await axios.get(apiUrl);

            if (!response.data.status || !response.data.pins || response.data.pins.length === 0) {
                try { api.unsendMessage(loadingMsg.messageID); } catch(e){}
                return message.reply("❌ Aucun résultat trouvé pour cette recherche.");
            }

            const allPins = response.data.pins;
            const pageUrls = allPins.slice(0, 10).map(p => p.image);
            const imgPath = await createCatalogueCanvas(pageUrls, query, 1);

            try { api.unsendMessage(loadingMsg.messageID); } catch(e){}

            const sentMessage = await api.sendMessage({
                body: `📸 **𝖢𝖠𝖳𝖠𝖫𝖮𝖦𝖴𝖤 𝖯𝖨𝖭𝖳𝖤𝖱𝖤𝖲𝖳**\n\n💬 **Instructions :**\n• Répondez avec un chiffre de \`1\` à \`10\` pour recevoir la photo seule en HD.\n• Répondez \`page 2\` ou \`page 3\` pour faire défiler la liste.`,
                attachment: fs.createReadStream(imgPath)
            }, threadID, messageID);

            // Enregistrement de la session dans le gestionnaire global de GoatBot
            global.GoatBot?.onReply?.set(sentMessage.messageID, {
                commandName,
                author: senderID,
                query: query,
                allPins: allPins,
                currentPage: 1,
                messageID: sentMessage.messageID
            });

            if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);

        } catch (error) {
            console.error(error);
            return message.reply("❌ Une erreur est survenue lors de la communication avec le serveur Pinterest.");
        }
    },

    onReply: async function ({ api, event, Reply, message, commandName }) {
        const { senderID, threadID, messageID, body } = event;
        const { author, query, allPins, currentPage, messageID: replyMsgID } = Reply || {};

        if (senderID !== author) return;

        const input = (body || "").trim().toLowerCase();

        // ---- LOGIQUE DE NAVIGATION DE PAGES ----
        if (input.startsWith("page ")) {
            const targetPage = parseInt(input.split(" ")[1], 10);
            if (isNaN(targetPage) || targetPage < 1 || targetPage > 3) {
                return message.reply("❌ Page invalide. Le catalogue comprend les pages 1, 2 et 3.");
            }

            const startIdx = (targetPage - 1) * 10;
            const endIdx = startIdx + 10;
            const pagePins = allPins.slice(startIdx, endIdx);

            if (pagePins.length === 0) {
                return message.reply("❌ Plus aucune image disponible pour cette page.");
            }

            // Supprimer l'ancien catalogue
            try { api.unsendMessage(replyMsgID); } catch (e) {}

            const pageUrls = pagePins.map(p => p.image);
            const imgPath = await createCatalogueCanvas(pageUrls, query, targetPage);

            const sentMessage = await api.sendMessage({
                body: `📸 **𝖢𝖠𝖳𝖠𝖫𝖮𝖦𝖴𝖤 : 𝖯𝖠𝖦𝖤 ${targetPage}**\n\n• Répondez avec un numéro (1-10) pour extraire l'image.\n• Tapez \`page [numéro]\` pour scroller.`,
                attachment: fs.createReadStream(imgPath)
            }, threadID, messageID);

            // Mettre à jour la session de Reply
            global.GoatBot?.onReply?.set(sentMessage.messageID, {
                commandName,
                author: senderID,
                query: query,
                allPins: allPins,
                currentPage: targetPage,
                messageID: sentMessage.messageID
            });

            if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
            return;
        }

        // ---- LOGIQUE DE SÉLECTION D'UNE IMAGE (1 À 10) ----
        const selection = parseInt(input, 10);
        if (!isNaN(selection) && selection >= 1 && selection <= 10) {
            const actualIndex = ((currentPage - 1) * 10) + (selection - 1);
            const selectedPin = allPins[actualIndex];

            if (!selectedPin || !selectedPin.image) {
                return message.reply("❌ Données de l'image introuvables.");
            }

            const ext = selectedPin.image.split('.').pop().split('?')[0] || "jpg";
            const cacheDir = path.join(__dirname, "cache");
            await fs.ensureDir(cacheDir);
            const cachePath = path.join(cacheDir, `pin_hd_${Date.now()}.${ext}`);

            try {
                const downloadNotice = await message.reply(`📥 Extraction et envoi de l'image HD n°${selection}...`);

                const response = await axios({
                    method: "get",
                    url: selectedPin.image,
                    responseType: "stream"
                });

                const writer = fs.createWriteStream(cachePath);
                response.data.pipe(writer);

                await new Promise((resolve, reject) => {
                    writer.on("finish", resolve);
                    writer.on("error", reject);
                });

                try { api.unsendMessage(downloadNotice.messageID); } catch(e){}

                await api.sendMessage({
                    body: `✨ **𝖨𝖬𝖠𝖦𝖤 𝖤𝖷𝖳𝖱𝖠𝖨𝖳𝖤** ✨\n\n📝 Titre : ${selectedPin.title || "Sans titre"}\n👤 Compte : ${selectedPin.uploader?.username || "Inconnu"}`,
                    attachment: fs.createReadStream(cachePath)
                }, threadID, () => {
                    if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
                }, messageID);

            } catch (e) {
                console.error(e);
                if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
                return message.reply("❌ Impossible de récupérer cette image en haute résolution.");
            }
        }
    }
};
