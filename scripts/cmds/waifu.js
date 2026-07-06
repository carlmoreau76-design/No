/**
 * @author Shade
 * @title Image Anime SFW
 * @name waifu
 * @class waifu
 * @version 1.0.1
 * @description Génère une image animée SFW depuis l'API selon la catégorie choisie.
 * @usage waifu [catégorie]
 */

const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

// Liste des catégories valides fournies par ton API
const VALID_CATEGORIES = [
    "waifu", "neko", "shinobu", "megumin", "bully", "cuddle", "cry", "hug", 
    "awoo", "kiss", "lick", "pat", "smug", "bonk", "yeet", "blush", "smile", 
    "wave", "highfive", "handhold", "nom", "bite", "glomp", "slap", "kill", 
    "kick", "happy", "wink", "poke", "dance", "cringe"
];

module.exports = {
    config: {
        name: "waifu",
        version: "1.0.1",
        author: "Shade",
        countDown: 5,
        role: 0,
        category: "image",
        guide: {
            fr: "{p}{n} ou {p}{n} <catégorie>\nExemple: {p}{n} neko"
        }
    },

    onStart: async function ({ api, event, message, args }) {
        const { threadID, messageID } = event;
        let category = args[0] ? args[0].toLowerCase() : null;

        // Si aucune catégorie n'est choisie, on en prend une au hasard
        if (!category) {
            category = VALID_CATEGORIES[Math.floor(Math.random() * VALID_CATEGORIES.length)];
        }

        // Vérification si la catégorie demandée est bien dans la liste de ton API
        if (!VALID_CATEGORIES.includes(category)) {
            return message.reply(`❌ **𝖢𝖠𝖳𝖤𝖦𝖮𝖱𝖨𝖤 𝖨𝖭𝖵𝖠𝖫𝖨𝖣𝖤**\n\nCatégories valides :\n${VALID_CATEGORIES.join(", ")}`);
        }

        // Construction de la bonne URL avec la catégorie spécifiée
        const apiUrl = `https://free-goat-api.onrender.com/waifu/sfw/${category}`;
        const cachePath = path.join(__dirname, "cache", `anime_${category}_${Date.now()}.png`);

        try {
            message.reply(`🔮 **𝖧𝖮𝖱𝖨 𝖠𝖭𝖨𝖬𝖤**\nInvocation du module [${category}] en cours...`);

            const response = await axios.get(apiUrl);
            const imageUrl = response.data.url || response.data.image;

            if (!imageUrl) {
                return message.reply("❌ Impossible de récupérer l'URL de l'image depuis l'API.");
            }

            fs.ensureDirSync(path.dirname(cachePath));
            const imageResponse = await axios({
                method: "get",
                url: imageUrl,
                responseType: "stream"
            });

            const writer = fs.createWriteStream(cachePath);
            imageResponse.data.pipe(writer);

            writer.on("finish", () => {
                return api.sendMessage({
                    body: `✨ **𝖬𝖮𝖣𝖴𝖫𝖤 : ${category.toUpperCase()}** ✨`,
                    attachment: fs.createReadStream(cachePath)
                }, threadID, () => {
                    if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
                }, messageID);
            });

            writer.on("error", (err) => {
                throw err;
            });

        } catch (error) {
            console.error(error);
            if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
            return message.reply("❌ Une erreur est survenue lors de la récupération du flux média.");
        }
    }
};
