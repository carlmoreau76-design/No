/**
 * 📦 MODULE DE STOCKAGE & PERSISTANCE - GUILDES MMORPG (GoatBot)
 * Emplacement obligatoire : database/guildsMMO/ à la racine du projet
 * Protection contre la corruption, écriture atomique et gestion des structures par défaut.
 */

const fs = require("fs");
const path = require("path");

// Définition stricte des chemins en remontant à la racine
const ROOT_DIR = path.join(__dirname, "..");
const DATA_DIR = path.join(ROOT_DIR, "database", "guildsMMO");
const GUILDS_FILE = path.join(DATA_DIR, "guilds_registry.json");
const USERS_FILE = path.join(DATA_DIR, "users_registry.json");
const WAR_FILE = path.join(DATA_DIR, "war_state.json");
const TERRITORIES_FILE = path.join(DATA_DIR, "territories.json");

// Liste des territoires par défaut (10 zones MMORPG)
const DEFAULT_TERRITORIES = [
    { id: "t1", name: "Royaume du Nord", rarity: "Commun", ownerId: null, revenues: { money: 5000, xp: 200 }, bonus: "Défense +5%", lastPayout: 0 },
    { id: "t2", name: "Îles Perdues", rarity: "Commun", ownerId: null, revenues: { money: 6000, xp: 250 }, bonus: "Chance +3%", lastPayout: 0 },
    { id: "t3", name: "Terre Volcanique", rarity: "Rare", ownerId: null, revenues: { money: 12000, xp: 500 }, bonus: "Attaque +7%", lastPayout: 0 },
    { id: "t4", name: "Forêt Antique", rarity: "Rare", ownerId: null, revenues: { money: 14000, xp: 550 }, bonus: "Régénération +10%", lastPayout: 0 },
    { id: "t5", name: "Désert d’Or", rarity: "Rare", ownerId: null, revenues: { money: 20000, xp: 400 }, bonus: "Gain Or +8%", lastPayout: 0 },
    { id: "t6", name: "Royaume Gelé", rarity: "Épique", ownerId: null, revenues: { money: 30000, xp: 1000 }, bonus: "Critique +6%", lastPayout: 0 },
    { id: "t7", name: "Cité Céleste", rarity: "Épique", ownerId: null, revenues: { money: 35000, xp: 1200 }, bonus: "Bonus Exp +10%", lastPayout: 0 },
    { id: "t8", name: "Port Pirate", rarity: "Épique", ownerId: null, revenues: { money: 40000, xp: 800 }, bonus: "Loot +12%", lastPayout: 0 },
    { id: "t9", name: "Empire du Dragon", rarity: "Légendaire", ownerId: null, revenues: { money: 75000, xp: 2500 }, bonus: "Puissance Totale +15%", lastPayout: 0 },
    { id: "t10", name: "Royaume des Ombres", rarity: "Légendaire", ownerId: null, revenues: { money: 85000, xp: 3000 }, bonus: "Esquive +10%", lastPayout: 0 }
];

// Structure par défaut de l'état de la guerre
const DEFAULT_WAR_STATE = {
    currentPhase: "idle", // idle, registration, combat
    phaseEndTime: 0,
    lastMatchmakingTime: 0,
    registeredGuilds: [], // array of guildIds
    matches: [], // array of { guildA, guildB, scoreA, scoreB, totalDamageA, totalDamageB }
    playerParticipants: {}, // guildId: [userIds]
    playerStats: {}, // userId: { damage: 0, attacks: 0, points: 0, name: "", guildId: "" }
    history: []
};

/**
 * Initialise l'arborescence et s'assure que les fichiers JSON existent et sont valides.
 */
function initStorage() {
    try {
        if (!fs.existsSync(DATA_DIR)) {
            fs.mkdirSync(DATA_DIR, { recursive: true });
        }

        const filesToCheck = [
            { path: GUILDS_FILE, default: {} },
            { path: USERS_FILE, default: {} },
            { path: WAR_FILE, default: DEFAULT_WAR_STATE },
            { path: TERRITORIES_FILE, default: DEFAULT_TERRITORIES }
        ];

        filesToCheck.forEach(file => {
            if (!fs.existsSync(file.path) || fs.readFileSync(file.path, "utf-8").trim() === "") {
                fs.writeFileSync(file.path, JSON.stringify(file.default, null, 4), "utf-8");
            } else {
                try {
                    JSON.parse(fs.readFileSync(file.path, "utf-8"));
                } catch (e) {
                    // Si le JSON est corrompu, on effectue un backup d'urgence et on reset proprement
                    const backupPath = `${file.path}.corrupted.${Date.now()}`;
                    fs.renameSync(file.path, backupPath);
                    fs.writeFileSync(file.path, JSON.stringify(file.default, null, 4), "utf-8");
                    console.error(`[GuildMMO Warning] Fichier corrompu détecté et reset. Backup créé à : ${backupPath}`);
                }
            }
        });
    } catch (error) {
        console.error("[GuildMMO Critical] Échec de l'initialisation du stockage :", error);
    }
}

// Lancement immédiat de la vérification à l'importation du module
initStorage();

/**
 * Sauvegarde atomique sécurisée pour éviter les corruptions lors des crashs d'écriture
 */
