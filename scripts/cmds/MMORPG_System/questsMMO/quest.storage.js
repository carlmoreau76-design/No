/**
 * @author Shade
 * @title Système de Quêtes MMORPG - Moteur de Stockage & Tracking
 * @version 1.0.0
 */

const fs = require("fs-extra");
const path = require("path");

// Définition rigoureuse des chemins d'accès vers la base de données racine
const DB_DIR = path.join(process.cwd(), "database", "questsMMO");
const PATHS = {
    users: path.join(DB_DIR, "quest_users.json"),
    definitions: path.join(DB_DIR, "quest_definitions.json"),
    story: path.join(DB_DIR, "quest_story.json"),
    daily: path.join(DB_DIR, "quest_daily.json"),
    weekly: path.join(DB_DIR, "quest_weekly.json"),
    events: path.join(DB_DIR, "quest_events.json")
};

/**
 * Initialise l'environnement de stockage et pré-remplit les fichiers JSON essentiels
 */
function initStorage() {
    try {
        fs.ensureDirSync(DB_DIR);
        Object.keys(PATHS).forEach(key => {
            if (!fs.existsSync(PATHS[key])) {
                // Injection des structures par défaut ou des fixtures initiales
                if (key === "story") {
                    fs.writeJsonSync(PATHS[key], getStoryFixtures(), { spaces: 4 });
                } else if (key === "daily" || key === "weekly" || key === "definitions") {
                    fs.writeJsonSync(PATHS[key], getQuestFixtures(key), { spaces: 4 });
                } else {
                    fs.writeJsonSync(PATHS[key], {}, { spaces: 4 });
                }
            }
        });
    } catch (error) {
        console.error(" [Quest Storage] Erreur d'initialisation :", error);
    }
}

// Lancement automatique à l'importation
initStorage();

/**
 * Sauvegarde atomique sécurisée contre les écritures corrompues et les crashs à chaud
 */
function safeWriteJson(filePath, data) {
    const tempPath = `${filePath}.tmp`;
    try {
        fs.writeJsonSync(tempPath, data, { spaces: 4 });
        fs.moveSync(tempPath, filePath, { overwrite: true });
    } catch (error) {
        console.error(` [Quest Storage] Échec d'écriture critique sur ${filePath}:`, error);
        if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
    }
}

function safeReadJson(filePath) {
    try {
        return fs.readJsonSync(filePath);
    } catch (error) {
        console.error(` [Quest Storage] Lecture corrompue détectée sur ${filePath}. Réinitialisation.`);
        return {};
    }
}

/**
 * Fonctions d'accès génériques pour l'écosystème
 */
