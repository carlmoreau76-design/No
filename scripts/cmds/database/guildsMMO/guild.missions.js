/**
 * ⚔️ SYSTÈME DE GUILDES MMORPG POUR GOATBOT
 * 🏆 MODULE DES MISSIONS HEBDOMADAIRES ET PANTHÉON DES SUCCÈS
 * Fichier : guild.missions.js
 */

const Storage = require("./guild.storage");
const Utils = require("./guild.utils");

const ACHIEVEMENTS_LIST = [
    { id: "first_guild", name: "🥉 Première Alliance", desc: "Fonder ou rejoindre une guilde officielle", check: (g) => true },
    { id: "level_10", name: "🥈 Bastion Émergent", desc: "Atteindre le Niveau 10 de guilde", check: (g) => g.level >= 10 },
    { id: "level_25", name: "🥇 Citadelle Souveraine", desc: "Atteindre le Niveau 25 de guilde", check: (g) => g.level >= 25 },
    { id: "level_50", name: "👑 Empire Immortel", desc: "Atteindre le Niveau Maximum (50)", check: (g) => g.level >= 50 },
    { id: "wins_50", name: "⚔️ Seigneurs de Guerre", desc: "Cumuler un total de 50 victoires militaires", check: (g) => g.wins >= 50 },
    { id: "bank_100m", name: "💰 Trésor Impérial", desc: "Accumuler 100 000 000 $ dans le coffre", check: (g) => g.bank >= 100000000 }
];

const MissionSystem = {
    /**
     * Instancie ou réinitialise les missions de la guilde si elles sont absentes
     */
    ensureMissionsInit: (guild) => {
        if (!guild.missions || Object.keys(guild.missions).length === 0) {
            guild.missions = {
                monster_hunt: { id: "monster_hunt", name: "Battre 100 monstres", progress: 0, target: 100, done: false, reward: 250000 },
                gold_deposit: { id: "gold_deposit", name: "Déposer 10 000 000 $ cumulés", progress: 0, target: 10000000, done: false, reward: 500000 },
                war_participation: { id: "war_participation", name: "Participer à 20 assauts de guerre", progress: 0, target: 20, done: false, reward: 400000 }
            };
        }
    },

    /**
     * Incrémente la progression d'une quête spécifique et distribue la récompense si complétée
     */
    advanceMission: (guildId, missionId, amount) => {
        const guilds = Storage.getGuilds();
        const g = guilds[guildId];
        if (!g) return;

        MissionSystem.ensureMissionsInit(g);
        const m = g.missions[missionId];

        if (m && !m.done) {
            m.progress += amount;
            if (m.progress >= m.target) {
                m.progress = m.target;
                m.done = true;
                g.bank += m.reward;
                g.xp += Math.floor(m.reward * 0.01);
                Storage.logEvent(guildId, "MISSION_COMPLETE", `🏆 Mission Accomplie : "${m.name}". Récompense de +${Utils.formatMoney(m.reward)} ajoutée au coffre.`);
            }
            Storage.saveGuilds(guilds);
        }
    },

    /**
     * Analyse et débloque de manière transparente les accomplissements du Panthéon
     */
    checkAchievements: (guildId) => {
        const guilds = Storage.getGuilds();
        const g = guilds[guildId];
        if (!g) return false;

        if (!g.achievements) g.achievements = [];
        let updated = false;

        ACHIEVEMENTS_LIST.forEach(ach => {
            if (!g.achievements.includes(ach.id) && ach.check(g)) {
                g.achievements.push(ach.id);
                g.xp += 2000; // Bonus d'XP global à l'alliance
                Storage.logEvent(guildId, "ACHIEVEMENT_UNLOCK", `⭐ SUCCÈS DÉBLOQUÉ : [${ach.name}] ! Panthéon mis à jour.`);
                updated = true;
            }
        });

        if (updated) {
            Storage.saveGuilds(guilds);
        }
        return updated;
    },

    getAchievementsRender: (guild) => {
        let lines = [];
        const unlocked = guild.achievements || [];

        ACHIEVEMENTS_LIST.forEach(ach => {
            const status = unlocked.includes(ach.id) ? "✅ [Débloqué]" : "🔒 [Verrouillé]";
            lines.push(`${status} **${ach.name}**`);
            lines.push(`   _${ach.desc}_`);
            lines.push(` ───────────────────────`);
        });
        if(lines.length > 0) lines.pop();

        return Utils.buildPremiumBox("𝐏𝐀𝐍𝐓𝐇É𝐎𝐍 𝐃𝐄𝐒 𝐒𝐔𝐂𝐂È𝐒", lines);
    }
};

module.exports = MissionSystem;
