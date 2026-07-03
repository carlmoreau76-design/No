/**
 * ⚔️ SYSTÈME DE GUILDES MMORPG POUR GOATBOT
 * 👑 CONTROLEUR CENTRAL & INTERFACES TEXTES PREMIUM (PARTIE 1)
 * Fichier : guild.js
 */

const Storage = require("./database/guildsMMO/guild.storage");
const Utils = require("./database/guildsMMO/guild.utils");
const WarSystem = require("./database/guildsMMO/guild.war");
const TerritorySystem = require("./database/guildsMMO/guild.territories");
const MissionSystem = require("./database/guildsMMO/guild.missions");

module.exports = {
    config: {
        name: "guild",
        version: "3.0.0",
        author: "Gemini MMORPG Engine",
        countDown: 2,
        role: 0,
        description: "Interface Impériale de gestion de faction MMORPG",
        category: "game",
        guide: { fr: "~guild [sous-commande]" }
    },

    onStart: async function ({ api, event, args, usersData }) {
        const { threadID, messageID, senderID } = event;
        
        // Synchronisation des horloges et des bourses de serveurs
        WarSystem.updateWarState();
        TerritorySystem.processPassiveClaims();

        const userData = await usersData.get(senderID) || {};
        const userName = userData.name || "𝖦𝗎𝖾𝗋𝗋𝗂𝖾𝗋";
        
        let p = Storage.getUserProfile(senderID, userName);
        let guilds = Storage.getGuilds();
        const subCommand = args[0]?.toLowerCase();

        // ════════════════════════════════════════════════════════════════════════════════════
        // 📜 INTERFACE DU MENU PRINCIPAL HAUTE PERFORMANCE
        // ════════════════════════════════════════════════════════════════════════════════════
        if (!subCommand) {
            let menu = `╭───────────────────────────────────────╮\n`;
            menu += `│ ⚔️  ${Utils.toStyle1("𝐒𝐘𝐒𝐓È𝐌𝐄 𝐃𝐄 𝐆𝐔𝐈𝐋𝐃𝐄𝐒 𝐌𝐌𝐎𝐑𝐏𝐆")}\n`;
            menu += `├───────────────────────────────────────┤\n`;
            menu += `│ 🔹 ~guild create <nom> : Fonder votre empire\n`;
            menu += `│ 🔹 ~guild info [ID] : Afficher la fiche de faction\n`;
            menu += `│ 🔹 ~guild list : Parcourir l'annuaire général\n`;
            menu += `│ 🔹 ~guild search <nom> : Filtrer les alliances\n`;
            menu += `│ 🔹 ~guild join <ID> : Intégrer un bastion\n`;
            menu += `│ 🔹 ~guild leave : Déserter les rangs actuels\n`;
            menu += `│ 🔹 ~guild invite @user : Enrôler un combattant\n`;
            menu += `│ 🔹 ~guild members : Voir l'effectif complet\n`;
            menu += `├───────────────────────────────────────┤\n`;
            menu += `│ 💰 ${Utils.toStyle1("𝐁𝐀𝐍𝐐𝐔𝐄  𝐈𝐍𝐅𝐑𝐀𝐒𝐓𝐑𝐔𝐂𝐓𝐔𝐑𝐄")}\n`;
            menu += `├───────────────────────────────────────┤\n`;
            menu += `│ 🔹 ~guild donate <montant/all> : Verser au coffre\n`;
            menu += `│ 🔹 ~guild withdraw <montant> : Retrait de fonds\n`;
            menu += `│ 🔹 ~guild upgrade : Élever le niveau du bastion\n`;
            menu += `│ 🔹 ~guild daily : Toucher l'allocation de guilde\n`;
            menu += `│ 🔹 ~guild settings : Éditer le profil (Emoji/Bio)\n`;
            menu += `│ 🔹 ~guild logs : Consulter le grand livre des comptes\n`;
            menu += `├───────────────────────────────────────┤\n`;
            menu += `│ 👑 ${Utils.toStyle1("𝐇𝐈𝐑𝐀𝐑𝐂𝐇𝐈𝐄  𝐎𝐅𝐅𝐈𝐂𝐈𝐄𝐑𝐒")}\n`;
            menu += `├───────────────────────────────────────┤\n`;
            menu += `│ 🔹 ~guild promote @user : Graduer un soldat\n`;
            menu += `│ 🔹 ~guild demote @user : Rétrograder un gradé\n`;
            menu += `│ 🔹 ~guild kick @user : Bannir un subordonné\n`;
            menu += `│ 🔹 ~guild disband : Atomiser la guilde (Leader)\n`;
            menu += `├───────────────────────────────────────┤\n`;
            menu += `│ 🏆 ⚔️  ${Utils.toStyle1("𝐂𝐎𝐌𝐏É𝐓𝐈𝐓𝐈𝐎𝐍, 𝐌𝐈𝐒𝐒𝐈𝐎𝐍𝐒  𝐙𝐎𝐍𝐄𝐒")}\n`;
            menu += `├───────────────────────────────────────┤\n`;
            menu += `│ 🔹 ~guild war : Statut du conflit planétaire\n`;
            menu += `│ 🔹 ~guild war join : S'enrôler dans le peloton\n`;
            menu += `│ 🔹 ~guild war attack : Frapper les lignes ennemies\n`;
            menu += `│ 🔹 ~guild territories : Statut de la carte globale\n`;
            menu += `│ 🔹 ~guild territory : Synonyme de carte globale\n`;
            menu += `│ 🔹 ~guild missions : Tableau des quêtes d'alliance\n`;
            menu += `│ 🔹 ~guild achievements : Panthéon des succès acquis\n`;
            menu += `│ 🔹 ~guild top : Classement des factions d'élite\n`;
            menu += `│ 🔹 ~guild chat <msg> : Relayer un ordre crypté\n`;
            menu += `├───────────────────────────────────────┤\n`;
            menu += `│ ⭐ Paliers : Niv. 1 à 50 | Cycle de guerre : 18h\n`;
            menu += `│ 📦 Récolte passive des territoires : Toutes les 12h\n`;
            menu += `╰───────────────────────────────────────╯`;
            return api.sendMessage(menu, threadID, messageID);
        }

        switch (subCommand) {
            // ════════════════════════════════════════════════════════════════════════════════════
            // 🛡️ COMMANDES DE GESTION DE BASE
            // ════════════════════════════════════════════════════════════════════════════════════
            case "create": {
                if (p.guildId) return api.sendMessage("🛑 𝖤𝗋𝗋𝖾𝗎𝗋 : 𝖵𝗈𝗎𝗌 𝖺𝗉𝗉𝖺𝗋𝗍𝖾𝗇𝖾𝗓 𝖽é𝗃à à 𝗎𝗇𝖾 𝖿𝖺𝖼𝗍𝗂𝗈𝗇 𝖺𝖼𝗍𝗂𝗏𝖾.", threadID, messageID);
                const gName = args.slice(1).join(" ");
                if (!gName || gName.length < 3 || gName.length > 25) {
                    return api.sendMessage("🛑 𝖤𝗋𝗋𝖾𝗎𝗋 : 𝖫𝖾 𝗇𝗈𝗆 𝖽𝗈𝗂𝗍 𝖼𝗈𝗆𝗉𝗋𝖾𝗇𝖽𝗋𝖾 𝖾𝗇𝗍𝗋𝖾 𝟥 𝖾𝗍 𝟤𝟧 𝖼𝖺𝗋𝖺𝖼𝗍è𝗋𝖾𝗌.", threadID, messageID);
                }

                // Génération de l'empreinte ID unique de la faction
                const gId = "NX-" + Math.floor(1000 + Math.random() * 9000);
                guilds[gId] = {
                    id: gId, name: gName, emoji: "🛡️", desc: "𝖠𝗎𝖼𝗎𝗇𝖾 𝖽𝗈𝖼𝗍𝗋𝗂𝗇𝖾 𝗋é𝖽𝗂𝗀é𝖾.", leader: senderID,
                    created: Date.now(), level: 1, xp: 0, bank: 0, trophies: 0, wins: 0, losses: 0,
                    members: [senderID], settings: { recruitment: "open", openWithdrawal: false },
                    logs: [], achievements: []
                };

                p.guildId = gId;
                p.role = "LEADER";

                Storage.saveGuilds(guilds);
                Storage.saveUsers(Storage.getUsers());
                MissionSystem.checkAchievements(gId);

                let lines = [
                    `👑 𝖥𝗈𝗇𝖽𝖺𝗍𝖾𝗎𝗋 : **${userName}**`,
                    `🏷️ 𝖭𝗈𝗆 : **${gName}**`,
                    `🔑 𝖨𝖣 𝖴𝗇𝗂messages𝗎𝖾 : \`${gId}\``,
                    `📈 𝖯𝖺𝗅𝗂𝖾𝗋 : **𝖭𝗂𝗏𝖾𝖺𝗎 𝟣**`,
                    ` ───────────────────────`,
                    `✨ _𝖵𝗈𝗍𝗋𝖾 𝖾𝗆𝗉𝗂𝗋𝖾 𝖼𝗈𝗆𝗆𝖾𝗇𝖼𝖾 𝗂𝖼𝗂. 𝖱𝖾𝖼𝗋𝗎𝗍𝖾𝗓 𝖽𝖾𝗌 𝗌𝗈𝗅𝖽𝖺𝗍𝗌._`
                ];
                return api.sendMessage(Utils.buildPremiumBox("𝐅𝐀𝐂𝐓𝐈𝐎𝐍 𝐅𝐎𝐍𝐃É𝐄", lines), threadID, messageID);
            }

            case "info": {
                let targetId = args[1] || p.guildId;
                if (!targetId) return api.sendMessage("🛑 𝖤𝗋𝗋𝖾𝗎𝗋 : 𝖵𝖾𝗎𝗂𝗅𝗅𝖾𝗓 𝗌𝗉é𝖼𝗂𝖿𝗂𝖾𝗋 𝗎𝗇 𝖨𝖣 𝖽𝖾 𝖦𝗎𝗂𝗅𝖽𝖾.", threadID, messageID);

                const g = guilds[targetId];
                if (!g) return api.sendMessage("🛑 𝖤𝗋𝗋𝖾𝗎𝗋 : 𝖡𝖺𝗌𝗍𝗂𝗈𝗇 𝗂𝗇𝗍𝗋𝗈𝗎𝗏𝖺𝖻𝗅𝖾 𝗈𝗎 𝖽é𝗆𝖺𝗇𝗍𝖾𝗅é.", threadID, messageID);

                const reqXp = Utils.getRequiredXP(g.level);
                const percent = Math.min(100, Math.floor((g.xp / reqXp) * 100)) || 0;
                // Jauge de progression stylisée MMORPG
                const barSize = 10;
                const progressBlocks = Math.round((percent / 100) * barSize);
                const progressBar = "🟩".repeat(progressBlocks) + "⬛".repeat(barSize - progressBlocks);

                let infoLines = [
                    `${g.emoji} **${g.name.toUpperCase()}** [\`${g.id}\`]`,
                    ` ───────────────────────`,
                    `📈 𝖭𝗂𝗏𝖾𝖺𝗎 : **${g.level} / 𝟧𝟢**`,
                    `✨ 𝖤𝗑𝗉é𝗋𝗂𝖾𝗇𝖼𝖾 : [${progressBar}] ${percent}%`,
                    `👑 𝖢𝗈𝗆𝗆𝖺𝗇𝖽𝖺𝗇𝗍 : _𝖮𝖿𝖿𝗂𝖼𝗂𝖾𝗅_`,
                    `👥 𝖦𝖺𝗋𝗇𝗂𝗌𝗈𝗇 : **${g.members.length} / ${Utils.getMaxMembers(g.level)}** 𝗌𝗈𝗅𝖽𝖺𝗍𝗌`,
                    `💰 𝖢𝗈𝖿𝖿𝗋𝖾-𝖥𝗈𝗋𝗍 : **${Utils.formatMoney(g.bank)}**`,
                    `🏆 𝖳𝗋𝗈𝗉𝗁é𝖾𝗌 : **${g.trophies} 𝖯𝗍𝗌**`,
                    `⚔️ 𝖢𝖺𝗆𝗉𝖺𝗀𝗇𝖾𝗌 : **${g.wins}** 𝖵𝗂𝖼𝗍𝗈𝗂𝗋𝖾𝗌 │ **${g.losses}** 𝖣é𝖿𝖺𝗂𝗍𝖾𝗌`,
                    ` ───────────────────────`,
                    `📜 𝖣𝗈𝖼𝗍𝗋𝗂𝗇𝖾 : _${g.desc}_`
                ];

                return api.sendMessage(Utils.buildPremiumBox("𝐅𝐈𝐂𝐇𝐄 𝐃𝐄 𝐅𝐀𝐂𝐓𝐈𝐎𝐍", infoLines), threadID, messageID);
            }

            case "list": {
                let listLines = [];
                let index = 1;
                for (const id in guilds) {
                    if (index > 8) break; // Sécurisation anti-flood
                    const g = guilds[id];
                    listLines.push(`[${index}] ${g.emoji} **${g.name}** (\`${g.id}\`)`);
                    listLines.push(`    𝖭𝗂𝗏𝖾𝖺𝗎: ${g.level} │ 👥: ${g.members.length} 𝗆𝖾𝗆𝖻𝗋𝖾𝗌 │ 🏆: ${g.trophies}`);
                    listLines.push(` ───────────────────────`);
                    index++;
                }
                if (listLines.length > 0) listLines.pop();
                else listLines.push("𝖦𝖺𝗅𝖺𝗑𝗂𝖾 𝖽é𝗌𝖾𝗋𝗍𝖾... 𝖠𝗎𝖼𝗎𝗇𝖾 𝖿𝖺𝖼𝗍𝗂𝗈𝗇 𝖾𝗇𝗋𝖾𝗀𝗂𝗌𝗍𝗋é𝖾.");

                return api.sendMessage(Utils.buildPremiumBox("𝐀𝐍𝐍𝐔𝐀𝐈𝐑𝐄 𝐆É𝐍É𝐑𝐀𝐋", listLines), threadID, messageID);
            }

            case "search": {
                const query = args.slice(1).join(" ")?.toLowerCase();
                if (!query) return api.sendMessage("🛑 𝖤𝗋𝗋𝖾𝗎𝗋 : 𝖨𝗇𝖽𝗂messages𝗎𝖾𝗓 𝗎𝗇 𝗇𝗈𝗆 à 𝖼𝗁𝖾𝗋𝖼𝗁𝖾𝗋.", threadID, messageID);

                let searchLines = [];
                for (const id in guilds) {
                    const g = guilds[id];
                    if (g.name.toLowerCase().includes(query)) {
                        searchLines.push(`🔹 ${g.emoji} **${g.name}** [\`${g.id}\`] 𝖭𝗂𝗏.${g.level}`);
                    }
                }
                if (searchLines.length === 0) searchLines.push("𝖦𝗎𝗂𝗅𝖽𝖾 𝗂𝗇𝗍𝗋𝗈𝗎𝗏𝖺𝖻𝗅𝖾 𝗌𝗈𝗎𝗌 𝖼𝖾𝗍 𝖺𝗅𝗂𝖺𝗌.");
                return api.sendMessage(Utils.buildPremiumBox("𝐑É𝐒𝐔𝐋𝐓𝐀𝐓𝐒 𝐃𝐄 𝐑𝐄𝐂𝐇𝐄𝐑𝐂𝐇𝐄", searchLines), threadID, messageID);
            }

            case "join": {
                if (p.guildId) return api.sendMessage("🛑 𝖤𝗋𝗋𝖾𝗎𝗋 : 𝖵𝗈𝗎𝗌 𝖽𝖾𝗏𝖾𝗓 𝖽'𝖺𝖻𝗈𝗋𝖽 𝖽é𝗌𝖾𝗋𝗍𝖾𝗋 𝗏𝗈𝗍𝗋𝖾 𝖿𝖺𝖼𝗍𝗂𝗈𝗇.", threadID, messageID);
                const targetId = args[1];
                if (!targetId) return api.sendMessage("🛑 𝖤𝗋𝗋𝖾𝗎𝗋 : 𝖲𝗉é𝖼𝗂𝖿𝗂𝖾𝗋 𝗅'𝖨𝖣 𝖽𝗎 𝖻𝖺𝗌𝗍𝗂𝗈𝗇.", threadID, messageID);

                const g = guilds[targetId];
                if (!g) return api.sendMessage("🛑 𝖤𝗋𝗋𝖾𝗎𝗋 : 𝖥𝖺𝖼𝗍𝗂𝗈𝗇 𝗂𝗇𝖾𝗑𝗂𝗌𝗍𝖺𝗇𝗍𝖾.", threadID, messageID);
                if (g.members.length >= Utils.getMaxMembers(g.level)) return api.sendMessage("🛑 𝖤𝗋𝗋𝖾𝗎𝗋 : 𝖦𝖺𝗋𝗇𝗂𝗌𝗈𝗇 𝖺𝗎 𝖼𝗈𝗆𝗉𝗅𝖾𝗍.", threadID, messageID);

                g.members.push(senderID);
                p.guildId = targetId;
                p.role = "MEMBRE";

                Storage.saveGuilds(guilds);
                Storage.saveUsers(Storage.getUsers());
                Storage.logEvent(targetId, "RECRUIT", `👤 ${userName} 𝖺 𝗉𝗋ê𝗍é 𝖺𝗅𝗅é𝗀𝖾𝖺𝗇𝖼𝖾 𝖺𝗎𝗑 𝗋𝖺𝗇𝗀𝗌.`);

                return api.sendMessage(`✨ **𝖠𝗅𝗅é𝗀𝖾𝖺𝗇𝖼𝖾 𝖲𝖼𝖾𝗅𝗅é𝖾 :** 𝖵𝗈𝗎𝗌 𝗋𝖾𝗃𝗈𝗂𝗀𝗇𝖾𝗓 𝗅𝖾𝗌 𝗋𝖺𝗇𝗀𝗌 𝖽𝖾 **${g.name}**.`, threadID, messageID);
            }

            case "leave": {
                if (!p.guildId) return api.sendMessage("🛑 𝖤𝗋𝗋𝖾𝗎𝗋 : 𝖵𝗈𝗎𝗌 𝗇'𝖺𝗉𝗉𝖺𝗋𝗍𝖾𝗇𝖾𝗓 à 𝖺𝗎𝖼𝗎𝗇𝖾 𝖺𝗅𝗅𝗂𝖺𝗇𝖼𝖾.", threadID, messageID);
                const g = guilds[p.guildId];
                if (g.leader === senderID) return api.sendMessage("🛑 𝖤𝗋𝗋𝖾𝗎𝗋 : 𝖴𝗇 𝖲𝗈𝗎𝗏𝖾𝗋𝖺𝗂𝗇 𝗇𝖾 𝗉𝖾𝗎𝗍 𝗉𝖺𝗌 𝖽é𝗌𝖾𝗋𝗍𝖾𝗋. (𝖴𝗍𝗂𝗅𝗂𝗌𝖾𝗓 ~guild disband)", threadID, messageID);

                g.members = g.members.filter(id => id !== senderID);
                const oldId = p.guildId;
                p.guildId = null;
                p.role = null;

                Storage.saveGuilds(guilds);
                Storage.saveUsers(Storage.getUsers());
                Storage.logEvent(oldId, "LEAVE", `🚪 ${userName} 𝖺 𝗋𝗈𝗆𝗉𝗎 𝗌𝖾𝗌 𝗏œ𝗎𝗑 𝖾𝗍 𝖺 𝖽é𝗌𝖾𝗋𝗍é.`);

                return api.sendMessage("🍃 **𝖣é𝗌𝖾𝗋𝗍𝗂𝗈𝗇 :** 𝖵𝗈𝗎𝗌 𝖺𝗏𝖾𝗓 𝗋𝗈𝗆𝗉𝗎 𝗏𝗈𝗌 𝖾𝗇𝗀𝖺messages𝖾𝗆𝖾𝗇𝗍𝗌 𝖾𝗍 𝖺𝗏𝖾𝗓 𝗊𝗎𝗂𝗍𝗍é 𝗅'𝖺𝗅𝗅𝗂𝖺𝗇𝖼𝖾.", threadID, messageID);
            }
