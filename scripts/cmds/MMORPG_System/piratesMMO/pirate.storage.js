/**
 * 🏴‍☠️ MODULE DE STOCKAGE ET PERSISTANCE : PIRATES MMORPG (GoatBot)
 * Emplacement : scripts/cmds/MMORPG_System/piratesMMO/pirate.storage.js
 * Gère l'écriture atomique, la validation des structures et la sécurité anti-corruption.
 */

const fs = require("fs");
const path = require("path");

// Définition stricte des chemins de stockage au sein du module MMORPG
const BASE_DIR = path.join(__dirname);
const PATHS = {
    pirates: path.join(BASE_DIR, "pirates_registry.json"),
    crews: path.join(BASE_DIR, "crews_registry.json"),
    battles: path.join(BASE_DIR, "naval_wars.json"),
    islands: path.join(BASE_DIR, "islands.json")
};

// Initialisation et sécurisation de l'architecture des répertoires
if (!fs.existsSync(BASE_DIR)) {
    fs.mkdirSync(BASE_DIR, { recursive: true });
}

/**
 * Assistant d'écriture sécurisée (Écriture atomique avec fichier temporaire)
 */
function secureWriteJSON(filePath, data) {
    const tempPath = `${filePath}.tmp`;
    try {
        fs.writeFileSync(tempPath, JSON.stringify(data, null, 4), "utf8");
        if (fs.existsSync(tempPath)) {
            fs.renameSync(tempPath, filePath);
            return true;
        }
    } catch (err) {
        console.error(`[PIRATE STORAGE ERROR] Échec d'écriture sur ${filePath}:`, err);
        if (fs.existsSync(tempPath)) {
            try { fs.unlinkSync(tempPath); } catch (e) {}
        }
    }
    return false;
}

/**
 * Assistant de lecture sécurisée avec fallback structurel
 */
function secureReadJSON(filePath, fallbackData = {}) {
    try {
        if (!fs.existsSync(filePath)) {
            secureWriteJSON(filePath, fallbackData);
            return fallbackData;
        }
        const content = fs.readFileSync(filePath, "utf8").trim();
        if (!content) {
            secureWriteJSON(filePath, fallbackData);
            return fallbackData;
        }
        return JSON.parse(content);
    } catch (err) {
        console.error(`[PIRATE STORAGE ERROR] Fichier corrompu détecté (${filePath}). Restauration...`);
        secureWriteJSON(filePath, fallbackData);
        return fallbackData;
    }
}

/**
 * Liste des îles et zones maritimes par défaut du MMORPG
 */
const DEFAULT_ISLANDS = [
    { id: "isl_1", name: "Île du Crâne", rarity: "Commun", dangerLevel: 1, baseReward: 500, xpReward: 50 },
    { id: "isl_2", name: "Port Sanglant", rarity: "Commun", dangerLevel: 3, baseReward: 1200, xpReward: 110 },
    { id: "isl_3", name: "Lagune des Brumes", rarity: "Rare", dangerLevel: 5, baseReward: 2500, xpReward: 240 },
    { id: "isl_4", name: "Fort des Corsaires", rarity: "Rare", dangerLevel: 8, baseReward: 4800, xpReward: 450 },
    { id: "isl_5", name: "Baie du Kraken", rarity: "Épique", dangerLevel: 12, baseReward: 9500, xpReward: 900 },
    { id: "isl_6", name: "Atoll du Trésor", rarity: "Épique", dangerLevel: 15, baseReward: 15000, xpReward: 1400 },
    { id: "isl_7", name: "Repaire des Abysses", rarity: "Légendaire", dangerLevel: 20, baseReward: 28000, xpReward: 2500 },
    { id: "isl_8", name: "Royaume Englouti", rarity: "Légendaire", dangerLevel: 25, baseReward: 45000, xpReward: 4000 },
    { id: "isl_9", name: "Archipel Fantôme", rarity: "Mythique", dangerLevel: 35, baseReward: 85000, xpReward: 7500 },
    { id: "isl_10", name: "Trône du Léviathan", rarity: "Divin", dangerLevel: 50, baseReward: 200000, xpReward: 18000 }
];