const storage = {
    getQuestUsers: () => safeReadJson(PATHS.users),
    saveQuestUsers: (data) => safeWriteJson(PATHS.users, data),
    getQuestDefinitions: () => safeReadJson(PATHS.definitions),
    getStoryData: () => safeReadJson(PATHS.story),
    getDailyDefinitions: () => safeReadJson(PATHS.daily),
    getWeeklyDefinitions: () => safeReadJson(PATHS.weekly),
    getQuestEvents: () => safeReadJson(PATHS.events),

    /**
     * Génère ou récupère le profil de quêtes persistant d'un utilisateur
     */
    getUserQuestProfile: function (userId, userName) {
        const users = this.getQuestUsers();
        if (!users[userId]) {
            users[userId] = this.buildDefaultQuestProfile(userId, userName);
            this.saveQuestUsers(users);
        }
        // Vérification et réinitialisation des cycles temporels (Daily / Weekly)
        this.checkTimeResets(users[userId]);
        return users[userId];
    },

    saveUserQuestProfile: function (userId, data) {
        const users = this.getQuestUsers();
        users[userId] = data;
        this.saveQuestUsers(users);
    },

    buildDefaultQuestProfile: function (userId, userName) {
        return {
            id: userId,
            name: userName || `Aventurier #${userId.slice(-4)}`,
            createdAt: Date.now(),
            lastSeen: Date.now(),
            reputation: 0,
            questPoints: 0,
            rank: "Novice",
            completedCount: 0,
            claimedCount: 0,
            storyProgress: {
                currentChapter: 1,
                currentQuestId: "CH1_Q1",
                completedSteps: {}
            },
            dailyProgress: {
                lastReset: Date.now(),
                streak: 0,
                activeQuests: {}
            },
            weeklyProgress: {
                lastReset: Date.now(),
                activeQuests: {}
            },
            activeContracts: {},
            completedQuestIds: [],
            claimedQuestIds: [],
            stats: {
                combat_win: 0, monster_kill: 0, boss_kill: 0, dungeon_clear: 0,
                bank_deposit: 0, bank_withdraw: 0, bank_transfer: 0, bank_invest: 0,
                guild_join: 0, guild_donate: 0, guild_war_attack: 0, territory_capture: 0,
                pirate_raid_win: 0, pirate_treasure: 0, marry: 0, couple_gift: 0
            },
            cooldowns: {},
            history: []
        };
    },

    checkTimeResets: function (profile) {
        const now = Date.now();
        const oneDay = 24 * 60 * 60 * 1000;
        const oneWeek = 7 * oneDay;

        // Reset Journalier
        if (now - profile.dailyProgress.lastReset >= oneDay) {
            const definitions = this.getDailyDefinitions();
            profile.dailyProgress.activeQuests = {};
            // Sélectionner 3 quêtes quotidiennes aléatoires
            const keys = Object.keys(definitions);
            const shuffled = keys.sort(() => 0.5 - Math.random()).slice(0, 3);
            shuffled.forEach(id => {
                profile.dailyProgress.activeQuests[id] = {
                    id,
                    progress: 0,
                    target: definitions[id].target,
                    claimed: false
                };
            });
            profile.dailyProgress.lastReset = now;
        }

        // Reset Hebdomadaire
        if (now - profile.weeklyProgress.lastReset >= oneWeek) {
            const definitions = this.getWeeklyDefinitions();
            profile.weeklyProgress.activeQuests = {};
            Object.keys(definitions).forEach(id => {
                profile.weeklyProgress.activeQuests[id] = {
                    id,
                    progress: 0,
                    target: definitions[id].target,
                    claimed: false
                };
            });
            profile.weeklyProgress.lastReset = now;
        }
    },

    /**
     * 🔗 POINT D'ENTRÉE DU TRACKER GLOBAL D'ACTIONS
     * Peut être appelé depuis n'importe quelle autre commande du bot :
     * global.questStorage.trackQuestProgress(userId, actionType, payload);
     */
    trackQuestProgress: function (userId, actionType, payload = {}) {
        const users = this.getQuestUsers();
        if (!users[userId]) return;

        const profile = users[userId];
        this.checkTimeResets(profile);

        // Incrementation de la statistique brute
        if (profile.stats[actionType] !== undefined) {
            const increment = payload.amount || 1;
            profile.stats[actionType] += increment;
        }

        // 1. Progression Quêtes Daily
        Object.keys(profile.dailyProgress.activeQuests).forEach(id => {
            const active = profile.dailyProgress.activeQuests[id];
            const def = this.getDailyDefinitions()[id];
            if (def && def.actionType === actionType) {
                const add = payload.amount || 1;
                active.progress = Math.min(active.target, active.progress + add);
            }
        });

        // 2. Progression Quêtes Weekly
        Object.keys(profile.weeklyProgress.activeQuests).forEach(id => {
            const active = profile.weeklyProgress.activeQuests[id];
            const def = this.getWeeklyDefinitions()[id];
            if (def && def.actionType === actionType) {
                const add = payload.amount || 1;
                active.progress = Math.min(active.target, active.progress + add);
            }
        });

        // 3. Progression Story Quests
        const currentQuestId = profile.storyProgress.currentQuestId;
        if (currentQuestId) {
            const storyData = this.getStoryData();
            const currentQuest = storyData[currentQuestId];
            if (currentQuest && currentQuest.objectives.actionType === actionType) {
                if (!profile.storyProgress.completedSteps[currentQuestId]) {
                    profile.storyProgress.completedSteps[currentQuestId] = 0;
                }
                const add = payload.amount || 1;
                profile.storyProgress.completedSteps[currentQuestId] = Math.min(
                    currentQuest.objectives.target,
                    profile.storyProgress.completedSteps[currentQuestId] + add
                );
            }
        }

        // 4. Progression Contrats actifs (Quest Board)
        Object.keys(profile.activeContracts).forEach(id => {
            const contract = profile.activeContracts[id];
            if (contract.actionType === actionType) {
                const add = payload.amount || 1;
                contract.progress = Math.min(contract.target, contract.progress + add);
            }
        });

        this.updateRank(profile);
        this.saveUserQuestProfile(userId, profile);
    },

    updateRank: function (profile) {
        const pts = profile.reputation;
        if (pts >= 10000) profile.rank = "Mythique";
        else if (pts >= 5000) profile.rank = "Légende";
        else if (pts >= 2500) profile.rank = "Héros";
        else if (pts >= 1200) profile.rank = "Vétéran";
        else if (pts >= 500) profile.rank = "Chasseur";
        else if (pts >= 150) profile.rank = "Aventurier";
        else profile.rank = "Novice";
    }
};

