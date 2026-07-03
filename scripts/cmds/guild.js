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

                // ════════════════════════════════════════════════════════════════════════════════════
            // 👥 INVITATIONS & EFFECTIFS IMPÉRIAUX
            // ════════════════════════════════════════════════════════════════════════════════════
            case "invite": {
                if (!Utils.checkPermission(p, "OFFICIER")) return api.sendMessage("🛑 𝖤𝗋𝗋𝖾𝗎𝗋 : 𝖠𝗎𝗍𝗈𝗋𝗂𝗌𝖺𝗍𝗂𝗈𝗇 𝗂𝗇𝗌𝗎𝖿𝖿𝗂𝗌𝖺𝗇𝗍𝖾 (𝖮𝖿𝖿𝗂𝖼𝗂𝖾𝗋 𝗆𝗂𝗇𝗂𝗆𝗎𝗆).", threadID, messageID);
                const targetID = Object.keys(event.mentions)[0];
                if (!targetID) return api.sendMessage("🛑 𝖤𝗋𝗋𝖾𝗎𝗋 : 𝖵𝖾𝗎𝗂𝗅𝗅𝖾𝗓 𝗆𝖾𝗇𝗍𝗂𝗈𝗇𝗇𝖾𝗋 (@user) 𝗅𝖾 𝖼𝗈𝗆𝖻𝖺𝗍𝗍𝖺𝗇𝗍 à 𝖾𝗇𝗋ô𝗅𝖾𝗋.", threadID, messageID);

                let targetP = Storage.getUserProfile(targetID);
                if (targetP.guildId) return api.sendMessage("🛑 𝖤𝗋𝗋𝖾𝗎𝗋 : 𝖢𝖾 𝗀𝗎𝖾𝗋𝗋𝗂𝖾𝗋 𝖺𝗉𝗉𝖺𝗋𝗍𝗂𝖾𝗇𝗍 𝖽é𝗃à à 𝗎𝗇𝖾 𝖺𝗅𝗅𝗂𝖺𝗇𝖼𝖾.", threadID, messageID);

                const g = guilds[p.guildId];
                if (g.members.length >= Utils.getMaxMembers(g.level)) return api.sendMessage("🛑 𝖤𝗋𝗋𝖾𝗎𝗋 : 𝖵𝗈𝗍𝗋𝖾 𝗀𝖺𝗋𝗇𝗂𝗌𝗈𝗇 𝖾𝗌𝗍 𝖺𝗎 𝖼𝗈𝗆𝗉𝗅𝖾𝗍.", threadID, messageID);

                targetP.guildId = p.guildId;
                targetP.role = "MEMBRE";
                g.members.push(targetID);

                Storage.saveGuilds(guilds);
                Storage.saveUsers(Storage.getUsers());
                Storage.logEvent(p.guildId, "INVITE", `⚔️ ${userName} 𝖺 𝖾𝗇𝗋ô𝗅é 𝗅𝖾 𝗌𝗈𝗅𝖽𝖺𝗍 [${targetID}].`);

                return api.sendMessage(`✨ **𝖤𝗇𝗋ô𝗅𝖾𝗆𝖾𝗇𝗍 :** 𝖫𝖾 𝗃𝗈𝗎𝖾𝗎𝗋 𝖺 é𝗍é 𝗂𝗇𝗍é𝗀𝗋é 𝖺𝗏𝖾𝗓 𝗌𝗎𝖼𝖼è𝗌 𝖽𝖺𝗇𝗌 𝗅'𝖺𝗅𝗅𝗂𝖺𝗇𝖼𝖾 **${g.name}**.`, threadID, messageID);
            }

            case "members": {
                if (!p.guildId) return api.sendMessage("🛑 𝖤𝗋𝗋𝖾𝗎𝗋 : 𝖵𝗈𝗎𝗌 𝗇'𝖺𝗉𝗉𝖺𝗋𝗍𝖾𝗇𝖾𝗓 à 𝖺𝗎𝖼𝗎𝗇𝖾 𝖿𝖺𝖼𝗍𝗂𝗈𝗇.", threadID, messageID);
                const g = guilds[p.guildId];
                const users = Storage.getUsers();

                let memberLines = [
                    `🏠 𝖡𝖺𝗌𝗍𝗂𝗈𝗇 : **${g.name}**`,
                    `👥 𝖤𝖿𝖿𝖾c𝗍𝗂𝖿 : **${g.members.length} / ${Utils.getMaxMembers(g.level)}**`,
                    ` ───────────────────────`
                ];

                g.members.forEach((mId, index) => {
                    const uProfile = users[mId];
                    const name = uProfile ? uProfile.name : `𝖲𝗈𝗅𝖽𝖺𝗍_${mId.slice(0,4)}`;
                    const roleTitle = uProfile ? Utils.ROLES[uProfile.role]?.name || "👤 𝖬𝖾𝗆𝖻𝗋𝖾" : "👤 𝖬𝖾𝗆𝖻𝗋𝖾";
                    memberLines.push(`[${index + 1}] ${roleTitle} │ **${name}**`);
                });

                return api.sendMessage(Utils.buildPremiumBox("𝐄𝐅𝐅𝐄𝐂𝐓𝐈𝐅 𝐃𝐄 𝐋'𝐀𝐋𝐋𝐈𝐀𝐍𝐂𝐄", memberLines), threadID, messageID);
            }

            // ════════════════════════════════════════════════════════════════════════════════════
            // 💰 BANQUE DE GUILDE & ÉCONOMIE MASSIVE
            // ════════════════════════════════════════════════════════════════════════════════════
            case "donate": {
                if (!p.guildId) return api.sendMessage("🛑 𝖤𝗋𝗋𝖾𝗎𝗋 : 𝖥𝖺𝖼𝗍𝗂𝗈𝗇 𝗋𝖾𝗊𝗎𝗂𝗌𝖾 𝗉𝗈𝗎𝗋 𝖼𝗈𝗇𝗍𝗋𝗂𝖦𝗎𝖾𝗋.", threadID, messageID);
                const g = guilds[p.guildId];
                const inputVal = args[1];

                if (!inputVal) return api.sendMessage("🛑 𝖤𝗋𝗋𝖾𝗎𝗋 : 𝖲𝗉é𝖼𝗂𝖿𝗂𝖾𝗓 𝗎𝗇 𝗆𝗈𝗇𝗍𝖺𝗇𝗍 𝗈𝗎 'all'.", threadID, messageID);

                // Simulation de fonds - Remplace par l'économie réelle de ton bot si nécessaire
                let donation = inputVal === "all" ? 1000000 : parseInt(inputVal);
                if (isNaN(donation) || donation <= 0) return api.sendMessage("🛑 𝖤𝗋𝗋𝖾𝗎𝗋 : 𝖬𝗈𝗇𝗍𝖺𝗇𝗍 𝗇𝗎𝗆é𝗋𝗂𝗊𝗎𝖾 𝗂𝗇𝗏𝖺𝗅𝗂𝖽𝖾.", threadID, messageID);

                g.bank += donation;
                p.stats.contributions += donation;
                
                Storage.saveGuilds(guilds);
                Storage.saveUsers(Storage.getUsers());
                Storage.logEvent(p.guildId, "DONATE", `💰 ${userName} 𝖺 𝖽é𝗉𝗈𝗌é ${Utils.formatMoney(donation)} 𝖽𝖺𝗇𝗌 𝗅𝖾 𝖼𝗈𝖿𝖿𝗋𝖾.`);
                
                MissionSystem.advanceMission(p.guildId, "gold_deposit", donation);

                let lines = [
                    `💰 𝖵𝖾𝗋𝗌𝖾𝗆𝖾𝗇𝗍 : **+${Utils.formatMoney(donation)}**`,
                    `🏛️ 𝖭𝗈𝗎𝗏𝖾𝖺𝗎 𝗌𝗈𝗅𝖽𝖾 : **${Utils.formatMoney(g.bank)}**`,
                    `✨ _𝖬𝖾𝗋𝖼𝗂 𝗉𝗈𝗎𝗋 𝗏𝗈𝗍𝗋𝖾 𝖼𝗈𝗇𝗍𝗋𝗂𝖻𝗎𝗍𝗂𝗈𝗇 𝖺𝗎𝗑 𝖿𝗈𝗇𝖽𝗌 𝖽'𝖾𝗆𝗉观𝗋𝖾._`
                ];
                return api.sendMessage(Utils.buildPremiumBox("𝐃É𝐏Ô𝐓 𝐕𝐀𝐋𝐈𝐃É", lines), threadID, messageID);
            }

            case "withdraw": {
                if (!p.guildId) return api.sendMessage("🛑 𝖤𝗋𝗋𝖾𝗎𝗋 : 𝖵𝗈𝗎𝗌 n'𝖺𝗉𝗉𝖺𝗋𝗍𝖾𝗇𝖾𝗓 à 𝖺𝗎𝖼𝗎𝗇𝖾 𝖿𝖺𝖼𝗍𝗂𝗈𝗇.", threadID, messageID);
                if (!Utils.checkPermission(p, "COLEADER")) return api.sendMessage("🛑 𝖤𝗋𝗋𝖾𝗎𝗋 : 𝖲𝖾𝗎𝗅𝗌 𝗅𝖾𝗌 𝖢𝗈-𝖫𝖾𝖺𝖽𝖾𝗋𝗌 𝖾𝗍 𝗅𝖾 𝖫𝖾𝖺𝖽𝖾𝗋 𝗉𝖾𝗎𝗏𝖾𝗇𝗍 𝗋𝖾𝗍𝗂𝗋𝖾𝗋.", threadID, messageID);
                
                const g = guilds[p.guildId];
                const amount = parseInt(args[1]);
                if (isNaN(amount) || amount <= 0) return api.sendMessage("🛑 𝖤𝗋𝗋𝖾𝗎𝗋 : 𝖲𝗉é𝖼𝗂𝖿𝗂𝖾𝗓 𝗎𝗇 𝗆𝗈𝗇𝗍𝖺𝗇𝗍 𝗏𝖺𝗅𝗂𝖽𝖾.", threadID, messageID);
                if (g.bank < amount) return api.sendMessage("🛑 𝖤𝗋𝗋𝖾𝗎𝗋 : 𝖥𝗈𝗇𝖽𝗌 𝗂𝗇𝗌𝗎𝖿𝖿𝗂𝗌𝖺𝗇𝗍𝗌 𝖽𝖺𝗇𝗌 𝗅𝖾 𝖳𝗋é𝗌𝗈𝗋 𝖱𝗈𝗒𝖺𝗅.", threadID, messageID);

                g.bank -= amount;
                Storage.saveGuilds(guilds);
                Storage.logEvent(p.guildId, "WITHDRAW", `🚨 Retrait : ${userName} 𝖺 𝗉𝗋é𝗅𝖾𝗏é ${Utils.formatMoney(amount)}.`);

                let lines = [
                    `💰 Retrait effectué : **-${Utils.formatMoney(amount)}**`,
                    `🏛️ Trésor restant : **${Utils.formatMoney(g.bank)}**`,
                    `👤 Opérateur : _${userName}_`
                ];
                return api.sendMessage(Utils.buildPremiumBox("𝐅𝐎𝐍𝐃𝐒 𝐏𝐑É𝐋𝐄𝐕É𝐒", lines), threadID, messageID);
            }

            case "upgrade": {
                if (!p.guildId) return api.sendMessage("🛑 𝖤𝗋𝗋𝖾𝗎𝗋 : 𝖥𝖺𝖼𝗍𝗂𝗈𝗇 𝗋𝖾𝗊𝗎𝗂𝗌𝖾.", threadID, messageID);
                if (!Utils.checkPermission(p, "OFFICIER")) return api.sendMessage("🛑 𝖤𝗋𝗋𝖾𝗎𝗋 : 𝖦𝗋𝖺𝖽𝖾 d'𝖮𝖿𝖿𝗂𝖼𝗂𝖾𝗋 𝗆𝗂𝗇𝗂𝗆𝗎𝗆 𝗋𝖾𝗊𝗎𝗂𝗌.", threadID, messageID);

                const g = guilds[p.guildId];
                if (g.level >= 50) return api.sendMessage("👑 𝖤𝗋𝗋𝖾𝗎𝗋 : 𝖡𝖺𝗌𝗍𝗂𝗈𝗇 𝖽é𝗃à 𝖺𝗎 𝖭𝗂𝗏𝖾𝖺𝗎 𝖬𝖺𝗑𝗂𝗆𝗎𝗆 (𝟧𝟢).", threadID, messageID);

                const cost = Utils.getUpgradeCost(g.level);
                if (g.bank < cost) return api.sendMessage(`🛑 𝖤𝗋𝗋𝖾𝗎𝗋 : 𝖨𝗅 𝖿𝖺𝗎𝗍 **${Utils.formatMoney(cost)}** 𝖽𝖺𝗇𝗌 𝗅𝖾 𝖼𝗈𝖿𝖿𝗋𝖾 𝗉𝗈𝗎𝗋 é𝗅𝖾𝗏𝖾𝗋 𝗅𝖾 𝖻𝖺𝗌𝗍𝗂𝗈𝗇.`, threadID, messageID);

                g.bank -= cost;
                g.level += 1;
                
                Storage.saveGuilds(guilds);
                Storage.logEvent(p.guildId, "UPGRADE", `🏛️ 𝖨𝖭𝖥𝖱𝖠𝖲𝖳𝖱𝖴𝖢𝖳𝖴𝖱𝖤 : 𝖡𝖺𝗌𝗍𝗂𝗈𝗇 é𝗅𝖾𝗏é 𝖺𝗎 𝖭𝗂𝗏𝖾𝖺𝗎 ${g.level}.`);
                MissionSystem.checkAchievements(p.guildId);

                let upgradeLines = [
                    `🏛️ **𝖡𝖺𝗌𝗍𝗂𝗈𝗇 É𝗅𝖾𝗏é 𝖺𝗎 𝖭𝗂𝗏𝖾𝖺𝗎 ${g.level} !**`,
                    ` ───────────────────────`,
                    `💰 𝖢𝗈û𝗍 𝖽𝖾𝗌 𝖳𝗋𝖺𝗏𝖺𝗎𝗑 : -${Utils.formatMoney(cost)}`,
                    `👥 𝖢𝖺𝗉𝖺𝖼𝗂𝗍é 𝖬𝖺𝗑 : **${Utils.getMaxMembers(g.level)} 𝖦𝗎𝖾𝗋𝗋𝗂𝖾𝗋𝗌**`,
                    `⚔️ 𝖡𝗈𝗇𝗎𝗌 𝖽𝖾 𝖦𝗎𝖾𝗋𝗋𝖾 : **+${Utils.getLevelBonus(g.level).warDamageBonus} Dégâts**`
                ];
                return api.sendMessage(Utils.buildPremiumBox("𝐈𝐍𝐅𝐑𝐀𝐒𝐓𝐑𝐔𝐂𝐓𝐔𝐑𝐄 𝐀𝐌É𝐋𝐈𝐎𝐑É𝐄", upgradeLines), threadID, messageID);
            }

            case "daily": {
                if (!p.guildId) return api.sendMessage("🛑 𝖤𝗋𝗋𝖾𝗎𝗋 : 𝖵𝗈𝗎𝗌 𝗇𝖾 𝗉𝗈𝗎𝗏𝖾𝗓 𝗉𝖺𝗌 𝗍𝗈𝗎c𝗁𝖾𝗋 𝖽'𝖺𝗅𝗅𝗈𝖼𝖺𝗍𝗂𝗈𝗇 𝗌𝖺𝗇𝗌 𝖿𝖺𝖼𝗍𝗂𝗈𝗇.", threadID, messageID);
                const now = Date.now();
                if (now - p.cooldowns.daily < 24 * 60 * 60 * 1000) {
                    const diff = (24 * 60 * 60 * 1000) - (now - p.cooldowns.daily);
                    const hours = Math.floor(diff / (1000 * 60 * 60));
                    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                    return api.sendMessage(`⏳ 𝖢𝗈𝗈𝗅𝖽𝗈𝗐𝗇 : 𝖵𝗈𝗍𝗋𝖾 𝖺𝗅𝗅𝗈𝖼𝖺𝗍𝗂𝗈𝗇 𝗋𝖾𝗏𝗂𝖾𝗇𝖽𝗋𝖺 𝖽𝖺𝗇𝗌 **${hours}𝗁 ${mins}𝗆**.`, threadID, messageID);
                }

                const g = guilds[p.guildId];
                const bonus = Utils.getLevelBonus(g.level);
                const payout = Math.floor(40000 * bonus.moneyMultiplier);
                const tax = Math.floor(payout * 0.15); // 15% reversés au coffre

                p.cooldowns.daily = now;
                g.bank += tax;

                Storage.saveUsers(Storage.getUsers());
                Storage.saveGuilds(guilds);
                Storage.logEvent(p.guildId, "DAILY", `🎁 ${userName} 𝖺 𝗉𝖾𝗋ç𝗎 𝗌𝗈𝗇 𝖺𝗅𝗅𝗈𝖼𝖺𝗍𝗂𝗈𝗇 (+${tax} 💰 𝗍𝖺𝗑é𝗌 𝗉𝗈𝗎𝗋 𝗅𝖺 𝗀𝗎𝗂𝗅𝖽𝖾).`);

                let dailyLines = [
                    `🎁 𝖣𝗈𝗍𝖺𝗍𝗂𝗈𝗇 𝖱𝗈𝗒𝖺𝗅𝖾 : **+${Utils.formatMoney(payout - tax)}**`,
                    `🏛️ 𝖳𝖺𝗑𝖾 𝖽𝖾 𝖡𝖺𝗌𝗍𝗂𝗈𝗇 (𝟣𝟧%) : **+${Utils.formatMoney(tax)}** (𝖠𝗎 𝖼𝗈𝖿𝖿𝗋𝖾)`
                ];
                return api.sendMessage(Utils.buildPremiumBox("𝐀𝐋𝐋𝐎𝐂𝐀𝐓𝐈𝐎𝐍 𝐐𝐔𝐎𝐓𝐈𝐃𝐈𝐄𝐍𝐍𝐄", dailyLines), threadID, messageID);
            }

                // ════════════════════════════════════════════════════════════════════════════════════
            // 👑 HIÉRARCHIE, grades & MODÉRATION INTERNE
            // ════════════════════════════════════════════════════════════════════════════════════
            case "promote": {
                if (!Utils.checkPermission(p, "COLEADER")) return api.sendMessage("🛑 𝖤𝗋𝗋𝖾𝗎𝗋 : 𝖠𝗎𝗍𝗈𝗋𝗂𝗌𝖺𝗍𝗂𝗈𝗇 𝗂𝗇𝗌𝗎𝖿𝖿𝗂𝗌𝖺𝗇𝗍𝖾.", threadID, messageID);
                const targetID = Object.keys(event.mentions)[0];
                if (!targetID) return api.sendMessage("🛑 𝖤𝗋𝗋𝖾𝗎𝗋 : 𝖬𝖾𝗇𝗍𝗂𝗈𝗇𝗇𝖾𝗓 𝗅𝖾 𝗌𝗈𝗅𝖽𝖺𝗍 à 𝗀𝗋𝖺𝖽𝗎𝖾𝗋.", threadID, messageID);

                let targetP = Storage.getUserProfile(targetID);
                if (targetP.guildId !== p.guildId) return api.sendMessage("🛑 𝖤𝗋𝗋𝖾𝗎𝗋 : 𝖢𝖾 𝗃𝗈𝗎𝖾𝗎𝗋 𝗇𝖾 𝖿𝖺𝗂𝗍 𝗉𝖺𝗌 𝗉𝖺𝗋𝗍𝗂𝖾 𝖽𝖾 𝗏𝗈𝗍𝗋𝖾 𝖿𝖺𝖼𝗍𝗂𝗈𝗇.", threadID, messageID);

                if (targetP.role === "MEMBRE") {
                    targetP.role = "OFFICIER";
                } else if (targetP.role === "OFFICIER" && p.role === "LEADER") {
                    targetP.role = "COLEADER";
                } else {
                    return api.sendMessage("🛑 𝖤𝗋𝗋𝖾𝗎𝗋 : 𝖯𝗉𝗈𝗆𝗈𝗍𝗂𝗈𝗇 𝗂𝗆𝗉𝗈𝗌𝗌𝗂𝖻𝗅𝖾 (𝖦𝗋𝖺𝖽𝖾 𝗆𝖺𝗑𝗂𝗆𝗎𝗆 𝗈𝗎 𝗉𝖾𝗋𝗆𝗂𝗌𝗌𝗂𝗈𝗇 𝗋𝖾𝗌𝗍𝗋𝖾𝗂𝗇𝗍𝖾).", threadID, messageID);
                }

                Storage.saveUsers(Storage.getUsers());
                Storage.logEvent(p.guildId, "PROMOTE", `👑 ${userName} 𝖺 𝗉𝗋𝗈𝗆𝗎 [${targetP.name}] au 𝗋𝖺𝗇𝗀 𝖽𝖾 ${targetP.role}.`);
                return api.sendMessage(`✨ **𝖦𝗋𝖺𝖽𝗎𝖺𝗍𝗂𝗈𝗇 :** **${targetP.name}** 𝖾𝗌𝗍 𝖽é𝗌𝗈𝗋𝗆𝖺𝗂𝗌 **${targetP.role}**.`, threadID, messageID);
            }

            case "demote": {
                if (!Utils.checkPermission(p, "COLEADER")) return api.sendMessage("🛑 𝖤𝗋𝗋𝖾𝗎𝗋 : 𝖠𝗎𝗍𝗈𝗋𝗂𝗌𝖺𝗍𝗂𝗈𝗇 𝗂𝗇𝗌𝗎𝖿𝖿𝗂𝗌𝖺𝗇𝗍𝖾.", threadID, messageID);
                const targetID = Object.keys(event.mentions)[0];
                if (!targetID) return api.sendMessage("🛑 𝖤𝗋𝗋𝖾𝗎𝗋 : 𝖬𝖾𝗇𝗍𝗂𝗈𝗇𝗇𝖾𝗓 𝗅'𝗈𝖿𝖿𝗂𝖼𝗂𝖾𝗋 à 𝗋é𝗍𝗋𝗈区分𝗋𝖺𝖽𝖾𝗋.", threadID, messageID);

                let targetP = Storage.getUserProfile(targetID);
                if (targetP.guildId !== p.guildId) return api.sendMessage("🛑 𝖤𝗋𝗋𝖾𝗎𝗋 : 𝖨𝗅 𝗇'𝖾𝗌𝗍 𝗉𝖺𝗌 𝖽𝖺𝗇𝗌 𝗏𝗈𝗍𝗋𝖾 𝖺𝗅𝗅𝗂𝖺𝗇𝖼𝖾.", threadID, messageID);

                if (targetP.role === "COLEADER" && p.role === "LEADER") {
                    targetP.role = "OFFICIER";
                } else if (targetP.role === "OFFICIER") {
                    targetP.role = "MEMBRE";
                } else {
                    return api.sendMessage("🛑 𝖤𝗋𝗋𝖾𝗎𝗋 : 𝖱é𝗍𝗋𝗈𝗀𝗋𝖺𝖽𝖺𝗍𝗂𝗈𝗇 𝗂𝗆𝗉𝗈𝗌𝗌𝗂𝖻𝗅𝖾.", threadID, messageID);
                }

                Storage.saveUsers(Storage.getUsers());
                Storage.logEvent(p.guildId, "DEMOTE", `📉 ${userName} 𝖺 𝗋é𝗍𝗋𝗈𝗀𝗋𝖺𝖽é [${targetP.name}] au 𝗋𝖺𝗇𝗀 𝖽𝖾 ${targetP.role}.`);
                return api.sendMessage(`📉 **𝖱é𝗍𝗋𝗈𝗀𝗋𝖺𝖽𝖺𝗍𝗂𝗈𝗇 :** **${targetP.name}** 𝗋𝖾𝖽𝖾𝗏𝗂𝖾𝗇𝗍 **${targetP.role}**.`, threadID, messageID);
            }

            case "kick": {
                if (!Utils.checkPermission(p, "OFFICIER")) return api.sendMessage("🛑 𝖤𝗋𝗋𝖾𝗎𝗋 : 𝖠𝗎𝗍𝗈𝗋𝗂𝗌𝖺𝗍𝗂𝗈𝗇 𝗂𝗇𝗌𝗎𝖿𝖿𝗂𝗌𝖺𝗇𝗍𝖾.", threadID, messageID);
                const targetID = Object.keys(event.mentions)[0];
                if (!targetID) return api.sendMessage("🛑 𝖤𝗋𝗋𝖾𝗎𝗋 : 𝖬𝖾𝗇𝗍𝗂𝗈𝗇𝗇𝖾𝗓 𝗅𝖾 𝗌𝗎𝖻𝗈𝗋𝖽𝗈𝗇𝗇é à 𝖻𝖺𝗇𝗇𝗂𝗋.", threadID, messageID);

                let targetP = Storage.getUserProfile(targetID);
                if (targetP.guildId !== p.guildId) return api.sendMessage("🛑 𝖤𝗋𝗋𝖾𝗎𝗋 : 𝖨𝗅 𝗇𝖾 𝖿𝖺𝗂𝗍 𝗉𝖺𝗌 𝗉𝖺𝗋𝗍𝗂𝖾 𝖽𝖾 𝗏𝗈𝗍𝗋𝖾 𝖿𝖺𝖼𝗍𝗂𝗈𝗇.", threadID, messageID);
                
                if (targetP.role === "LEADER" || targetP.role === "COLEADER" && p.role !== "LEADER") {
                    return api.sendMessage("🛑 𝖤𝗋𝗋𝖾𝗎𝗋 : Hiérarchie protégée. Vous ne pouvez pas exclure ce membre.", threadID, messageID);
                }

                const g = guilds[p.guildId];
                g.members = g.members.filter(id => id !== targetID);
                targetP.guildId = null;
                targetP.role = null;

                Storage.saveGuilds(guilds);
                Storage.saveUsers(Storage.getUsers());
                Storage.logEvent(p.guildId, "KICK", `🚨 EXCLUSION : ${userName} 𝖺 𝖻𝖺𝗇𝗇𝗂 [${targetP.name}] 𝖽𝖾 𝗅'𝖺建立𝗅𝗂𝖺𝗇𝖼𝖾.`);

                return api.sendMessage(`🚨 **𝖡𝖺𝗇𝗇𝗂𝗌𝗌𝖾𝗆𝖾𝗇𝗍 :** **${targetP.name}** 𝖺 é𝗍é 𝖾𝗑𝖼𝗅𝗎 𝖽𝖾 𝗅𝖺 𝖿𝖺𝖼𝗍𝗂𝗈𝗇.`, threadID, messageID);
            }

            case "settings": {
                if (!Utils.checkPermission(p, "COLEADER")) return api.sendMessage("🛑 𝖤𝗋𝗋𝖾𝗎𝗋 : 𝖦𝗋𝖺𝖽𝖾 𝖽𝖾 𝖢𝗈-𝖫𝖾𝖺𝖽𝖾𝗋 𝗆𝗂𝗇𝗂𝗆𝗎𝗆 𝗋𝖾𝗊𝗎𝗂𝗌.", threadID, messageID);
                const type = args[1]?.toLowerCase();
                const value = args.slice(2).join(" ");
                const g = guilds[p.guildId];

                if (type === "emoji") {
                    if (!value) return api.sendMessage("🛑 𝖤𝗋𝗋𝖾𝗎𝗋 : 𝖨𝗇𝖽𝗂𝗊𝗎𝖾𝗓 𝗎𝗇 é𝗆𝗈𝗃𝗂 𝗏𝖺𝗅𝗂𝖽𝖾.", threadID, messageID);
                    g.emoji = value;
                    Storage.saveGuilds(guilds);
                    return api.sendMessage(`✅ **𝖤𝗆𝖻𝗅è𝗆𝖾 :** 𝖫'é𝗆𝗈𝗃𝗂 𝖽𝖾 𝗅𝖺 𝗀𝗎𝗂𝗅𝖽𝖾 𝖾𝗌𝗍 𝖽é𝗌𝗈𝗋𝗆𝖺𝗂𝗌 **${value}**.`, threadID, messageID);
                } else if (type === "desc") {
                    if (!value) return api.sendMessage("🛑 𝖤𝗋𝗋𝖾𝗎𝗋 : 𝖨𝗇𝖽𝗂𝗊𝗎𝖾𝗓 𝗅𝖺 𝗇𝗈𝗎𝗏𝖾𝗅𝗅𝖾 𝖽𝗈𝖼𝗍𝗋𝗂𝗇𝖾.", threadID, messageID);
                    g.desc = value;
                    Storage.saveGuilds(guilds);
                    return api.sendMessage(`✅ **𝖣𝗈𝖼𝗍𝗋𝗂𝗇𝖾 :** 𝖫𝖺 𝖽𝖾𝗌𝖼𝗋𝗂𝗉𝗍𝗂𝗈𝗇 𝖺 é𝗍é 𝗆𝗂𝗌𝖾 à 𝗃𝗈𝗎𝗋.`, threadID, messageID);
                } else {
                    let setLines = [
                        `🔧 **𝖢𝗈𝗇𝖿𝗂𝗀𝗎𝗋𝖺𝗍𝗂𝗈𝗇 𝖺𝗏𝖺𝗇𝖼é𝖾 :**`,
                        ` ───────────────────────`,
                        `🔹 ~guild settings emoji <émoji> : Changer l'icône`,
                        `🔹 ~guild settings desc <texte> : Éditer la bio/doctrine`
                    ];
                    return api.sendMessage(Utils.buildPremiumBox("𝖯𝖠𝖱𝖠𝖬È𝖳𝖱𝖤𝖲 𝖣𝖤 𝖥𝖠𝖢𝖳𝖨𝖮𝖭", setLines), threadID, messageID);
                }
            }

            // ════════════════════════════════════════════════════════════════════════════════════
            // ⚔️ INTERACTIONS MILITAIRES (GUILD WAR ACTIVE)
            // ════════════════════════════════════════════════════════════════════════════════════
            case "war": {
                const action = args[1]?.toLowerCase();
                let war = Storage.getWar();

                if (action === "join") {
                    if (!p.guildId) return api.sendMessage("🛑 𝖤𝗋𝗋𝖾𝗎𝗋 : 𝖵𝗈𝗎𝗌 𝖽𝖾𝗏𝖾𝗓 𝖺𝗉𝗉𝖺𝗋𝗍𝖾𝗇𝗂𝗋 à 𝗎𝗇𝖾 𝗀𝗎𝗂𝗅𝖽𝖾.", threadID, messageID);
                    if (war.phase !== "signup") return api.sendMessage("⏳ 𝖤𝗋𝗋𝖾𝗎𝗋 : 𝖠𝗎𝖼𝗎𝗇𝖾 𝗉𝗁𝖺𝗌𝖾 𝖽'𝖾𝗇𝗋ô𝗅𝖾𝗆𝖾𝗇𝗍 𝖺𝖼𝗍𝗂𝗏𝖾 𝗉𝗈𝗎𝗋 𝗅𝖾 𝗆𝗈𝗆𝖾𝗇𝗍.", threadID, messageID);
                    if (!war.participants.includes(p.guildId)) return api.sendMessage("🛑 𝖤𝗋𝗋𝖾𝗎𝗋 : 𝖵𝗈𝗍𝗋𝖾 𝗀𝗎𝗂𝗅𝖽𝖾 𝗇'𝖺 𝗉𝖺𝗌 é𝗍é 𝗌é𝗅𝖾𝖼𝗍𝗂𝗈𝗇𝗇é𝖾 𝗉𝗈𝗎𝗋 𝖼𝖾 𝖼𝗈𝗇𝖿𝗅𝗂𝗍.", threadID, messageID);

                    if (!war.rosters[p.guildId]) war.rosters[p.guildId] = [];
                    if (war.rosters[p.guildId].includes(senderID)) return api.sendMessage("🛑 𝖤𝗋𝗋𝖾𝗎𝗋 : 𝖵𝗈𝗎𝗌 ê𝗍𝖾𝗌 𝖽é𝗃à 𝗂𝗇𝗌𝖼𝗋𝗂𝗍 𝖽𝖺𝗇𝗌 𝗅𝖾 𝗉𝖾𝗅𝗈𝗍𝗈𝗇.", threadID, messageID);

                    war.rosters[p.guildId].push(senderID);
                    Storage.saveWar(war);
                    return api.sendMessage(`🎖️ **𝖤𝗇𝗋ô𝗅𝖾𝗆𝖾𝗇𝗍 :** Vous intégrez le peloton d'exécution de **${guilds[p.guildId].name}** !`, threadID, messageID);
                }

                if (action === "attack") {
                    if (!p.guildId) return api.sendMessage("🛑 𝖤𝗋𝗋𝖾𝗎𝗋 : 𝖥𝖺𝖼𝗍𝗂𝗇 𝗋𝖾𝗊𝗎𝗂𝗌𝖾.", threadID, messageID);
                    if (war.phase !== "battle") return api.sendMessage("⚔️ 𝖤𝗋𝗋𝖾𝗎𝗋 : 𝖫𝖺 𝗀𝗎𝖾𝗋𝗋𝖾 𝗇'𝖾𝗌𝗍 𝗉𝖺𝗌 𝖽é𝖼𝗅𝖺𝗋é𝖾 (𝖧𝗈𝗋𝗌 𝖼𝗈𝗆𝖻𝖺𝗍).", threadID, messageID);
                    
                    if (!war.rosters[p.guildId] || !war.rosters[p.guildId].includes(senderID)) {
                        return api.sendMessage("🛑 𝖤𝗋𝗋𝖾𝗎𝗋 : 𝖵𝗈𝗎𝗌 𝗇𝖾 𝗏𝗈𝗎𝗌 ê𝗍𝖾𝗌 𝗉𝖺𝗌 𝖾𝗇𝗋ô𝗅é 𝗉𝖾𝗇𝖽𝖺𝗇𝗍 𝗅𝖺 𝗉𝗁𝖺𝗌𝖾 𝖽'𝗂𝗇𝗌𝖼𝗋𝗂𝗉𝗍𝗂𝗈𝗇.", threadID, messageID);
                    }

                    const now = Date.now();
                    if (now - p.cooldowns.warAttack < 45 * 1000) {
                        return api.sendMessage(`⏳ **𝖠𝗇𝗍𝗂-𝖲𝗉𝖺𝗆 :** Vos armes refroidissent. Attendez **${Math.ceil((45000 - (now - p.cooldowns.warAttack)) / 1000)}s**.`, threadID, messageID);
                    }

                    // Recherche de la guilde adverse dans le matchmaking
                    let enemyGuildId = null;
                    const index = war.participants.indexOf(p.guildId);
                    if (index % 2 === 0) enemyGuildId = war.participants[index + 1];
                    else enemyGuildId = war.participants[index - 1];

                    if (!enemyGuildId || !guilds[enemyGuildId]) {
                        return api.sendMessage("🛑 L'armée ennemie a déserté ou a été dissoute du champ de bataille.", threadID, messageID);
                    }

                    p.cooldowns.warAttack = now;
                    // Appel du simulateur de combat de la partie 2
                    const result = WarSystem.executeAttack(senderID, userName, 10, p.guildId, enemyGuildId); // niveau par défaut simulé à 10
                    Storage.saveUsers(Storage.getUsers());

                    MissionSystem.advanceMission(p.guildId, "war_participation", 1);

                    return api.sendMessage(result.text, threadID, messageID);
                }

                // Affichage par défaut de l'interface de guerre globale
                let warLines = [
                    `📊 𝖤𝗇𝗀𝖺𝗀𝖾𝗆𝖾𝗇𝗍 : **${war.phase.toUpperCase()}**`,
                    `⏳ 𝖥𝗂𝗇 𝖽𝖾 𝖯𝗁𝖺𝗌𝖾 : _𝖣𝖺𝗇𝗌 ${Math.ceil((war.nextCycle - Date.now()) / 60000)} min_`,
                    ` ───────────────────────`
                ];

                war.participants.forEach((gId) => {
                    const gName = guilds[gId]?.name || "Inconnue";
                    const score = war.scores[gId] || 0;
                    const dmg = war.damage[gId] || 0;
                    const registered = war.rosters[gId]?.length || 0;
                    warLines.push(`🛡️ **${gName}** │ 🏆 **${score} Pts**`);
                    warLines.push(`    💥 Dégâts : ${dmg} │ 👥 Roster : ${registered} guerriers`);
                });

                return api.sendMessage(Utils.buildPremiumBox("𝐆𝐔𝐈𝐋𝐃 𝐖𝐀𝐑 𝐂𝐎𝐍𝐅𝐋𝐈𝐂𝐓", warLines), threadID, messageID);
            }

                // ════════════════════════════════════════════════════════════════════════════════════
            // 🎯 TABLEAU DES QUÊTES COLLECTIVES & SUCCÈS
            // ════════════════════════════════════════════════════════════════════════════════════
            case "missions": {
                if (!p.guildId) return api.sendMessage("🛑 𝖤𝗋𝗋𝖾𝗎𝗋 : 𝖵𝗈𝗎𝗌 𝖽𝖾𝗏𝖾𝗓 𝖺𝗉𝗉𝖺𝗋𝗍𝖾𝗇𝗂𝗋 à 𝗎𝗇𝖾 𝖿𝖺𝖼𝗍𝗂𝗈𝗇 𝗉𝗈𝗎𝗋 𝗏𝗈𝗂𝗋 𝗅𝖾𝗌 𝗆𝗂𝗌𝗌𝗂𝗈𝗇𝗌.", threadID, messageID);
                const g = guilds[p.guildId];
                
                // Initialisation sécurisée des objectifs si non existants
                MissionSystem.ensureMissionsInit(g);

                let mLines = [
                    `🏰 𝖠𝗅𝗅𝗂𝖺𝗇𝖼𝖾 : **${g.name}**`,
                    `📊 _𝖢𝗈𝗇𝗍𝗋𝗂𝖻𝗎𝖾𝗓 𝖾𝗇𝗌𝖾𝗆𝖻𝗅𝖾 𝗉𝗈𝗎𝗋 𝗏𝖺𝗅𝗂𝖽𝖾𝗋 𝗅𝖾𝗌 𝗉𝖺𝗅𝗂𝖾𝗋𝗌._`,
                    ` ───────────────────────`
                ];

                for (const k in g.missions) {
                    const m = g.missions[k];
                    const percent = Math.min(100, Math.floor((m.progress / m.target) * 100));
                    const barSize = 8;
                    const blocks = Math.round((percent / 100) * barSize);
                    const progressBar = "🔷".repeat(blocks) + "🔹".repeat(barSize - blocks);

                    mLines.push(`🎯 **${m.name}**`);
                    mLines.push(`   𝖯𝗋𝗈𝗀𝗋è𝗌 : [${progressBar}] ${percent}% (${Utils.formatMoney(m.progress)}/${Utils.formatMoney(m.target)})`);
                    mLines.push(`   𝖲𝗍𝖺𝗍𝗎𝗍  : ${m.done ? "✅ 𝖢𝖮𝖬𝖯𝖫È𝖳𝖤" : "⏳ 𝖤𝖭 𝖢𝖮𝖴𝖱𝖲"}`);
                    mLines.push(`   𝖦𝖺𝗂𝗇𝗌   : +${Utils.formatMoney(m.reward)} 💰 au Coffre`);
                    mLines.push(` ───────────────────────`);
                }
                if (mLines.length > 3) mLines.pop();

                return api.sendMessage(Utils.buildPremiumBox("𝐐𝐔Ê𝐓𝐄𝐒 𝐃'𝐀𝐋𝐋𝐈𝐀𝐍𝐂𝐄", mLines), threadID, messageID);
            }

            case "achievements": {
                if (!p.guildId) return api.sendMessage("🛑 𝖤𝗋𝗋𝖾𝗎𝗋 : 𝖥𝖺𝖼𝗍𝗂𝗇 𝗋𝖾𝗊𝗎𝗂𝗌𝖾 𝗉𝗈𝗎𝗋 𝖺𝖼𝖼é𝖽𝖾𝗋 𝖺𝗎 𝖯𝖺𝗇𝗍𝗁é𝗈𝗇.", threadID, messageID);
                const g = guilds[p.guildId];
                
                // Force la vérification des nouveaux succès débloqués avant affichage
                MissionSystem.checkAchievements(p.guildId);

                // Récupération de l'interface graphique du Panthéon
                const renderBox = MissionSystem.getAchievementsRender(g);
                return api.sendMessage(renderBox, threadID, messageID);
            }

            // ════════════════════════════════════════════════════════════════════════════════════
            // 📡 COMMUNICATIONS INTERNES & STRATÉGIE CRYPTÉE
            // ════════════════════════════════════════════════════════════════════════════════════
            case "chat": {
                if (!p.guildId) return api.sendMessage("🛑 𝖤𝗋𝗋𝖾𝗎𝗋 : 𝖵𝗈𝗎𝗌 𝖽𝖾𝗏𝖾𝗓 𝖺𝗉𝗉𝖺𝗋𝗍𝖾𝗇𝗂𝗋 à 𝗎𝗇𝖾 𝗀𝗎𝗂𝗅𝖽𝖾 𝗉𝗈𝗎𝗋 𝗎𝗍𝗂𝗅𝗂𝗌𝖾𝗋 𝖼𝖾 𝖼𝖺𝗇𝖺𝗅.", threadID, messageID);
                const msg = args.slice(1).join(" ");
                if (!msg) return api.sendMessage("🛑 𝖤𝗋𝗋𝖾𝗎𝗋 : Syntaxe correcte : ~guild chat <votre message stratégique>", threadID, messageID);

                // Chiffrement symbolique et enregistrement dans le grand livre de l'alliance
                const formattedMsg = `💬 [${p.role}] ${userName} : "${msg}"`;
                Storage.logEvent(p.guildId, "CHAT", formattedMsg);

                // Notification aux officiers ou confirmation d'envoi à l'utilisateur
                let lines = [
                    `📡 **𝖢𝖺𝗇𝖺𝗅 𝖢𝗋𝗒𝗉𝗍é 𝖠𝖼𝗍𝗂𝖿**`,
                    ` ───────────────────────`,
                    `👤 𝖤𝗆é𝗍𝗍𝖾𝗎𝗋 : _${userName}_`,
                    `💬 𝖬𝖾𝗌𝗌𝖺𝗀𝖾 : *${msg}*`,
                    ` ───────────────────────`,
                    `✨ _𝖢𝖾𝗍 𝗈𝗋𝖽𝗋𝖾 𝖺 é𝗍é 𝖺𝖼𝗁𝖾𝗆𝗂𝗇é 𝖽𝖺𝗇𝗌 𝗅𝖾 𝖩𝗈𝗎𝗋𝗇𝖺𝗅 𝖽𝖾 𝖥𝖺𝖼𝗍𝗂𝗈𝗇 (~guild logs)._`
                ];
                return api.sendMessage(Utils.buildPremiumBox("📡 𝐑𝐄𝐋𝐀𝐈 𝐓𝐀𝐂𝐓𝐈𝐐𝐔𝐄", lines), threadID, messageID);
            }

            case "logs": {
                if (!p.guildId) return api.sendMessage("🛑 𝖤𝗋𝗋𝖾𝗎𝗋 : 𝖠𝖼𝖼è𝗌 𝗋𝖾𝖿𝗎𝗌é 𝗌𝖺𝗇𝗌 𝖺𝗅𝗅𝗂𝖺𝗇𝖼𝖾.", threadID, messageID);
                const g = guilds[p.guildId];
                
                // Récupération des 8 dernières entrées (Audits, dons, combats, chat)
                let logLines = (g.logs || [])
                    .slice(0, 8)
                    .map(l => `• [${new Date(l.timestamp).toLocaleTimeString()}] **${l.type}** : ${l.message}`);

                if (logLines.length === 0) {
                    logLines.push("📂 _𝖠𝗎𝖼𝗎𝗇𝖾 𝖺𝖼𝗍𝗂𝗏𝗂𝗍é 𝗋é𝖼𝖾𝗇𝗍𝖾 𝖽𝖺𝗇𝗌 𝗅𝖾 𝗀𝗋𝖺𝗇𝖽 𝗅𝗂𝗏𝗋𝖾._");
                }

                return api.sendMessage(Utils.buildPremiumBox("𝐆𝐑𝐀𝐍𝐃 𝐋𝐈𝐕𝐑𝐄 𝐃𝐄𝐒 𝐂𝐎𝐌𝐏𝐓𝐄𝐒", logLines), threadID, messageID);
            }

            // ════════════════════════════════════════════════════════════════════════════════════
            // 🏆 PANTHÉON MONDIAL (TOP GUILDES MULTI-CRITÈRES)
            // ════════════════════════════════════════════════════════════════════════════════════
            case "top": {
                // Classement dynamique basé sur le Niveau d'infrastructure, puis le nombre de trophées PvP
                let sortedGuilds = Object.values(guilds)
                    .sort((a, b) => b.level - a.level || b.trophies - a.trophies)
                    .slice(0, 5);

                let topLines = [
                    `👑 _𝖫𝖾𝗌 𝟧 𝗉𝗅𝗎𝗌 𝗀𝗋𝖺𝗇𝖽𝗌 𝖤𝗆𝗉𝗂𝗋𝖾𝗌 𝖽𝗎 𝗌𝖾𝗋𝗏𝖾𝗎𝗋._`,
                    ` ───────────────────────`
                ];

                const medals = ["🥇", "🥈", "🥉", "🎖️", "🎖️"];
                sortedGuilds.forEach((g, i) => {
                    topLines.push(`${medals[i]} **${g.name.toUpperCase()}** [\`${g.id}\`]`);
                    topLines.push(`   Palier : **𝖭𝗂𝗏𝖾𝖺𝗎 ${g.level}** │ 🏆 Trophées : ${g.trophies}`);
                    topLines.push(`   Garnison : ${g.members.length} / ${Utils.getMaxMembers(g.level)} │ Bourse : ${Utils.formatMoney(g.bank)}`);
                    topLines.push(` ───────────────────────`);
                });
                if (topLines.length > 2) topLines.pop();
                else topLines.push("⚠️ _𝖠𝗎𝖼𝗎𝗇𝖾 𝖿𝖺𝖼𝗍𝗂𝗈𝗇 𝖽'é𝗅𝗂𝗍𝖾 𝗇'𝖾𝗌𝗍 𝖾𝗇𝗋𝖾𝗀𝗂𝗌𝗍𝗋é𝖾._");

                return api.sendMessage(Utils.buildPremiumBox("𝐏𝐀𝐍𝐓𝐇É𝐎𝐍 𝐃𝐄𝐒 𝐅𝐀𝐂𝐓𝐈𝐎𝐍𝐒", topLines), threadID, messageID);
            }

            // ════════════════════════════════════════════════════════════════════════════════════
            // 💥 FERMETURE ET ROUTAGE SECURISE
            // ════════════════════════════════════════════════════════════════════════════════════
            case "disband": {
                if (!p.guildId) return api.sendMessage("🛑 𝖤𝗋𝗋𝖾𝗎𝗋 : 𝖠𝗎𝖼𝗎𝗇𝖾 𝖺𝗅𝗅𝗂𝖺𝗇𝖼𝖾 active.", threadID, messageID);
                const g = guilds[p.guildId];
                if (g.leader !== senderID) return api.sendMessage("🛑 𝖤𝗋𝗋𝖾𝗎𝗋 : Seul le Leader Suprême peut dissoudre l'Empire.", threadID, messageID);

                const oldId = p.guildId;
                g.members.forEach(mId => {
                    let users = Storage.getUsers();
                    if (users[mId]) {
                        users[mId].guildId = null;
                        users[mId].role = null;
                    }
                });

                delete guilds[oldId];
                Storage.saveGuilds(guilds);
                Storage.saveUsers(Storage.getUsers());

                return api.sendMessage("💥 **𝐀𝐓𝐎𝐌𝐈𝐒𝐀𝐓𝐈𝐎𝐍 :** Le bastion et l'intégralité de ses archives ont été rayés de la carte globale.", threadID, messageID);
            }

            default:
                return api.sendMessage("🛑 𝖤𝗋𝗋𝖾𝗎𝗋 : 𝖲𝗈𝗎𝗌-𝖼𝗈𝗆𝗆𝖺𝗇𝖽𝖾 𝗂𝗇𝗏𝖺𝗅𝗂𝖽𝖾. Tapez `~guild` pour l'interface.", threadID, messageID);
        }
    }
};