module.exports = {
    getPirates: () => secureReadJSON(PATHS.pirates, {}),
    savePirates: (data) => secureWriteJSON(PATHS.pirates, data),

    getCrews: () => secureReadJSON(PATHS.crews, {}),
    saveCrews: (data) => secureWriteJSON(PATHS.crews, data),

    getBattles: () => secureReadJSON(PATHS.battles, { currentPhase: "idle", lastUpdate: Date.now(), activeRaids: {} }),
    saveBattles: (data) => secureWriteJSON(PATHS.battles, data),

    getIslands: () => secureReadJSON(PATHS.islands, DEFAULT_ISLANDS),
    saveIslands: (data) => secureWriteJSON(PATHS.islands, data),

    /**
     * Initialise et normalise le profil d'un Pirate (Persistance individuelle)
     */
    getUserProfile: function (userId, userName = "Pirate Sans Nom") {
        const pirates = this.getPirates();
        if (!pirates[userId]) {
            pirates[userId] = {
                id: userId,
                name: userName,
                title: "Mousse Égaré",
                createdAt: Date.now(),
                level: 1,
                xp: 0,
                hp: 100,
                maxHp: 100,
                energy: 50,
                maxEnergy: 50,
                gold: 1000,
                bounty: 0,
                reputation: 0,
                crewId: null,
                lastKnownName: userName,
                ship: {
                    name: "Radeau de Fortune",
                    class: "Chaloupe",
                    level: 1,
                    xp: 0,
                    hp: 150,
                    maxHp: 150,
                    attack: 15,
                    defense: 10,
                    speed: 12,
                    cargo: 5,
                    durability: 100,
                    cannons: 2,
                    sails: "Toile Déchirée",
                    hull: "Bois Pourri",
                    rarity: "Commun"
                },
                inventory: [],
                equipment: { weapon: null, armor: null, amulet: null },
                skills: { boarding: 1, navigation: 1, cannonade: 1 },
                missions: [
                    { id: "mis_1", title: "Premier Sang", desc: "Gagner votre premier combat naval", target: 1, current: 0, rewardGold: 1500, rewardXp: 150, done: false },
                    { id: "mis_2", title: "Chasseur de Trésor", desc: "Accumuler 50K pièces d'or", target: 50000, current: 0, rewardGold: 5000, rewardXp: 600, done: false }
                ],
                achievements: [],
                cooldowns: { work: 0, hunt: 0, fish: 0, sail: 0, attack: 0 },
                battleStats: { played: 0, wins: 0, losses: 0, damageDealt: 0, bossKilled: 0, raidsDone: 0 },
                dailyState: { lastClaim: 0 }
            };
            this.savePirates(pirates);
        } else {
            // Normalisation défensive si mise à jour du nom de l'utilisateur
            if (userName !== "Pirate Sans Nom" && pirates[userId].lastKnownName !== userName) {
                pirates[userId].lastKnownName = userName;
                pirates[userId].name = userName;
                this.savePirates(pirates);
            }
        }
        return pirates[userId];
    },

    saveUserProfile: function (userId, data) {
        const pirates = this.getPirates();
        pirates[userId] = data;
        return this.savePirates(pirates);
    },

    /**
     * Enregistre un événement dans l'historique d'un équipage (Max 30 entrées pour la taille du JSON)
     */
    logEvent: function (crewId, type, message) {
        const crews = this.getCrews();
        if (!crews[crewId]) return;
        if (!crews[crewId].logs) crews[crewId].logs = [];
        
        crews[crewId].logs.unshift({
            timestamp: Date.now(),
            type: type.toUpperCase(),
            message: message
        });

        if (crews[crewId].logs.length > 30) {
            crews[crewId].logs = crews[crewId].logs.slice(0, 30);
        }
        this.saveCrews(crews);
    }
};

// Initialisation automatique des îles lors du chargement du module
module.exports.getIslands();
