/**
 * ⚔️ SYSTÈME DE GUILDES MMORPG POUR GOATBOT
 * 💾 MODULE DE STOCKAGE ET PERSISTANCE DES DONNÉES
 * Fichier : guild.storage.js
 */

const fs = require("fs");
const path = require("path");

// Définition des chemins de données isolés du cache
const DATA_DIR = path.join(__dirname, "database", "guildsMMO");
const GUILDS_FILE = path.join(DATA_DIR, "guilds_registry.json");
const USERS_FILE = path.join(DATA_DIR, "users_registry.json");
const WAR_FILE = path.join(DATA_DIR, "war_state.json");
const TERRITORIES_FILE = path.join(DATA_DIR, "territories.json");

// Structure par défaut pour la réinitialisation des bases de données
const DEFAULTS = {
    guilds: {},
    users: {},
    war: {
        phase: "idle", // idle, signup, battle
        nextCycle: Date.now() + 18 * 60 * 60 * 1000,
        participants: [],
        rosters: {}, // guildId: [userIds]
        scores: {},   // guildId: score
        damage: {},   // guildId: totalDamage
        playerStats: {}, // userId: { attacks: 0, damage: 0, points: 0, name: "" }
        history: [],
        lastMatchups: {} // guildId: lastEnemyGuildId
    },
    territories: {
        "north_kingdom": { id: "north_kingdom", name: "Royaume du Nord", rarity: "Légendaire", owner: null, revenue: { money: 150000, xp: 1200 }, bonus: "+15% Dégâts de Guerre", lastClaim: Date.now(), history: [] },
        "lost_isles": { id: "lost_isles", name: "Îles Perdues", rarity: "Rare", owner: null, revenue: { money: 60000, xp: 500 }, bonus: "+10% Or Daily", lastClaim: Date.now(), history: [] },
        "volcanic_lands": { id: "volcanic_lands", name: "Terre Volcanique", rarity: "Épique", owner: null, revenue: { money: 100000, xp: 800 }, bonus: "+12% Critique en Guerre", lastClaim: Date.now(), history: [] },
        "ancient_forest": { id: "ancient_forest", name: "Forêt Antique", rarity: "Commun", owner: null, revenue: { money: 30000, xp: 300 }, bonus: "+5% Expérience de Guilde", lastClaim: Date.now(), history: [] },
        "gold_desert": { id: "gold_desert", name: "Désert d'Or", rarity: "Épique", owner: null, revenue: { money: 120000, xp: 600 }, bonus: "+20% Capacité du Coffre", lastClaim: Date.now(), history: [] },
        "frozen_realm": { id: "frozen_realm", name: "Royaume Gelé", rarity: "Rare", owner: null, revenue: { money: 70000, xp: 550 }, bonus: "+10% Résistance aux Raids", lastClaim: Date.now(), history: [] },
        "celestial_city": { id: "celestial_city", name: "Cité Céleste", rarity: "Mythique", owner: null, revenue: { money: 250000, xp: 2000 }, bonus: "+25% Multiplicateur Global", lastClaim: Date.now(), history: [] },
        "pirate_port": { id: "pirate_port", name: "Port Pirate", rarity: "Commun", owner: null, revenue: { money: 450000, xp: 200 }, bonus: "+15% Taux de Vol de Coffre", lastClaim: Date.now(), history: [] },
        "dragon_empire": { id: "dragon_empire", name: "Empire du Dragon", rarity: "Légendaire", owner: null, revenue: { money: 180000, xp: 1500 }, bonus: "+20% Chance d'Esquive", lastClaim: Date.now(), history: [] },
        "shadow_realm": { id: "shadow_realm", name: "Royaume des Ombres", rarity: "Mythique", owner: null, revenue: { money: 220000, xp: 1800 }, bonus: "+30% Pénétration d'Armure", lastClaim: Date.now(), history: [] }
    }
};

/**
 * Initialise l'arborescence et s'assure que les fichiers JSON existent.
 */
function initStorage() {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    ensureFile(GUILDS_FILE, DEFAULTS.guilds);
    ensureFile(USERS_FILE, DEFAULTS.users);
    ensureFile(WAR_FILE, DEFAULTS.war);
    ensureFile(TERRITORIES_FILE, DEFAULTS.territories);
}

function ensureFile(filePath, defaultData) {
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 4), "utf-8");
    } else {
        try {
            // Test de corruption du fichier
            JSON.parse(fs.readFileSync(filePath, "utf-8"));
        } catch (e) {
            // En cas de corruption, restructuration d'urgence sécurisée
            fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 4), "utf-8");
        }
    }
}

function readJSON(filePath, defaultData) {
    initStorage();
    try {
        const content = fs.readFileSync(filePath, "utf-8");
        return JSON.parse(content);
    } catch (error) {
        return defaultData;
    }
}

function writeJSON(filePath, data) {
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 4), "utf-8");
        return true;
    } catch (error) {
        console.error(`[GUILD STORAGE ERROR] Échec de l'écriture dans ${filePath}:`, error);
        return false;
    }
}

// Objets d'accès globaux
const Storage = {
    getGuilds: () => readJSON(GUILDS_FILE, DEFAULTS.guilds),
    saveGuilds: (data) => writeJSON(GUILDS_FILE, data),
    
    getUsers: () => readJSON(USERS_FILE, DEFAULTS.users),
    saveUsers: (data) => writeJSON(USERS_FILE, data),
    
    getWar: () => readJSON(WAR_FILE, DEFAULTS.war),
    saveWar: (data) => writeJSON(WAR_FILE, data),
    
    getTerritories: () => readJSON(TERRITORIES_FILE, DEFAULTS.territories),
    saveTerritories: (data) => writeJSON(TERRITORIES_FILE, data),

    // Loggueur d'événements interne pour la traçabilité des actions financières et militaires
    logEvent: (guildId, type, message) => {
        const guilds = readJSON(GUILDS_FILE, DEFAULTS.guilds);
        if (guilds[guildId]) {
            if (!guilds[guildId].logs) guilds[guildId].logs = [];
            guilds[guildId].logs.unshift({
                timestamp: Date.now(),
                type: type,
                message: message
            });
            // Limitation stricte de l'historique à 40 entrées pour éviter l'inflation mémoire
            if (guilds[guildId].logs.length > 40) {
                guilds[guildId].logs.pop();
            }
            writeJSON(GUILDS_FILE, guilds);
        }
    },

    // Récupérer le profil complet d'un utilisateur ou l'initialiser
    getUserProfile: (userId, userName) => {
        const users = readJSON(USERS_FILE, DEFAULTS.users);
        if (!users[userId]) {
            users[userId] = {
                id: userId,
                name: userName || "Guerrier Inconnu",
                guildId: null,
                role: null,
                cooldowns: { daily: 0, warAttack: 0 },
                stats: { attacks: 0, damage: 0, points: 0, contributions: 0 }
            };
            writeJSON(USERS_FILE, users);
        }
        return users[userId];
    }
};

module.exports = Storage;
