/**
 * 🏴‍☠️ SYSTEME DE PIRATES MMORPG SOUVERAIN POUR GOATBOT
 * 👑 FICHIER PRINCIPAL - PARTIE 1 : CONFIGURATION, MENU & ENRÔLEMENT
 * Fichier : pirates.js
 * Emplacement : cmds/pirates.js
 */

const Storage = require("./database/piratesMMO/pirates.storage");
const path = require("path");

// Constantes d'équilibrage et de hiérarchie
const MAX_LEVEL = 50;
const ROLES_PERMS = { "CAPITAINE": 4, "SECOND": 3, "OFFICIER": 2, "PIRATE": 1 };

module.exports = {
    config: {
        name: "pirates",
        version: "1.0.0",
        author: "Gemini MMORPG Engine",
        countDown: 2,
        role: 0,
        description: "Vrai mode de jeu de piraterie MMORPG persistant et interconnecté",
        category: "game",
        guide: { fr: "~pirates [sous-commande]" }
    },

    onStart: async function ({ api, event, args, usersData }) {
        const { threadID, messageID, senderID } = event;
        
        // Extraction et sécurisation du profil utilisateur
        const userData = await usersData.get(senderID) || {};
        const userName = userData.name || "Moussaillon";
        
        let p = Storage.getUserProfile(senderID, userName);
        let users = Storage.getUsers();
        let crews = Storage.getCrews();
        let world = Storage.getWorld();

        const subCommand = args[0]?.toLowerCase();

        // ════════════════════════════════════════════════════════════════════════════════════
        // 📜 MENU PRINCIPAL UNIQUE ET PREMIUM
        // ════════════════════════════════════════════════════════════════════════════════════
        if (!subCommand) {
            let menu = `╭───────────────────────────────────────╮\n`;
            menu += `│ ⚓  ${Storage.toStyle1("𝐒𝐘𝐒𝐓È𝐌𝐄 𝐏𝐈𝐑𝐀𝐓𝐄 𝐌𝐌𝐎𝐑𝐏𝐆")}\n`;
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
            menu += `│ 💰 ${Storage.toStyle1("𝐓𝐑É𝐒𝐎𝐑𝐒  𝐄𝐓  𝐋𝐎𝐎𝐓")}\n`;
            menu += `├───────────────────────────────────────┤\n`;
            menu += `│ 🔹 pirates treasure : Chasse au trésor\n`;
            menu += `│ 🔹 pirates map : Voir ses cartes\n`;
            menu += `│ 🔹 pirates chest : Ouvrir des coffres\n`;
            menu += `│ 🔹 pirates loot : Voir son butin\n`;
            menu += `│ 🔹 pirates bank : Banque pirate\n`;
            menu += `├───────────────────────────────────────┤\n`;
            menu += `│ ⚔️ ${Storage.toStyle1("𝐂𝐎𝐌𝐁𝐀𝐓  𝐄𝐓  𝐏𝐈𝐋𝐋𝐀𝐆𝐄")}\n`;
            menu += `├───────────────────────────────────────┤\n`;
            menu += `│ 🔹 pirates raid : Lancer un raid\n`;
            menu += `│ 🔹 pirates plunder : Piller une cible\n`;
            menu += `│ 🔹 pirates duel @user : Duel pirate\n`;
            menu += `│ 🔹 pirates boss : Affronter un boss\n`;
            menu += `│ 🔹 pirates kraken : Défi Kraken\n`;
            menu += `├───────────────────────────────────────┤\n`;
            menu += `│ 🎯 ${Storage.toStyle1("𝐏𝐑𝐎𝐆𝐑𝐄𝐒𝐒𝐈𝐎𝐍")}\n`;
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

        // Helper de permission dynamique
        const checkCrewPerm = (requiredRole) => {
            if (!p.crewId) return false;
            return (ROLES_PERMS[p.role] || 1) >= ROLES_PERMS[requiredRole];
        };

        // Base de données des îles
        const MARITIME_ZONES = {
            "perdue": { name: "🏝️ Île Perdue", danger: 15, gold: [400, 1200], xp: [30, 80], loot: "bois" },
            "brumeuse": { name: "🌫️ Baie Brumeuse", danger: 30, gold: [800, 2500], xp: [60, 150], loot: "rhum" },
            "corail": { name: "🐚 Lagune du Corail", danger: 45, gold: [1500, 4500], xp: [100, 250], loot: "perles" },
            "volcanique": { name: "🌋 Île Volcanique", danger: 60, gold: [3000, 8000], xp: [180, 400], loot: "fer" },
            "maudite": { name: "🦂 Îles Maudites", danger: 80, gold: [6000, 15000], xp: [300, 700], loot: "reliques" }
        };

        // ROUTAGE CHIRURGICAL PAR SOUS-COMMANDE INDÉPENDANTE
        switch (subCommand) {
            
            case "create": {
                if (p.crewId) return api.sendMessage(`🛑 ${Storage.toStyle2("Vous faites déjà partie d'un équipage.")}`, threadID, messageID);
                const crewName = args.slice(1).join(" ");
                if (!crewName || crewName.length < 3 || crewName.length > 20) {
                    return api.sendMessage(`🛑 ${Storage.toStyle2("Syntaxe : ~pirates create <Nom entre 3 et 20 caractères>")}`, threadID, messageID);
                }

                const crewId = "CRW-" + Math.floor(1000 + Math.random() * 9000);
                crews[crewId] = {
                    id: crewId, name: crewName, emoji: "🏴‍☠️", desc: "Aucune loi sur ce navire.",
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
                Storage.logCrewEvent(crewId, "CREATION", `L'équipage a été fondé par le Capitaine ${userName}.`);

                let render = [
                    `⚓ ${Storage.toStyle2("Faction :")} **${crewName}**`,
                    `🔑 ${Storage.toStyle2("ID Équipage :")} \`${crewId}\``,
                    `🚢 ${Storage.toStyle2("Navire Initial :")} **Sloop [Le Vagabond]**`,
                    ` ───────────────────────`,
                    `✨ _${Storage.toStyle2("Votre piraterie commence ! Recrutez à l'aide de l'ID.")}_`
                ];
                return api.sendMessage(Storage.buildPremiumBox("É𝐐𝐔local𝐈𝐏local𝐀𝐆local𝐄 𝐅local𝐎local𝐍local𝐃localÉ", render), threadID, messageID);
            }

            case "info":
            case "profile": {
                let status = p.crewId ? crews[p.crewId].name : "Sans Équipage";
                let percent = Math.min(100, Math.floor((p.xp / (p.level * 1200)) * 100)) || 0;
                
                let render = [
                    `👤 ${Storage.toStyle2("Pirate :")} **${userName}**`,
                    `🎖️ ${Storage.toStyle2("Niveau :")} **${p.level}** (${p.xp}/${p.level * 1200} XP │ ${percent}%)`,
                    `🏴‍☠️ ${Storage.toStyle2("Flotte :")} **${status}** [Rôle: _${p.role}_]`,
                    `💰 ${Storage.toStyle2("Or Perso :")} **${Storage.formatMoney(p.gold)}**`,
                    `💎 ${Storage.toStyle2("Doublons :")} **${p.doubloons} 💎**`,
                    ` ───────────────────────`,
                    `⚔️ ${Storage.toStyle2("Duels Gagnés :")} ${p.stats.duelsWon} │ 🏝️ ${Storage.toStyle2("Explorations :")} ${p.stats.explorations}`,
                    `📦 ${Storage.toStyle2("Coffres Ouverts :")} ${p.stats.chestsOpened}`
                ];
                return api.sendMessage(Storage.buildPremiumBox("𝐅𝐈𝐂𝐇𝐄 𝐃local𝐄 𝐏local..."), threadID, messageID);
            }

            case "list": {
                let lines = [];
                let i = 1;
                for (const id in crews) {
                    if (i > 5) break;
                    let c = crews[id];
                    lines.push(`[${i}] ${c.emoji} **${c.name}** (\`${c.id}\`)`);
                    lines.push(`   𝖭𝗂𝗏𝖾𝖺𝗎: ${c.level} │ 👥: ${c.membersCount}/${c.membersLimit} │ 🏆 Gloire: ${c.glory}`);
                    lines.push(` ───────────────────────`);
                    i++;
                }
                if(lines.length > 0) lines.pop();
                else lines.push("Aucune faction pirate ne navigue pour le moment.");
                
                return api.sendMessage(Storage.buildPremiumBox("𝐑local𝐄𝐆local𝐈..."), threadID, messageID);
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
                return api.sendMessage(Storage.buildPremiumBox("𝐌𝐄𝐌𝐁𝐑𝐄𝐒 𝐃𝐄 𝐋’𝐄𝐐𝐔𝐈𝐏𝐀𝐆𝐄"), threadID, messageID);
        }

        // ════════════════════════════════════════════════════════════════════════════════════
            // 🚢 SYSTEME DE NAVIRE (INDEPENDANT & NETTOYE)
            // ════════════════════════════════════════════════════════════════════════════════════
            case "ship": {
                if (!p.crewId) return api.sendMessage(`🛑 ${Storage.toStyle2("Vous devez posséder un équipage pour inspecter votre navire principal.")}`, threadID, messageID);
                let c = crews[p.crewId];
                let s = c.ship;

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

                return api.sendMessage(Storage.buildPremiumBox("𝐍𝐀𝐕𝐈𝐑𝐄 𝐃𝐄 𝐋'É𝐐𝐔𝐈𝐏𝐀𝐆𝐄", shipLines), threadID, messageID);
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
                s.hp = s.maxHp;
                s.atk += 10;
                s.def += 8;
                s.speed += 3;

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
                return api.sendMessage(Storage.buildPremiumBox("𝐈𝐍𝐅𝐑𝐀𝐒𝐓𝐑𝐔𝐂𝐓𝐔𝐑𝐄 𝐍𝐀𝐕𝐀𝐋𝐄", upLines), threadID, messageID);
            }

            case "repair": {
                if (!p.crewId) return api.sendMessage("🛑 Vous n'avez pas d'équipage.", threadID, messageID);
                let c = crews[p.crewId];
                let s = c.ship;

                if (s.hp >= s.maxHp) return api.sendMessage("⚓ La coque de votre bâtiment de guerre est déjà intacte.", threadID, messageID);

                let missingHp = s.maxHp - s.hp;
                let cost = missingHp * 15;

                if (p.gold < cost) return api.sendMessage(`🛑 Il vous manque **${Storage.formatMoney(cost - p.gold)}** pour payer les charpentiers du port.`, threadID, messageID);

                p.gold -= cost;
                s.hp = s.maxHp;

                Storage.saveCrews();
                Storage.saveUsers();
                Storage.logCrewEvent(p.crewId, "REPARATION", `Coque entièrement colmatée par le pirate ${userName}.`);

                return api.sendMessage(`🔧 **𝖢𝗁𝖺𝗋𝗉𝖾𝗇𝗍𝖾 :** Coque entièrement réparée pour **${Storage.formatMoney(cost)}**. Vos structures sont opérationnelles !`, threadID, messageID);
            }

            // ════════════════════════════════════════════════════════════════════════════════════
            // 🗺️ NAVIGATION & CARTO (INDEPENDANT & NETTOYE)
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
                return api.sendMessage(Storage.buildPremiumBox("𝐂𝐀𝐑𝐓𝐎𝐆𝐑𝐀𝐏𝐇𝐈𝐄", islandLines), threadID, messageID);
            }

            case "explore":
            case "sail": {
                let now = Date.now();
                if (now - p.cooldowns.explore < 5 * 60 * 1000) {
                    let rem = Math.ceil((5 * 60 * 1000 - (now - p.cooldowns.explore)) / 1000);
                    return api.sendMessage(`⏳ **𝖠𝗇𝗍𝗂-𝖲𝗉𝖺𝗆 :** Vos marins dorment. Attendez **${rem} secondes** avant de lever l'ancre.`, threadID, messageID);
                }

                let targetZoneKey = args[1]?.toLowerCase() || "perdue";
                let zone = MARITIME_ZONES[targetZoneKey];
                if (!zone) return api.sendMessage("🛑 Zone inconnue. Tapez `~pirates islands` pour voir les cibles valides.", threadID, messageID);

                if (p.crewId) {
                    let s = crews[p.crewId].ship;
                    if (s.hp <= 30) return api.sendMessage("🛑 Votre navire d'équipage est trop endommagé pour prendre la mer ! Lancez `~pirates repair`.", threadID, messageID);
                }

                p.cooldowns.explore = now;
                let dice = Math.floor(Math.random() * 100);

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
                        `📉 Impact : Le navire a essuyé des tirs et subit **-${dmg} HP** de dégâts.`,
                        `✨ _Réparez la coque avant qu'il ne sombre._`
                    ];
                    return api.sendMessage(Storage.buildPremiumBox("𝐄𝐗𝐏É𝐃𝐈𝐓𝐈𝐎𝐍 𝐄𝐍 𝐌𝐄𝐑", failLines), threadID, messageID);
                }

                let rewardGold = Math.floor(zone.gold[0] + Math.random() * (zone.gold[1] - zone.gold[0]));
                let rewardXp = Math.floor(zone.xp[0] + Math.random() * (zone.xp[1] - zone.xp[0]));
                let resCount = Math.floor(2 + Math.random() * 5);

                p.gold += rewardGold;
                p.xp += rewardXp;
                p.stats.explorations += 1;

                if (!p.inventory[zone.loot]) p.inventory[zone.loot] = 0;
                p.inventory[zone.loot] += resCount;

                let nextLevelXp = p.level * 1200;
                if (p.xp >= nextLevelXp) {
                    p.level += 1;
                    p.xp = 0;
                }

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

                return api.sendMessage(Storage.buildPremiumBox("𝐁𝐔𝐓𝐈𝐍 𝐃𝐄 𝐌𝐄𝐑", winLines), threadID, messageID);
                            }
