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

            // ==========================================
        // COMBAT ET AFFRONTEMENT : DUEL & BOSS
        // ==========================================
        if (subCommand === "duel") {
            const targetID = Object.keys(event.mentions)[0];
            if (!targetID) return api.sendMessage("❌ 𝖬𝖾𝗇𝗍𝗂𝗈𝗇𝗇𝖾𝗓 𝗅𝖾 𝗉𝗂𝗋𝖺𝗍𝖾 à 𝖽é𝖿𝗂𝖾𝗋.", threadID, messageID);
            if (targetID === senderID) return api.sendMessage("❌ 𝖵𝗈𝗎𝗌 𝗇𝖾 𝗉𝗈𝗎𝗏𝖾𝗓 𝗉𝖺𝗌 𝗏𝗈𝗎𝗌 𝗍𝗂𝗋𝖾𝗋 𝖽𝖾𝗌𝗌𝗎𝗌 𝗏𝗈𝗎𝗌-𝗆ê𝗆𝖾 !", threadID, messageID);

            const opponent = pirates[targetID];
            if (!opponent) return api.sendMessage("❌ 𝖢𝖾𝗍 𝗎𝗍𝗂𝗅𝗂𝗌𝖺𝗍𝖾𝗎𝗋 𝗇'𝖺 𝗉𝖺𝗌 𝖾𝗇𝖼𝗈𝗋𝖾 𝖼𝗋éé 𝖽𝖾 𝗉𝗂𝗋𝖺𝗍𝖾.", threadID, messageID);

            // Calcul du vainqueur basé sur la puissance d'attaque des navires
            const myPower = profile.ship.attack + (profile.level * 2);
            const oppPower = opponent.ship.attack + (opponent.level * 2);
            
            const total = myPower + oppPower;
            const myChance = myPower / total;

            profile.battleStats.played += 1;
            opponent.battleStats.played += 1;

            if (Math.random() < myChance) {
                const winGold = Math.floor(opponent.gold * 0.1); // Vol de 10% de l'or
                profile.gold += winGold;
                opponent.gold -= winGold;
                profile.bounty += 500;
                profile.battleStats.wins += 1;
                opponent.battleStats.losses += 1;
                
                storage.saveUserProfile(senderID, profile);
                storage.saveUserProfile(targetID, opponent);
                return api.sendMessage(`⚔️ **𝖵𝖨𝖢𝖳𝖮𝖨𝖱𝖤 !** Vous coulez les défenses de **${opponent.name}** et lui pilotez **${formatNumber(winGold)}** 💰 !`, threadID, messageID);
            } else {
                const loseGold = Math.floor(profile.gold * 0.1);
                profile.gold -= loseGold;
                opponent.gold += loseGold;
                opponent.bounty += 500;
                profile.battleStats.losses += 1;
                opponent.battleStats.wins += 1;

                storage.saveUserProfile(senderID, profile);
                storage.saveUserProfile(targetID, opponent);
                return api.sendMessage(`💀 **𝖣É𝖥𝖠𝖨𝖳𝖤...** **${opponent.name}** a mieux ajusté ses tirs de canon. Vous perdez **${formatNumber(loseGold)}** 💰.`, threadID, messageID);
            }
        }

        if (subCommand === "boss") {
            if (profile.hp < 30) return api.sendMessage("❌ Vous êtes trop blessé pour affronter le Léviathan.", threadID, messageID);
            
            const bossDmg = 40 + Math.floor(Math.random() * 40);
            profile.hp -= bossDmg;

            if (Math.random() > 0.6) {
                const bossReward = 50000;
                profile.gold += bossReward;
                profile.battleStats.bossKilled += 1;
                storage.saveUserProfile(senderID, profile);
                return api.sendMessage(`🐋 **💥 LÉGENDE !** Vous avez terrassé le Kraken ! Butin mythique : +**50,000** 💰 !`, threadID, messageID);
            } else {
                storage.saveUserProfile(senderID, profile);
                return api.sendMessage(`🐋 **ÉCHEC :** Le monstre des abysses a brisé vos lignes de défense. Vous battez en retraite (-${bossDmg} HP).`, threadID, messageID);
            }
            
        // ==========================================
        // GESTION COMPLÈTE DES ÉQUIPAGES : CREW
        // ==========================================
        if (subCommand === "crew") {
            const crewAction = args[1] ? args[1].toLowerCase() : null;

            // --- MENU DE COMPAGNIE DES CREWS ---
            if (!crewAction) {
                let cMenu = `╭───────────────────────────────────────╮\n`;
                cMenu += `│ ☠️ 𝐂𝐎𝐌𝐌𝐀𝐍𝐃𝐄𝐒 𝐃'É𝐐𝐔𝐈𝐏𝐀𝐆𝐄\n`;
                cMenu += `├───────────────────────────────────────┤\n`;
                cMenu += `│ 🔹 𝗉𝗂𝗋𝖺𝗍𝖾 𝖼𝗋𝖾𝗐 𝖼𝗋𝖾𝖺𝗍𝖾 <𝗇𝗈𝗆> : 𝖥𝗈𝗇𝖽𝗋𝖾 𝗎𝗇𝖾 𝖿𝗅𝗈𝗍𝗍𝖾\n`;
                cMenu += `│ 🔹 𝗉𝗂𝗋𝖺𝗍𝖾 𝖼𝗋𝖾𝗐 𝗂𝗇𝖿𝗈 [𝗂𝖽] / 𝗅𝗂𝗌𝗍 : 𝖵𝗈𝗂𝗋 𝗅𝖾𝗌 𝖼𝗋𝖾𝗐𝗌\n`;
                cMenu += `│ 🔹 𝗉𝗂𝗋𝖺𝗍𝖾 𝖼𝗋𝖾𝗐 𝗆𝖾𝗆𝖻𝖾𝗋𝗌 : 𝖫𝗂𝗌𝗍𝖾 𝖽𝖾𝗌 𝗆𝖺𝗋𝗂𝗇𝗌\n`;
                cMenu += `│ 🔹 𝗉𝗂𝗋𝖺𝗍𝖾 𝖼𝗋𝖾𝗐 𝗃𝗈𝗂𝗇 <𝗂𝖽> / 𝗅𝖾𝖺𝗏𝖾 : 𝖬𝗈𝗎𝗏𝖾𝗆𝖾𝗇𝗍𝗌\n`;
                cMenu += `│ 🔹 𝗉𝗂𝗋𝖺𝗍𝖾 𝖼𝗋𝖾𝗐 𝗂𝗇𝗏𝗂𝗍𝖾 / 𝗄𝗂𝖼𝗄 @𝗎𝗌𝖾𝗋 : 𝖱𝖾𝖼𝗋𝗎𝗍𝖾𝗆𝖾𝗇𝗍\n`;
                cMenu += `│ 🔹 𝗉𝗂𝗋𝖺𝗍𝖾 𝖼𝗋𝖾𝗐 𝗉𝗋𝗈𝗆𝗈𝗍𝖾 / 𝖽𝖾𝗆𝗈𝗍𝖾 @𝗎𝗌𝖾𝗋 : 𝖱𝖺𝗇𝗀𝗌\n`;
                cMenu += `│ 🔹 𝗉𝗂𝗋𝖺𝗍𝖾 𝖼𝗋𝖾𝗐 𝖽𝗈𝗇𝖺𝗍𝖾 / 𝗐𝗂𝗍𝗁𝖽𝗋𝖺𝗐 <𝗊𝗍é> : 𝖢𝗈𝖿𝖿𝗋𝖾\n`;
                cMenu += `│ 🔹 𝗉𝗂𝗋𝖺𝗍𝖾 𝖼𝗋𝖾𝗐 𝗎𝗉𝗀𝗋𝖺𝖽𝖾 : 𝖠𝗆é𝗅𝗂𝗈𝗋𝖾𝗋 𝗅𝖺 𝖿𝗅𝗈𝗍𝗍𝖾\n`;
                cMenu += `│ 🔹 𝗉𝗂𝗋𝖺𝗍𝖾 𝖼𝗋𝖾𝗐 𝖼𝗁𝖺𝗍 <𝗆𝗌𝗀> / 𝗅𝗈𝗀𝗌 : 𝖵𝗂𝖾 𝖽𝗎 𝖼𝗋𝖾𝗐\n`;
                cMenu += `│ 🔹 𝗉𝗂𝗋𝖺𝗍𝖾 𝖼𝗋𝖾𝗐 𝗐𝖺𝗋 : 𝖫𝖺𝗇𝖼𝖾𝗋 𝗎𝗇𝖾 𝖻𝖺𝗍𝖺𝗂𝗅𝗅𝖾\n`;
                cMenu += `╰───────────────────────────────────────╯`;
                return api.sendMessage(cMenu, threadID, messageID);
            }

            // --- CREW CREATE ---
            if (crewAction === "create") {
                if (profile.crewId) return api.sendMessage("❌ 𝖵𝗈𝗎𝗌 𝖺𝗉𝗉𝖺𝗋𝗍𝖾𝗇𝖾𝗋 𝖽é𝗃à à 𝗎𝗇 é𝗊𝗎𝗂𝗉𝖺𝗀𝖾.", threadID, messageID);
                const cName = args.slice(2).join(" ");
                if (!cName || cName.length < 3) return api.sendMessage("❌ 𝖫𝖾 𝗇𝗈𝗆 𝖽𝗎 𝖼𝗋𝖾𝗐 𝖽𝗈𝗂𝗍 𝖿𝖺𝗂𝗋𝖾 𝖺𝗎 𝗆𝗈𝗂𝗇𝗌 3 𝖼𝖺𝗋𝖺𝖼𝗍è𝗋𝖾𝗌.", threadID, messageID);

                const newId = "CRW" + Date.now().toString().slice(-5);
                crews[newId] = {
                    id: newId,
                    name: cName,
                    captain: senderID,
                    captainName: profile.name,
                    bank: 0,
                    level: 1,
                    maxMembers: 15,
                    members: [senderID],
                    logs: []
                };

                profile.crewId = newId;
                profile.crewRole = "Capitaine";

                storage.saveCrews(crews);
                storage.saveUserProfile(senderID, profile);
                storage.logEvent(newId, "CREATION", `🏴‍☠️ L'équipage ${cName} a été fondé par le Capitaine ${profile.name}.`);

                return api.sendMessage(`🏴‍☠️ **𝖥𝖫𝖮𝖳𝖳𝖤 𝖢𝖱ÉÉ𝖤 :** L'équipage **${cName}** (ID: ${newId}) vient de hisser son pavillon noir !`, threadID, messageID);
            }

            // --- CREW LIST ---
            if (crewAction === "list") {
                const listCrews = Object.values(crews).slice(0, 10);
                if (listCrews.length === 0) return api.sendMessage("📭 𝖠𝗎𝖼𝗎𝗇 é𝗊𝗎𝗂𝗉𝖺𝗀𝖾 𝗇'𝖾𝗌𝗍 𝖾𝗇𝗉𝖾𝗋𝗋𝖾 𝖺𝖼𝗍𝗎𝖾𝗅𝗅𝖾𝗆𝖾𝗇𝗍.", threadID, messageID);

                let lMsg = `╭───────────────────────────────────────╮\n`;
                lMsg += `│ 📜 𝐑𝐄𝐆𝐈𝐒𝐓𝐑𝐄 𝐃𝐄𝐒 É𝐐𝐔𝐈𝐏𝐀𝐆𝐄𝐒\n`;
                lMsg += `├───────────────────────────────────────┤\n`;
                listCrews.forEach(c => {
                    lMsg += `│ 🔹 [${c.id}] **${c.name}** | 𝖫𝗏𝗅 ${c.level} | 👥 ${c.members.length}/${c.maxMembers}\n`;
                });
                lMsg += `╰───────────────────────────────────────╯`;
                return api.sendMessage(lMsg, threadID, messageID);
            }

            // --- CREW INFO ---
            if (crewAction === "info") {
                const targetId = args[2] || profile.crewId;
                if (!targetId || !crews[targetId]) return api.sendMessage("❌ 𝖤𝗊𝗎𝗂𝗉𝖺𝗀𝖾 𝗂𝗇𝗍𝗋𝗈𝗎𝗏𝖺𝖻𝗅𝖾.", threadID, messageID);

                const c = crews[targetId];
                let iMsg = `╭───────────────────────────────────────╮\n`;
                iMsg += `│ ☠️ É𝐐𝐔𝐈𝐏𝐀𝐆𝐄 : ${c.name.toUpperCase()}\n`;
                iMsg += `├───────────────────────────────────────┤\n`;
                iMsg += `│ 🆔 𝖨𝖣 : ${c.id}\n`;
                iMsg += `│ 👑 𝖢𝖺𝗉𝗂𝗍𝖺𝗂𝗇𝖾 : ${c.captainName || "Inconnu"}\n`;
                iMsg += `│ 🌟 𝖭𝗂𝗏𝖾𝖺𝗎 : ${c.level}\n`;
                iMsg += `│ 👥 𝖬𝖺𝗋𝗂𝗇𝗌 : ${c.members.length} / ${c.maxMembers}\n`;
                iMsg += `│ 💰 𝖢𝗈𝖿𝖿𝗋𝖾-𝖥𝗈𝗋𝗍 : ${formatNumber(c.bank)} doublons\n`;
                iMsg += `╰───────────────────────────────────────╯`;
                return api.sendMessage(iMsg, threadID, messageID);
            }

            // --- CREW JOIN ---
            if (crewAction === "join") {
                if (profile.crewId) return api.sendMessage("❌ 𝖵𝗈𝗎𝗌 ê𝗍𝖾𝗌 𝖽é𝗃à 𝖽𝖺𝗇𝗌 𝗎𝗇 𝖼𝗋𝖾𝗐.", threadID, messageID);
                const targetId = args[2];
                if (!targetId || !crews[targetId]) return api.sendMessage("❌ 𝖨𝖣 𝖽'é𝗊𝗎𝗂𝗉𝖺𝗀𝖾 𝗂𝗇𝗏𝖺𝗅𝗂𝖽𝖾.", threadID, messageID);

                const c = crews[targetId];
                if (c.members.length >= c.maxMembers) return api.sendMessage("❌ 𝖢𝖾𝗍 é𝗊𝗎𝗂𝗉𝖺𝗀𝖾 𝖾𝗌𝗍 𝖺𝗎 𝗆𝖺𝗑𝗂𝗆𝗎𝗆 𝖽𝖾 𝗌𝖺 𝖼𝖺𝗉𝖺𝖼𝗂𝗍é.", threadID, messageID);

                c.members.push(senderID);
                profile.crewId = c.id;
                profile.crewRole = "Membre";

                storage.saveCrews(crews);
                storage.saveUserProfile(senderID, profile);
                storage.logEvent(c.id, "RECRUTEMENT", `👤 ${profile.name} a rejoint l'équipage.`);

                return api.sendMessage(`✅ Vous avez rejoint l'équipage **${c.name}** !`, threadID, messageID);
            }

            // --- CREW LEAVE ---
            if (crewAction === "leave") {
                if (!profile.crewId) return api.sendMessage("❌ 𝖵𝗈𝗎𝗌 𝗇'𝖺𝗏𝖾𝗓 𝗉𝖺𝗌 𝖽'é𝗊𝗎𝗂𝗉𝖺𝗀𝖾.", threadID, messageID);
                const c = crews[profile.crewId];

                if (c.captain === senderID) return api.sendMessage("❌ En tant que Capitaine, vous devez dissoudre le crew via `disband` (ou utiliser une autre action) plutôt que de l'abandonner.", threadID, messageID);

                c.members = c.members.filter(id => id !== senderID);
                profile.crewId = null;
                profile.crewRole = null;

                storage.saveCrews(crews);
                storage.saveUserProfile(senderID, profile);
                storage.logEvent(c.id, "DEPART", `🚪 ${profile.name} a quitté le navire.`);

                return api.sendMessage(`🚪 Vous avez fait vos bagages et quitté l'équipage.`, threadID, messageID);
            }

            // --- CREW MEMBERS ---
            if (crewAction === "members") {
                if (!profile.crewId) return api.sendMessage("❌ Vous n'avez pas d'équipage.", threadID, messageID);
                const c = crews[profile.crewId];

                let mMsg = `╭───────────────────────────────────────╮\n`;
                mMsg += `│ 👥 𝐌𝐀𝐑𝐈𝐍𝐒 𝐃𝐄 𝐋'É𝐐𝐔𝐈𝐏𝐀𝐆𝐄\n`;
                mMsg += `├───────────────────────────────────────┤\n`;
                c.members.forEach(mId => {
                    const mProf = pirates[mId] || { name: "Pirate Égaré", crewRole: "Membre" };
                    mMsg += `│ 🔹 **${mProf.name}** - [${mProf.crewRole || "Membre"}]\n`;
                });
                mMsg += `╰───────────────────────────────────────╯`;
                return api.sendMessage(mMsg, threadID, messageID);
            }

            // --- CREW WITHDRAW (RETRAIT SÉCURISÉ) ---
            if (crewAction === "withdraw") {
                if (!profile.crewId) return api.sendMessage("❌ Vous n'avez pas de crew.", threadID, messageID);
                const c = crews[profile.crewId];

                if (!["Capitaine", "Second"].includes(profile.crewRole)) {
                    return api.sendMessage("❌ Seul le Capitaine ou le Second peut retirer des doublons du coffre.", threadID, messageID);
                }

                const amt = parseInt(args[2]);
                if (isNaN(amt) || amt <= 0 || c.bank < amt) return api.sendMessage("❌ Montant invalide ou coffre insuffisant.", threadID, messageID);

                c.bank -= amt;
                profile.gold += amt;

                storage.saveCrews(crews);
                storage.saveUserProfile(senderID, profile);
                storage.logEvent(c.id, "COFFRE", `💰 ${profile.name} a retiré ${formatNumber(amt)} doublons.`);

                return api.sendMessage(`💰 Retrait réussi de **${formatNumber(amt)}** doublons du coffre d'équipage.`, threadID, messageID);
            }

            // --- CREW PROMOTE ---
            if (crewAction === "promote") {
                if (!profile.crewId) return api.sendMessage("❌ Pas d'équipage.", threadID, messageID);
                if (!["Capitaine", "Second"].includes(profile.crewRole)) return api.sendMessage("❌ Droits insuffisants.", threadID, messageID);

                const targetID = Object.keys(event.mentions)[0];
                if (!targetID) return api.sendMessage("❌ Mentionnez le marin à promouvoir.", threadID, messageID);

                const targetProfile = pirates[targetID];
                if (!targetProfile || targetProfile.crewId !== profile.crewId) return api.sendMessage("❌ Ce pirate n'est pas à bord de votre navire.", threadID, messageID);

                if (!targetProfile.crewRole || targetProfile.crewRole === "Membre") {
                    targetProfile.crewRole = "Officier";
                } else if (targetProfile.crewRole === "Officier") {
                    if (profile.crewRole !== "Capitaine") return api.sendMessage("❌ Seul le Capitaine peut nommer un Second.", threadID, messageID);
                    targetProfile.crewRole = "Second";
                } else {
                    return api.sendMessage("❌ Impossible de promouvoir plus haut.", threadID, messageID);
                }

                storage.saveUserProfile(targetID, targetProfile);
                storage.logEvent(profile.crewId, "PROMOTION", `⭐ ${targetProfile.name} a été promu au rang de ${targetProfile.crewRole}.`);
                return api.sendMessage(`⭐ **${targetProfile.name}** a été promu **${targetProfile.crewRole}** !`, threadID, messageID);
            }

            // --- CREW DEMOTE ---
            if (crewAction === "demote") {
                if (!profile.crewId) return api.sendMessage("❌ Pas d'équipage.", threadID, messageID);
                if (profile.crewRole !== "Capitaine") return api.sendMessage("❌ Seul le Capitaine gère la dégradation des officiers.", threadID, messageID);

                const targetID = Object.keys(event.mentions)[0];
                if (!targetID) return api.sendMessage("❌ Mentionnez le marin à rétrograder.", threadID, messageID);

                const targetProfile = pirates[targetID];
                if (!targetProfile || targetProfile.crewId !== profile.crewId) return api.sendMessage("❌ Ce pirate ne fait pas partie du crew.", threadID, messageID);

                if (targetProfile.crewRole === "Second") {
                    targetProfile.crewRole = "Officier";
                } else if (targetProfile.crewRole === "Officier") {
                    targetProfile.crewRole = "Membre";
                } else {
                    return api.sendMessage("❌ Ce membre est déjà au rang le plus bas.", threadID, messageID);
                }

                storage.saveUserProfile(targetID, targetProfile);
                storage.logEvent(profile.crewId, "RÉTROGRADATION", `🔻 ${targetProfile.name} a été rétrogradé au rang de ${targetProfile.crewRole}.`);
                return api.sendMessage(`🔻 **${targetProfile.name}** a été rétrogradé au rang de **${targetProfile.crewRole}**.`, threadID, messageID);
            }

            // --- CREW KICK ---
            if (crewAction === "kick") {
                if (!profile.crewId) return api.sendMessage("❌ Pas d'équipage.", threadID, messageID);
                if (!["Capitaine", "Second", "Officier"].includes(profile.crewRole)) return api.sendMessage("❌ Vous n'avez pas l'autorité nécessaire.", threadID, messageID);

                const targetID = Object.keys(event.mentions)[0];
                if (!targetID) return api.sendMessage("❌ Mentionnez le pirate à jeter par-dessus bord.", threadID, messageID);

                const targetProfile = pirates[targetID];
                if (!targetProfile || targetProfile.crewId !== profile.crewId) return api.sendMessage("❌ Ce pirate n'est pas dans votre crew.", threadID, messageID);

                if (targetProfile.crewRole === "Capitaine" || (targetProfile.crewRole === "Second" && profile.crewRole !== "Capitaine")) {
                    return api.sendMessage("❌ Hiérarchie protégée. Vous ne pouvez pas exclure ce membre.", threadID, messageID);
                }

                const c = crews[profile.crewId];
                c.members = c.members.filter(id => id !== targetID);
                targetProfile.crewId = null;
                targetProfile.crewRole = null;

                storage.saveCrews(crews);
                storage.saveUserProfile(targetID, targetProfile);
                storage.logEvent(c.id, "KICK", `🥾 ${targetProfile.name} a été jeté par-dessus bord.`);

                return api.sendMessage(`🥾 **${targetProfile.name}** a été exclu de l'équipage.`, threadID, messageID);
            }

            // --- CREW CHAT ---
            if (crewAction === "chat") {
                if (!profile.crewId) return api.sendMessage("❌ Vous n'avez pas de crew pour chatter.", threadID, messageID);
                const msg = args.slice(2).join(" ");
                if (!msg) return api.sendMessage("❌ Écrivez un message destiné à votre flotte.", threadID, messageID);

                const c = crews[profile.crewId];
                c.members.forEach(mId => {
                    if (mId !== senderID) {
                        api.sendMessage(`💬 [𝖢𝖧𝖠𝖳 𝖢𝖱𝖤𝖶 - ${c.name}] **${profile.name}** : ${msg}`, mId);
                    }
                });
                return api.sendMessage("✉️ Message transmis instantanément aux cabines des marins actifs.", threadID, messageID);
            }

            // --- CREW LOGS ---
            if (crewAction === "logs") {
                if (!profile.crewId) return api.sendMessage("❌ Pas d'équipage.", threadID, messageID);
                const c = crews[profile.crewId];
                if (!c.logs || c.logs.length === 0) return api.sendMessage("📭 Aucun log enregistré dans le journal de bord.", threadID, messageID);

                let logMsg = `📜 **𝐉𝐎𝐔𝐑𝐍𝐀𝐋 𝐃𝐄 𝐁𝐎𝐑𝐃 (𝐋𝐎𝐆𝐒)**\n\n`;
                c.logs.slice(0, 10).forEach(l => {
                    logMsg += `• [${l.type}] ${l.message}\n`;
                });
                return api.sendMessage(logMsg, threadID, messageID);
            }

            // --- CREW UPGRADE ---
            if (crewAction === "upgrade") {
                if (!profile.crewId) return api.sendMessage("❌ Pas d'équipage.", threadID, messageID);
                const c = crews[profile.crewId];
                
                const cost = c.level * 50000;
                if (c.bank < cost) return api.sendMessage(`❌ Fonds du coffre insuffisants. Il faut **${formatNumber(cost)}** 💰 dans le coffre commun.`, threadID, messageID);

                c.bank -= cost;
                c.level += 1;
                c.maxMembers += 2;

                storage.saveCrews(crews);
                storage.logEvent(c.id, "AMÉLIORATION", `📈 L'équipage est passé au niveau ${c.level}.`);
                return api.sendMessage(`📈 **𝖥𝖫𝖮𝖳𝖳𝖤 𝖠𝖬É𝖫𝖨𝖮𝖱É𝖤 :** L'équipage passe au Niveau **${c.level}** ! Capacité maximale augmentée à ${c.maxMembers} marins.`, threadID, messageID);
            }

            // --- CREW WAR ---
            if (crewAction === "war") {
                if (!profile.crewId) return api.sendMessage("❌ Pas d'équipage.", threadID, messageID);
                return api.sendMessage("⚔️ **𝖦𝖴𝖤𝖱𝖱𝖤 𝖭𝖠𝖵𝖠𝖫𝖤 :** Les éclaireurs cherchent des flottes ennemies sur l'horizon. La saison d'assaut s'ouvrira sous peu !", threadID, messageID);
            }

         // ==========================================
        // BUTIN QUOTIDIEN : DAILY
        // ==========================================
        if (subCommand === "daily") {
            if (now - profile.dailyState.lastClaim < 24 * 60 * 60 * 1000) {
                const rem = Math.ceil((24 * 60 * 60 * 1000 - (now - profile.dailyState.lastClaim)) / 1000 / 60 / 60);
                return api.sendMessage(`⏳ Votre coffre de bonus quotidien est vide. Revenez dans ${rem}h.`, threadID, messageID);
            }

            const dailyGold = 2000 + (profile.level * 300);
            profile.gold += dailyGold;
            profile.dailyState.lastClaim = now;
            storage.saveUserProfile(senderID, profile);

            return api.sendMessage(`🎁 **💥 BUTIN DU JOUR :** Vous ouvrez une vieille caisse échouée. Gain : +**${formatNumber(dailyGold)}** 💰 !`, threadID, messageID);
        }

        // ==========================================
        // MOTEUR DE RENDU GRAPHIQUE : STATS PREMIUM (CANVAS)
        // ==========================================
        if (subCommand === "stats") {
            if (canvasAvailable) {
                const canvas = Canvas.createCanvas(1400, 800);
                const ctx = canvas.getContext("2d");

                // Background Marine Dark Cyan
                const gradient = ctx.createLinearGradient(0, 0, 1400, 800);
                gradient.addColorStop(0, "#051329");
                gradient.addColorStop(0.5, "#081c3b");
                gradient.addColorStop(1, "#020a17");
                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, 1400, 800);

                // Bordures style Or Vieilli Néon
                ctx.strokeStyle = "#d4af37";
                ctx.lineWidth = 6;
                ctx.strokeRect(20, 20, 1360, 760);

                // Header / Infos Principales
                ctx.fillStyle = "#ffffff";
                ctx.font = "bold 56px Arial";
                ctx.fillText(`🏴‍☠️ ${profile.name.toUpperCase()}`, 70, 100);

                ctx.fillStyle = "#d4af37";
                ctx.font = "26px Arial";
                ctx.fillText(`Titre: ${profile.title}  |  Niveau Capitaine: ${profile.level}`, 70, 145);

                // Grid des Statistiques du Dashboard
                const makeCard = (x, y, w, h, label, val, color) => {
                    ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
                    ctx.beginPath();
                    ctx.roundRect(x, y, w, h, 15);
                    ctx.fill();
                    ctx.strokeStyle = "rgba(212, 175, 55, 0.3)";
                    ctx.stroke();

                    ctx.fillStyle = "#a0aab8";
                    ctx.font = "20px Arial";
                    ctx.fillText(label, x + 25, y + 40);

                    ctx.fillStyle = color;
                    ctx.font = "bold 36px Arial";
                    ctx.fillText(val, x + 25, y + 95);
                };

                makeCard(70, 200, 380, 140, "DOUBLONS EN POCHE", `${formatNumber(profile.gold)} 💰`, "#ffd700");
                makeCard(490, 200, 380, 140, "PRIME DE RECHERCHE", `${formatNumber(profile.bounty)} ☠️`, "#ff4d4d");
                makeCard(910, 200, 420, 140, "SANTE DU CAPITAINE", `${profile.hp} / ${profile.maxHp} HP`, "#ff3366");

                makeCard(70, 380, 380, 140, "PUISSANCE DU NAVIRE", `${profile.ship.attack} ATK`, "#00ffcc");
                makeCard(490, 380, 380, 140, "RÉSISTANCE COQUE", `${profile.ship.durability}% 🔧`, "#99ff33");
                makeCard(910, 380, 420, 140, "VICTOIRES EN MER", `${profile.battleStats.wins} ⚔️`, "#00ff66");

                // Barre d'expérience en bas
                const xpNeed = profile.level * 1000;
                const progress = Math.min(1, profile.xp / xpNeed);

                ctx.fillStyle = "#ffffff";
                ctx.font = "20px Arial";
                ctx.fillText(`Progression Notoriété (XP) : ${formatNumber(profile.xp)} / ${formatNumber(xpNeed)}`, 70, 600);

                ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
                ctx.beginPath();
                ctx.roundRect(70, 630, 1260, 30, 10);
                ctx.fill();

                ctx.fillStyle = "#d4af37";
                ctx.beginPath();
                ctx.roundRect(70, 630, 1260 * progress, 30, 10);
                ctx.fill();

                const tempImgPath = path.join(__dirname, "pirate_stats_temp.png");
                const out = fs.createWriteStream(tempImgPath);
                const stream = canvas.createPNGStream();
                stream.pipe(out);

                out.on("finish", () => {
                    api.sendMessage({
                        body: `📊 **𝖣𝖺𝗌𝗁𝖻𝗈𝖺𝗋𝖽 𝖢𝖺𝗇𝗏𝖺𝗌 : Fiche de ${profile.name}**`,
                        attachment: fs.createReadStream(tempImgPath)
                    }, threadID, () => {
                        try { fs.unlinkSync(tempImgPath); } catch (e) {}
                    }, messageID);
                });
                return;
            }

            // Fallback Texte Premium (Si Canvas n'est pas chargé)
            let txt = `╭───────────────────────────────────────╮\n`;
            txt += `│ 📊 **𝐒𝐓𝐀𝐓𝐈𝐒𝐓𝐈𝐐𝐔𝐄𝐒 𝐃𝐔 𝐂𝐎𝐑𝐒𝐀𝐈𝐑𝐄**\n`;
            txt += `├───────────────────────────────────────┤\n`;
            txt += `│ 🔹 𝖭𝗈𝗆 : **${profile.name}**\n`;
            txt += `│ 💰 𝖮𝗋 : ${formatNumber(profile.gold)} 𝗉𝗂è𝖼𝖾𝗌\n`;
            txt += `│ ☠️ 𝖯𝗋𝗂𝗆𝖾 : ${formatNumber(profile.bounty)} doublons\n`;
            txt += `│ ⚔️ 𝖵𝗂𝖼𝗍𝗈𝗂𝗋𝖾𝗌 : ${profile.battleStats.wins} | 𝖣é𝖿𝖺𝗂𝗍𝖾𝗌 : ${profile.battleStats.losses}\n`;
            txt += `╰───────────────────────────────────────╯`;
            return api.sendMessage(txt, threadID, messageID);
        }

        return api.sendMessage("❌ Sous-commande invalide. Tapez `pirate` pour voir le registre complet.", threadID, messageID);
    }
};
