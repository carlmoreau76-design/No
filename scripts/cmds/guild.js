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
            menu += `│ 🔹 𝖦𝗎𝗂𝗅𝖽 𝗌et𝗍𝗂𝗇𝗀𝗌 : 𝖬𝗈𝖽𝗂𝖿𝗂𝖾𝗋 𝖾𝗆𝗈𝗃𝗂 / 𝖻𝗂𝗈 / 𝗉𝗋𝗈𝖿𝗂𝗅\n`;
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

        // --- SUB-COMMAND : INVITE ---
        if (subCommand === "invite") {
            if (!userProfile.guildId) return api.sendMessage("❌ 𝖵𝗈𝗎𝗌 𝗇'ê𝗍𝖾𝗌 𝖽𝖺𝗇𝗌 𝖺𝗎𝖼𝗎𝗇𝖾 𝗀𝗎𝗂𝗅𝖽𝖾.", threadID, messageID);
            const guild = guilds[userProfile.guildId];

            if (!["Leader", "Co-Leader", "Officier"].includes(userProfile.role)) {
                return api.sendMessage("❌ 𝖯𝖾𝗋𝗆𝗂𝗌𝗌𝗂𝗈𝗇 𝗂𝗇𝗌𝗎𝖿𝖿𝗂𝗌𝖺𝗇𝗍𝖾 𝗉𝗈𝗎𝗋 𝗂𝗇𝗏𝗂𝗍𝖾𝗋.", threadID, messageID);
            }

            if (guild.members.length >= guild.maxMembers) {
                return api.sendMessage("❌ 𝖫𝖺 𝗀𝗎𝗂𝗅𝖽𝖾 𝖾𝗌𝗍 𝗉𝗅𝖾𝗂𝗇𝖾. 𝖠𝗆é𝗅𝗂𝗈𝗋𝖾𝗓-𝗅𝖺 𝗉𝗈𝗎𝗋 𝗉𝗅𝗎𝗌 𝖽𝖾 𝗉𝗅𝖺𝖼𝖾𝗌.", threadID, messageID);
            }

            const targetID = Object.keys(event.mentions)[0];
            if (!targetID) return api.sendMessage("❌ 𝖵𝖾𝗎𝗂𝗅𝗅𝖾𝗓 𝗆𝖾𝗇𝗍𝗂𝗈𝗇𝗇𝖾𝗋 𝗅𝖾 𝗃𝗈𝗎𝖾𝗎𝗋 à 𝗂𝗇𝗏𝗂𝗍𝖾𝗋.", threadID, messageID);

            const targetProfile = storage.getUserProfile(targetID);
            if (targetProfile.guildId) return api.sendMessage("❌ 𝖢𝖾 𝗃𝗈𝗎𝖾𝗎𝗋 𝖿𝖺𝗂𝗍 𝖽é𝗃à 𝗉𝖺𝗋𝗍𝗂𝖾 𝖽'𝗎𝗇𝖾 𝗀𝗎𝗂𝗅𝖽𝖾.", threadID, messageID);

            // Injection directe (Acceptation automatique simplifiée pour GoatBot sans collecteur complexe)
            guild.members.push(targetID);
            targetProfile.guildId = guild.id;
            targetProfile.role = "Membre";
            targetProfile.joinedAt = Date.now();

            storage.saveGuilds(guilds);
            storage.saveUserProfile(targetID, targetProfile);
            storage.logEvent(guild.id, "JOIN", `👤 ${targetProfile.name} a rejoint la guilde.`);

            return api.sendMessage(`✅ **${targetProfile.name}** 𝖺 𝗋𝖾𝗃𝗈𝗂𝗇𝗍 𝗅𝖺 𝗀𝗎𝗂𝗅𝖽𝖾 **${guild.name}** !`, threadID, messageID);
        }

        // --- SUB-COMMAND : KICK ---
        if (subCommand === "kick") {
            if (!userProfile.guildId) return api.sendMessage("❌ 𝖵𝗈𝗎𝗌 𝗇'ê𝗍𝖾𝗌 𝖽𝖺𝗇𝗌 𝖺𝗎𝖼𝗎𝗇𝖾 𝗀𝗎𝗂𝗅𝖽𝖾.", threadID, messageID);
            const guild = guilds[userProfile.guildId];

            if (!["Leader", "Co-Leader", "Officier"].includes(userProfile.role)) {
                return api.sendMessage("❌ 𝖯𝖾𝗋𝗆𝗂𝗌𝗌𝗂𝗈𝗇 𝗂𝗇𝗌𝗎𝖿𝖿𝗂𝗌𝖺𝗇𝗍𝖾.", threadID, messageID);
            }

            const targetID = Object.keys(event.mentions)[0];
            if (!targetID) return api.sendMessage("❌ 𝖵𝖾𝗎𝗂𝗅𝗅𝖾𝗓 𝗆𝖾𝗇𝗍𝗂𝗈𝗇𝗇𝖾𝗋 𝗅𝖾 𝗆𝖾𝗆𝖻𝗋𝖾 à 𝖾𝗑𝖼𝗅𝗎𝗋𝖾.", threadID, messageID);
            if (targetID === senderID) return api.sendMessage("❌ 𝖵𝗈𝗎𝗌 𝗇𝖾 𝗉𝗈𝗎𝗏𝖾𝗓 𝗉𝖺𝗌 𝗏𝗈𝗎𝗌 𝖾𝗑𝖼𝗅𝗎𝗋𝖾 𝗏𝗈𝗎𝗌-𝗆ê𝗆𝖾.", threadID, messageID);

            const targetProfile = users[targetID];
            if (!targetProfile || targetProfile.guildId !== guild.id) {
                return api.sendMessage("❌ 𝖢𝖾 𝗃𝗈𝗎𝖾𝗎𝗋 𝗇𝖾 𝖿𝖺𝗂𝗍 𝗉𝖺抄𝗌 𝗉𝖺𝗋𝗍𝗂𝖾 𝖽𝖾 𝗏𝗈𝗍𝗋𝖾 𝗀𝗎𝗂𝗅𝖽𝖾.", threadID, messageID);
            }

            // Sécurité hiérarchique : Un co-leader ou officier ne peut pas kick un membre de rang égal ou supérieur
            if (userProfile.role === "Officier" && ["Leader", "Co-Leader", "Officier"].includes(targetProfile.role)) {
                return api.sendMessage("❌ 𝖧𝗂é𝗋𝖺𝗋𝖼𝗁𝗂𝖾 𝗂𝗇𝗌𝗎𝖿𝖿𝗂𝗌𝖺𝗇𝗍𝖾.", threadID, messageID);
            }
            if (userProfile.role === "Co-Leader" && targetProfile.role === "Leader") {
                return api.sendMessage("❌ 𝖵𝗈𝗎𝗌 𝗇𝖾 𝗉𝗈𝗎𝗏𝖾𝗓 𝗉𝖺𝗌 𝖾𝗑𝖼𝗅𝗎𝗋𝖾 𝗅𝖾 𝖫𝖾𝖺𝖽𝖾𝗋.", threadID, messageID);
            }

            guild.members = guild.members.filter(id => id !== targetID);
            targetProfile.guildId = null;
            targetProfile.role = null;

            storage.saveGuilds(guilds);
            storage.saveUserProfile(targetID, targetProfile);
            storage.logEvent(guild.id, "LEAVE", `❌ ${targetProfile.name} a été exclu par ${senderName}.`);

            return api.sendMessage(`👞 **${targetProfile.name}** 𝖺 é𝗍é 𝖾𝗑𝖼𝗅𝗎 𝖽𝖾 𝗅𝖺 𝗀𝗎𝗂𝗅𝖽𝖾.`, threadID, messageID);
        }

        // --- SUB-COMMAND : PROMOTE ---
        if (subCommand === "promote") {
            if (!userProfile.guildId) return api.sendMessage("❌ 𝖵𝗈𝗎𝗌 𝗇'ê𝗍𝖾𝗌 𝖽𝖺𝗇𝗌 𝖺𝗎𝖼𝗎𝗇𝖾 𝗀𝗎𝗂𝗅𝖽𝖾.", threadID, messageID);
            if (userProfile.role !== "Leader") return api.sendMessage("❌ 𝖲𝖾𝗎𝗅 𝗅𝖾 𝖫𝖾𝖺𝖽𝖾𝗋 𝗉𝖾𝗎𝗍 𝗀é𝗋𝖾𝗋 𝗅𝖾𝗌 𝗋𝖺𝗇𝗀𝗌.", threadID, messageID);

            const targetID = Object.keys(event.mentions)[0];
            if (!targetID) return api.sendMessage("❌ 𝖬𝖾𝗇𝗍𝗂𝗈𝗇𝗇𝖾𝗓 𝗅𝖾 𝗆𝖾𝗆𝖻𝗋𝖾 à 𝗉𝗋𝗈𝗆𝗈𝗎𝗏𝗈𝗂𝗋.", threadID, messageID);

            const targetProfile = users[targetID];
            if (!targetProfile || targetProfile.guildId !== userProfile.guildId) return api.sendMessage("❌ 𝖩𝗈𝗎𝖾𝗎𝗋 𝗂𝗇𝗍𝗋𝗈𝗎𝗏𝖺𝖻𝗅𝖾 𝖽𝖺𝗇𝗌 𝗏𝗈𝗍𝗋𝖾 𝗀𝗎𝗂𝗅𝖽𝖾.", threadID, messageID);

            if (targetProfile.role === "Membre") {
                targetProfile.role = "Officier";
            } else if (targetProfile.role === "Officier") {
                targetProfile.role = "Co-Leader";
            } else {
                return api.sendMessage("❌ 𝖢𝖾 𝗆𝖾𝗆𝖻𝗋𝖾 𝖾𝗌𝗍 𝖽é𝗃à 𝖺𝗎 𝗋𝖺𝗇𝗀 𝗆𝖺𝗑𝗂𝗆𝗎𝗆 (𝖢𝗈-𝖫𝖾𝖺𝖽𝖾𝗋).", threadID, messageID);
            }

            storage.saveUserProfile(targetID, targetProfile);
            storage.logEvent(userProfile.guildId, "RANK", `⚡ ${targetProfile.name} a été promu au rang de ${targetProfile.role}.`);
            return api.sendMessage(`🔼 **${targetProfile.name}** 𝖺 é𝗍é 𝗉𝗋𝗈𝗆𝗎 **${targetProfile.role}** !`, threadID, messageID);
        }

        // --- SYSTEM DE GUERRE AUTOMATIQUE : ENTRÉE CORE ---
        const warState = storage.getWar();

        // Engine de cycle automatique (Simulé à l'appel de la commande pour économiser les timers système en arrière-plan)
        const now = Date.now();
        if (warState.currentPhase === "idle" && now - warState.lastMatchmakingTime >= 18 * 60 * 60 * 1000) {
            // Déclenchement automatique de la phase d'inscription (30 minutes)
            warState.currentPhase = "registration";
            warState.phaseEndTime = now + 30 * 60 * 1000;
            warState.registeredGuilds = [];
            warState.playerParticipants = {};
            warState.playerStats = {};
            warState.matches = [];
            storage.saveWar(warState);
        } else if (warState.currentPhase === "registration" && now >= warState.phaseEndTime) {
            // Fin de l'inscription -> Lancement de la Phase de Combat (30 minutes)
            warState.currentPhase = "combat";
            warState.phaseEndTime = now + 30 * 60 * 1000;

            // Matchmaking logique
            const pool = [...warState.registeredGuilds];
            if (pool.length > 1) {
                while (pool.length > 1) {
                    const guildA = pool.splice(Math.floor(Math.random() * pool.length), 1)[0];
                    const guildB = pool.splice(Math.floor(Math.random() * pool.length), 1)[0];
                    warState.matches.push({
                        guildA, guildB,
                        scoreA: 0, scoreB: 0,
                        totalDamageA: 0, totalDamageB: 0
                    });
                }
                // Si guilde impaire, la dernière gagne par forfait
                if (pool.length === 1) {
                    const luckyGuildId = pool[0];
                    if (guilds[luckyGuildId]) {
                        guilds[luckyGuildId].bank += 25000;
                        guilds[luckyGuildId].wins += 1;
                        storage.logEvent(luckyGuildId, "WAR", "🏳️ Victoire par forfait (Pas d'adversaire trouvé).");
                    }
                }
            } else if (pool.length === 1) {
                // Une seule guilde inscrite au total
                const luckyGuildId = pool[0];
                if (guilds[luckyGuildId]) guilds[luckyGuildId].wins += 1;
            }
            
            warState.lastMatchmakingTime = now;
            storage.saveWar(warState);
            storage.saveGuilds(guilds);
        }

        // --- SUB-COMMAND : WAR ---
        if (subCommand === "war") {
            let warMsg = `╭───────────────────────────────────────╮\n`;
            warMsg += `│ ⚔️ 𝐒𝐓𝐀𝐓𝐔𝐓 𝐃𝐄 𝐋𝐀 𝐆𝐔𝐄𝐑𝐑𝐄 𝐃𝐄 𝐆𝐔𝐈𝐋𝐃𝐄𝐒\n`;
            warMsg += `├───────────────────────────────────────┤\n`;
            warMsg += `│ 🔹 𝖤𝗍𝖺𝗍 𝖺𝖼𝗍𝗎𝖾𝗅 : **${warState.currentPhase.toUpperCase()}**\n`;
            
            if (warState.currentPhase !== "idle") {
                const timeLeft = Math.max(0, Math.floor((warState.phaseEndTime - now) / 1000 / 60));
                warMsg += `│ 🔹 𝖳𝖾𝗆𝗉𝗌 𝗋𝖾𝗌𝗍𝖺𝗇𝗍 : ${timeLeft} 𝗆𝗂𝗇𝗎𝗍𝖾𝗌\n`;
                warMsg += `│ 🔹 𝖦𝗎𝗂𝗅𝖽𝖾𝗌 𝗂𝗇𝗌𝖼𝗋𝗂𝗍𝖾𝗌 : ${warState.registeredGuilds.length}\n`;
            } else {
                const nextWar = Math.max(0, Math.floor(((warState.lastMatchmakingTime + 18*60*60*1000) - now) / 1000 / 60 / 60));
                warMsg += `│ 💤 𝖯𝗋𝗈𝖼𝗁𝖺𝗂𝗇𝖾 𝗀𝗎𝖾𝗋𝗋𝖾 𝖽𝖺𝗇𝗌 : ${nextWar} 𝗁𝖾𝗎𝗋𝖾𝗌\n`;
            }
            warMsg += `╰───────────────────────────────────────╯`;
            return api.sendMessage(warMsg, threadID, messageID);
        }

        // --- SUB-COMMAND : WAR JOIN ---
        if (subCommand === "war" && args[1] === "join") {
            if (!userProfile.guildId) return api.sendMessage("❌ 𝖵𝗈𝗎𝗌 𝗇'ê𝗍𝖾𝗌 𝖽𝖺𝗇𝗌 𝖺𝗎𝖼𝗎𝗇𝖾 𝗀𝗎𝗂𝗅𝖽𝖾.", threadID, messageID);
            if (warState.currentPhase !== "registration") return api.sendMessage("❌ 𝖫𝖺 𝗉𝗁𝖺𝗌𝖾 𝖽'𝗂𝗇𝗌𝖼𝗋𝗂𝗉𝗍𝗂𝗈𝗇 𝖾𝗌𝗍 𝖿𝖾𝗋𝗆é𝖾.", threadID, messageID);

            const gId = userProfile.guildId;
            if (!warState.registeredGuilds.includes(gId)) {
                warState.registeredGuilds.push(gId);
            }

            if (!warState.playerParticipants[gId]) warState.playerParticipants[gId] = [];
            if (warState.playerParticipants[gId].includes(senderID)) {
                return api.sendMessage("❌ 𝖵𝗈𝗎𝗌 ê𝗍𝖾𝗌 𝖽é𝗃à 𝗂𝗇𝗌𝖼𝗋𝗂𝗍 𝗉𝗈𝗎𝗋 𝖼𝖾𝗍𝗍𝖾 𝗀𝗎𝖾𝗋𝗋𝖾.", threadID, messageID);
            }

            warState.playerParticipants[gId].push(senderID);
            warState.playerStats[senderID] = { damage: 0, attacks: 0, points: 0, name: senderName, guildId: gId };
            
            storage.saveWar(warState);
            return api.sendMessage("⚔️ 𝖨𝗇𝗌𝖼𝗋𝗂𝗉𝗍𝗂𝗈𝗇 𝗏𝖺𝗅𝗂𝖽é𝖾 ! 𝖵𝗈𝗎𝗌 ê𝗍𝖾𝗌 𝗉𝗋ê𝗍 𝗉𝗈𝗎𝗋 𝗅𝖾 𝖼𝗈𝗆𝖻𝖺𝗍.", threadID, messageID);
        }
