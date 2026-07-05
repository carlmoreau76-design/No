/**
 * 🏴‍☠️ COMMANDE PRINCIPALE : SYSTÈME MMORPG PIRATE PREMIUM (GoatBot)
 * Version : 1.0.0
 * Architecture : Persistance isolée & Moteur Graphique Canvas intégré
 */

const path = require("path");
const fs = require("fs");

// Importation sécurisée du module de stockage persistant
const storage = require("./MMORPG_System/piratesMMO/pirate.storage.js");

// Détection et initialisation de l'environnement graphique Node-Canvas
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
        name: "pirate",
        version: "1.0.0",
        author: "Gemini Collaborator",
        countDown: 3,
        role: 0, // Accessible à tous les mousses
        shortDescription: "Système complet de piraterie RPG Premium",
        longDescription: "Fondez votre équipage, améliorez votre navire, pillez des îles légendaires et devenez le roi des pirates.",
        category: "economy",
        guide: {
            fr: "{p}{n} [sous-commande]"
        }
    },

    onStart: async function ({ api, event, args, usersData }) {
        const { threadID, messageID, senderID } = event;
        const now = Date.now();

        // --- ASSISTANT ÉCONOMIQUE : FORMATAGE DES NOMBRES COMPACTS ---
        function formatNumber(value) {
            if (value === null || value === undefined || isNaN(value)) return "0";
            const num = parseFloat(value);
            if (num >= 1.0e12) return (num / 1.0e12).toFixed(1).replace(/\.0$/, "") + "T";
            if (num >= 1.0e9) return (num / 1.0e9).toFixed(1).replace(/\.0$/, "") + "B";
            if (num >= 1.0e6) return (num / 1.0e6).toFixed(1).replace(/\.0$/, "") + "M";
            if (num >= 1.0e3) return (num / 1.0e3).toFixed(1).replace(/\.0$/, "") + "K";
            return num.toLocaleString("fr-FR");
        }

        // Récupération sécurisée du nom Facebook via l'API GoatBot
        let senderName = "Pirate Inconnu";
        try {
            senderName = await usersData.getName(senderID) || "Pirate Inconnu";
        } catch (err) {
            senderName = "Pirate Inconnu";
        }

        // Chargement du profil joueur persistant et des tables de données
        const profile = storage.getUserProfile(senderID, senderName);
        const pirates = storage.getPirates();
        const crews = storage.getCrews();
        const islands = storage.getIslands();

        const subCommand = args[0] ? args[0].toLowerCase() : null;

        // ==========================================
        // 📜 MENU PRINCIPAL TEXTE ULTRA PREMIUM
        // ==========================================
        if (!subCommand) {
            let menu = `╭───────────────────────────────────────╮\n`;
            menu += `│ 🏴‍☠️ 𝐒𝐘𝐒𝐓È𝐌𝐄 𝐏𝐈𝐑𝐀𝐓𝐄 𝐌𝐌𝐎\n`;
            menu += `├───────────────────────────────────────┤\n`;
            menu += `│ 🔱 𝐀𝐂𝐓𝐈𝐎𝐍𝐒 𝐃𝐄 𝐁𝐀𝐒𝐄\n`;
            menu += `│ 🔹 𝖯𝗂𝗋𝖺𝗍𝖾 𝖼𝗋𝖾𝖺𝗍𝖾 <𝗇𝗈𝗆> : 𝖢𝗋é𝖾𝗋 𝗎𝗇 𝗉𝗂𝗋𝖺𝗍𝖾\n`;
            menu += `│ 🔹 𝖯𝗂𝗋𝖺𝗍𝖾 𝗉𝗋𝗈𝖿𝗂𝗅𝖾 / 𝗂𝗇𝖿𝗈 : 𝖥𝗂𝖼𝗁𝖾 𝗍𝖾𝗑𝗍𝖾\n`;
            menu += `│ 🔹 𝖯𝗂𝗋𝖺𝗍𝖾 𝗌𝗍𝖺𝗍𝗌 : 𝖣𝖺𝗌𝗁𝖻𝗈𝖺𝗋𝖽 𝖢𝖺𝗇𝗏𝖺𝗌 𝖯𝗋𝖾𝗆𝗂𝗎𝗆\n`;
            menu += `│ 🔹 𝖯𝗂𝗋𝖺𝗍𝖾 𝗋𝖾𝗇𝖺𝗆𝖾 <𝗇𝗈𝗆> : 𝖢𝗁𝖺𝗇𝗀𝖾𝗋 𝖽𝖾 𝗇𝗈𝗆\n`;
            menu += `│ 🔹 𝖯𝗂𝗋𝖺𝗍𝖾 𝖽𝖺𝗂𝗅𝗒 : 𝖡𝗎𝗍𝗂𝗇 𝗊𝗎𝗈𝗍𝗂𝖽𝗂𝖾𝗇\n`;
            menu += `│ 🔹 𝖯𝗂𝗋𝖺𝗍𝖾 𝗂𝗇𝗏𝖾𝗇𝗍𝗈𝗋𝗒 : 𝖵𝗈𝗂𝗋 𝗏𝗈𝗌 𝗍𝗋é𝗌𝗈𝗋𝗌\n`;
            menu += `│ 🔹 𝖯𝗂𝗋𝖺𝗍𝖾 𝗌𝗁𝗂𝗉 : 𝖤𝗍𝖺𝗍 𝖽𝗎 𝗇𝖺𝗏𝗂𝗋𝖾\n`;
            menu += `│ 🔹 𝖯𝗂𝗋𝖺𝗍𝖾 𝗎𝗉𝗀𝗋𝖺𝖽𝖾𝗌 : 𝖠𝗆é𝗅𝗂𝗈𝗋𝖾𝗋 𝗅𝖾 𝖻â𝗍𝗂𝗆𝖾𝗇𝗍\n`;
            menu += `│ 🔹 𝖯𝗂𝗋𝖺𝗍𝖾 𝗋𝖺𝗇𝗄 / 𝗍𝗈𝗉 : 𝖢𝗅𝖺𝗌𝗌𝖾𝗆𝖾𝗇𝗍 𝖽𝖾𝗌 𝗉𝗋𝗂𝗆𝖾𝗌\n`;
            menu += `├───────────────────────────────────────┤\n`;
            menu += `│ ⚓ 𝐏𝐑𝐎𝐆𝐑𝐄𝐒𝐒𝐈𝐎𝐍 & É𝐂𝐎\n`;
            menu += `│ 🔹 𝖯𝗂𝗋𝖺𝗍𝖾 𝗐𝗈𝗋𝗄 / 𝗁𝗎𝗇𝗍 : 𝖦𝖺𝗀𝗇𝖾𝗋 𝖽𝖾𝗌 𝖽𝗈𝗎𝖻𝗅𝗈𝗇𝗌\n`;
            menu += `│ 🔹 𝖯𝗂𝗋𝖺𝗍𝖾 𝖿𝗂𝗌𝗁 / 𝗅𝗈𝗈𝗍 : 𝖯ê𝖼𝗁𝖾𝗋 & 𝖿𝗈𝗎𝗂𝗅𝗅𝖾𝗋\n`;
            menu += `│ 🔹 𝖯𝗂𝗋𝖺𝗍𝖾 𝗌𝖾𝗅𝗅 <𝗂𝗍𝖾𝗆/𝖺𝗅𝗅> : 𝖵𝖾𝗇𝖽𝗋𝖾 𝖺𝗎 𝗋𝖾𝗉𝖺𝗂𝗋𝖾\n`;
            menu += `│ 🔹 𝖯𝗂𝗋𝖺𝗍𝖾 𝖻𝗎𝗒 <𝗂𝗍𝖾𝗆> : 𝖠𝖼𝗁𝖾𝗍𝖾𝗋 𝖽𝗎 𝗆𝖺𝗍é𝗋𝗂𝖾𝗅\n`;
            menu += `│ 🔹 𝖯𝗂𝗋𝖺𝗍𝖾 𝗋𝖾𝗉𝖺𝗂𝗋 / 𝗁𝖾𝖺𝗅 : 𝖱𝖾𝗌𝗍𝖺𝗎𝗋𝖾𝗋 𝗏𝗈𝗌 𝖧𝖯\n`;
            menu += `├───────────────────────────────────────┤\n`;
            menu += `│ 🧭 𝐄𝐗𝐏𝐋𝐎𝐑𝐀𝐓𝐈𝐎𝐍 & 𝐂𝐎𝐌𝐁𝐀𝐓\n`;
            menu += `│ 🔹 𝖯𝗂𝗋𝖺𝗍𝖾 𝗌𝖺𝗂𝗅 / 𝖾𝗑𝗉𝗅𝗈𝗋𝖾 : 𝖵𝗈𝗒𝖺𝗀𝖾𝗋 𝖾𝗇 𝗆𝖾𝗋\n`;
            menu += `│ 🔹 𝖯𝗂𝗋𝖺𝗍𝖾 𝗂𝗌𝗅𝖺𝗇𝖽𝗌 : 𝖫𝗂𝗌𝗍𝖾 𝖽𝖾𝗌 𝗂𝗅𝖾𝗌 𝖽𝗎 𝗆𝗈𝗇𝖽𝖾\n`;
            menu += `│ 🔹 𝖯𝗂𝗋𝖺𝗍𝖾 𝖺𝗍𝗍𝖺𝖼𝗄 / 𝖻𝖺𝗍𝗍𝗅𝖾 : 𝖢𝗈𝗆𝖻𝖺𝗍𝗌 𝗇𝖺𝗏𝖺𝗎𝗑\n`;
            menu += `│ 🔹 𝖯𝗂𝗋𝖺𝗍𝖾 𝖽𝗎𝖾𝗅 @𝗎𝗌𝖾𝗋 : 𝖣é𝖿𝗂𝖾𝗋 𝗎𝗇 𝖺𝗎𝗍𝗋𝖾 𝗉𝗂𝗋𝖺𝗍𝖾\n`;
            menu += `│ 🔹 𝖯𝗂𝗋𝖺𝗍𝖾 𝗋𝖺𝗂𝖽 / 𝖻𝗈𝗌𝗌 : 𝖠𝖿𝖿𝗋𝗈𝗇𝗍𝖾𝗋 𝗅𝖾 𝖪𝗋𝖺𝗄𝖾𝗇\n`;
            menu += `├───────────────────────────────────────┤\n`;
            menu += `│ ☠️ É𝐐𝐔𝐈𝐏𝐀𝐆𝐄𝐒 (𝐂𝐑𝐄𝐖𝐒)\n`;
            menu += `│ 🔹 𝖯𝗂𝗋𝖺𝗍𝖾 𝖼𝗋𝖾𝗐 ... (𝖳𝖺𝗉𝖾𝗓 '𝗉𝗂𝗋𝖺𝗍𝖾 𝖼𝗋𝖾𝗐' 𝗉𝗈𝗎𝗋 𝗅𝖾 𝗆𝖾𝗇𝗎)\n`;
            menu += `╰───────────────────────────────────────╯`;
            return api.sendMessage(menu, threadID, messageID);
        }

        // ==========================================
        // SUB-COMMAND : CREATE
        // ==========================================
        if (subCommand === "create") {
            const desiredName = args.slice(1).join(" ");
            if (!desiredName || desiredName.length < 3 || desiredName.length > 20) {
                return api.sendMessage("❌ 𝖫𝖾 𝗇𝗈𝗆 𝖽𝖾 𝗏𝗈𝗍𝗋𝖾 𝗉𝗂𝗋𝖺𝗍𝖾 𝖽𝗈𝗂𝗍 𝖼𝗈𝗆𝗉𝗋𝖾𝗇𝖽𝗋𝖾 𝖾𝗇𝗍𝗋𝖾 3 𝖾𝗍 20 𝖼𝖺𝗋𝖺𝖼𝗍è𝗋𝖾𝗌.", threadID, messageID);
            }
            const nameExists = Object.values(pirates).some(p => p.name.toLowerCase() === desiredName.toLowerCase());
            if (nameExists) return api.sendMessage("❌ 𝖢𝖾 𝗇𝗈𝗆 𝖽𝖾 𝗉𝗂𝗋𝖺𝗍𝖾 𝖾𝗌𝗍 𝖽é𝗃à 𝗅é𝗀𝖾𝗇𝖽𝖺𝗂𝗋𝖾 𝖼𝗁𝖾𝗓 𝗎𝗇 𝖺𝗎𝗍𝗋𝖾 𝖼𝗈𝗋𝗌𝖺𝗂𝗋𝖾.", threadID, messageID);

            profile.name = desiredName;
            profile.title = "Mousse Novice";
            storage.saveUserProfile(senderID, profile);

            return api.sendMessage(`✨ 𝖵𝗈𝗍𝗋𝖾 𝖺𝗏𝖾𝗇𝗍𝗎𝗋𝖾 𝖼𝗈𝗆𝗆𝖾𝗇𝖼𝖾 ! Vous êtes désormais connu sous le nom de **${desiredName}**.`, threadID, messageID);
        }

        // ==========================================
        // SUB-COMMAND : PROFILE / INFO
        // ==========================================
        if (subCommand === "profile" || subCommand === "info") {
            const targetCrew = profile.crewId ? crews[profile.crewId] : null;
            let pMsg = `╭───────────────────────────────────────╮\n`;
            pMsg += `│ 👤 𝐏𝐑𝐎𝐅𝐈𝐋 𝐃𝐔 𝐂𝐎𝐑𝐒𝐀𝐈𝐑𝐄\n`;
            pMsg += `├───────────────────────────────────────┤\n`;
            pMsg += `│ 🔹 𝖭𝗈𝗆 : **${profile.name}**\n`;
            pMsg += `│ 🔹 𝖳𝗂𝗍𝗋𝖾 : _${profile.title}_\n`;
            pMsg += `│ 🔹 𝖭𝗂𝗏𝖾𝖺𝗎 : ${profile.level} (𝖷𝖯: ${formatNumber(profile.xp)})\n`;
            pMsg += `│ 🔹 𝖵𝗂𝗍𝖺𝗅𝗂𝗍é : ${profile.hp} / ${profile.maxHp} ❤️\n`;
            pMsg += `│ 🔹 𝖤𝗇𝖾𝗋𝗀𝗂𝖾 : ${profile.energy} / ${profile.maxEnergy} ⚡\n`;
            pMsg += `│ 🔹 𝖣𝗈𝗎𝖻𝗅𝗈𝗇𝗌 : ${formatNumber(profile.gold)} 💰\n`;
            pMsg += `│ 🔹 𝖯𝗋𝗂𝗆𝖾 : ${formatNumber(profile.bounty)} ☠️\n`;
            pMsg += `│ 🔹 𝖤𝗊𝗎𝗂𝗉𝖺𝗀𝖾 : ${targetCrew ? targetCrew.name : "Aucun"}\n`;
            pMsg += `╰───────────────────────────────────────╯`;
            return api.sendMessage(pMsg, threadID, messageID);
        }

        // ==========================================
        // SUB-COMMAND : RENAME
        // ==========================================
        if (subCommand === "rename") {
            const renameArg = args.slice(1).join(" ");
            if (!renameArg || renameArg.length < 3 || renameArg.length > 20) {
                return api.sendMessage("❌ 𝖭𝗈𝗆 𝗂𝗇𝗏𝖺𝗅𝗂𝖽𝖾 (𝖬𝖺𝗑 20 𝖼𝗁𝖺𝗋𝗌).", threadID, messageID);
            }
            if (profile.gold < 5000) return api.sendMessage("❌ 𝖢𝗁𝖺𝗇𝗀𝖾𝗋 𝖽'𝗂𝖽𝖾𝗇𝗍𝗂𝗍é 𝖼𝗈û𝗍𝖾 **5,000** doublons.", threadID, messageID);

            profile.gold -= 5000;
            profile.name = renameArg;
            storage.saveUserProfile(senderID, profile);

            return api.sendMessage(`🎭 **${renameArg}**, votre faux passeport a été validé au port !`, threadID, messageID);
        }

        // ==========================================
        // SUB-COMMAND : INVENTORY
        // ==========================================
        if (subCommand === "inventory") {
            if (!profile.inventory || profile.inventory.length === 0) {
                return api.sendMessage("🎒 𝖵𝗈𝗍𝗋𝖾 𝗌𝖺𝖼 𝖽𝖾 𝗆𝖾𝗅𝖾𝗌𝗍𝖾 𝖾𝗌𝗍 𝗏𝗂𝖽𝖾.", threadID, messageID);
            }
            let invMsg = `╭───────────────────────────────────────╮\n`;
            invMsg += `│ 🎒 𝐈𝐍𝐕𝐄𝐍𝐓𝐀𝐈𝐑𝐄 𝐃𝐔 𝐏𝐈𝐑𝐀𝐓𝐄\n`;
            invMsg += `├───────────────────────────────────────┤\n`;
            
            // Regroupement par item pour affichage propre
            const counts = {};
            profile.inventory.forEach(i => counts[i.name] = (counts[i.name] || 0) + 1);
            
            Object.keys(counts).forEach(name => {
                invMsg += `│ 📦 **${name}** x${counts[name]}\n`;
            });
            invMsg += `╰───────────────────────────────────────╯`;
            return api.sendMessage(invMsg, threadID, messageID);
        }

        // ==========================================
        // SUB-COMMAND : SHIP
        // ==========================================
        if (subCommand === "ship") {
            const s = profile.ship;
            let sMsg = `╭───────────────────────────────────────╮\n`;
            sMsg += `│ 🚢 𝐅𝐈𝐂𝐇𝐄 𝐃𝐔 𝐍𝐀𝐕𝐈𝐑𝐄\n`;
            sMsg += `├───────────────────────────────────────┤\n`;
            sMsg += `│ 🔹 𝖭𝗈𝗆 : **${s.name}**\n`;
            sMsg += `│ 🔹 𝖢𝗅𝖺𝗌𝗌𝖾 : ${s.class} [${s.rarity}]\n`;
            sMsg += `│ 🔹 𝖭𝗂𝗏𝖾𝖺𝗎 : ${s.level}\n`;
            sMsg += `│ 🔹 𝖢𝗈𝗊𝗎𝖾 (𝖧𝖯) : ${s.hp} / ${s.maxHp} 🛡️\n`;
            sMsg += `│ 🔹 𝖢𝖺𝗇𝗈𝗇𝗌 (𝖠𝗍𝗍𝖺𝗊𝗎𝖾) : ${s.attack} [𝖰𝗍é: ${s.cannons}]\n`;
            sMsg += `│ 🔹 𝖵𝗈𝗂𝗅𝗎𝗋𝖾 (𝖵𝗂𝗍𝖾𝗌𝗌𝖾) : ${s.speed} 🍃\n`;
            sMsg += `│ 🔹 𝖤𝗍𝖺𝗍 : ${s.durability}% 🔧\n`;
            sMsg += `╰───────────────────────────────────────╯`;
            return api.sendMessage(sMsg, threadID, messageID);
        }

        // ==========================================
        // SUB-COMMAND : RANK / TOP
        // ==========================================
        if (subCommand === "rank" || subCommand === "top") {
            const sortedPirates = Object.values(pirates).sort((a, b) => b.bounty - a.bounty).slice(0, 5);
            let topMsg = `🏆 𝐓𝐎𝐏 𝟓 𝐃𝐄𝐒 𝐏𝐈𝐑𝐀𝐓𝐄𝐒 𝐋É𝐆𝐄𝐍𝐃𝐀𝐈𝐑𝐄𝐒\n\n`;
            sortedPirates.forEach((p, idx) => {
                topMsg += `${idx + 1}. **${p.name}** - 𝖫𝗏𝗅 ${p.level} | ☠️ Prime : **${formatNumber(p.bounty)}** doublons\n`;
            });
            return api.sendMessage(topMsg, threadID, messageID);
        }

        // --- LOGIQUE DE CHEMIN ADAPTÉE À TA STRUCTURE DE SOUS-DOSSIERS ---
        // Vu que pirate.js et le sous-dossier piratesMMO/ sont tous les deux dans MMORPG_System :
        // const storage = require("./piratesMMO/pirate.storage.js");

        // ==========================================
        // ECO & PROGRESSION : WORK / HUNT / FISH / LOOT
        // ==========================================
        
        if (subCommand === "work") {
            if (now - profile.cooldowns.work < 5 * 60 * 1000) {
                const rem = Math.ceil((5 * 60 * 1000 - (now - profile.cooldowns.work)) / 1000);
                return api.sendMessage(`⏳ 𝖵𝗈𝗌 𝗆𝖺𝗋𝗂𝗇𝗌 𝗌𝗈𝗇𝗍 𝖿𝖺𝗍𝗂𝗀𝗎é𝗌. 𝖱𝖾𝗉𝗋𝗂𝗌𝖾 𝖽𝗎 𝗀𝗎𝖾𝗎𝗅𝖺𝗋𝖽 𝖽𝖺𝗇𝗌 ${rem}𝗌.`, threadID, messageID);
            }
            
            const gain = Math.floor(200 + Math.random() * 300) * profile.level;
            profile.gold += gain;
            profile.xp += 30;
            profile.cooldowns.work = now;
            
            storage.saveUserProfile(senderID, profile);
            return api.sendMessage(`⚓ **${profile.name}** 𝖺 𝖺𝗂𝖽é à 𝖼𝗁𝖺𝗋𝗀𝖾𝗋 𝗎𝗇 𝗀𝖺𝗅𝗂𝗈𝗇 𝗆𝖺𝗋𝖼𝗁𝖺𝗇𝖽. 𝖦𝖺𝗂𝗇 : +**${formatNumber(gain)}** 💰 & +30 ⭐ 𝖷𝖯.`, threadID, messageID);
        }

        if (subCommand === "hunt") {
            if (now - profile.cooldowns.hunt < 10 * 60 * 1000) {
                const rem = Math.ceil((10 * 60 * 1000 - (now - profile.cooldowns.hunt)) / 1000);
                return api.sendMessage(`⏳ 𝖯𝖺𝗌 𝖽𝖾 𝗉𝗋𝗂𝗆𝖾𝗌 𝖽𝗂𝗌𝗉𝗈𝗇𝗂𝖻𝗅𝖾𝗌. 𝖱𝖾𝗏𝖾𝗇𝖾𝗓 𝖽𝖺𝗇𝗌 ${rem}𝗌.`, threadID, messageID);
            }
            
            const targetBounty = Math.floor(500 + Math.random() * 800) * profile.level;
            profile.gold += targetBounty;
            profile.bounty += Math.floor(targetBounty / 2);
            profile.cooldowns.hunt = now;
            
            storage.saveUserProfile(senderID, profile);
            return api.sendMessage(`⚔️ 𝖢𝗁𝖺𝗌𝗌𝖾 𝖺𝗎𝗑 𝖼𝗈𝗋𝗌𝖺𝗂𝗋𝖾𝗌 𝗋é𝗎𝗌𝗌𝗂𝖾 ! +**${formatNumber(targetBounty)}** 💰 et votre prime grimpe de +**${formatNumber(Math.floor(targetBounty/2))}** ☠️.`, threadID, messageID);
        }

        if (subCommand === "fish") {
            if (now - profile.cooldowns.fish < 3 * 60 * 1000) {
                return api.sendMessage("⏳ 𝖫𝖺 𝗆𝖾𝗋 𝖾𝗌𝑡 𝖼𝖺𝗅𝗆𝖾, 𝗅𝖺𝗂𝗌𝗌𝖾𝗓 𝗅𝖾𝗌 𝗉𝗈𝗂𝗌𝗌𝗈𝗇𝗌 𝗆𝗈𝗋𝖽𝗋𝖾 un peu plus tard.", threadID, messageID);
            }
            
            const fishTypes = ["Carpe de Mer", "Thon Rouge", "Requin Marteau", "Espadon Doré"];
            const caught = fishTypes[Math.floor(Math.random() * fishTypes.length)];
            profile.inventory.push({ name: caught, type: "fish", value: profile.level * 150 });
            profile.cooldowns.fish = now;
            
            storage.saveUserProfile(senderID, profile);
            return api.sendMessage(`🎣 **${profile.name}** 𝖺 𝗋𝖾𝗆𝗈𝗇𝗍é 𝗎𝗇 [**${caught}**] ! 𝖵𝖾𝗇𝖽𝖾𝗓-𝗅𝖾 𝖺𝗎 𝗋𝖾𝗉𝖺𝗂𝗋𝖾 pour faire de la place.`, threadID, messageID);
        }

        if (subCommand === "loot") {
            const lootItems = ["Vieux Compas", "Coffre en Bois", "Rhum Premium", "Carte au Trésor Déchirée"];
            const looted = lootItems[Math.floor(Math.random() * lootItems.length)];
            profile.inventory.push({ name: looted, type: "loot", value: profile.level * 250 });
            
            storage.saveUserProfile(senderID, profile);
            return api.sendMessage(`🎒 𝖥𝗈𝗎𝗂𝗅𝗅𝖾𝗌 𝖽𝖾𝗌 é𝗉𝖺𝗏𝖾𝗌 : 𝖵𝗈𝗎𝗌 𝗋𝖺𝗆𝖺𝗌𝗌𝖾𝗓 [**${looted}**].`, threadID, messageID);
        }

        // ==========================================
        // COMMERCE : SELL / BUY / REPAIR / HEAL
        // ==========================================
        
        if (subCommand === "sell") {
            if (!profile.inventory || profile.inventory.length === 0) return api.sendMessage("❌ 𝖵𝗈𝗍𝗋𝖾 𝗂𝗇𝗏𝖾𝗇𝗍𝖺𝗂𝗋𝖾 𝖾𝗌𝗍 𝗏𝗂𝖽𝖾.", threadID, messageID);
            
            let totalGain = 0;
            profile.inventory.forEach(item => {
                totalGain += item.value || 100;
            });
            
            profile.gold += totalGain;
            profile.inventory = [];
            storage.saveUserProfile(senderID, profile);
            
            return api.sendMessage(`💰 **𝖬𝖺𝗋𝖼𝗁é 𝗇𝗈𝗂𝗋 :** 𝖳𝗈𝗎𝗍 𝗏𝗈𝗍𝗋𝖾 𝖻𝗎𝗍𝗂𝗇 𝖺 é𝗍é 𝗏𝖾𝗇𝖽𝗎 𝗉𝗈𝗎𝗋 **${formatNumber(totalGain)}** doublons !`, threadID, messageID);
        }

        if (subCommand === "buy") {
            const itemToBuy = args[1];
            if (!itemToBuy) return api.sendMessage("💡 Usage: `pirate buy <canon/voile>`", threadID, messageID);
            
            if (itemToBuy.toLowerCase() === "canon") {
                if (profile.gold < 15000) return api.sendMessage("❌ 𝖴𝗇 𝖼𝖺𝗇𝗈𝗇 𝗅𝗈𝗎𝗋𝖽 𝖼𝗈û𝗍𝖾 15,000 doublons.", threadID, messageID);
                profile.gold -= 15000;
                profile.ship.attack += 15;
                profile.ship.cannons += 1;
                storage.saveUserProfile(senderID, profile);
                return api.sendMessage("💣 Nouveau canon lourd installé à bord ! (+15 Attaque)", threadID, messageID);
            }
            return api.sendMessage("❌ Article indisponible sur les quais actuels.", threadID, messageID);
        }

        if (subCommand === "repair") {
            if (profile.ship.durability >= 100) return api.sendMessage("🚢 Votre navire est déjà comme neuf !", threadID, messageID);
            const cost = (100 - profile.ship.durability) * 50;
            if (profile.gold < cost) return api.sendMessage(`❌ Réparation impossible, il vous faut ${formatNumber(cost)} 💰.`, threadID, messageID);
            
            profile.gold -= cost;
            profile.ship.durability = 100;
            profile.ship.hp = profile.ship.maxHp;
            storage.saveUserProfile(senderID, profile);
            return api.sendMessage("🔧 Les charpentiers du port ont remis votre navire à neuf !", threadID, messageID);
        }

        if (subCommand === "heal") {
            if (profile.hp >= profile.maxHp) return api.sendMessage("❤️ Votre pirate est en pleine forme !", threadID, messageID);
            const cost = (profile.maxHp - profile.hp) * 10;
            if (profile.gold < cost) return api.sendMessage("❌ Pas assez de pièces pour payer le médecin de bord.", threadID, messageID);
            
            profile.gold -= cost;
            profile.hp = profile.maxHp;
            storage.saveUserProfile(senderID, profile);
            return api.sendMessage("🧪 Tournée de Rhum médical ! Vos HP sont restaurés.", threadID, messageID);
        }

        // ==========================================
        // NAVIGATION & COMBAT : SAIL / EXPLORE / ISLANDS
        // ==========================================
        
        if (subCommand === "islands") {
            let islMsg = `╭───────────────────────────────────────╮\n`;
            islMsg += `│ 🗺️ 𝐂𝐀𝐑𝐓𝐄 𝐃𝐄𝐒 𝐀𝐑𝐂𝐇𝐈𝐏𝐄𝐋𝐒\n`;
            islMsg += `├───────────────────────────────────────┤\n`;
            islands.forEach(isl => {
                islMsg += `│ 📍 **${isl.name}** [${isl.rarity}]\n`;
                islMsg += `│ 📊 Danger: Niv.${isl.dangerLevel} | Butin Moyen: ${formatNumber(isl.baseReward)} 💰\n`;
                islMsg += `├───────────────────────────────────────┤\n`;
            });
            islMsg += `╰───────────────────────────────────────╯`;
            return api.sendMessage(islMsg, threadID, messageID);
        }

        if (subCommand === "sail" || subCommand === "explore") {
            if (profile.ship.durability < 20) return api.sendMessage("⚠️ Navire trop endommagé pour lever l'ancre. Utilisez `pirate repair`.", threadID, messageID);
            
            const randomIsland = islands[Math.floor(Math.random() * islands.length)];
            
            // Simulation de voyage et résolution d'événement
            const successChance = 0.5 + (profile.ship.speed / 200);
            const roll = Math.random();
            
            if (roll < successChance) {
                // Succès de l'expédition
                const finalGold = randomIsland.baseReward + Math.floor(Math.random() * 200);
                profile.gold += finalGold;
                profile.xp += randomIsland.xpReward;
                profile.ship.durability -= Math.floor(Math.random() * 8);
                
                storage.saveUserProfile(senderID, profile);
                return api.sendMessage(`🧭 **𝖵𝗈𝗒𝖺𝗀𝖾 :** 𝖵𝗈𝗎𝗌 𝖺𝖼𝖼𝗈𝗋𝗍𝖾𝗓 à **${randomIsland.name}** !\n🎁 Butin pillé : +**${formatNumber(finalGold)}** 💰 & +${randomIsland.xpReward} ⭐ XP.`, threadID, messageID);
            } else {
                // Rencontre hostile ou tempête
                profile.ship.durability -= 25;
                profile.hp = Math.max(10, profile.hp - 20);
                storage.saveUserProfile(senderID, profile);
                return api.sendMessage(`⛈️ **𝖳𝖾𝗆𝗉ê𝗍𝖾 / Embouscade :** Votre navire a heurté des récifs près de ${randomIsland.name}. Coque endommagée !`, threadID, messageID);
            }
