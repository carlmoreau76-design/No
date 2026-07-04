const fs = require("fs");
const path = require("path");

// Remonte de 3 niveaux pour revenir à la racine du bot
const ROOT_DIR = path.join(__dirname, "..", "..", ".."); 
const DATA_DIR = path.join(ROOT_DIR, "database", "guildsMMO");

const GUILDS_FILE = path.join(DATA_DIR, "guilds_registry.json");
const USERS_FILE = path.join(DATA_DIR, "users_registry.json");
const WAR_FILE = path.join(DATA_DIR, "war_state.json");
const TERRITORIES_FILE = path.join(DATA_DIR, "territories.json");

// Structure par défaut des territoires MMORPG
const DEFAULT_TERRITORIES = [
    { id: "t1", name: "Royaume du Nord", rarity: "Commun", ownerId: null, revenue: 15000, xpReward: 500, lastPayout: 0 },
    { id: "t2", name: "Îles Perdues", rarity: "Commun", ownerId: null, revenue: 18000, xpReward: 600, lastPayout: 0 },
    { id: "t3", name: "Forêt Antique", rarity: "Rare", ownerId: null, revenue: 35000, xpReward: 1200, lastPayout: 0 },
    { id: "t4", name: "Désert d’Or", rarity: "Rare", ownerId: null, revenue: 40000, xpReward: 1500, lastPayout: 0 },
    { id: "t5", name: "Port Pirate", rarity: "Rare", ownerId: null, revenue: 45000, xpReward: 1600, lastPayout: 0 },
    { id: "t6", name: "Terre Volcanique", rarity: "Épique", ownerId: null, revenue: 85000, xpReward: 3000, lastPayout: 0 },
    { id: "t7", name: "Royaume Gelé", rarity: "Épique", ownerId: null, revenue: 90000, xpReward: 3200, lastPayout: 0 },
    { id: "t8", name: "Empire du Dragon", rarity: "Légendaire", ownerId: null, revenue: 200000, xpReward: 7000, lastPayout: 0 },
    { id: "t9", name: "Cité Céleste", rarity: "Légendaire", ownerId: null, revenue: 250000, xpReward: 8500, lastPayout: 0 },
    { id: "t10", name: "Royaume des Ombres", rarity: "Mythique", ownerId: null, revenue: 500000, xpReward: 15000, lastPayout: 0 }
];

const DEFAULT_WAR_STATE = {
    currentPhase: "idle", // idle, registration, combat
    phaseEndTime: 0,
    registeredGuilds: [], // array de guildIds
    rosters: {}, // guildId: [userIds]
    scores: {}, // guildId: points
    damage: {}, // guildId: totalDamage
    userStats: {}, // userId: { attacks: 0, damage: 0, points: 0, name: "", guildId: "" }
    matches: [], // pairs de { g1, g2 }
    history: []
};

// Initialisation sécurisée
function initStorage() {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(GUILDS_FILE)) fs.writeFileSync(GUILDS_FILE, JSON.stringify({}, null, 4));
    if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, JSON.stringify({}, null, 4));
    if (!fs.existsSync(WAR_FILE)) fs.writeFileSync(WAR_FILE, JSON.stringify(DEFAULT_WAR_STATE, null, 4));
    if (!fs.existsSync(TERRITORIES_FILE)) fs.writeFileSync(TERRITORIES_FILE, JSON.stringify(DEFAULT_TERRITORIES, null, 4));
}

initStorage();

function readJsonSafely(filePath, defaultData) {
    try {
        const content = fs.readFileSync(filePath, "utf8");
        if (!content.trim()) return defaultData;
        return JSON.parse(content);
    } catch (e) {
        console.error(`[GuildStorage] Erreur lecture ${filePath}, restauration défaut.`, e);
        fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 4));
        return defaultData;
    }
}

function writeJsonSafely(filePath, data) {
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 4), "utf8");
    } catch (e) {
        console.error(`[GuildStorage] Échec critique d'écriture sur ${filePath}`, e);
    }
}

