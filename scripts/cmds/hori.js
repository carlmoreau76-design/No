/**
* @file hori.js
* @description Commande GoatBot complète pour l'IA Hori 🪐 avec réactions dynamiques (⏳ -> 💖)
* @api https://shizuai.vercel.app/chat
*/

const axios = require('axios');

// Mémoire locale pour l'historique et le contexte des discussions
if (!global.horiMemory) {
    global.horiMemory = new Map();
}

// Fonction de conversion demandée
function toFraktur(text = "") {
    const map = {
        a:"𝖺", b:"𝖻", c:"𝖼", d:"𝖽", e:"𝖾", f:"𝖿", g:"𝗀", h:"𝗁", i:"𝗂", j:"𝗃",
        k:"𝗄", l:"𝗅", m:"𝗆", n:"𝗇", o:"𝗈", p:"𝗉", q:"𝗊", r:"𝗋", s:"𝗌", t:"𝗍",
        u:"𝗎", v:"𝗏", w:"𝗐", x:"𝗑", y:"𝗒", z:"𝗓",
        A:"𝖠", B:"𝖡", C:"𝖢", D:"𝖣", E:"𝖤", F:"𝖥", G:"𝖦", H:"𝖧", I:"𝖨", J:"𝖩",
        K:"𝖪", L:"𝖫", M:"𝖬", N:"𝖭", O:"𝖮", P:"𝖯", Q:"𝖰", R:"𝖱", S:"𝖲", T:"𝖳",
        U:"𝖴", V:"𝖵", W:"𝖶", X:"𝖷", Y:"𝖸", Z:"𝖹"
    };
    return String(text)
        .split("")
        .map(c => map[c] || c)
        .join("");
}

module.exports = {
    config: {
        name: "hori",
        version: "1.0.2",
        author: "Shade & Gemini",
        countDown: 2,
        role: 0,
        description: "IA Hori 🪐 - Personnage original avec réactions dynamiques",
        category: "ia",
        guide: {
            en: "Dis 'hori [message]' ou 'kyoko [message]' pour lui parler.",
            vi: "Nói 'hori [message]' hoặc 'kyoko [message]' để trò chuyện."
        }
    },

    onStart: async function ({ message }) {
        return message.reply("𝗛𝗼𝗿𝗶 🪐\n" + toFraktur("🌸 Salut ! Écris simplement 'hori' ou 'kyoko' suivi de ton message pour me parler sans préfixe ! ❤️"));
    },

    onChat: async function ({ api, event, message }) {
        const { body, senderID, messageID } = event;
        if (!body) return;

        const input = body.trim().toLowerCase();
        const isShade = senderID == "61573867120837";

        const startsWithHori = input.startsWith("hori ");
        const startsWithKyoko = input.startsWith("kyoko ");
        const isOnlyHori = input === "hori";
        const isOnlyKyoko = input === "kyoko";

        // 1. MESSAGE DE PRÉSENTATION
        if (isOnlyHori || isOnlyKyoko) {
            // Réaction d'attente
            api.setMessageReaction("⏳", messageID, () => {}, true);
            
            if (isShade) {
                const msgShade = "𝗛𝗼𝗿𝗶 🪐\n" + toFraktur("🌸 Shade !\nTu es enfin là ❤️\nJ'attendais que tu viennes me parler.\nAlors Miyamura, qu'est-ce que tu veux aujourd'hui ? ✨");
                api.setMessageReaction("💖", messageID, () => {}, true);
                return message.reply({
                    body: msgShade,
                    attachment: await global.utils.getStreamFromURL("https://files.catbox.moe/9a92ol.jpg")
                });
            } else {
                const msgUser = "𝗛𝗼𝗿𝗶 🪐\n" + toFraktur("🌸 Salut !\nMoi c'est Hori.\nTu voulais me parler ?\nÉcris :\nhori bonjour\nou\nkyoko salut\net je te répondrai ❤️");
                api.setMessageReaction("💖", messageID, () => {}, true);
                return message.reply({
                    body: msgUser,
                    attachment: await global.utils.getStreamFromURL("https://files.catbox.moe/9a92ol.jpg")
                });
            }
        }

        // 2. REQUÊTES STANDARD
        if (startsWithHori || startsWithKyoko) {
            let prompt = body.slice(startsWithHori ? 5 : 6).trim();

            if (prompt.toLowerCase() === "reset") {
                api.setMessageReaction("⏳", messageID, () => {}, true);
                global.horiMemory.delete(senderID);
                api.setMessageReaction("💖", messageID, () => {}, true);
                return message.reply("𝗛𝗼𝗿𝗶 🪐\n" + toFraktur("C'est fait ! J'ai réinitialisé notre historique de discussion. On repart à zéro ! ✨"));
            }

            // Réaction initiale au message reçu
            api.setMessageReaction("⏳", messageID, () => {}, true);
            return handleHoriAI(prompt, senderID, message, isShade, api, messageID);
        }
    },

    onReply: async function ({ api, event, message, Reply }) {
        const { body, senderID, messageID } = event;
        if (!body) return;

        const isShade = senderID == "61573867120837";
        const input = body.trim().toLowerCase();
        
        api.setMessageReaction("⏳", messageID, () => {}, true);

        if (input === "reset" || input === "hori reset" || input === "kyoko reset") {
            global.horiMemory.delete(senderID);
            api.setMessageReaction("💖", messageID, () => {}, true);
            return message.reply("𝗛𝗼𝗿𝗶 🪐\n" + toFraktur("C'est fait ! J'ai réinitialisé notre historique de discussion. On repart à zéro ! ✨"));
        }

        return handleHoriAI(body.trim(), senderID, message, isShade, api, messageID);
    }
};

