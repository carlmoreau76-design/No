/**
 * ⚔️ SYSTÈME DE GUILDES MMORPG POUR GOATBOT
 * ⚔️ MOTEUR AUTOMATISÉ DE GUERRE ET DE COMBAT PLANÉTAIRE (CYCLE 18H)
 * Fichier : guild.war.js
 */

const Storage = require("./guild.storage");
const Utils = require("./guild.utils");

const SIGNUP_DURATION = 30 * 60 * 1000; // 30 minutes d'enrôlement
const BATTLE_DURATION = 30 * 60 * 1000; // 30 minutes de guerre active
const ATTACK_COOLDOWN = 45 * 1000;      // Cooldown anti-spam de 45 secondes par joueur

const WarSystem = {
    /**
     * Boucle d'actualisation centrale du statut de la guerre (Appelée périodiquement à chaque exécution de commande)
     */
    updateWarState: () => {
        let war = Storage.getWar();
        const now = Date.now();

        if (now >= war.nextCycle) {
            // Transition d'état ou initialisation d'une nouvelle guerre
            if (war.phase === "idle") {
                WarSystem.initiateNewWar(war, now);
            } else if (war.phase === "signup") {
                WarSystem.startBattlePhase(war, now);
            } else if (war.phase === "battle") {
                WarSystem.resolveWar(war, now);
            }
        }
    },

    initiateNewWar: (war, now) => {
        const guilds = Storage.getGuilds();
        const guildIds = Object.keys(guilds);

        if (guildIds.length < 2) {
            // Pas assez de factions pour déclarer une guerre mondiale, on repousse le cycle
            war.nextCycle = now + 4 * 60 * 60 * 1000; 
            war.phase = "idle";
            Storage.saveWar(war);
            return;
        }

        // Sélection aléatoire de guildes pour le matchmaking
        let participants = [...guildIds].sort(() => 0.5 - Math.random()).slice(0, 4);
        if (participants.length % 2 !== 0) participants.pop(); // Paire obligatoire pour les duels

        war.phase = "signup";
        war.nextCycle = now + SIGNUP_DURATION;
        war.participants = participants;
        war.rosters = {};
        war.scores = {};
        war.damage = {};
        war.playerStats = {};

        participants.forEach(gId => {
            war.rosters[gId] = [];
            war.scores[gId] = 0;
            war.damage[gId] = 0;
        });

        Storage.saveWar(war);
        
        // Envoi des logs globaux
        participants.forEach(gId => {
            Storage.logEvent(gId, "WAR_SIGNUP", "📢 Un conflit planétaire approche ! Les inscriptions au peloton sont ouvertes pour 30 min (~guild war join).");
        });
    },

    startBattlePhase: (war, now) => {
        war.phase = "battle";
        war.nextCycle = now + BATTLE_DURATION;
        Storage.saveWar(war);

        war.participants.forEach(gId => {
            Storage.logEvent(gId, "WAR_BATTLE", "⚔️ La phase de combat est ouverte ! Frappez les lignes ennemies immédiatement avec ~guild war attack !");
        });
    },

    resolveWar: (war, now) => {
        const guilds = Storage.getGuilds();
        const territories = Storage.getTerritories();
        let matches = [];

        for (let i = 0; i < war.participants.length; i += 2) {
            if (war.participants[i] && war.participants[i+1]) {
                matches.push([war.participants[i], war.participants[i+1]]);
            }
        }

        matches.forEach(([g1, g2]) => {
            const s1 = war.scores[g1] || 0;
            const s2 = war.scores[g2] || 0;
            const name1 = guilds[g1]?.name || "Faction Déchue";
            const name2 = guilds[g2]?.name || "Faction Déchue";

            let winner = null;
            let loser = null;

            if (s1 > s2) { winner = g1; loser = g2; }
            else if (s2 > s1) { winner = g2; loser = g1; }
            else {
                // Égalité : Brise-égalité au niveau ou à la pièce de monnaie
                winner = (guilds[g1]?.level || 0) >= (guilds[g2]?.level || 0) ? g1 : g2;
                loser = winner === g1 ? g2 : g1;
            }

            // --- TRAITEMENT DU GAGNANT ---
            if (guilds[winner]) {
                guilds[winner].wins += 1;
                guilds[winner].trophies += 25;
                const winXp = 500 * guilds[winner].level;
                const winGold = 200000 * guilds[winner].level;
                guilds[winner].xp += winXp;
                guilds[winner].bank += winGold;

                // Trophée et capture territoriale aléatoire (15% de chance de subtiliser une zone libre/adverse)
                if (Math.random() < 0.15) {
                    const zones = Object.keys(territories);
                    const targetZone = zones[Math.floor(Math.random() * zones.length)];
                    if (territories[targetZone] && territories[targetZone].owner !== winner) {
                        territories[targetZone].owner = winner;
                        territories[targetZone].history.unshift(`Capturé suite à la victoire écrasante contre ${guilds[loser]?.name || 'l\'ennemi'}.`);
                        Storage.logEvent(winner, "TERRITORY", `🌍 Conquête ! Votre guilde s'empare du territoire : ${territories[targetZone].name}.`);
                    }
                }
                
                Storage.logEvent(winner, "WAR_VICTORY", `🏆 VICTOIRE ÉPIQUE contre ${guilds[loser]?.name} ! Score: ${war.scores[winner]} vs ${war.scores[loser]}. Gains: +${Utils.formatMoney(winGold)} | +${winXp} XP.`);
            }

            // --- TRAITEMENT DU PERDANT (SÉCURISÉ SANS TOUCHER L'ARGENT PERSO) ---
            if (guilds[loser]) {
                guilds[loser].losses += 1;
                guilds[loser].trophies = Math.max(0, guilds[loser].trophies - 12);
                
                // Retrait passif punitif de 5% de la banque de guilde uniquement
                const penalty = Math.floor(guilds[loser].bank * 0.05);
                guilds[loser].bank = Math.max(0, guilds[loser].bank - penalty);
                
                Storage.logEvent(loser, "WAR_DEFEAT", `💀 DÉFAITE AMÈRE face à ${guilds[winner]?.name}. Score: ${war.scores[loser]} vs ${war.scores[winner]}. Pénalité de coffre: -${Utils.formatMoney(penalty)}.`);
            }
        });

        // Archivage de l'historique de la guerre
        war.phase = "idle";
        war.nextCycle = now + 18 * 60 * 60 * 1000; // Repart pour 18h de trêve
        war.history.unshift({
            time: now,
            summary: matches.map(([g1, g2]) => `${guilds[g1]?.name || 'Inconnu'} (${war.scores[g1]}) vs ${guilds[g2]?.name || 'Inconnu'} (${war.scores[g2]})`).join(" | ")
        });
        if (war.history.length > 10) war.history.pop();

        Storage.saveGuilds(guilds);
        Storage.saveTerritories(territories);
        Storage.saveWar(war);
    },

    executeAttack: (userId, userName, userLevel, guildId, targetGuildId) => {
        let war = Storage.getWar();
        const guilds = Storage.getGuilds();
        
        const gLevel = guilds[guildId]?.level || 1;
        const bonuses = Utils.getLevelBonus(gLevel);

        // Simulation complexe de dégâts MMORPG
        let baseDamage = Math.floor((userLevel * 15) + (Math.random() * 80) + bonuses.warDamageBonus);
        let isCrit = Math.random() < 0.15; // 15% de coups critiques
        let isEvaded = Math.random() < 0.05; // 5% de chance d'esquive de la guilde adverse

        if (isEvaded) {
            return { dmg: 0, points: 0, text: `💨 L'armée ennemie a **𝖤𝗌𝗊𝗎𝗂𝗏é** votre assaut frontal !` };
        }

        if (isCrit) {
            baseDamage = Math.floor(baseDamage * 2.2);
        }

        const ptsGained = isCrit ? 3 : 1;
        
        // Incrémentation des compteurs de guerre
        war.scores[guildId] = (war.scores[guildId] || 0) + ptsGained;
        war.damage[guildId] = (war.damage[guildId] || 0) + baseDamage;

        if (!war.playerStats[userId]) {
            war.playerStats[userId] = { attacks: 0, damage: 0, points: 0, name: userName };
        }
        war.playerStats[userId].attacks += 1;
        war.playerStats[userId].damage += baseDamage;
        war.playerStats[userId].points += ptsGained;

        Storage.saveWar(war);

        let outText = isCrit ? `💥 **𝖢𝖮𝖴𝖯 𝖢𝖱𝖨𝖳𝖨𝖰𝖴𝖤 !** ` : `⚔️ `;
        outText += `Vous infligez **${baseDamage}** points de dégâts aux lignes de *${guilds[targetGuildId]?.name}* et offrez **+${ptsGained} Points** à votre alliance.`;
        
        return { dmg: baseDamage, points: ptsGained, text: outText };
    }
};

module.exports = WarSystem;
