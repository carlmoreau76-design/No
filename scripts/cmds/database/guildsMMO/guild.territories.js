/**
 * ⚔️ SYSTÈME DE GUILDES MMORPG POUR GOATBOT
 * 🌍 MODULE GÉOPOLITIQUE DES TERRITOIRES ET RÉCOLTES PASSIVES (12H)
 * Fichier : guild.territories.js
 */

const Storage = require("./guild.storage");
const Utils = require("./guild.utils");

const CLAIM_INTERVAL = 12 * 60 * 60 * 1000; // Cycle de récolte exact de 12h

const TerritorySystem = {
    /**
     * Traite les taxes passives accumulées par l'ensemble des zones contrôlées sur le serveur
     */
    processPassiveClaims: () => {
        let territories = Storage.getTerritories();
        let guilds = Storage.getGuilds();
        const now = Date.now();
        let changesMade = false;

        for (const zoneId in territories) {
            const zone = territories[zoneId];
            if (zone.owner && (now - zone.lastClaim >= CLAIM_INTERVAL)) {
                const targetGuild = guilds[zone.owner];
                if (targetGuild) {
                    // Application des revenus territoriaux directs au coffre fort
                    const baseMoney = zone.revenue.money;
                    const baseXp = zone.revenue.xp;

                    targetGuild.bank += baseMoney;
                    targetGuild.xp += baseXp;
                    
                    zone.lastClaim = now;
                    changesMade = true;

                    Storage.logEvent(zone.owner, "TERRITORY_REVENUE", `📦 Récolte Passive : Le contrôle de [${zone.name}] a injecté ${Utils.formatMoney(baseMoney)} et +${baseXp} XP dans vos réserves.`);
                }
            }
        }

        if (changesMade) {
            Storage.saveGuilds(guilds);
            Storage.saveTerritories(territories);
        }
    },

    /**
     * Renvoie le récapitulatif graphique complet de l'état du monde
     */
    getGlobalMapRender: () => {
        TerritorySystem.processPassiveClaims(); // Forcer une vérification avant affichage
        const territories = Storage.getTerritories();
        const guilds = Storage.getGuilds();
        
        let lines = [];
        for (const id in territories) {
            const z = territories[id];
            const ownerName = z.owner ? (guilds[z.owner]?.name || "Faction Déchue") : "❌ Aucun (Zone Sauvage)";
            lines.push(`📍 **${z.name}** [${z.rarity}]`);
            lines.push(`   Contrôle : *${Utils.toStyle2(ownerName)}*`);
            lines.push(`   Revenu : +${Utils.formatMoney(z.revenue.money)} | +${z.revenue.xp} XP`);
            lines.push(`   Effet : _${z.bonus}_`);
            lines.push(` ───────────────────────`);
        }
        if(lines.length > 0) lines.pop(); // Retirer le dernier séparateur superflu

        return Utils.buildPremiumBox("𝐂𝐀𝐑𝐓𝐄 𝐃𝐄𝐒 𝐓𝐄𝐑𝐑𝐈𝐓𝐎𝐈𝐑𝐄𝐒", lines);
    }
};

module.exports = TerritorySystem;