/**
 * Fixtures statiques de secours pour alimenter les JSON à la création initiale
 */
function getStoryFixtures() {
    return {
        "CH1_Q1": {
            id: "CH1_Q1", chapter: 1, title: "Le Réveil du Chasseur",
            description: "Faites vos preuves auprès de l'instructeur en nettoyant vos premiers donjons.",
            objectives: { actionType: "dungeon_clear", target: 2, desc: "Terminer 2 donjons" },
            rewards: { money: 5000, xp: 200, reputation: 25, points: 5 },
            nextQuestId: "CH1_Q2"
        },
        "CH1_Q2": {
            id: "CH1_Q2", chapter: 1, title: "L'Épargne de Sécurité",
            description: "Allez sécuriser vos premiers gains à la banque centrale pour l'avenir.",
            objectives: { actionType: "bank_deposit", target: 25000, desc: "Déposer 25,000 Or en banque" },
            rewards: { money: 2000, xp: 300, reputation: 35, points: 10 },
            nextQuestId: "CH2_Q1"
        }
    };
}

function getQuestFixtures(type) {
    if (type === "daily") {
        return {
            "D_DUNGEON": { id: "D_DUNGEON", title: "Nettoyage du jour", description: "Compléter un donjon", actionType: "dungeon_clear", target: 1, rewards: { money: 2000, reputation: 10, points: 2 } },
            "D_BANK": { id: "D_BANK", title: "Investisseur Quotidien", description: "Déposer des fonds", actionType: "bank_deposit", target: 10000, rewards: { money: 1000, reputation: 5, points: 1 } },
            "D_PIRATE": { id: "D_PIRATE", title: "Raid de la taverne", description: "Lancer un raid pirate réussi", actionType: "pirate_raid_win", target: 1, rewards: { money: 3000, reputation: 15, points: 3 } }
        };
    }
    if (type === "weekly") {
        return {
            "W_CONQUEROR": { id: "W_CONQUEROR", title: "Seigneur des Donjons", description: "Compléter une série de donjons", actionType: "dungeon_clear", target: 10, rewards: { money: 25000, reputation: 100, points: 20 } },
            "W_GUILD": { id: "W_GUILD", title: "Pilier de la Communauté", description: "Soutenir massivement votre guilde", actionType: "guild_donate", target: 100000, rewards: { money: 15000, reputation: 80, points: 15 } }
        };
    }
    return {};
}

// Rendre le point d'entrée global pour l'accessibilité inter-commandes
global.questStorage = storage;
module.exports = storage;