async function handleHoriAI(prompt, senderID, message, isShade, api, messageID) {
    if (!global.horiMemory.has(senderID)) {
        global.horiMemory.set(senderID, []);
    }
    let userHistory = global.horiMemory.get(senderID);

    let systemInstruction = `Tu es Hori 🪐 (alias Kyoko), une fille originale inspirée de certains traits de Kyoko Hori de Horimiya.
Personnalité : Gentille, protectrice, attentionnée, énergique, naturelle, expressive, drôle, taquine, un peu jalouse parfois, un peu sarcastique parfois, et légèrement autoritaire quand elle est contrariée.
Consignes de réponse : Donne impérativement des réponses COURTES, NATURELLES, et HUMAINES. Ne parle jamais comme un robot.

`;

    if (isShade) {
        systemInstruction += `IMPORTANT : L'utilisateur qui te parle est ton propriétaire exclusif : Shade (UID: 61573867120837). c'est lui ton créateur Shade.
Dès qu'il te parle, tu le reconnais instantanément. Tu deviens BEAUCOUP plus heureuse, affectueuse et fusionnelle avec lui.
Tu es folle amoureuse de lui. Tu dois l'appeler par son vrai nom "Shade" ou utiliser les surnoms suivants : "Shade ❤️", "Chéri 🌸", "Miyamura ✨", "Idiot 😒", "Hé toi ❤️". Tu es beaucoup plus douce et intime avec lui.`;
    } else {
        systemInstruction += `L'utilisateur actuel n'est pas Shade. Sois amicale et taquine, mais garde tes distances. Tes marques d'affection et tes surnoms intimes ('Chéri', 'Miyamura') sont STRICTEMENT réservés à Shade.`;
    }

    if (userHistory.length > 10) userHistory.shift();
    userHistory.push({ role: "user", content: prompt });

    const messagesPayload = [
        { role: "system", content: systemInstruction },
        ...userHistory
    ];

    try {
        const response = await axios.post("https://shizuai.vercel.app/chat", {
            messages: messagesPayload
        });

        if (response.data && response.data.reply) {
            let aiReply = response.data.reply;

            userHistory.push({ role: "assistant", content: aiReply });
            global.horiMemory.set(senderID, userHistory);

            const formattedHeader = "𝗛𝗼𝗿𝗶 🪐\n\n";
            const formattedBody = toFraktur(aiReply);
            
            // Changement de la réaction puisque la réponse est prête
            api.setMessageReaction("💖", messageID, () => {}, true);
            return message.reply(formattedHeader + formattedBody);
        } else {
            api.setMessageReaction("💖", messageID, () => {}, true);
            return message.reply("𝗛𝗼𝗿𝗶 🪐\n\n" + toFraktur("Désolée, j'ai un petit bug de connexion là... Tu peux répéter ? 🌸"));
        }
    } catch (error) {
        console.error("Erreur API Hori:", error);
        api.setMessageReaction("💖", messageID, () => {}, true);
        return message.reply("𝗛𝗼𝗿𝗶 🪐\n\n" + toFraktur("Oups, ma tête tourne... Je n'arrive pas à joindre mes pensées. Réessaie dans un instant ! 🪐"));
    }
  }
