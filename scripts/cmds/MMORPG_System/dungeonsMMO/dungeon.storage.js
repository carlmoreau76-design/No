/**
 * 🏰 SYSTEME MMORPG DUNGEON - MOTEUR DE PERSISTANCE ATOMIQUE (GoatBot)
 * Version : 1.0.0
 * Architecture : Isolation par registres JSON & Normalisation défensive
 */

const fs = require("fs");
const path = require("path");

// Définition du répertoire de stockage persistant dédié
const DATA_DIR = path.join(__dirname, "data");

const PATHS = {
    PLAYERS: path.join(DATA_DIR, "players_registry.json"),
    DUNGEONS: path.join(DATA_DIR, "dungeons_registry.json"),
    RAID: path.join(DATA_DIR, "raid_state.json"),
    LEADERBOARDS: path.join(DATA_DIR, "leaderboards.json")
};

/**
 * Initialise l'environnement de stockage et crée les fichiers requis s'ils sont absents.
 */
function initStorage() {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (!fs.existsSync(PATHS.PLAYERS)) fs.writeFileSync(PATHS.PLAYERS, JSON.stringify({}, null, 4), "utf8");
    if (!fs.existsSync(PATHS.DUNGEONS)) initDungeonsRegistry();
    if (!fs.existsSync(PATHS.RAID)) fs.writeFileSync(PATHS.RAID, JSON.stringify(getDefaultRaidState(), null, 4), "utf8");
    if (!fs.existsSync(PATHS.LEADERBOARDS)) fs.writeFileSync(PATHS.LEADERBOARDS, JSON.stringify({}, null, 4), "utf8");
}

function getDefaultRaidState() {
    return {
        bossName: "Baphomet le Maudit",
        hp: 5000000,
        maxHp: 5000000,
        level: 50,
        status: "ACTIVE", // ACTIVE, DEFEATED
        participants: {}, // userId: damage
        lastReset: Date.now()
    };
}

function initDungeonsRegistry() {
    const defaultDungeons = [
          { id: "d1", name: "Forêt des Murmures", recommendedLevel: 1, staminaCost: 10, floors: 5, baseReward: 500, rarity: "Commun", theme: "Sylvestre", bossName: "Gardien Sylvestre" },
          { id: "d2", name: "Crypte du Roi Déchu", recommendedLevel: 10, staminaCost: 15, floors: 7, baseReward: 1500, rarity: "Rare", theme: "Mort-vivant", bossName: "Roi Squelette" },
          { id: "d3", name: "Temple Volcanique", recommendedLevel: 20, staminaCost: 20, floors: 10, baseReward: 3500, rarity: "Épique", theme: "Magma", bossName: "Titan de Lave" },
          { id: "d4", name: "Tour du Néant", recommendedLevel: 35, staminaCost: 25, floors: 12, baseReward: 8000, rarity: "Légendaire", theme: "Abyssal", bossName: "Dragon du Néant" },
          { id: "d5", name: "Palais de Givre", recommendedLevel: 50, staminaCost: 30, floors: 15, baseReward: 18000, rarity: "Mythique", theme: "Cryogénique", bossName: "Empereur du Chaos" },
          { id: "d6", name: "Sanctuaire des Tempêtes", recommendedLevel: 65, staminaCost: 35, floors: 18, baseReward: 32000, rarity: "Mythique", theme: "Foudre", bossName: "Seigneur des Orages" },
          { id: "d7", name: "Catacombes Sanglantes", recommendedLevel: 80, staminaCost: 40, floors: 20, baseReward: 50000, rarity: "Mythique", theme: "Sanguinaire", bossName: "Reine Vampire Écarlate" },
          { id: "d8", name: "Cité Engloutie d’Atlantis", recommendedLevel: 100, staminaCost: 45, floors: 22, baseReward: 80000, rarity: "Divin", theme: "Aquatique", bossName: "Léviathan des Abysses" },
          { id: "d9", name: "Faille du Jugement Céleste", recommendedLevel: 125, staminaCost: 50, floors: 25, baseReward: 120000, rarity: "Divin", theme: "Céleste", bossName: "Archange du Jugement" },
          { id: "d10", name: "Trône de l’Apocalypse", recommendedLevel: 150, staminaCost: 60, floors: 30, baseReward: 200000, rarity: "Transcendant", theme: "Fin du monde", bossName: "Roi de l’Apocalypse" }
      ];
    fs.writeFileSync(PATHS.DUNGEONS, JSON.stringify(defaultDungeons, null, 4), "utf8");
}

/**
 * Lecture sécurisée d'un fichier JSON avec fallback automatique
 */