const storage = {
    getGuilds: () => readJsonSafely(GUILDS_FILE, {}),
    saveGuilds: (data) => writeJsonSafely(GUILDS_FILE, data),
    
    getUsers: () => readJsonSafely(USERS_FILE, {}),
    saveUsers: (data) => writeJsonSafely(USERS_FILE, data),
    
    getWar: () => readJsonSafely(WAR_FILE, DEFAULT_WAR_STATE),
    saveWar: (data) => writeJsonSafely(WAR_FILE, data),
    
    getTerritories: () => readJsonSafely(TERRITORIES_FILE, DEFAULT_TERRITORIES),
    saveTerritories: (data) => writeJsonSafely(TERRITORIES_FILE, data),

    getUserProfile: (userId, userName = "Aventurier") => {
        const users = storage.getUsers();
        if (!users[userId]) {
            users[userId] = {
                id: userId,
                name: userName,
                guildId: null,
                role: null,
                totalDonated: 0,
                lastDaily: 0,
                joinedAt: 0
            };
            storage.saveUsers(users);
        }
        return users[userId];
    },

    saveUserProfile: (userId, data) => {
        const users = storage.getUsers();
        users[userId] = { ...storage.getUserProfile(userId), ...data };
        storage.saveUsers(users);
    },

    logEvent: (guildId, type, message) => {
        const guilds = storage.getGuilds();
        if (!guilds[guildId]) return;
        if (!guilds[guildId].logs) guilds[guildId].logs = [];
        
        guilds[guildId].logs.unshift({
            timestamp: Date.now(),
            type,
            message
        });
        
        if (guilds[guildId].logs.length > 50) {
            guilds[guildId].logs = guilds[guildId].logs.slice(0, 50);
        }
        storage.saveGuilds(guilds);
    },

    getDefaultMissions: () => [
        { id: "m1", title: "Trésor de guerre", desc: "Déposer 500,000 pièces dans le coffre.", target: 500000, current: 0, done: false, type: "donate", rewardXp: 1200, rewardMoney: 50000 },
        { id: "m2", title: "Appel aux armes", desc: "Atteindre 5 membres actifs dans la guilde.", target: 5, current: 1, done: false, type: "members", rewardXp: 1500, rewardMoney: 75000 },
        { id: "m3", title: "Légion d'assaut", desc: "Effectuer 15 attaques lors d'une guerre.", target: 15, current: 0, done: false, type: "attacks", rewardXp: 2500, rewardMoney: 150000 }
    ],

    getDefaultAchievements: () => [
        { id: "a1", name: "Fondation Ancestrale", desc: "Créer votre première guilde MMORPG.", unlocked: false, date: null },
        { id: "a2", name: "Ascension Dorée", desc: "Atteindre le niveau de guilde 10.", unlocked: false, date: null },
        { id: "a3", name: "Forteresse de Fer", desc: "Déposer un total de 1,000,000 dans la banque.", unlocked: false, date: null },
        { id: "a4", name: "Seigneur de Guerre", desc: "Remporter une première Victoire de Guerre.", unlocked: false, date: null },
        { id: "a5", name: "Souverain Impérial", desc: "Capturer au moins 1 Territoire.", unlocked: false, date: null }
    ],

    calculateUpgradeCosts: (level) => {
        if (level >= 50) return { xpReq: Infinity, moneyReq: Infinity };
        return {
            xpReq: Math.floor(1000 * Math.pow(level, 1.8)),
            moneyReq: Math.floor(50000 * Math.pow(level, 1.5))
        };
    },

    getGuildBonuses: (level) => {
        return {
            maxMembers: Math.min(50, 10 + Math.floor(level / 2)),
            xpXpModifier: 1 + (level * 0.02),
            moneyModifier: 1 + (level * 0.015),
            warBonusDamage: level * 10
        };
    }
};

module.exports = storage;