function safeWriteJSON(filePath, data) {
    const tempPath = `${filePath}.tmp`;
    try {
        fs.writeFileSync(tempPath, JSON.stringify(data, null, 4), "utf-8");
        fs.renameSync(tempPath, filePath);
    } catch (error) {
        console.error(`[GuildMMO Error] Échec de la sauvegarde atomique sur ${filePath}:`, error);
        if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
    }
}

function safeReadJSON(filePath, defaultValue) {
    try {
        const content = fs.readFileSync(filePath, "utf-8");
        return JSON.parse(content);
    } catch (error) {
        return defaultValue;
    }
}

// --- LOGIQUE CORE DES OBJETS DE SAUVEGARDE ---

function getGuilds() { return safeReadJSON(GUILDS_FILE, {}); }
function saveGuilds(data) { safeWriteJSON(GUILDS_FILE, data); }

function getUsers() { return safeReadJSON(USERS_FILE, {}); }
function saveUsers(data) { safeWriteJSON(USERS_FILE, data); }

function getWar() { return safeReadJSON(WAR_FILE, DEFAULT_WAR_STATE); }
function saveWar(data) { safeWriteJSON(WAR_FILE, data); }

function getTerritories() { return safeReadJSON(TERRITORIES_FILE, DEFAULT_TERRITORIES); }
function saveTerritories(data) { safeWriteJSON(TERRITORIES_FILE, data); }

/**
 * Récupère ou instancie le profil utilisateur lié aux features de Guilde MMO
 */
function getUserProfile(userId, userName = "Aventurier Anonyme") {
    const users = getUsers();
    if (!users[userId]) {
        users[userId] = {
            id: userId,
            name: userName,
            guildId: null,
            role: null, // "Leader", "Co-Leader", "Officier", "Membre"
            joinedAt: 0,
            contributions: { bankMoney: 0, warDamage: 0 },
            dailyState: { lastClaim: 0, streak: 0 },
            cooldowns: { lastAttack: 0, lastChat: 0 }
        };
        saveUsers(users);
    }
    return users[userId];
}

function saveUserProfile(userId, data) {
    const users = getUsers();
    users[userId] = data;
    saveUsers(users);
}

/**
 * Crée et pousse un log d'action dans le tableau de logs de la guilde ciblée
 */
function logEvent(guildId, type, message) {
    const guilds = getGuilds();
    if (!guilds[guildId]) return;

    if (!guilds[guildId].logs) guilds[guildId].logs = [];
    
    guilds[guildId].logs.unshift({
        timestamp: Date.now(),
        type: type, // "BANK", "RANK", "JOIN", "LEAVE", "WAR", "TERRITORY", "UPGRADE"
        message: message
    });

    // Rotation automatique des logs pour éviter la surchauffe de taille du fichier JSON (max 100 logs)
    if (guilds[guildId].logs.length > 100) {
        guilds[guildId].logs = guilds[guildId].logs.slice(0, 100);
    }

    saveGuilds(guilds);
}

/**
 * Génère la structure de base d'une nouvelle guilde
 */
function createGuildStructure(guildId, name, leaderId, leaderName) {
    return {
        id: guildId,
        name: name,
        emoji: "🛡️",
        description: "Une nouvelle guilde de combattants émérites.",
        leaderId: leaderId,
        leaderName: leaderName,
        coLeaders: [],
        officers: [],
        members: [leaderId],
        createdAt: Date.now(),
        level: 1,
        xp: 0,
        maxMembers: 15,
        bank: 0,
        trophies: 0,
        wins: 0,
        losses: 0,
        score: 0,
        territories: [],
        settings: {
            inviteOnly: false,
            minLevelRequired: 1
        },
        logs: [],
        missions: [
            { id: "m1", title: "Trésor de guerre", desc: "Déposer de l'argent dans le coffre", target: 50000, current: 0, rewardMoney: 10000, rewardXp: 500, done: false },
            { id: "m2", title: "Première Ligne", desc: "Effectuer des attaques en Guerre", target: 5, current: 0, rewardMoney: 15000, rewardXp: 750, done: false },
            { id: "m3", title: "Expansion Terrestre", desc: "Posséder au moins 1 territoire", target: 1, current: 0, rewardMoney: 30000, rewardXp: 1500, done: false }
        ],
        achievements: [
            { id: "a1", name: "Fondation", desc: "Créer sa propre guilde MMORPG", condition: "create", unlocked: true, unlockedAt: Date.now() },
            { id: "a2", name: "Fortune", desc: "Atteindre 1,000,000 de pièces en banque", condition: "bank_1m", unlocked: false, unlockedAt: null },
            { id: "a3", name: "Impérium", desc: "Atteindre le niveau 10 de guilde", condition: "lvl_10", unlocked: false, unlockedAt: null }
        ],
        warStats: { totalDamage: 0, matchCount: 0 },
        upgradeHistory: []
    };
}

module.exports = {
    getGuilds,
    saveGuilds,
    getUsers,
    saveUsers,
    getWar,
    saveWar,
    getTerritories,
    saveTerritories,
    getUserProfile,
    saveUserProfile,
    logEvent,
    createGuildStructure,
    DEFAULT_TERRITORIES
};
