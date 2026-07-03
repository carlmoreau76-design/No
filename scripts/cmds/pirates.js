/**
 * 🏴‍☠️ SYSTEME DE PIRATES MMORPG SOUVERAIN POUR GOATBOT
 * 👑 CONTROLEUR ROUTEUR CENTRAL & GESTION DES EQUIPAGES (PARTIE 1)
 * Fichier : pirates.js
 */

const Storage = require("./database/piratesMMO/pirates.storage");
const path = require("path");

// Définition des constantes d'équilibrage MMORPG
const MAX_LEVEL = 50;
const ROLES_PERMS = { "CAPITAINE": 4, "SECOND": 3, "OFFICIER": 2, "PIRATE": 1 };

module.exports = {
    config: {
        name: "pirates",
        version: "1.0.0",
        author: "Gemini MMORPG Engine",
        countDown: 2,
        role: 0,
        description: "Vrai mode de jeu de piraterie MMORPG persistant",
        category: "game",
        guide: { fr: "~pirates [sous-commande]" }
    },

    onStart: async function ({ api, event, args, usersData }) {
        const { threadID, messageID, senderID } = event;
        
        // Initialisation ou extraction du profil de l'utilisateur émetteur
        const userData = await usersData.get(senderID) || {};
        const userName = userData.name || "Moussaillon";
        
        let p = Storage.getUserProfile(senderID, userName);
        let users = Storage.getUsers();
        let crews = Storage.getCrews();
        let world = Storage.getWorld();

        const subCommand = args[0]?.toLowerCase();

        // ════════════════════════════════════════════════════════════════════════════════════
        // 📜 INTERFACE UNIFIÉE DU MENU PRINCIPAL HAUT DE GAMME
        // ════════════════════════════════════════════════════════════════════════════════════
        if (!subCommand) {
            let menu = `╭───────────────────────────────────────╮\n`;
            menu += `│ ⚓  ${Storage.toStyle1("𝐒𝐘𝐒𝐓È𝐌𝐄 𝐏local𝐈𝐑𝐀𝐓local𝐄 𝐌𝐌local𝐎𝐑𝐏𝐆")}\n`;
            menu += `├───────────────────────────────────────┤\n`;
            menu += `│ 🔹 pirates create <nom> : Fonder un équipage\n`;
            menu += `│ 🔹 pirates info : Voir la fiche de pirate\n`;
            menu += `│ 🔹 pirates list : Voir les équipages\n`;
            menu += `│ 🔹 pirates join <id> : Rejoindre un équipage\n`;
            menu += `│ 🔹 pirates leave : Quitter l'équipage\n`;
            menu += `│ 🔹 pirates members : Voir les membres\n`;
            menu += `├───────────────────────────────────────┤\n`;
            menu += `│ 🚢 ${Storage.toStyle1("𝐍𝐀𝐕𝐈𝐑𝐄  𝐄𝐓  𝐌𝐄𝐑")}\n`;
            menu += `├───────────────────────────────────────┤\n`;
            menu += `│ 🔹 pirates ship : Voir son navire\n`;
            menu += `│ 🔹 pirates ship upgrade : Améliorer le navire\n`;
            menu += `│ 🔹 pirates ship repair : Réparer les dégâts\n`;
            menu += `│ 🔹 pirates sail : Prendre la mer\n`;
            menu += `│ 🔹 pirates explore : Explorer les îles\n`;
            menu += `│ 🔹 pirates islands : Voir les zones maritimes\n`;
            menu += `├───────────────────────────────────────┤\n`;
            menu += `│ 💰 ${Storage.toStyle1("𝐓𝐑É𝐒local𝐎𝐑𝐒  𝐄𝐓  𝐋local𝐎local𝐎𝐓")}\n`;
            menu += `├───────────────────────────────────────┤\n`;
            menu += `│ 🔹 pirates treasure : Chasse au trésor\n`;
            menu += `│ 🔹 pirates map : Voir ses cartes\n`;
            menu += `│ 🔹 pirates chest : Ouvrir des coffres\n`;
            menu += `│ 🔹 pirates loot : Voir son butin\n`;
            menu += `│ 🔹 pirates bank : Banque pirate\n`;
            menu += `├───────────────────────────────────────┤\n`;
            menu += `│ ⚔️ ${Storage.toStyle1("𝐂local𝐎𝐌𝐁𝐀𝐓  𝐄𝐓  𝐏local𝐈𝐋𝐋local𝐀𝐆𝐄")}\n`;
            menu += `├───────────────────────────────────────┤\n`;
            menu += `│ 🔹 pirates raid : Lancer un raid\n`;
            menu += `│ 🔹 pirates plunder : Piller une cible\n`;
            menu += `│ 🔹 pirates duel @user : Duel pirate\n`;
            menu += `│ 🔹 pirates boss : Affronter un boss\n`;
            menu += `│ 🔹 pirates kraken : Défi Kraken\n`;
            menu += `├───────────────────────────────────────┤\n`;
            menu += `│ 🎯 ${Storage.toStyle1("𝐏𝐑local𝐎𝐆𝐑𝐄𝐒𝐒local𝐈local𝐎𝐍")}\n`;
            menu += `├───────────────────────────────────────┤\n`;
            menu += `│ 🔹 pirates daily : Bonus quotidien\n`;
            menu += `│ 🔹 pirates work : Petit job pirate\n`;
            menu += `│ 🔹 pirates missions : Missions disponibles\n`;
            menu += `│ 🔹 pirates achievements : Succès\n`;
            menu += `│ 🔹 pirates top : Classement\n`;
            menu += `│ 🔹 pirates profile : Profil pirate\n`;
            menu += `╰───────────────────────────────────────╯`;
            return api.sendMessage(menu, threadID, messageID);
        }

        // Helper interne pour valider les rangs de commandement
        const checkCrewPerm = (requiredRole) => {
            if (!p.crewId) return false;
            return (ROLES_PERMS[p.role] || 1) >= ROLES_PERMS[requiredRole];
        };

        // EXÉCUTION DES SOUS-COMMANDES D'ÉQUIPAGE
        switch (subCommand) {
            case "create": {
                if (p.crewId) return api.sendMessage(`🛑 ${Storage.toStyle2("𝖵𝗈𝗎𝗌 𝖿𝖺𝗂𝗍𝖾𝗌 𝖽é𝗃à 𝗉𝖺𝗋𝗍𝗂𝖾 𝖽'𝗎𝗇 é𝗊𝗎𝗂𝗉𝖺𝗀𝖾.")}`, threadID, messageID);
                const crewName = args.slice(1).join(" ");
                if (!crewName || crewName.length < 3 || crewName.length > 20) {
                    return api.sendMessage(`🛑 ${Storage.toStyle2("𝖲𝗒𝗇𝗍𝖺𝗑𝖾 : ~𝗉𝗂𝗋𝖺𝗍𝖾𝗌 𝖼𝗋𝖾𝖺𝗍𝖾 <𝖭𝗈𝗆 𝖾𝗇𝗍𝗋𝖾 𝟥 𝖾𝗍 𝟤𝟢 𝖼𝗁𝖺𝗋𝗌>")}`, threadID, messageID);
                }

                const crewId = "CRW-" + Math.floor(1000 + Math.random() * 9000);
                crews[crewId] = {
                    id: crewId, name: crewName, emoji: "🏴‍☠️", desc: "𝖠𝗎𝖼𝗎𝗇𝖾 𝗋è𝗀𝗅𝖾 𝗌𝗎𝗋 𝖼𝖾 𝗇𝖺𝗏𝗂𝗋𝖾.",
                    captain: senderID, created: Date.now(), level: 1, xp: 0, glory: 0, reputation: 0,
                    vault: 5000, membersCount: 1, membersLimit: 10, logs: [], achievements: [],
                    stats: { totalRaids: 0, totalTreasures: 0, bossKilled: 0 },
                    ship: {
                        name: "Le Vagabond", class: "Sloop", level: 1, hp: 200, maxHp: 200,
                        atk: 35, def: 15, speed: 20, cargo: 100, durability: 100, skins: ["default"], equippedSkin: "default"
                    }
                };

                p.crewId = crewId;
                p.role = "CAPITAINE";

                Storage.saveCrews();
                Storage.saveUsers();
                Storage.logCrewEvent(crewId, "CREATION", `𝖫'é𝗊𝗎𝗂𝗉𝖺𝗀𝖾 𝖺 é𝗍é 𝖿𝗈𝗇𝖽é 𝗉𝖺𝗋 𝗅𝖾 𝖢𝖺𝗉𝗂𝗍𝖺𝗂𝗇𝖾 ${userName}.`);

                let render = [
                    `⚓ ${Storage.toStyle2("𝖥𝖺𝖼𝗍𝗂𝗈𝗇 :")} **${crewName}**`,
                    `🔑 ${Storage.toStyle2("𝖨𝖣 𝖠𝗅𝗅𝗂𝖺𝗇𝖼𝖾 :")} \`${crewId}\``,
                    `🚢 ${Storage.toStyle2("𝖭𝖺𝖏𝗂𝗋𝖾 𝖨𝗇𝗂𝗍𝗂𝖺𝗅 :")} **𝖲𝗅𝗈𝗈𝗉 [𝖫𝖾 𝖵𝖺𝗀𝖺𝖻𝗈𝗇𝗏]**`,
                    ` ───────────────────────`,
                    `✨ _${Storage.toStyle2("𝖵𝗈𝗍𝗋𝖾 𝗉𝗂𝗋𝖺𝗍𝖾𝗋𝗂𝖾 𝖼𝗈𝗆𝗆𝖾𝗇𝖼𝖾 ! 𝖱𝖾𝖼𝗋𝗎𝗍𝖾𝗓 à 𝗅'𝖺𝗂𝖽𝖾 𝖽𝖾 𝗅'𝖨𝖣.")}_`
                ];
                return api.sendMessage(Storage.buildPremiumBox("É𝐐𝐔𝐈𝐏𝐀𝐆𝐄 𝐅𝐎𝐍𝐃É", render), threadID, messageID);
            }

            case "info":
            case "profile": {
                let status = p.crewId ? crews[p.crewId].name : "Sans Équipage";
                let percent = Math.min(100, Math.floor((p.xp / (p.level * 1200)) * 100)) || 0;
                
                let render = [
                    `👤 ${Storage.toStyle2("𝖯𝗂𝗋𝖺𝗍𝖾 :")} **${userName}**`,
                    `🎖️ ${Storage.toStyle2("𝖭𝗂𝗏𝖾𝖺𝗎 :")} **${p.level}** (${p.xp}/${p.level * 1200} XP │ ${percent}%)`,
                    `🏴‍☠️ ${Storage.toStyle2("𝖥𝗅𝗈𝗍𝗍𝖾 :")} **${status}** [Rôle: _${p.role}_]`,
                    `💰 ${Storage.toStyle2("𝖮𝗋 𝖯𝖾𝗋𝗌𝗈 :")} **${Storage.formatMoney(p.gold)}**`,
                    `🪙 ${Storage.toStyle2("𝖣𝗈𝗎𝖻𝗅𝗈𝗇𝗌 :")} **${p.doubloons} 💎**`,
                    ` ───────────────────────`,
                    `⚔️ ${Storage.toStyle2("𝖣𝗎𝖾𝗅𝗌 𝖦𝖺𝗀𝗇é𝗌 :")} ${p.stats.duelsWon} │ 🏝️ ${Storage.toStyle2("𝖤𝗑𝗉𝗅𝗈𝗋𝖺𝗍𝗂𝗈𝗇𝗌 :")} ${p.stats.explorations}`,
                    `📦 ${Storage.toStyle2("𝖢𝗈𝖿𝖿𝗋𝖾𝗌 𝖮𝗎𝗏𝖾𝗋𝗍𝗌 :")} ${p.stats.chestsOpened}`
                ];
                return api.sendMessage(Storage.buildPremiumBox("𝐅𝐈𝐂𝐇𝐄 𝐃local𝐄 𝐏local𝐈𝐑local𝐀𝐓local𝐄", render), threadID, messageID);
            }

            case "list": {
                let lines = [];
                let i = 1;
                for (const id in crews) {
                    if (i > 6) break;
                    let c = crews[id];
                    lines.push(`[${i}] ${c.emoji} **${c.name}** (\`${c.id}\`)`);
                    lines.push(`   𝖭𝗂𝗏𝖾𝖺𝗎: ${c.level} │ 👥: ${c.membersCount}/${c.membersLimit} │ 🏆 Gloire: ${c.glory}`);
                    lines.push(` ───────────────────────`);
                    i++;
                }
                if(lines.length > 0) lines.pop();
                else lines.push("Aucune faction pirate ne navigue pour le moment.");
                
                return api.sendMessage(Storage.buildPremiumBox("𝐑local𝐄𝐆local𝐈𝐒𝐓𝐑local𝐄 𝐃local𝐄𝐒 𝐍local𝐀𝐕local𝐈𝐑local𝐄𝐒", lines), threadID, messageID);
            }

            case "join": {
                if (p.crewId) return api.sendMessage("🛑 Quittez d'abord votre équipage actuel.", threadID, messageID);
                const targetId = args[1];
                if (!targetId) return api.sendMessage("🛑 Spécifiez l'ID de l'équipage.", threadID, messageID);

                let c = crews[targetId];
                if (!c) return api.sendMessage("🛑 Équipage introuvable.", threadID, messageID);
                if (c.membersCount >= c.membersLimit) return api.sendMessage("🛑 Le navire de cet équipage est complet.", threadID, messageID);

                p.crewId = targetId;
                p.role = "PIRATE";
                c.membersCount += 1;

                Storage.saveCrews();
                Storage.saveUsers();
                Storage.logCrewEvent(targetId, "RECRUTEMENT", `Le matelot ${userName} a rejoint les rangs.`);

                return api.sendMessage(`⚓ **𝖤𝗇𝗋ô𝗅𝖾𝗆𝖾𝗇𝗍 :** Vous faites désormais partie de l'équipage **${c.name}** !`, threadID, messageID);
            }

            case "leave": {
                if (!p.crewId) return api.sendMessage("🛑 Vous n'avez pas d'équipage.", threadID, messageID);
                let c = crews[p.crewId];
                if (c.captain === senderID) return api.sendMessage("🛑 Un capitaine ne peut pas fuir. Utilisez `~pirates disband` pour dissoudre l'équipage.", threadID, messageID);

                const oldId = p.crewId;
                c.membersCount -= 1;
                p.crewId = null;
                p.role = "PIRATE";

                Storage.saveCrews();
                Storage.saveUsers();
                Storage.logCrewEvent(oldId, "MUTINERIE", `Le pirate ${userName} a déserté le navire.`);

                return api.sendMessage("🍃 Vous avez pris une barque et déserté votre équipage.", threadID, messageID);
            }

            case "members": {
                if (!p.crewId) return api.sendMessage("🛑 Vous n'avez pas de faction pirate.", threadID, messageID);
                let c = crews[p.crewId];
                let lines = [`🚢 Équipage : **${c.name}** (${c.membersCount}/${c.membersLimit})\n───────────────────`];
                
                Object.values(users).forEach(u => {
                    if (u.crewId === p.crewId) {
                        lines.push(`• [${u.role}] **${u.name}** │ Niv.${u.level}`);
                    }
                });
                return api.sendMessage(Storage.buildPremiumBox("𝐌local𝐈𝐄𝐌local𝐁𝐑local𝐄𝐒 𝐃'É𝐐𝐔local𝐈𝐏local𝐀𝐆local𝐄", lines), threadID, messageID);
            }
            
            // Redirection transparente vers la suite de l'infrastructure
            default:
                return module.exports.onStartNext({ api, event, args, p, users, crews, world, subCommand, userName, checkCrewPerm });
        }

/**
     * 🚢 EXTENSION SYSTEME DE NAVIRE & CARTOGRAPHIE (PARTIE 2)
     */
    onStartNext: async function ({ api, event, args, p, users, crews, world, subCommand, userName, checkCrewPerm }) {
        const { threadID, messageID, senderID } = event;

        // Base de données locale des zones d'exploration maritime
        const MARITIME_ZONES = {
            "perdue": { name: "🏝️ Île Perdue", danger: 15, gold: [400, 1200], xp: [30, 80], loot: "bois" },
            "brumeuse": { name: "🌫️ Baie Brumeuse", danger: 30, gold: [800, 2500], xp: [60, 150], loot: "rhum" },
            "corail": { name: "🐚 Lagune du Corail", danger: 45, gold: [1500, 4500], xp: [100, 250], loot: "perles" },
            "volcanique": { name: "🌋 Île Volcanique", danger: 60, gold: [3000, 8000], xp: [180, 400], loot: "fer" },
            "maudite": { name: "🦂 Îles Maudites", danger: 80, gold: [6000, 15000], xp: [300, 700], loot: "reliques" }
        };

        switch (subCommand) {
            // ════════════════════════════════════════════════════════════════════════════════════
            // 🚢 SYSTEME DE NAVIRE D'EQUIPAGE
            // ════════════════════════════════════════════════════════════════════════════════════
            case "ship": {
                if (!p.crewId) return api.sendMessage(`🛑 ${Storage.toStyle2("Vous devez posséder un équipage pour inspecter votre navire principal.")}`, threadID, messageID);
                let c = crews[p.crewId];
                let s = c.ship;

                // Calcul visuel de l'état de la coque (Jauge de durabilité textuelle)
                let pct = Math.min(100, Math.floor((s.hp / s.maxHp) * 100));
                let blocks = Math.round((pct / 100) * 10);
                let hpBar = "🟩".repeat(blocks) + "🟥".repeat(10 - blocks);

                let shipLines = [
                    `🚢 ${Storage.toStyle2("Nom :")} **${s.name}**`,
                    `🔱 ${Storage.toStyle2("Classe :")} **${s.class} (Niv.${s.level})**`,
                    ` ───────────────────────`,
                    `❤️ ${Storage.toStyle2("Coque :")} [${hpBar}] ${pct}% (${s.hp}/${s.maxHp} HP)`,
                    `💥 ${Storage.toStyle2("Canons (ATK) :")} **${s.atk}** │ 🛡️ ${Storage.toStyle2("Blindage (DEF) :")} **${s.def}**`,
                    `💨 ${Storage.toStyle2("Voiles (SPEED) :")} **${s.speed} nœuds**`,
                    `📦 ${Storage.toStyle2("Soute (Cargo) :")} **${s.cargo} kg**`,
                    `⚙️ ${Storage.toStyle2("État Général :")} _${s.hp <= 50 ? "⚠️ Dommages Critiques" : "⚓ Prêt à naviguer"}_`
                ];

                return api.sendMessage(Storage.buildPremiumBox("𝐍local𝐀𝐕local𝐈𝐑local𝐄 𝐃local𝐄 𝐋'É𝐐𝐔local𝐈𝐏local𝐀𝐆local𝐄", shipLines), threadID, messageID);
            }

            case "upgrade": {
                if (!p.crewId) return api.sendMessage("🛑 Vous n'avez pas d'équipage.", threadID, messageID);
                if (!checkCrewPerm("OFFICIER")) return api.sendMessage("🛑 Grade d'Officier minimum requis pour améliorer le navire.", threadID, messageID);

                let c = crews[p.crewId];
                let s = c.ship;
                
                if (s.level >= MAX_LEVEL) return api.sendMessage("🔱 Votre navire a atteint le niveau maximal d'architecture navale.", threadID, messageID);
                
                let cost = s.level * 15000;
                if (c.vault < cost) return api.sendMessage(`🛑 Fonds insuffisants dans le Trésor d'Équipage. Il faut **${Storage.formatMoney(cost)}**.`, threadID, messageID);

                c.vault -= cost;
                s.level += 1;
                s.maxHp += 50;
                s.hp = s.maxHp; // Restauration automatique
                s.atk += 10;
                s.def += 8;
                s.speed += 3;

                // Évolution visuelle automatique de la classe du bâtiment de guerre
                if (s.level === 10) s.class = "Brigantin";
                if (s.level === 25) s.class = "Frégate";
                if (s.level === 45) s.class = "Galion Impérial";

                Storage.saveCrews();
                Storage.logCrewEvent(p.crewId, "AMELIORATION", `Le navire a été amélioré au niveau ${s.level} (${s.class}).`);

                let upLines = [
                    `🎉 **${s.name}** ${Storage.toStyle2("a été amélioré au niveau")} **${s.level}** !`,
                    `⚙️ ${Storage.toStyle2("Nouvelle Classe :")} **${s.class}**`,
                    ` ───────────────────────`,
                    `💰 ${Storage.toStyle2("Financement :")} -${Storage.formatMoney(cost)} (Retirés du Trésor)`,
                    `❤️ Max HP : **${s.maxHp}** │ 💥 Canons : **+10 ATK**`
                ];
                return api.sendMessage(Storage.buildPremiumBox("𝐈𝐍𝐅𝐑local𝐀𝐒𝐓𝐑local𝐔𝐂𝐓𝐔𝐑local𝐄 𝐍local𝐀𝐕local𝐀local𝐋local𝐄", upLines), threadID, messageID);
            }

            case "repair": {
                if (!p.crewId) return api.sendMessage("🛑 Vous n'avez pas d'équipage.", threadID, messageID);
                let c = crews[p.crewId];
                let s = c.ship;

                if (s.hp >= s.maxHp) return api.sendMessage("⚓ La coque de votre bâtiment de guerre est déjà intacte.", threadID, messageID);

                let missingHp = s.maxHp - s.hp;
                let cost = missingHp * 15; // 15 pièces d'or par point de structure manquant

                if (p.gold < cost) return api.sendMessage(`🛑 Il vous manque **${Storage.formatMoney(cost - p.gold)}** personnellement pour payer les charpentiers du port.`, threadID, messageID);

                p.gold -= cost;
                s.hp = s.maxHp;

                Storage.saveCrews();
                Storage.saveUsers();
                Storage.logCrewEvent(p.crewId, "REPARATION", `Coque entièrement colmatée par le pirate ${userName}.`);

                return api.sendMessage(`🔧 **𝖢𝗁𝖺𝗋𝗉𝖾𝗇𝗍𝖾 :** Coque entièrement réparée pour **${Storage.formatMoney(cost)}**. Vos structures sont de nouveau opérationnelles !`, threadID, messageID);
            }

            // ════════════════════════════════════════════════════════════════════════════════════
            // 🗺️ NAVIGATION & RECHERCHe D'ÎLES
            // ════════════════════════════════════════════════════════════════════════════════════
            case "islands": {
                let islandLines = [
                    `🗺️ **𝖢𝖺𝗋𝗍𝗈𝗀𝗋𝖺𝗉𝗁𝗂𝖾 𝖽𝖾𝗌 𝖬𝖾𝗋𝗌 𝖢𝗈𝗇𝗇𝗎𝖾𝗌**`,
                    ` ───────────────────────`
                ];
                for (const key in MARITIME_ZONES) {
                    let z = MARITIME_ZONES[key];
                    islandLines.push(`${z.name} │ ⚠️ Danger : **${z.danger}%**`);
                    islandLines.push(`   Ressource : _${z.loot.toUpperCase()}_ │ 💰 Butin moyen : ${z.gold[0]}-${z.gold[1]}`);
                    islandLines.push(` ───────────────────────`);
                }
                if (islandLines.length > 2) islandLines.pop();
                return api.sendMessage(Storage.buildPremiumBox("𝐂local𝐀𝐑𝐓local𝐎𝐆𝐑local𝐀𝐏𝐇local𝐈local𝐄", islandLines), threadID, messageID);
            }

            case "explore":
            case "sail": {
                let now = Date.now();
                if (now - p.cooldowns.explore < 5 * 60 * 1000) {
                    let rem = Math.ceil((5 * 60 * 1000 - (now - p.cooldowns.explore)) / 1000);
                    return api.sendMessage(`⏳ **𝖠𝗇𝗍𝗂-𝖲𝗉𝖺𝗆 :** Vos marins dorment en soute. Attendez **${rem} secondes** avant de lever l'ancre.`, threadID, messageID);
                }

                // Sélection intelligente de la zone selon les arguments fournis
                let targetZoneKey = args[1]?.toLowerCase() || "perdue";
                let zone = MARITIME_ZONES[targetZoneKey];
                if (!zone) return api.sendMessage("🛑 Zone inconnue. Tapez `~pirates islands` pour voir les cibles valides.", threadID, messageID);

                // Validation de sécurité liée aux dégâts du navire d'équipage
                if (p.crewId) {
                    let s = crews[p.crewId].ship;
                    if (s.hp <= 30) return api.sendMessage("🛑 Votre navire d'équipage est trop endommagé pour prendre la mer ! Lancez `~pirates ship repair`.", threadID, messageID);
                }

                p.cooldowns.explore = now;
                let dice = Math.floor(Math.random() * 100);

                // SCÉNARIO 1 : Embuscade ou Tempête violente (Échec)
                if (dice < zone.danger) {
                    let dmg = Math.floor(15 + Math.random() * 30);
                    if (p.crewId) {
                        crews[p.crewId].ship.hp = Math.max(10, crews[p.crewId].ship.hp - dmg);
                        Storage.saveCrews();
                    }
                    Storage.saveUsers();
                    
                    let failLines = [
                        `🌊 **𝖳𝖾𝗆𝗉ê𝗍𝖾 𝗈𝗎 𝖤𝗆𝖻𝗎𝗌𝖼𝖺𝖽𝖾 !**`,
                        ` ───────────────────────`,
                        `💥 Situation : Votre expédition vers **${zone.name}** a échoué.`,
                        `📉 Impact : Le navire a essuyé des tirs et subit **-${dmg} HP** de dégâts structural.`,
                        `✨ _Réparez la coque avant qu'il ne sombre._`
                    ];
                    return api.sendMessage(Storage.buildPremiumBox("𝐄𝐗𝐏localÉ𝐃local𝐈𝐓local𝐈local𝐎𝐍 𝐄𝐍 𝐌local𝐄𝐑", failLines), threadID, messageID);
                }

                // SCÉNARIO 2 : Succès de l'expédition (Calcul des gains et stockage)
                let rewardGold = Math.floor(zone.gold[0] + Math.random() * (zone.gold[1] - zone.gold[0]));
                let rewardXp = Math.floor(zone.xp[0] + Math.random() * (zone.xp[1] - zone.xp[0]));
                let resCount = Math.floor(2 + Math.random() * 5);

                p.gold += rewardGold;
                p.xp += rewardXp;
                p.stats.explorations += 1;

                // Enregistrement des matières premières dans l'inventaire persistant
                if (!p.inventory[zone.loot]) p.inventory[zone.loot] = 0;
                p.inventory[zone.loot] += resCount;

                // Système de Level-Up persistant du pirate
                let nextLevelXp = p.level * 1200;
                if (p.xp >= nextLevelXp) {
                    p.level += 1;
                    p.xp = 0;
                }

                // Chance aléatoire d'exhumer une carte au trésor cryptée
                let foundMap = Math.random() > 0.70;
                if (foundMap) {
                    p.inventory.treasure_map_common = (p.inventory.treasure_map_common || 0) + 1;
                }

                Storage.saveUsers();

                let winLines = [
                    `🗺️ **${zone.name} ${Storage.toStyle2("explorée avec succès !")}**`,
                    ` ───────────────────────`,
                    `💰 ${Storage.toStyle2("Or pillé :")} **+${Storage.formatMoney(rewardGold)}**`,
                    `✨ ${Storage.toStyle2("Expérience :")} **+${rewardXp} XP**`,
                    `📦 ${Storage.toStyle2("Ressources :")} **+${resCount} unités de ${zone.loot.toUpperCase()}**`,
                    foundMap ? `🗺️ **💡 Découverte : Vous avez trouvé une Carte au Trésor !**` : `🍃 Aucun artefact rare exhumé.`
                ];

                return api.sendMessage(Storage.buildPremiumBox("𝐁local𝐔𝐓local𝐈𝐍 𝐃local𝐄 𝐌local𝐄𝐑", winLines), threadID, messageID);
            }
            
            default:
                return module.exports.onStartCombat({ api, event, args, p, users, crews, world, subCommand, userName, checkCrewPerm });
        }
      
