/**
 * @author Shade
 * @title Recherche de Paroles
 * @name lyrics
 * @class lyrics
 * @version 1.0.0
 * @description Récupère les paroles d'une chanson via l'API Zetsu.
 * @usage lyrics [nom de la chanson / artiste]
 */

const axios = require("axios");

module.exports = {
    config: {
        name: "lyrics",
        version: "1.0.0",
        author: "Shade",
        aliases: ["paroles"],
        countDown: 5,
        role: 0, // Accessible à tous
        category: "media",
        guide: {
            fr: "{p}{n} <titre de la chanson>\nExemple: {p}{n} eminem lose yourself"
        }
    },

    onStart: async function ({ event, message, args }) {
        const { threadID, messageID } = event;
        const query = args.join(" ");

        if (!query) {
            return message.reply("❌ **𝖤𝖱𝖱𝖤𝖴𝖱**\nVeuillez spécifier le titre d'une chanson ou un artiste.");
        }

        const apiUrl = `https://zetbot-page.onrender.com/api/lyrics?query=${encodeURIComponent(query)}`;

        try {
            message.reply("🎵 **𝖫𝖸𝖱𝖨𝖢𝖲**\nRecherche des paroles en cours...");

            const response = await axios.get(apiUrl);

            // Vérification de la présence de résultats valides
            if (!response.data || !response.data.results || response.data.results.length === 0) {
                return message.reply("❌ Aucune parole trouvée pour cette recherche.");
            }

            // Extraction du premier résultat correspondant
            const track = response.data.results[0];
            const title = track.trackName || "Inconnu";
            const artist = track.artistName || "Inconnu";
            const album = track.albumName || "Aucun";
            const lyrics = track.plainLyrics;

            if (!lyrics) {
                return message.reply(`❌ Les paroles de **${title}** sont indisponibles.`);
            }

            // Construction du message final
            const formattedMessage = [
                `🎵 **𝖯𝖠𝖱𝖮𝖫𝖤𝖲 𝖣𝖤 𝖢𝖧𝖠𝖭𝖲𝖮𝖭**`,
                `━━━━━━━━━━━━━━━━━━`,
                `🎤 **𝗔𝗿𝘁𝗶𝘀𝘁𝗲𝘀** : ${artist}`,
                `🎶 **𝗧𝗶𝘁𝗿𝗲** : ${title}`,
                `💿 **𝗔𝗹𝗯𝘂𝗺** : ${album}`,
                `━━━━━━━━━━━━━━━━━━\n`,
                lyrics
            ].join("\n");

            return message.reply(formattedMessage);

        } catch (error) {
            console.error(error);
            return message.reply("❌ Une erreur est survenue lors de la communication avec l'API de paroles.");
        }
    }
};