function readJSON(filePath, fallback = {}) {
    try {
        if (!fs.existsSync(filePath)) return fallback;
        const content = fs.readFileSync(filePath, "utf8");
        return JSON.parse(content);
    } catch (error) {
        // En cas de corruption, on applique le fallback pour éviter le crash du bot
        return fallback;
    }
}

/**
 * Écriture atomique pour éliminer les risques de perte de données en cas de restart brutal
 */
function writeJSON(filePath, data) {
    const tempPath = filePath + ".tmp";
    try {
        fs.writeFileSync(tempPath, JSON.stringify(data, null, 4), "utf8");
        fs.renameSync(tempPath, filePath);
    } catch (error) {
        if (fs.existsSync(tempPath)) {
            try { fs.unlinkSync(tempPath); } catch (e) {}
        }
    }
}

// Initialisation immédiate au chargement du module
initStorage();

module.exports = {
    getPlayers: () => readJSON(PATHS.PLAYERS),
    savePlayers: (data) => writeJSON(PATHS.PLAYERS, data),
    
    getDungeons: () => readJSON(PATHS.DUNGEONS, []),
    
    getRaidState: () => readJSON(PATHS.RAID, getDefaultRaidState()),
    saveRaidState: (data) => writeJSON(PATHS.RAID, data),

    /**
     * Structure de données exhaustive et normalisée d'un profil joueur
     */
    getPlayerProfile: function (userId, userName) {
        const players = readJSON(PATHS.PLAYERS);
        if (!players[userId]) {
            players[userId] = {
                id: userId,
                name: userName,
                level: 1,
                xp: 0,
                stamina: 100,
                maxStamina: 100,
                goldEarned: 0,
                dungeonCoins: 0,
                keys: 3,
                tickets: 1,
                highestFloor: 0,
                bossesDefeated: 0,
                runsCompleted: 0,
                runsFailed: 0,
                totalDamage: 0,
                attack: 25,
                defense: 10,
                hp: 150,
                maxHp: 150,
                critRate: 0.10,
                critDamage: 1.5,
                luck: 5,
                inventory: [
                    { id: "pot_hp_01", name: "Potion de Soin Mineure", type: "potion", effect: 50, qty: 2 },
                    { id: "pot_hp_02", name: "Potion de Soin Standard", type: "potion", effect: 120, qty: 1 },
                    { id: "pot_hp_03", name: "Grande Potion de Soin", type: "potion", effect: 250, qty: 1 },
                    { id: "pot_hp_04", name: "Potion de Régénération", type: "regen", effect: 30, qty: 1 },
                    { id: "pot_mp_01", name: "Potion de Mana Mineure", type: "mana", effect: 40, qty: 2 },
                    { id: "pot_mp_02", name: "Potion de Mana Supérieure", type: "mana", effect: 100, qty: 1 },
                    { id: "pot_atk_01", name: "Élixir de Force", type: "buff_attack", effect: 0.2, qty: 1 },
                    { id: "pot_def_01", name: "Élixir de Défense", type: "buff_defense", effect: 0.2, qty: 1 },
                    { id: "pot_crit_01", name: "Flacon du Prédateur", type: "buff_crit", effect: 0.15, qty: 1 },
                    { id: "pot_revive_01", name: "Pierre de Résurrection", type: "revive", effect: 0.5, qty: 1 }
                ],
                equipment: {
                    weapon: null,
                    armor: null,
                    ring: null
                },
                skills: [
                    { id: "sk_01", name: "Frappe Brutale", type: "damage", value: 1.4, cooldown: 0 }
                ],
                cooldowns: {
                    daily: 0,
                    weekly: 0
                },
                history: [],
                activeRun: null
            };
            writeJSON(PATHS.PLAYERS, players);
        } else {
            // Regeneration passive de la stamina (1 point par 5 minutes)
            const now = Date.now();
            if (!players[userId].lastStaminaUpdate) {
                players[userId].lastStaminaUpdate = now;
            } else {
                const diff = now - players[userId].lastStaminaUpdate;
                const intervals = Math.floor(diff / (5 * 60 * 1000));
                if (intervals > 0) {
                    players[userId].stamina = Math.min(players[userId].maxStamina, players[userId].stamina + intervals);
                    players[userId].lastStaminaUpdate = now;
                    writeJSON(PATHS.PLAYERS, players);
                }
            }
        }
        return players[userId];
    },

    savePlayerProfile: function (userId, profileData) {
        const players = readJSON(PATHS.PLAYERS);
        players[userId] = profileData;
        writeJSON(PATHS.PLAYERS, players);
    },

    /**
     * Historique circulaire persistant (limite de 10 entrées par joueur)
     */
    logDungeonEvent: function (profile, type, message) {
        if (!profile.history) profile.history = [];
        profile.history.unshift({
            timestamp: Date.now(),
            type: type,
            message: message
        });
        if (profile.history.length > 10) profile.history.pop();
    }
};
