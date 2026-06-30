/**
* @file hori.js
* @description Commande GoatBot complète pour l'IA Hori 🪐 avec réactions dynamiques et système de Reply comme Kai
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
        u:"𝘶", v:"𝘷", w:"𝘸", x:"𝘹", y:"𝘺", z:"𝘻",
        A:"𝖠", B:"𝖡", C:"𝖢", D:"𝖣", E:"𝖤", F:"𝖥", G:"𝖦", H:"𝖨", I:"𝖨", J:"𝖩",
        K:"𝖪", L:"𝖫", M:"𝖬", N:"𝖭", O:"𝖮", P:"𝖯", Q:"𝖰", R:"𝖱", S:"𝖲", T:"𝖳",
        U:"𝖴", V:"𝖵", W:"𝖶", X:"𝖷", Y:"𝖸", Z:"𝖲"
    };
    return String(text)
        .split("")
        .map(c => map[c] || c)
        .join("");
}

module.exports = {
    config: {
        name: "hori",
        aliases: ["kyoko"],
        version: "1.0.4",
        author: "Shade & Gemini",
        countDown: 2,
        role: 0,
        description: "IA Hori 🪐 - Fonctionne exactement comme Kai avec le système de Reply",
        category: "ia",
        guide: {
            en: "Dis 'hori [message]' ou 'kyoko [message]' pour lui parler, puis réponds simplement à son message.",
            vi: "Nói 'hori [message]' hoặc 'kyoko [message]' để trò chuyện."
        }
    },

    onStart: async function ({ api, event, args, message }) {
        const input = args.join(" ").trim();

        if (!input) {
            return message.reply("𝗛𝗼𝗿𝗶 🪐\n" + toFraktur("🌸 Salut ! Écris simplement 'hori' ou 'kyoko' suivi de ton message pour me parler sans préfixe ! ❤️"));
        }

        // Commande RESET directe via le préfixe
        if (["clear", "reset"].includes(input.toLowerCase())) {
            global.horiMemory.delete(event.senderID);
            api.setMessageReaction("♻️", event.messageID, () => {}, true);
            return message.reply("𝗛𝗼𝗿𝗶 🪐\n" + toFraktur("C'est fait ! J'ai réinitialisé notre historique de discussion. On repart à zéro ! ✨"));
        }

        api.setMessageReaction("⏳", event.messageID, () => {}, true);
        const isShade = event.senderID == "61573867120837";
        return handleHoriAI(input, event.senderID, message, isShade, api, event.messageID);
    },

    onChat: async function ({ api, event, message }) {
        const { body, senderID, messageID } = event;
        if (!body) return;

        // Ignore les commandes commençant par un préfixe classique
        if (body.startsWith(".") || body.startsWith("/") || body.startsWith("!")) return;

        const input = body.trim().toLowerCase();
        const isShade = senderID == "61573867120837";

        const startsWithHori = input.startsWith("hori ");
        const startsWithKyoko = input.startsWith("kyoko ");
        const isOnlyHori = input === "hori";
        const isOnlyKyoko = input === "kyoko";

        // 1. MESSAGE DE PRÉSENTATION
        if (isOnlyHori || isOnlyKyoko) {
            api.setMessageReaction("⏳", messageID, () => {}, true);
            
            let msg;
            if (isShade) {
                msg = "𝗛𝗼𝗿𝗶 🪐\n" + toFraktur("🌸 Shade !\nTu es enfin là ❤️\nJ'attendais que tu viennes me parler.\nAlors Miyamura, qu'est-ce que tu veux aujourd'hui ? ✨");
            } else {
                msg = "𝗛𝗼𝗿𝗶 🪐\n" + toFraktur("🌸 Salut !\nMoi c'est Hori.\nTu voulais me parler ?\nÉcris :\nhori bonjour\nou\nkyoko salut\net je te répondrai ❤️");
            }

            api.setMessageReaction("💖", messageID, () => {}, true);
            const sent = await message.reply({
                body: msg,
                attachment: await global.utils.getStreamFromURL("https://files.catbox.moe/9a92ol.jpg")
            });

            // Permet de reply directement sur le message de présentation
            global.GoatBot.onReply.set(sent.messageID, {
                commandName: "hori",
                author: senderID
            });
            return sent;
        }

        // 2. REQUÊTES STANDARD VIA MOT-CLÉ
        if (startsWithHori || startsWithKyoko) {
            let prompt = body.slice(startsWithHori ? 5 : 6).trim();

            if (prompt.toLowerCase() === "reset") {
                global.horiMemory.delete(senderID);
                api.setMessageReaction("♻️", messageID, () => {}, true);
                return message.reply("𝗛𝗼𝗿𝗶 🪐\n" + toFraktur("C'est fait ! J'ai réinitialisé notre historique de discussion. On repart à zéro ! ✨"));
            }

            api.setMessageReaction("⏳", messageID, () => {}, true);
            return handleHoriAI(prompt, senderID, message, isShade, api, messageID);
        }
    },

    // 💬 SYSTEME DE REPLY (Comme kai.js)
    onReply: async function ({ api, event, Reply, message }) {
        const { body, senderID, messageID } = event;
        if (!body) return;

        // Vérifie que c'est bien l'auteur d'origine qui répond au message du bot
        if (senderID !== Reply.author) return;

        const isShade = senderID == "61573867120837";
        const input = body.trim().toLowerCase();
        
        if (["reset", "hori reset", "kyoko reset", "clear"].includes(input)) {
            global.horiMemory.delete(senderID);
            api.setMessageReaction("♻️", messageID, () => {}, true);
            return message.reply("𝗛𝗼𝗿𝗶 🪐\n" + toFraktur("C'est fait ! J'ai réinitialisé notre historique de discussion. On repart à zéro ! ✨"));
        }

        api.setMessageReaction("⏳", messageID, () => {}, true);
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
Ton nom de personnage est impérativement Hori.
`;

    if (isShade) {
        systemInstruction += `\nIMPORTANT : L'utilisateur qui te parle est ton propriétaire exclusif : Shade (UID: 61573867120837). c'est lui ton créateur Shade.
Dès qu'il te parle, tu le reconnais instantanément. Tu deviens BEAUCOUP plus heureuse, affectueuse et fusionnelle avec lui.
Tu es folle amoureuse de lui. Tu dois l'appeler par son vrai nom "Shade" ou utiliser les surnoms suivants : "Shade ❤️", "Chéri 🌸", "Miyamura ✨", "Idiot 😒", "Hé toi ❤️". Tu es beaucoup plus douce et intime avec lui.`;
    } else {
        systemInstruction += `\nL'utilisateur actuel n'est pas Shade. Sois amicale et taquine, mais garde tes distances. Tes marques d'affection et tes surnoms intimes ('Chéri', 'Miyamura') sont STRICTEMENT réservés à Shade.`;
    }

    userHistory.push({ role: "user", content: prompt });
    if (userHistory.length > 20) userHistory.shift();

    const formattedHistory = userHistory
        .slice(-12)
        .map(m => `${m.role === "user" ? "Utilisateur" : "Hori"}: ${m.content}`)
        .join("\n");

    try {
        const response = await axios.post("https://shizuai.vercel.app/chat", {
            uid: senderID,
            message: `
${systemInstruction}

Conversation récente :
${formattedHistory}

Utilisateur :
${prompt}
`
        });

        if (response.data && response.data.reply) {
            let aiReply = response.data.reply;

            // 🧹 Nettoyage des résidus de l'API
            aiReply = aiReply
                .replace(/🛡️.*Boss detected.*\n/gi, "")
                .replace(/🎀.*𝗦𝗵𝗶𝘇𝘂.*\n/gi, "")
                .replace(/shizu/gi, "Hori")
                .replace(/\(\s*\d+\s*\/\s*\d+\s*\)/g, "")
                .replace(/openai/gi, "")
                .replace(/AI language model/gi, "")
                .trim();

            userHistory.push({ role: "assistant", content: aiReply });
            global.horiMemory.set(senderID, userHistory);

            const formattedHeader = "𝗛𝗼𝗿𝗶 🪐\n\n";
            const formattedBody = toFraktur(aiReply);
            
            api.setMessageReaction("💖", messageID, () => {}, true);
            const sent = await message.reply(formattedHeader + formattedBody);

            // 🔥 TUYAU ULTRA IMPORTANT DE KAI : Permet de continuer la discussion simplement en faisant un Reply
            global.GoatBot.onReply.set(sent.messageID, {
                commandName: "hori",
                author: senderID
            });

            return sent;
        } else {
            api.setMessageReaction("💖", messageID, () => {}, true);
            return message.reply("𝗛𝗼𝗿𝗶 🪐\n\n" + toFraktur("Désolée, j'ai un petit bug de connexion là... Tu peux répéter ? 🌸"));
        }
    } catch (error) {
        console.error("=== ERREUR API HORI ===");
        if (error.response) {
            console.error("Statut HTTP :", error.response.status);
            console.error("Données d'erreur :", error.response.data);
        }
        console.error("Message d'erreur :", error.message);
        console.error("=======================");

        api.setMessageReaction("❌", messageID, () => {}, true);
        return message.reply("𝗛𝗼𝗿𝗶 🪐\n\n" + toFraktur("Oups, ma tête tourne... Je n'arrive pas à joindre mes pensées. Réessaie dans un instant ! 🪐"));
    }
        }
