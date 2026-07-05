/**
 * 🏰 SYSTEME MMORPG DUNGEON - FICHIER PRINCIPAL (GoatBot)
 * Version : 1.0.0
 * Architecture : Commandes et Gestion de l'Exploration Active
 */

const path = require("path");

// Importation sécurisée du module de stockage persistant
// Ajuste le chemin si ton arborescence varie (ex: "./piratesMMO/dungeon.storage.js")
const storage = require("./piratesMMO/dungeon.storage.js");

module.exports = {
    config: {
        name: "dungeon",
        version: "1.0.0",
        author: "Premium MMORPG Engine",
        countDown: 2, // Anti-spam natif de 2 secondes
        role: 0, // Accessible à tous les joueurs
        description: "Explorez des donjons instanciés complexes, affrontez des monstres et pillez du loot mythique !",
        category: "economy"
    },

    onStart: async function ({ api, event, args }) {
        const { threadID, messageID, senderID } = event;
        const now = Date.now();

        // Récupération ou création du profil persistant du joueur
        // Remplacement par défaut si le nom du profil GoatBot est inaccessible
        const userName = event.senderName || `Aventurier #${senderID.slice(-4)}`;
        const profile = storage.getPlayerProfile(senderID, userName);

        const subCommand = args[0] ? args[0].toLowerCase() : null;

        // --- HELPER : FORMATAGE FINANCIER & STATS UNIQUES ---
        const formatNum = (num) => new Intl.NumberFormat("fr-FR").format(num);

        // =========================================================================
        // 📜 MENU GENERAL D'ACCUEIL : PREMIUM DARK FANTASY
        // =========================================================================
        if (!subCommand) {
            let menu = `╭───────────────────────────────────────╮\n`;
            menu += `│ 🏰 𝐑𝐄𝐆𝐈𝐒𝐓𝐑𝐄 𝐃𝐄𝐒 𝐃𝐎𝐍𝐉𝐎𝐍𝐒\n`;
            menu += `├───────────────────────────────────────┤\n`;
            menu += `│ ⚔️ 𝖤𝖷𝖯𝖫𝖮𝖱𝖠𝖳𝖨𝖮𝖭 & 𝖢𝖮𝖬𝖡𝖠𝖳\n`;
            menu += `│ 🔹 𝖽𝗎𝗇𝗀𝖾𝗈𝗇 𝗂𝗇𝖿𝗈 : 𝖫𝗂𝗌𝗍𝖾 𝖽𝖾𝗌 𝗓𝗈𝗇𝖾𝗌 𝖾𝗍 𝖻𝗈𝗌𝗌\n`;
            menu += `│ 🔹 𝖽𝗎𝗇𝗀𝖾𝗈𝗇 𝖾𝗇𝗍𝖾𝗋 <𝗂𝖽> : 𝖨𝗇𝗂𝗍𝗂𝖾𝗋 𝗎𝗇𝖾 𝗂𝗇𝗌𝗍𝖺𝗇𝖼𝖾\n`;
            menu += `│ 🔹 𝖽𝗎𝗇𝗀𝖾𝗈𝗇 𝖾𝗑𝗉𝗅𝗈𝗋𝖾 : 𝖯𝗋𝗈𝗀𝗋𝖾𝗌𝗌𝖾𝗋 𝖽𝖺𝗇𝗌 𝗅𝖺 𝗌𝖺𝗅𝗅𝖾\n`;
            menu += `│ 🔹 𝖽𝗎𝗇𝗀𝖾𝗈𝗇 𝖺𝗍𝗍𝖺𝖼𝗄 / 𝖽𝖾𝖿𝖾𝗇𝖽 : 𝖢𝗈𝗆𝖻𝖺𝗍𝗍𝗋𝖾\n`;
            menu += `│ 🔹 𝖽𝗎𝗇𝗀𝖾𝗈𝗇 𝗌𝗄𝗂𝗅𝗅 <𝗂𝖽> : 𝖴𝗍𝗂𝗅𝗂𝗌𝖾𝗋 𝗎𝗇 𝗌𝗈𝗋𝗍\n`;
            menu += `│ 🔹 𝖽𝗎𝗇𝗀𝖾𝗈𝗇 𝖿𝗅𝖾𝖾 / 𝗅𝖾𝖺𝗏𝖾 : 𝖥𝗎𝗂𝗍𝖾 𝗈𝗎 𝖺𝖻𝖺𝗇𝖽𝗈𝗇\n`;
            menu += `├───────────────────────────────────────┤\n`;
            menu += `│ ☠️ 𝖡𝖮𝖲𝖲 & 𝖯𝖱𝖮𝖦𝖱𝖤𝖲𝖲𝖨𝖮𝖭\n`;
            menu += `│ 🔹 𝖽𝗎𝗇𝗀𝖾𝗈𝗇 𝗉𝗋𝗈𝖿𝗂𝗅𝖾 : 𝖥𝗂𝖼𝗁𝖾 𝖽𝖾 𝗅'𝖺𝖿𝖿𝗋𝖾𝗎𝗑\n`;
            menu += `│ 🔹 𝖽𝗎𝗇𝗀𝖾𝗈𝗇 𝗇𝖾𝗑𝗍 : 𝖬𝗈𝗇𝗍𝖾𝗋 à 𝗅'é𝗍𝖺𝗀𝖾 𝗌𝗎𝗂𝗏𝖺𝗇𝗍\n`;
            menu += `│ 🔹 𝖽𝗎𝗇𝗀𝖾𝗈𝗇 𝖼𝗁𝖾𝗌𝗍 / 𝖼𝗅𝖺𝗂𝗆 : 𝖮𝗎𝗏𝗋𝗂𝗋 𝗅𝖾𝗌 𝖼𝗈𝖿𝖿𝗋𝖾𝗌\n`;
            menu += `├───────────────────────────────────────┤\n`;
            menu += `│ 🎒 𝖫𝖮𝖮𝖳 & 𝖨𝖭𝖵𝖤𝖭𝖳𝖠𝖨𝖱𝖤\n`;
            menu += `│ 🔹 𝖽𝗎𝗇𝗀𝖾𝗈𝗇 𝗂𝗇𝗏𝖾𝗇𝗍𝗈𝗋𝗒 / 𝗅𝗈𝗈𝗍 : 𝖵𝗈𝗌 𝗋𝖾𝗅𝗂𝗊𝗎𝖾𝗌\n`;
            menu += `│ 🔹 𝖽𝗎𝗇𝗀𝖾𝗈𝗇 𝖾𝗊𝗎𝗂𝗉 / 𝗎𝗇𝖾𝗊𝗎𝗂𝗉 : 𝖦𝖾𝗌𝗍𝗂𝗈𝗇 𝖺𝗋𝗆𝖾𝗌\n`;
            menu += `│ 🔹 𝖽𝗎𝗇𝗀𝖾𝗈𝗇 𝗎𝗌𝖾 <𝗂𝖽> / 𝗁𝖾𝖺𝗅 / 𝗋𝖾𝗏𝗂𝗏𝖾 : 𝖲𝗎𝗋𝗏𝗂𝖾\n`;
            menu += `├───────────────────────────────────────┤\n`;
            menu += `│ 🛒 𝖲𝖧𝖮𝖯 & 𝖤𝖢𝖮𝖭𝖮𝖬𝖨𝖤\n`;
            menu += `│ 🔹 𝖽𝗎𝗇𝗀𝖾𝗈𝗇 𝗌𝗁𝗈𝗉 : 𝖬𝖺𝗋𝖼𝗁é 𝖽𝖾𝗌 𝖼𝗈𝗇𝗀𝗋é𝗀𝖺𝗍𝗂𝗈𝗇𝗌\n`;
            menu += `│ 🔹 𝖽𝗎𝗇𝗀𝖾𝗈𝗇 𝖻𝗎𝗒 / 𝗌𝖾𝗅𝗅 : 𝖢𝗈𝗆𝗆𝖾𝗋𝖼𝖾 𝖽𝖾 𝗉𝗂𝖾𝗋𝗋𝖾𝗌\n`;
            menu += `├───────────────────────────────────────┤\n`;
            menu += `│ 🏆 𝖱𝖠𝖨𝖣 & 𝖢𝖫𝖠𝖲𝖲𝖤𝖬𝖤𝖭𝖳𝖲\n`;
            menu += `│ 🔹 𝖽𝗎𝗇𝗀𝖾𝗈𝗇 𝗍𝗈𝗉 / 𝗅𝖾𝖺𝖽𝖾𝗋𝖻𝗈𝖺𝗋𝖽 : 𝖫𝖾𝗌 𝗅é𝗀𝖾𝗇𝖽𝖾𝗌\n`;
            menu += `│ 🔹 𝖽𝗎𝗇𝗀𝖾𝗈𝗇 𝖽𝖺𝗂𝗅𝗒 / 𝗐𝖾𝖾𝗄𝗅𝗒 : 𝖰𝗎ê𝗍𝖾𝗌 𝖿𝗂𝗑𝖾𝗌\n`;
            menu += `│ 🔹 𝖽𝗎𝗇𝗀𝖾𝗈𝗇 𝗋𝖺𝗂𝖽 [𝗃𝗈𝗂𝗇 / 𝖺𝗍𝗍𝖺𝖼𝗄] : 𝖡𝗈𝗌𝗌 𝖬𝗈𝗇𝖽𝗂𝖺𝗅\n`;
            menu += `│ 🔹 𝖽𝗎𝗇𝗀𝖾𝗈𝗇 𝗁𝗂𝗌𝗍𝗈𝗋𝗒 : 𝖩𝗈𝗎𝗋𝗇𝖺𝗅 𝖽𝖾𝗌 𝗉é𝗋𝗂𝗉é𝗍𝗂𝖾𝗌\n`;
            menu += `╰───────────────────────────────────────╯`;
            return api.sendMessage(menu, threadID, messageID);
        }

        // =========================================================================
        // 🗺️ SOUS-COMMANDE : DUNGEON INFO
        // =========================================================================
        if (subCommand === "info") {
            const dungeons = storage.getDungeons();
            let msg = `╭───────────────────────────────────────╮\n`;
            msg += `│ 🗺️ 𝐙𝐎𝐍𝐄𝐒 𝐃'𝖤𝖷𝖯𝖫𝖮𝖱𝖠𝖳𝖨𝖮𝖢\n`;
            msg += `├───────────────────────────────────────┤\n`;
            dungeons.forEach(d => {
                msg += `│ 📍 [${d.id}] **${d.name}** (${d.rarity})\n`;
                msg += `│ 📊 Rec: Niv.${d.recommendedLevel} | Étagés: ${d.floors} | ⚡ Cost: ${d.staminaCost}\n`;
                msg += `│ 💀 Boss final : **${d.bossName}**\n`;
                msg += `├───────────────────────────────────────┤\n`;
            });
            msg += `╰───────────────────────────────────────╯`;
            return api.sendMessage(msg, threadID, messageID);
        }

        // =========================================================================
        // 📊 SOUS-COMMANDE : DUNGEON PROFILE
        // =========================================================================
        if (subCommand === "profile") {
            let pMsg = `╭───────────────────────────────────────╮\n`;
            pMsg += `│ 👤 𝐅𝐈𝐂𝐇𝐄 𝐃'𝐀𝐕𝐄𝐍𝐓𝐔𝐑𝐈𝐄𝐑\n`;
            pMsg += `├───────────────────────────────────────┤\n`;
            pMsg += `│ 🔹 Nom : **${profile.name}**\n`;
            pMsg += `│ 🌟 Niveau : **${profile.level}** (XP: ${formatNum(profile.xp)} / ${formatNum(profile.level * 1200)})\n`;
            pMsg += `│ ❤️ Vitalité : **${profile.hp} / ${profile.maxHp} HP**\n`;
            pMsg += `│ ⚡ Endurance : **${profile.stamina} / ${profile.maxStamina} STAM**\n`;
            pMsg += `├───────────────────────────────────────┤\n`;
            pMsg += `│ ⚔️ Attaque : ${profile.attack} | 🛡️ Défense : ${profile.defense}\n`;
            pMsg += `│ 💥 Critique : ${(profile.critRate * 100).toFixed(0)}% (x${profile.critDamage})\n`;
            pMsg += `│ 🍀 Chance : ${profile.luck}\n`;
            pMsg += `├───────────────────────────────────────┤\n`;
            pMsg += `│ 💰 Dungeon Coins : **${formatNum(profile.dungeonCoins)}** 🪙\n`;
            pMsg += `│ 🔑 Clés : ${profile.keys} | 🎫 Tickets de Raid : ${profile.tickets}\n`;
            pMsg += `├───────────────────────────────────────┤\n`;
            pMsg += `│ 🏅 Étage Max : ${profile.highestFloor} | ☠️ Boss vaincus : ${profile.bossesDefeated}\n`;
            pMsg += `│ 🟢 Runs Complétées : ${profile.runsCompleted} | 🔴 Échecs : ${profile.runsFailed}\n`;
            pMsg += `╰───────────────────────────────────────╯`;
            return api.sendMessage(pMsg, threadID, messageID);
        }

        // =========================================================================
        // ⚡ SOUS-COMMANDE : DUNGEON STAMINA
        // =========================================================================
        if (subCommand === "stamina") {
            return api.sendMessage(`⚡ **𝖤𝖭𝖣𝖴𝖱𝖠𝖭𝖢𝖤 :** Vous possédez **${profile.stamina} / ${profile.maxStamina}** points d'énergie. Récunération automatique active (1 point par 5 mins).`, threadID, messageID);
        }

        // =========================================================================
        // 🎒 SOUS-COMMANDE : DUNGEON INVENTORY
        // =========================================================================
        if (subCommand === "inventory") {
            if (!profile.inventory || profile.inventory.length === 0) {
                return api.sendMessage("🎒 Votre sacoche de donjon ne contient aucun objet pour le moment.", threadID, messageID);
            }
            let invMsg = `╭───────────────────────────────────────╮\n`;
            invMsg += `│ 🎒 𝐒𝐀𝐂𝐎𝐂𝐇𝐄 𝐃𝐄 𝐃𝐎𝐍𝐉𝐎𝐍\n`;
            invMsg += `├───────────────────────────────────────┤\n`;
            profile.inventory.forEach(item => {
                const qtyStr = item.qty ? ` (x${item.qty})` : "";
                invMsg += `│ 📦 [${item.id}] **${item.name}**${qtyStr}\n`;
                invMsg += `│    Type: *${item.type}* | Effet/Valeur: ${item.effect || 0}\n`;
            });
            invMsg += `╰───────────────────────────────────────╯`;
            return api.sendMessage(invMsg, threadID, messageID);
        }

        // =========================================================================
        // 📜 SOUS-COMMANDE : DUNGEON HISTORY
        // =========================================================================
        if (subCommand === "history" || subCommand === "historq") {
            if (!profile.history || profile.history.length === 0) {
                return api.sendMessage("📭 Aucun événement marquant enregistré dans vos archives.", threadID, messageID);
            }
            let histMsg = `📜 **𝐉𝐎𝐔𝐑𝐍𝐀𝐋 𝐃'𝐄𝐗𝐏𝐋𝐎𝐑𝐀𝐓𝐈𝐎𝐍 𝐃𝐄 ${profile.name.toUpperCase()}**\n\n`;
            profile.history.forEach((h, index) => {
                histMsg += `${index + 1}. [${h.type}] ${h.message}\n`;
            });
            return api.sendMessage(histMsg, threadID, messageID);
        }

  // =========================================================================
        // 🏁 INITIALISATION D'UNE RUN : DUNGEON ENTER / START
        // =========================================================================
        if (subCommand === "enter" || subCommand === "start") {
            if (profile.activeRun) {
                return api.sendMessage("⚠️ Vous avez déjà une exploration en cours ! Terminez-la ou fuyez via `dungeon leave`.", threadID, messageID);
            }

            const targetId = args[1];
            if (!targetId) return api.sendMessage("💡 Usage: `dungeon enter <id>` (Ex: `dungeon enter d1`)", threadID, messageID);

            const dungeons = storage.getDungeons();
            const dungeon = dungeons.find(d => d.id === targetId);
            if (!dungeon) return api.sendMessage("❌ Ce donjon n'existe pas. Tapez `dungeon info`.", threadID, messageID);

            if (profile.stamina < dungeon.staminaCost) {
                return api.sendMessage(`❌ Énergie insuffisante ! Il vous faut **${dungeon.staminaCost}** ⚡ STAM pour entrer.`, threadID, messageID);
            }

            // Consommation de la stamina et création de l'instance de run
            profile.stamina -= dungeon.staminaCost;
            profile.activeRun = {
                dungeonId: dungeon.id,
                dungeonName: dungeon.name,
                floor: 1,
                room: 1,
                playerHp: profile.maxHp,
                state: "EXPLORING", // EXPLORING, FIGHTING, CHEST, COMPLETED
                enemy: null,
                turn: 0,
                lootBox: { gold: 0, coins: 0, items: [] }
            };

            storage.savePlayerProfile(senderID, profile);
            storage.logDungeonEvent(profile, "ENTRÉE", `A franchi les portes de : ${dungeon.name}`);

            let startMsg = `╭───────────────────────────────────────╮\n`;
            startMsg += `│ 🏰 𝐈𝐍𝐒𝐓𝐀𝐍𝐂𝐄 𝐎𝐔𝐕𝐄𝐑𝐓𝐄\n`;
            startMsg += `├───────────────────────────────────────┤\n`;
            startMsg += `│ Vous pénétrez dans **${dungeon.name}**.\n`;
            startMsg += `│ 🔹 Étage : 1 / ${dungeon.floors}\n`;
            startMsg += `│ ⚡ Énergie consommée : -${dungeon.staminaCost}\n`;
            startMsg += `├───────────────────────────────────────┤\n`;
            startMsg += `│ 🧭 Utilisez \`dungeon explore\` pour avancer.\n`;
            startMsg += `╰───────────────────────────────────────╯`;
            return api.sendMessage(startMsg, threadID, messageID);
        }

        // =========================================================================
        // 🧭 SÉCURITÉ DE RUN ACTIVE : TOUTES LES COMMANDES SUIVANTES REQUIÈRENT UNE RUN
        // =========================================================================
        const runCommands = ["explore", "attack", "skill", "defend", "flee", "next", "chest", "claim", "leave"];
        if (runCommands.includes(subCommand) && !profile.activeRun) {
            return api.sendMessage("❌ Vous n'avez aucune exploration active. Lancez-en une avec `dungeon enter <id>`.", threadID, messageID);
        }

        const run = profile.activeRun;

        // =========================================================================
        // 🧭 SOUS-COMMANDE : DUNGEON EXPLORE
        // =========================================================================
        if (subCommand === "explore") {
            if (run.state !== "EXPLORING") {
                return api.sendMessage(`⚠️ Vous ne pouvez pas explorer actuellement. Statut de la run : **${run.state}**.`, threadID, messageID);
            }

            const roll = Math.random();
            const dungeons = storage.getDungeons();
            const currentDungeon = dungeons.find(d => d.id === run.dungeonId);

            // Événement 1 : Rencontre d'un Boss à l'étage final ou monstre normal
            if (run.room === 3 || (run.floor === currentDungeon.floors && run.room === 3)) {
                // Combat de Boss
                const isFinalBoss = run.floor === currentDungeon.floors;
                run.state = "FIGHTING";
                run.turn = 1;
                run.enemy = {
                    name: isFinalBoss ? currentDungeon.bossName : `Élite de ${currentDungeon.theme}`,
                    hp: Math.floor(profile.maxHp * (0.6 + (run.floor * 0.4))) * (isFinalBoss ? 2 : 1.3),
                    maxHp: Math.floor(profile.maxHp * (0.6 + (run.floor * 0.4))) * (isFinalBoss ? 2 : 1.3),
                    attack: Math.floor(profile.attack * (0.5 + (run.floor * 0.25))),
                    defense: Math.floor(profile.defense * (0.4 + (run.floor * 0.2))),
                    isBoss: isFinalBoss
                };
                storage.savePlayerProfile(senderID, profile);
                return api.sendMessage(`👹 **DANGER :** Un **${run.enemy.name}** bloque le passage ! HP: ${run.enemy.hp}\n⚔️ Combat engagé ! Utilisez \`dungeon attack\` ou \`dungeon skill\`.`, threadID, messageID);
            } 
            
            // Événement 2 : Découverte d'un coffre
            if (roll < 0.4) {
                run.state = "CHEST";
                storage.savePlayerProfile(senderID, profile);
                return api.sendMessage(`🎁 **COFFRE TROUVÉ :** Vous tombez sur une vieille malle poussiéreuse ! Tapez \`dungeon chest\` pour l'ouvrir.`, threadID, messageID);
            }

            // Événement 3 : Salle vide, progression libre
            run.room += 1;
            if (run.room > 3) {
                run.room = 1;
                return api.sendMessage(`🏁 **SALLE NETTOYÉE :** Le couloir se dégage. Utilisez \`dungeon next\` pour passer à l'étage suivant.`, threadID, messageID);
            }

            storage.savePlayerProfile(senderID, profile);
            return api.sendMessage(`🧭 Vous avancez prudemment dans les sombres méandres de la salle ${run.room}... Aucun danger immédiat. (\`dungeon explore\`)`, threadID, messageID);
        }

        // =========================================================================
        // ⚔️ SYSTÈME DE COMBAT AU TOUR PAR TOUR : ATTACK / SKILL / DEFEND / FLEE
        // =========================================================================
        if (subCommand === "attack" || subCommand === "skill" || subCommand === "defend") {
            if (run.state !== "FIGHTING" || !run.enemy) {
                return api.sendMessage("❌ Il n'y a aucun ennemi face à vous dans cette salle.", threadID, messageID);
            }

            let playerDmgMultiplier = 1;
            let isDefending = false;

            // Gestion de l'action du joueur
            if (subCommand === "skill") {
                const skillId = args[1] || "sk_01";
                const skill = profile.skills.find(s => s.id === skillId);
                if (!skill) return api.sendMessage("❌ Compétence introuvable ou non équipée.", threadID, messageID);
                playerDmgMultiplier = skill.value || 1.4;
            }

            if (subCommand === "defend") {
                isDefending = true;
            }

            //--- TOUR DU JOUEUR ---
            let combatLog = `📝 **TOUR ${run.turn}**\n`;
            if (!isDefending) {
                let baseDmg = Math.max(5, (profile.attack * playerDmgMultiplier) - (run.enemy.defense * 0.5));
                // Calcul du Critique
                const isCrit = Math.random() < profile.critRate;
                if (isCrit) baseDmg = Math.floor(baseDmg * profile.critDamage);
                
                const finalDmg = Math.floor(baseDmg * (0.9 + Math.random() * 0.2));
                run.enemy.hp -= finalDmg;
                profile.totalDamage += finalDmg;

                combatLog += `⚔️ Vous infligez **${finalDmg}** dégâts à **${run.enemy.name}** ${isCrit ? "💥 **CRITIQUE !**" : ""}\n`;
            } else {
                combatLog += `🛡️ Vous vous mettez en posture défensive.\n`;
            }

            // Vérification de la mort de l'ennemi
            if (run.enemy.hp <= 0) {
                run.state = "EXPLORING";
                // Attribution du loot temporaire de run
                const winGold = 200 * run.floor;
                const winCoins = 10 * run.floor;
                run.lootBox.gold += winGold;
                run.lootBox.coins += winCoins;

                if (run.enemy.isBoss) {
                    profile.bossesDefeated += 1;
                    run.lootBox.items.push("Fragment d'Âme de Boss");
                }

                run.enemy = null;
                run.room += 1;
                storage.savePlayerProfile(senderID, profile);
                return api.sendMessage(`🎉 **VICTOIRE !** L'ennemi s'effondre en poussière.\n💰 Butin accumulé : +${winGold} Or & +${winCoins} Dungeon Coins ! (\`dungeon explore\`)`, threadID, messageID);
            }

            //--- TOUR DE L'ENNEMI ---
            let enemyDmg = Math.max(3, run.enemy.attack - (profile.defense * 0.5));
            if (isDefending) enemyDmg = Math.floor(enemyDmg * 0.4); // Réduction de 60% si posture de défense
            enemyDmg = Math.floor(enemyDmg * (0.9 + Math.random() * 0.2));

            run.playerHp -= enemyDmg;
            combatLog += `👹 **${run.enemy.name}** réplique et vous inflige **${enemyDmg}** dégâts. (Vos HPs : ${run.playerHp}/${profile.maxHp})\n`;

            // Vérification de la mort du joueur
            if (run.playerHp <= 0) {
                profile.runsFailed += 1;
                profile.activeRun = null; // Perte totale de l'instance
                storage.savePlayerProfile(senderID, profile);
                return api.sendMessage(`💀 **MORT AU COMBAT...** Vous avez succombé face à **${run.enemy.name}**. La run échoue et tout votre butin accumulé est perdu. Réparez vos forces via \`dungeon heal\`.`, threadID, messageID);
            }

            run.turn += 1;
            storage.savePlayerProfile(senderID, profile);
            return api.sendMessage(combatLog, threadID, messageID);
        }

        if (subCommand === "flee") {
            if (run.state !== "FIGHTING") return api.sendMessage("❌ Aucun combat à fuir.", threadID, messageID);
            if (Math.random() < 0.4) {
                run.state = "EXPLORING";
                run.enemy = null;
                storage.savePlayerProfile(senderID, profile);
                return api.sendMessage("🏃💨 **FUITE RÉUSSIE !** Vous parvenez à vous glisser dans une fissure du mur pour semer le monstre.", threadID, messageID);
            } else {
                return api.sendMessage("❌ **ÉCHEC DE LA FUITE !** Le monstre vous barre la route et bloque la sortie !", threadID, messageID);
            }
        }

        // =========================================================================
        // 🏁 PROGRESSION INTER-ÉTAGES & FIN DE RUN : NEXT / CHEST / CLAIM / LEAVE
        // =========================================================================
        if (subCommand === "next") {
            if (run.state !== "EXPLORING" || run.room !== 1) {
                return api.sendMessage("❌ Vous devez nettoyer la salle actuelle ou vaincre l'élite avant de monter.", threadID, messageID);
            }

            const dungeons = storage.getDungeons();
            const currentDungeon = dungeons.find(d => d.id === run.dungeonId);

            if (run.floor >= currentDungeon.floors) {
                run.state = "COMPLETED";
                storage.savePlayerProfile(senderID, profile);
                return api.sendMessage("🏁 **DONJON TERMINÉ !** Vous avez nettoyé le dernier étage. Utilisez `dungeon claim` pour valider vos gains mythiques !", threadID, messageID);
            }

            run.floor += 1;
            run.room = 1;
            if (run.floor > profile.highestFloor) profile.highestFloor = run.floor;

            storage.savePlayerProfile(senderID, profile);
            return api.sendMessage(`🧗 Vous grimpez un escalier dérobé... Bienvenue à l'**Étage ${run.floor} / ${currentDungeon.floors}**. (Utilisez \`dungeon explore\`)`, threadID, messageID);
        }

        if (subCommand === "chest") {
            if (run.state !== "CHEST") return api.sendMessage("❌ Pas de coffre disponible ici.", threadID, messageID);
            
            const dropRoll = Math.random();
            let bonusLoot = "Potion de Soin Résiduelle";
            if (dropRoll < 0.2) bonusLoot = "Pierre d'Amélioration Brute";
            if (dropRoll < 0.05) bonusLoot = "Artefact du Néant";

            run.lootBox.gold += 500 * run.floor;
            run.lootBox.items.push(bonusLoot);
            run.state = "EXPLORING";
            run.room += 1;

            storage.savePlayerProfile(senderID, profile);
            return api.sendMessage(`🎁 **COFFRE OUVERT !** +${500 * run.floor} Or insérés dans votre boîte temporaire. Vous découvrez aussi un [**${bonusLoot}**] !`, threadID, messageID);
        }

        if (subCommand === "claim") {
            if (run.state !== "COMPLETED" && run.lootBox.gold === 0) {
                return api.sendMessage("❌ Aucun gain à réclamer. Terminez le donjon ou avancez plus loin.", threadID, messageID);
            }

            const earnedGold = run.lootBox.gold;
            const earnedCoins = run.lootBox.coins;

            profile.goldEarned += earnedGold;
            profile.dungeonCoins += earnedCoins;
            profile.xp += run.floor * 150;
            profile.runsCompleted += 1;

            // Transfert des items dans le vrai inventaire persistant
            run.lootBox.items.forEach(itm => {
                const existing = profile.inventory.find(i => i.name === itm);
                if (existing) {
                    existing.qty = (existing.qty || 1) + 1;
                } else {
                    profile.inventory.push({ id: "loot_" + Date.now().toString().slice(-4), name: itm, type: "matériau", effect: 0, qty: 1 });
                }
            });

            // Log de réussite
            storage.logDungeonEvent(profile, "SUCCÈS", `A complété le donjon avec succès (+${earnedGold} Or)`);
            profile.activeRun = null; // Nettoyage de l'instance persistée

            // Passage de niveau
            let lvUpMsg = "";
            const xpNeeded = profile.level * 1200;
            if (profile.xp >= xpNeeded) {
                profile.level += 1;
                profile.maxHp += 25;
                profile.attack += 5;
                profile.defense += 2;
                lvUpMsg = `\n🌟 **LEVEL UP !** Vous passez au niveau **${profile.level}** ! Vos stats augmentent !`;
            }

            storage.savePlayerProfile(senderID, profile);
            return api.sendMessage(`🎁 **RÉCOMPENSES DE RUN ENCAISSÉES :**\n💰 Or : +${formatNum(earnedGold)}\n🪙 Dungeon Coins : +${formatNum(earnedCoins)}\n⭐ XP : +${run.floor * 150}${lvUpMsg}\n🎒 Vos trésors ont été transférés dans votre sacoche !`, threadID, messageID);
        }

        if (subCommand === "leave") {
            profile.activeRun = null;
            storage.savePlayerProfile(senderID, profile);
            return api.sendMessage("🏃 Vous abandonnez l'exploration en cours et fuyez lâchement vers la surface. Tout le loot temporaire est perdu.", threadID, messageID);
    }

  // =========================================================================
        // ❤️ SOINS & SURVIE : HEAL / REVIVE / USE
        // =========================================================================
        if (subCommand === "heal") {
            if (profile.hp >= profile.maxHp) return api.sendMessage("❤️ Votre vitalité est déjà au maximum !", threadID, messageID);
            
            const potion = profile.inventory.find(i => i.id === "pot_hp_01" || i.type === "potion");
            if (!potion || potion.qty <= 0) return api.sendMessage("❌ Vous n'avez plus de Potion de Soin dans votre sacoche. Visitez le `dungeon shop`.", threadID, messageID);

            potion.qty -= 1;
            profile.hp = Math.min(profile.maxHp, profile.hp + 75);
            if (potion.qty === 0) profile.inventory = profile.inventory.filter(i => i.id !== potion.id);

            storage.savePlayerProfile(senderID, profile);
            return api.sendMessage(`🧪 **POTION UTILISÉE :** Vous buvez une Potion de Soin. (+75 HP). Vitalité actuelle : **${profile.hp} / ${profile.maxHp} HP**`, threadID, messageID);
        }

        if (subCommand === "use") {
            const itemId = args[1];
            if (!itemId) return api.sendMessage("💡 Usage: `dungeon use <id_item>`", threadID, messageID);

            const item = profile.inventory.find(i => i.id === itemId);
            if (!item) return api.sendMessage("❌ Objet introuvable dans votre inventaire.", threadID, messageID);

            if (item.type === "potion") {
                item.qty -= 1;
                profile.hp = Math.min(profile.maxHp, profile.hp + (item.effect || 50));
                if (item.qty <= 0) profile.inventory = profile.inventory.filter(i => i.id !== item.id);
                storage.savePlayerProfile(senderID, profile);
                return api.sendMessage(`🧪 Vous avez consommé [**${item.name}**]. Vos HPs remontent !`, threadID, messageID);
            }
            return api.sendMessage("❌ Cet objet ne peut pas être consommé directement.", threadID, messageID);
        }

        // =========================================================================
        // 🗡️ ARSENAL & FORGE : EQUIP / UNEQUIP
        // =========================================================================
        if (subCommand === "equip") {
            const itemId = args[1];
            if (!itemId) return api.sendMessage("💡 Usage: `dungeon equip <id_item>`", threadID, messageID);

            const itemIndex = profile.inventory.findIndex(i => i.id === itemId);
            if (itemIndex === -1) return api.sendMessage("❌ Cet équipement n'est pas dans votre sacoche.", threadID, messageID);

            const item = profile.inventory[itemIndex];
            const validSlots = ["weapon", "armor", "ring"];
            if (!validSlots.includes(item.type)) return api.sendMessage("❌ Cet objet n'est pas une pièce d'équipement valide (weapon, armor, ring).", threadID, messageID);

            // Déséquiper l'ancien s'il existe
            if (profile.equipment[item.type]) {
                const oldItem = profile.equipment[item.type];
                profile.inventory.push(oldItem);
                if (item.type === "weapon") profile.attack -= oldItem.effect;
                if (item.type === "armor") profile.defense -= oldItem.effect;
            }

            // Équiper le nouveau
            profile.equipment[item.type] = item;
            if (item.type === "weapon") profile.attack += item.effect;
            if (item.type === "armor") profile.defense += item.effect;

            profile.inventory.splice(itemIndex, 1);
            storage.savePlayerProfile(senderID, profile);
            return api.sendMessage(`🛡️ **FORGE :** Vous équipez fièrement [**${item.name}**] au slot **${item.type.toUpperCase()}** ! Stats mis à jour.`, threadID, messageID);
        }

        if (subCommand === "unequip") {
            const slot = args[1] ? args[1].toLowerCase() : null;
            if (!slot || !["weapon", "armor", "ring"].includes(slot)) return api.sendMessage("💡 Usage: `dungeon unequip <weapon/armor/ring>`", threadID, messageID);

            if (!profile.equipment[slot]) return api.sendMessage(`❌ Votre emplacement **${slot.toUpperCase()}** est déjà vide.`, threadID, messageID);

            const item = profile.equipment[slot];
            if (slot === "weapon") profile.attack -= item.effect;
            if (slot === "armor") profile.defense -= item.effect;

            profile.equipment[slot] = null;
            profile.inventory.push(item);

            storage.savePlayerProfile(senderID, profile);
            return api.sendMessage(`📦 Vous retirez [**${item.name}**] et le rangez dans votre inventaire.`, threadID, messageID);
        }

        // =========================================================================
        // 🛒 MARCHÉ DES CONGRÉGATIONS : SHOP / BUY / SELL
        // =========================================================================
        if (subCommand === "shop") {
            let shopMsg = `╭───────────────────────────────────────╮\n`;
            shopMsg += `│ 🛒 𝐌𝐀𝐑𝐂𝐇É 𝐃𝐄𝐒 𝐂𝐎𝐍𝐆𝐑É𝐆𝐀𝐓𝐈𝐎𝐍𝐒\n`;
            shopMsg += `├───────────────────────────────────────┤\n`;
            shopMsg += `│ 🔹 [sh_01] **Potion de Soin Majeure**\n`;
            shopMsg += `│    Prix : 150 🪙 | Effet : Recouvre 120 HP\n`;
            shopMsg += `│ 🔹 [sh_02] **Lame en Acier Noir** (weapon)\n`;
            shopMsg += `│    Prix : 1,200 🪙 | Effet : +15 Attaque\n`;
            shopMsg += `│ 🔹 [sh_03] **Cotte de Maille Lourde** (armor)\n`;
            shopMsg += `│    Prix : 1,500 🪙 | Effet : +10 Défense\n`;
            shopMsg += `├───────────────────────────────────────┤\n`;
            shopMsg += `│ 💡 Achetez via: \`dungeon buy <id_shop>\`\n`;
            shopMsg += `╰───────────────────────────────────────╯`;
            return api.sendMessage(shopMsg, threadID, messageID);
        }

        if (subCommand === "buy") {
            const shopId = args[1];
            if (!shopId) return api.sendMessage("💡 Usage: `dungeon buy <id_shop>`", threadID, messageID);

            if (shopId === "sh_01") {
                if (profile.dungeonCoins < 150) return api.sendMessage("❌ Pièces de donjon (Coins) insuffisantes.", threadID, messageID);
                profile.dungeonCoins -= 150;
                profile.inventory.push({ id: "pot_" + Date.now().toString().slice(-4), name: "Potion de Soin Majeure", type: "potion", effect: 120, qty: 1 });
            } else if (shopId === "sh_02") {
                if (profile.dungeonCoins < 1200) return api.sendMessage("❌ Pièces de donjon (Coins) insuffisantes.", threadID, messageID);
                profile.dungeonCoins -= 1200;
                profile.inventory.push({ id: "weap_" + Date.now().toString().slice(-4), name: "Lame en Acier Noir", type: "weapon", effect: 15, qty: 1 });
            } else if (shopId === "sh_03") {
                if (profile.dungeonCoins < 1500) return api.sendMessage("❌ Pièces de donjon (Coins) insuffisantes.", threadID, messageID);
                profile.dungeonCoins -= 1500;
                profile.inventory.push({ id: "arm_" + Date.now().toString().slice(-4), name: "Cotte de Maille Lourde", type: "armor", effect: 10, qty: 1 });
            } else {
                return api.sendMessage("❌ Code d'achat invalide.", threadID, messageID);
            }

            storage.savePlayerProfile(senderID, profile);
            return api.sendMessage("✅ Transaction validée ! L'objet a été livré dans votre inventaire persistant.", threadID, messageID);
        }

        // =========================================================================
        // 🏅 CLASSEMENTS MONDIAUX : LEADERBOARD / TOP
        // =========================================================================
        if (subCommand === "top" || subCommand === "leaderboard") {
            const allPlayers = Object.values(storage.getPlayers());
            allPlayers.sort((a, b) => b.level - a.level);

            let topMsg = `╭───────────────────────────────────────╮\n`;
            topMsg += `│ 🏆 𝐏𝐀𝐍𝐓𝐇É𝐎𝐍 𝐃𝐄𝐒 𝐀𝐕𝐄𝐍𝐓𝐔𝐑𝐈𝐄𝐑𝐒\n`;
            topMsg += `├───────────────────────────────────────┤\n`;
            allPlayers.slice(0, 5).forEach((p, idx) => {
                topMsg += `│ ${idx + 1}. **${p.name}** | Niv.${p.level} | 🏅 Étage Max: ${p.highestFloor}\n`;
            });
            topMsg += `╰───────────────────────────────────────╯`;
            return api.sendMessage(topMsg, threadID, messageID);
        }

        // =========================================================================
        // 🎁 QUÊTES PÉRIODIQUES : DAILY / WEEKLY
        // =========================================================================
        if (subCommand === "daily" || subCommand === "dailyq") {
            if (now - (profile.cooldowns.daily || 0) < 24 * 60 * 60 * 1000) {
                return api.sendMessage("⏳ Votre dotation journalière a déjà été réclamée.", threadID, messageID);
            }
            profile.dungeonCoins += 250;
            profile.stamina = Math.min(profile.maxStamina, profile.stamina + 30);
            profile.cooldowns.daily = now;

            storage.savePlayerProfile(senderID, profile);
            return api.sendMessage("🎁 **BUTIN JOURNALIER :** Vous recevez **+250 Dungeon Coins** 🪙 et **+30 Énergie** ⚡ !", threadID, messageID);
        }

        if (subCommand === "weekly" || subCommand === "weeklyq") {
            if (now - (profile.cooldowns.weekly || 0) < 7 * 24 * 60 * 60 * 1000) {
                return api.sendMessage("⏳ Votre dotation hebdomadaire est encore sous scellé.", threadID, messageID);
            }
            profile.dungeonCoins += 1000;
            profile.keys += 2;
            profile.cooldowns.weekly = now;

            storage.savePlayerProfile(senderID, profile);
            return api.sendMessage("🎁 **COFFRE HEBDOMADAIRE :** Ouverture validée ! **+1,000 Dungeon Coins** 🪙 et **+2 Clés Ancestrales** 🔑 !", threadID, messageID);
        }

        // =========================================================================
        // 🌋 MODE : RAID BOSS MONDIAL COOPÉRATIF
        // =========================================================================
        if (subCommand === "raid") {
            const raid = storage.getRaidState();
            const raidAction = args[1] ? args[1].toLowerCase() : null;

            if (!raidAction) {
                let rMsg = `╭───────────────────────────────────────╮\n`;
                rMsg += `│ 🌋 𝐑𝐀𝐈𝐃 𝐁𝐎𝐒𝐒 𝐌𝐎𝐍𝐃𝐈𝐀𝐋\n`;
                rMsg += `├───────────────────────────────────────┤\n`;
                rMsg += `│ 👹 Cible : **${raid.bossName}** (Niv.${raid.level})\n`;
                rMsg += `│ 📊 Vitalité : **${formatNum(raid.hp)} / ${formatNum(raid.maxHp)} HP**\n`;
                rMsg += `│ 📜 Statut : \`${raid.status}\`\n`;
                rMsg += `├───────────────────────────────────────┤\n`;
                rMsg += `│ ⚔️ Commandes disponibles :\n`;
                rMsg += `│ 🔹 \`dungeon raid attack\` : Engager l'assaut mondial\n`;
                rMsg += `╰───────────────────────────────────────╯`;
                return api.sendMessage(rMsg, threadID, messageID);
            }

            if (raidAction === "attack") {
                if (raid.status !== "ACTIVE" || raid.hp <= 0) return api.sendMessage("❌ Le Boss de Raid actuel a déjà été terrassé ou n'est pas actif.", threadID, messageID);
                if (profile.stamina < 20) return api.sendMessage("❌ Énergie insuffisante ! Déployer une armée de raid coûte **20 ⚡ STAM**.", threadID, messageID);

                profile.stamina -= 20;

                // Calcul des dégâts infligés au boss mondial
                let dmg = Math.floor((profile.attack * 8) * (0.8 + Math.random() * 0.4));
                raid.hp = Math.max(0, raid.hp - dmg);

                // Enregistrement des contributions
                raid.participants[senderID] = (raid.participants[senderID] || 0) + dmg;

                let outcome = `⚔️ **RAID MONDIAL :** Vous rejoignez l'alliance et infligez **${formatNum(dmg)}** points de dégâts à **${raid.bossName}** !\n`;
                
                if (raid.hp <= 0) {
                    raid.status = "DEFEATED";
                    profile.dungeonCoins += 5000; // Bonus immédiat du tueur
                    outcome += `🎉 **LÉGENDE MONDIALE !** Le coup de grâce a été porté ! Le boss s'effondre. Récompenses de participation prêtes pour le prochain cycle !`;
                } else {
                    // Le boss riposte sur le joueur
                    profile.hp = Math.max(10, profile.hp - 35);
                    outcome += `💥 Le monstre se déchaîne et blesse vos troupes en retour (-35 HP).`;
                }

                storage.saveRaidState(raid);
                storage.savePlayerProfile(senderID, profile);
                return api.sendMessage(outcome, threadID, messageID);
            }
        }

        return api.sendMessage("❌ Sous-commande introuvable dans le registre. Tapez `dungeon` pour voir le menu.", threadID, messageID);
    }
};
