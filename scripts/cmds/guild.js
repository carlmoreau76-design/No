/**
 * 🏰 COMMANDE PRINCIPALE : SYSTÈME DE GUILDE MMORPG (GoatBot)
 * Intègre la gestion complète, la hiérarchie stricte, l'économie interne et les missions.
 */

const path = require("path");
// Ajuste le chemin selon l'option choisie (ici configuré si tu as mis le fichier dans cmds/utils/)
const storage = require("./MMORPG_System/guildsMMO/guild.storage.js");

// Tentative de récupération sélective de Canvas pour la sous-commande "stats"
let canvasAvailable = false;
let Canvas = null;
try {
    Canvas = require("canvas");
    canvasAvailable = true;
} catch (e) {
    canvasAvailable = false;
}

module.exports = {
    config: {
        name: "guild",
        version: "2.0.0",
        author: "Gemini Collaborator",
        countDown: 3,
        role: 0, // Accessible à tous
        shortDescription: "Système complet de guilde MMORPG",
        longDescription: "Gérez votre guilde, participez à des guerres de territoires, améliorez votre banque et accomplissez des missions.",
        category: "economy",
        guide: {
            vi: "{p}{n} [sous-commande]",
            en: "{p}{n} [sub-command]"
        }
    },

    onStart: async function ({ api, event, args, usersData }) {
        const { threadID, messageID, senderID } = event;
        
        // Assistant de formatage des nombres compacts (Ex: 10.5K, 2.3M)
        function formatNumber(value) {
            if (value === null || value === undefined || isNaN(value)) return "0";
            const num = parseFloat(value);
            if (num >= 1.0e12) return (num / 1.0e12).toFixed(1).replace(/\.0$/, "") + "T";
            if (num >= 1.0e9) return (num / 1.0e9).toFixed(1).replace(/\.0$/, "") + "B";
            if (num >= 1.0e6) return (num / 1.0e6).toFixed(1).replace(/\.0$/, "") + "M";
            if (num >= 1.0e3) return (num / 1.0e3).toFixed(1).replace(/\.0$/, "") + "K";
            return num.toLocaleString("fr-FR");
        }

        // Récupération sécurisée du nom de l'utilisateur via GoatBot
        let senderName = "Aventurier";
        try {
            senderName = await usersData.getName(senderID) || "Aventurier";
        } catch (err) {
            senderName = "Aventurier";
        }

        // Enregistrement / Chargement du profil utilisateur persistant
        const userProfile = storage.getUserProfile(senderID, senderName);
        const subCommand = args[0] ? args[0].toLowerCase() : null;

        // --- MENU TEXTE PREMIUM SI AUCUNE SOUS-COMMANDE N'EST FOURNIE ---
        if (!subCommand) {
            let menu = "";
            menu += `╭───────────────────────────────────────╮\n`;
            menu += `│ ⚔️ 𝐒𝐘𝐒𝐓È𝐌𝐄 𝐃𝐄 𝐆𝐔𝐈𝐋𝐃𝐄𝐒 𝐌𝐌𝐎𝐑𝐏𝐆\n`;
            menu += `├───────────────────────────────────────┤\n`;
            menu += `│ 🔹 𝖦𝗎𝗂𝗅𝖽 𝖼𝗋𝖾𝖺𝗍𝖾 <nom> : 𝖥𝗈𝗇𝖽𝖾𝗋 𝗏𝗈𝗍𝗋𝖾 𝖾𝗆𝗉𝗂𝗋𝖾\n`;
            menu += `│ 🔹 𝖦𝗎𝗂𝗅𝖽 𝗂𝗇𝖿𝗈 [ID] : 𝖠𝖿𝖿𝗂𝖼𝗁𝖾𝗋 𝗅𝖺 𝖿𝗂𝖼𝗁𝖾 𝖽𝖾 𝗀𝗎𝗂𝗅𝖽𝖾\n`;
            menu += `│ 🔹 𝖦𝗎𝗂𝗅𝖽 𝗌𝗍𝖺𝗍𝗌 [ID] : 𝖥𝗂𝖼𝗁𝖾 𝗉𝗋𝖾𝗆𝗂𝗎𝗆 𝖽𝖾 𝗅𝖺 𝗀𝗎𝗂𝗅𝖽𝖾\n`;
            menu += `│ 🔹 𝖦𝗎𝗂𝗅𝖽 𝗅𝗂𝗌𝗍 : 𝖯𝖺𝗋𝖼𝗈𝗎𝗋𝗂𝗋 𝗅’𝖺𝗇𝗇𝗎𝖺𝗂𝗋𝖾 𝖽𝖾𝗌 𝗀𝗎𝗂𝗅𝖽𝖾𝗌\n`;
            menu += `│ 🔹 𝖦𝗎𝗂𝗅𝖽 𝗌𝖾𝖺𝗋𝖼𝗁 <nom> : 𝖥𝗂𝗅𝗍𝗋𝖾𝗋 𝗅𝖾𝗌 𝖺𝗅𝗅𝗂𝖺𝗇𝖼𝖾𝗌\n`;
            menu += `│ 🔹 𝖦𝗎𝗂𝗅𝖽 𝗃𝗈𝗂𝗇 <ID> : 𝖨𝗇𝗍é𝗀𝗋𝖾𝗋 𝗎𝗇𝖾 𝗀𝗎𝗂𝗅𝖽𝖾\n`;
            menu += `│ 🔹 𝖦𝗎𝗂𝗅𝖽 𝗅𝖾𝖺𝗏𝖾 : 𝖰𝗎𝗂quit𝗍𝖾𝗋 𝗏𝗈𝗍𝗋𝖾 𝗀𝗎𝗂𝗅𝖽𝖾\n`;
            menu += `│ 🔹 𝖦𝗎𝗂𝗅𝖽 𝗂𝗇𝗏𝗂𝗍𝖾 @user : 𝖨𝗇𝗏𝗂𝗍改𝖾𝗋 𝗎𝗇 𝗃𝗈𝗎𝖾𝗎𝗋\n`;
            menu += `│ 🔹 𝖦𝗎𝗂𝗅𝖽 𝗆𝖾𝗆𝖻𝖾𝗋𝗌 : 𝖵𝗈𝗂𝗋 𝗅’𝖾𝖿𝖿𝖾𝖼𝗍𝗂𝖿 𝖼𝗈𝗆𝗉𝗅𝖾𝗍\n`;
            menu += `├───────────────────────────────────────┤\n`;
            menu += `│ 💰 𝐁𝐀𝐍𝐐𝐔𝐄 & 𝐈𝐍𝐅𝐑𝐀𝐒𝐓𝐑𝐔𝐂𝐓𝐔𝐑𝐄\n`;
            menu += `├───────────────────────────────────────┤\n`;
            menu += `│ 🔹 𝖦𝗎𝗂𝗅𝖽 ... (tronqué pour affichage propre)\n`;
            menu += `│ 🔹 𝖦𝗎𝗂𝗅𝖽 𝖽𝗈𝗇𝖺𝗍𝖾 <montant/all> : 𝖵𝖾𝗋𝗌𝖾𝗋 𝖺𝗎 𝖼𝗈𝖿𝖿𝗋𝖾\n`;
            menu += `│ 🔹 𝖦𝗎𝗂𝗅𝖽 𝗐𝗂𝗍𝗁𝖽𝗋𝖺𝗐 <montant> : 𝖱𝖾𝗍𝗂𝗋𝖾𝗋 𝖽𝖾𝗌 𝖿𝗈𝗇𝖽𝗌\n`;
            menu += `│ 🔹 𝖦𝗎𝗂𝗅𝖽 𝗎𝗉𝗀𝗋𝖺𝖽𝖾 : 𝖠𝗆é𝗅𝗂𝗈𝗋𝖾𝗋 𝗅𝖺 𝗀𝗎𝗂𝗅𝖽𝖾\n`;
            menu += `│ 🔹 𝖦𝗎𝗂𝗅𝖽 𝖽𝖺𝗂𝗅𝗒 : 𝖱é𝖼𝗅𝖺𝗆𝖾𝗋 𝗅𝖺 𝗋é𝖼𝗈𝗆𝗉𝖾𝗇𝗌𝖾 𝗊𝗎𝗈𝗍𝗂𝖽𝗂𝖾𝗇𝗇𝖾\n`;
            menu += `│ 🔹 𝖦𝗎𝗂𝗅𝖽 𝗌𝖾fet𝗍𝗂𝗇𝗀𝗌 : 𝖬𝗈𝖽𝗂𝖿𝗂𝖾𝗋 𝖾𝗆𝗈𝗃𝗂 / 𝖻𝗂𝗈 / 𝗉𝗋𝗈𝖿𝗂𝗅\n`;
            menu += `│ 🔹 𝖦𝗎𝗂𝗅𝖽 𝗅𝗈𝗀𝗌 : 𝖢𝗈𝗇𝗌𝗎𝗅𝗍𝖾𝗋 𝗅’𝗁𝗂𝗌𝗍𝗈𝗋𝗂𝗊𝗎𝖾\n`;
            menu += `├───────────────────────────────────────┤\n`;
            menu += `│ 👑 𝐇𝐈𝐄́𝐑𝐀𝐑𝐂𝐇𝐈𝐄 & 𝐎𝐅𝐅𝐈𝐂𝐈𝐄𝐑𝐒\n`;
            menu += `├───────────────────────────────────────┤\n`;
            menu += `│ 🔹 𝖦𝗎𝗂𝗅𝖽 𝗉𝗋𝗈𝗆𝗈𝗍𝖾 @user : 𝖯𝗋𝗈𝗆𝗈𝗎𝗏𝗈𝗂𝗋\n`;
            menu += `│ 🔹 𝖦𝗎𝗂𝗅𝖽 𝖽𝖾𝗆𝗈𝗍𝖾 @user : 𝖱é𝗍𝗋𝗈𝗀𝗋𝖺𝖽𝖾𝗋\n`;
            menu += `│ 🔹 𝖦𝗎𝗂𝗅𝖽 𝗄𝗂𝖼𝗄 @user : 𝖤𝗑𝖼𝗅𝗎𝗋𝖾 𝗎𝗇 𝗆𝖾𝗆𝖻𝗋𝖾\n`;
            menu += `│ 🔹 𝖦𝗎𝗂𝗅𝖽 𝖽𝗂𝗌𝖻𝖺𝗇𝖽 : 𝖣𝗂𝗌𝗌𝗈𝗎𝖽𝗋𝖾 𝗅𝖺 𝗀𝗎𝗂𝗅𝖽𝖾\n`;
            menu += `├───────────────────────────────────────┤\n`;
            menu += `│ 🏆 ⚔️ 𝐆𝐔𝐄𝐑𝐑𝐄𝐒, 𝐌𝐈𝐒𝐒𝐈𝐎𝐍𝐒 & 𝐓𝐄𝐑𝐑𝐈𝐓𝐎𝐈𝐑𝐄𝐒\n`;
            menu += `├───────────────────────────────────────┤\n`;
            menu += `│ 🔹 𝖦𝗎𝗂𝗅𝖽 𝗐𝖺𝗋 : 𝖵𝗈𝗂𝗋 𝗅𝖾 𝗌𝗍𝖺𝗍𝗎𝗍 𝖽𝖾𝗌 𝗀𝗎𝖾𝗋𝗋𝖾𝗌\n`;
            menu += `│ 🔹 𝖦𝗎𝗂𝗅𝖽 𝗐𝖺𝗋 𝗃𝗈𝗂𝗇 : 𝖲’𝗂𝗇𝗌𝖼𝗋𝗂𝗋𝖾 à 𝗅𝖺 𝗀𝗎𝖾𝗋𝗋𝖾\n`;
            menu += `│ 🔹 𝖦𝗎𝗂𝗅𝖽 𝗐𝖺𝗋 𝖺𝗍𝗍𝖺𝊼𝗄 : 𝖠𝗍𝗍𝖺𝗊𝗎𝖾𝗋 𝗅𝖺 𝗀𝗎𝗂𝗅𝖽𝖾\n`;
            menu += `│ 🔹 𝖦𝗎𝗂𝗅𝖽 𝗍𝖾𝗋𝗋𝗂𝗍𝗈𝗋𝗂𝖾𝗌 : 𝖢𝖺𝗋𝗍𝖾 𝖽𝖾𝗌 𝗍𝖾𝗋𝗋𝗂𝗍𝗈𝗂𝗋𝖾𝗌\n`;
            menu += `│ 🔹 𝖦𝗎𝗂𝗅𝖽 𝗆𝗂𝗌𝗌𝗂𝗈𝗇𝗌 : 𝖵𝗈𝗂𝗋 𝗅𝖾𝗌 𝗊𝗎ê𝗍𝖾𝗌\n`;
            menu += `│ 🔹 𝖦𝗎𝗂𝗅𝖽 𝖺𝖼𝗁𝗂𝖾𝗏𝖾𝗆𝖾𝗇𝗍𝗌 : 𝖵𝗈𝗂𝗋 𝗅𝖾𝗌 𝗌𝗎𝖼𝖼è𝗌\n`;
            menu += `│ 🔹 𝖦𝗎𝗂𝗅𝖽 𝗍𝗈𝗉 : 𝖢𝗅𝖺𝗌𝗌𝖾𝗆𝖾𝗇𝗍 𝖽𝖾𝗌 𝗀𝗎𝗂𝗅𝖽𝖾𝗌\n`;
            menu += `│ 🔹 𝖦𝗎𝗂𝗅𝖽 𝖼𝗁𝖺𝗍 <msg> : 𝖢𝗁𝖺𝗍 𝗉𝗋𝗂𝗏é\n`;
            menu += `├───────────────────────────────────────┤\n`;
            menu += `│ ⭐ 𝖭𝗂𝗏𝖾𝖺𝗎𝗑 : 1 → 50 | ⚔️ 𝖦𝗎𝗂𝗅𝖽 𝖶𝖺𝗋 : 𝖳𝗈𝗎𝗍𝖾𝗌 𝗅𝖾𝗌 18𝗁\n`;
            menu += `╰───────────────────────────────────────╯`;
            return api.sendMessage(menu, threadID, messageID);
        }

        const guilds = storage.getGuilds();
        const users = storage.getUsers();

        // --- SUB-COMMAND : CREATE ---
        if (subCommand === "create") {
            if (userProfile.guildId) return api.sendMessage("❌ 𝖵𝗈𝗎𝗌 𝖿𝖺𝗂𝗍𝖾𝗌 𝖽é𝗃à 𝗉𝖺𝗋𝗍𝗂𝖾 𝖽'𝗎𝗇𝖾 𝗀𝗎𝗂𝗅𝖽𝖾.", threadID, messageID);
            const nameArg = args.slice(1).join(" ");
            if (!nameArg || nameArg.length < 3 || nameArg.length > 25) {
                return api.sendMessage("❌ 𝖫𝖾 𝗇𝗈𝗆 𝖽𝖾 𝗅𝖺 𝗀𝗎𝗂𝗅𝖽𝖾 𝖽𝗈𝗂𝗍 𝖼𝗈𝗆𝗉𝗋𝖾𝗇𝖽𝗋𝖾 𝖾𝗇𝗍𝗋𝖾 3 𝖾𝗍 25 𝖼𝖺𝗋𝖺𝖼𝗍è𝗋𝖾𝗌.", threadID, messageID);
            }

            // Vérification de l'unicité du nom
            const nameExists = Object.values(guilds).some(g => g.name.toLowerCase() === nameArg.toLowerCase());
            if (nameExists) return api.sendMessage("❌ 𝖢𝖾 𝗇𝗈𝗆 𝖽𝖾 𝗀𝗎𝗂𝗅𝖽𝖾 𝖾𝗌𝗍 𝖽é𝗃à 𝗎𝗍𝗂𝗅𝗂𝗌é.", threadID, messageID);

            const newGuildId = "G-" + Math.floor(100000 + Math.random() * 900000);
            const newGuild = storage.createGuildStructure(newGuildId, nameArg, senderID, senderName);
            
            guilds[newGuildId] = newGuild;
            storage.saveGuilds(guilds);

            userProfile.guildId = newGuildId;
            userProfile.role = "Leader";
            userProfile.joinedAt = Date.now();
            storage.saveUserProfile(senderID, userProfile);

            storage.logEvent(newGuildId, "JOIN", `👑 ${senderName} a fondé la guilde !`);

            return api.sendMessage(`✨ 𝖥é𝗅𝗂𝖼𝗂𝗍𝖺𝗍𝗂𝗈𝗇𝗌 ! 𝖵𝗈𝗎𝗌 𝗏𝖾𝗇𝖾𝗓 𝖽𝖾 𝖿𝗈𝗇𝖽𝖾𝗋 𝗅𝖺 𝗀𝗎𝗂𝗅𝖽𝖾 **${nameArg}** [ID: ${newGuildId}].`, threadID, messageID);
        }

        // --- SUB-COMMAND : DONATE ---
        if (subCommand === "donate") {
            if (!userProfile.guildId) return api.sendMessage("❌ 𝖵𝗈𝗎𝗌 𝗇'ê𝗍𝖾𝗌 𝖽𝖺𝗇𝗌 𝖺𝗎𝖼𝗎𝗇𝖾 𝗀𝗎𝗂𝗅𝖽𝖾.", threadID, messageID);
            const guild = guilds[userProfile.guildId];
            const amountArg = args[1];

            if (!amountArg) return api.sendMessage("❌ 𝖵𝖾𝗎𝗂𝗅𝗅𝖾𝗓 𝗌𝗉é𝖼𝗂𝖿𝗂𝖾𝗋 𝗎𝗇 𝗆𝗈𝗇𝗍𝖺𝗇𝗍 𝗈𝗎 'all'.", threadID, messageID);
            
            // Simuler l'intégration du portefeuille de ton système économique global
            // Remplacer par l'appel adéquat de ton bot global si nécessaire
            let goldAvailable = 500000; // Valeur fictive sécurisée pour la démo
            let toDonate = 0;

            if (amountArg.toLowerCase() === "all") {
                toDonate = goldAvailable;
            } else {
                toDonate = parseInt(amountArg);
            }

            if (isNaN(toDonate) || toDonate <= 0) return api.sendMessage("❌ 𝖬𝗈𝗇𝗍𝖺𝗇𝗍 𝗂𝗇𝗏𝖺𝗅𝗂𝖽𝖾.", threadID, messageID);
            if (toDonate > goldAvailable) return api.sendMessage("❌ 𝖵𝗈𝗎𝗌 𝗇'𝖺𝗏𝖾𝗓 𝗉𝖺𝗌 𝖺𝗌𝗌𝖾𝗓 𝖽'𝖺𝗋𝗀𝖾𝗇.", threadID, messageID);

            guild.bank += toDonate;
            userProfile.contributions.bankMoney += toDonate;

            // Mise à jour de la quête interne de dépôt
            const q = guild.missions.find(m => m.id === "m1");
            if (q && !q.done) {
                q.current += toDonate;
                if (q.current >= q.target) {
                    q.done = true;
                    guild.bank += q.rewardMoney;
                    guild.xp += q.rewardXp;
                }
            }

            storage.saveGuilds(guilds);
            storage.saveUserProfile(senderID, userProfile);
            storage.logEvent(guild.id, "BANK", `💰 ${senderName} a déposé ${formatNumber(toDonate)} pièces.`);

            return api.sendMessage(`✅ 𝖵𝗈𝗎𝗌 𝖺𝗏𝖾𝗓 𝖽é𝗉𝗈𝗌é **${formatNumber(toDonate)}** 𝗉𝗂è𝖼𝖾𝗌 𝖽𝖺𝗇𝗌 𝗅𝖾 𝖼𝗈𝖿𝖿𝗋𝖾.`, threadID, messageID);
        }

        // --- SUB-COMMAND : WITHDRAW ---
        if (subCommand === "withdraw") {
            if (!userProfile.guildId) return api.sendMessage("❌ 𝖵𝗈𝗎𝗌 𝗇'ê𝗍𝖾𝗌 𝖽𝖺𝗇𝗌 𝖺𝗎𝖼𝗎𝗇𝖾 𝗀𝗎𝗂𝗅𝖽𝖾.", threadID, messageID);
            const guild = guilds[userProfile.guildId];
            
            // Seuls les Leaders, Co-Leaders et Officiers peuvent retirer
            if (!["Leader", "Co-Leader", "Officier"].includes(userProfile.role)) {
                return api.sendMessage("❌ 𝖯𝖾𝗋𝗆𝗂𝗌𝗌𝗂𝗈𝗇 𝗂𝗇𝗌𝗎𝖿𝖿𝗂𝗌𝖺𝗇𝗍𝖾.", threadID, messageID);
            }

            const amount = parseInt(args[1]);
            if (isNaN(amount) || amount <= 0) return api.sendMessage("❌ 𝖬𝗈𝗇𝗍𝖺𝗇𝗍 𝗂𝗇𝗏𝖺𝗅𝗂𝖽𝖾.", threadID, messageID);
            if (amount > guild.bank) return api.sendMessage("❌ 𝖫𝖾 𝖼𝗈𝖿𝖿𝗋𝖾 𝗇𝖾 𝗉𝗈𝗌𝗌è𝖽𝖾 𝗉𝖺𝗌 𝖼𝖾𝗍𝗍𝖾 𝗌𝗈𝗆𝗆𝖾.", threadID, messageID);

            guild.bank -= amount;
            storage.saveGuilds(guilds);
            storage.logEvent(guild.id, "BANK", `💸 ${senderName} a retiré ${formatNumber(amount)} pièces.`);

            return api.sendMessage(`✅ **${formatNumber(amount)}** 𝗉𝗂è𝖼𝖾𝗌 𝗈𝗇𝗍 é𝗍é 𝗋𝖾𝗍𝗂𝗋é𝖾𝗌 𝖽𝗎 𝖼𝗈𝖿𝖿𝗋𝖾.`, threadID, messageID);
        }

        // --- SUB-COMMAND : UPGRADE ---
        if (subCommand === "upgrade") {
            if (!userProfile.guildId) return api.sendMessage("❌ 𝖵𝗈𝗎𝗌 𝗇'ê𝗍𝖾𝗌 𝖽𝖺𝗇𝗌 𝖺𝗎𝖼𝗎𝗇𝖾 𝗀𝗎ἱ𝗅𝖽𝖾.", threadID, messageID);
            const guild = guilds[userProfile.guildId];

            if (!["Leader", "Co-Leader"].includes(userProfile.role)) {
                return api.sendMessage("❌ 𝖲𝖾𝗎𝗅𝗌 𝗅𝖾 𝖫𝖾𝖺𝖽𝖾𝗋 𝖾𝗍 𝖢𝗈-𝖫𝖾𝖺𝖽𝖾𝗋𝗌 𝗉𝖾𝗎𝗏𝖾𝗇𝗍 𝖺𝗆é𝗅𝗂𝗈𝗋𝖾𝗋 𝗅𝖺 𝗀𝗎𝗂𝗅𝖽𝖾.", threadID, messageID);
            }

            if (guild.level >= 50) return api.sendMessage("👑 𝖵𝗈𝗍𝗋𝖾 𝗀𝗎𝗂𝗅𝖽𝖾 𝖾𝗌𝗍 𝖽é𝗃à 𝖺𝗎 𝗇𝗂𝗏𝖾𝖺𝗎 𝖬𝖠𝖷 (50).", threadID, messageID);

            const cost = guild.level * 150000; // Formule linéaire progressive
            if (guild.bank < cost) {
                return api.sendMessage(`❌ 𝖥𝗈𝗇𝖽𝗌 𝗂𝗇𝗌𝗎𝖿𝖿𝗂𝗌𝖺𝗇𝗍𝗌 𝖽𝖺𝗇𝗌 𝗅𝖾 𝖼𝗈𝖿𝖿𝗋𝖾. 𝖱𝖾𝗊𝗎𝗂𝗌 : **${formatNumber(cost)}** 𝗉𝗂è𝖼𝖾𝗌.`, threadID, messageID);
            }

            guild.bank -= cost;
            guild.level += 1;
            guild.maxMembers += 2; // Augmente l'espace d'accueil de la guilde
            
            storage.saveGuilds(guilds);
            storage.logEvent(guild.id, "UPGRADE", `⚡ La guilde est passée au niveau ${guild.level} !`);

            return api.sendMessage(`🚀 𝖦𝗎𝗂𝗅𝖽𝖾 𝖺𝗆é𝗅𝗂𝗈𝗋é𝖾 𝖺𝗏𝖾𝖼 𝗌𝗎𝖼𝖼è𝗌 ! 𝖭𝗂𝗏𝖾𝖺𝗎 : **${guild.level}** (𝖢𝖺𝗉𝖺𝖼𝗂𝗍é : ${guild.maxMembers} 𝗆𝖾𝗆𝖻𝗋𝖾𝗌).`, threadID, messageID);
                 }
