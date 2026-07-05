/**
 * 💍 SYSTEME MARRIAGE V2 PREMIUM - MOTEUR DE PERSISTANCE ISOLE
 * Version : 2.0.0
 * Architecture : Sauvegardes Atomiques & Normalisation Relationnelle
 */

const fs = require("fs");
const path = require("path");

// Configuration du répertoire de la base de données dédiée
const DATA_DIR = path.join(__dirname, "database");

const PATHS = {
    MARRIAGES: path.join(DATA_DIR, "marriages.json"),
    PROFILES: path.join(DATA_DIR, "profiles.json"),
    PROPOSALS: path.join(DATA_DIR, "proposals.json")
};

/**
 * Initialise l'environnement de stockage et les structures JSON par défaut
 */
function initStorage() {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(PATHS.MARRIAGES)) fs.writeFileSync(PATHS.MARRIAGES, JSON.stringify({}, null, 4), "utf8");
    if (!fs.existsSync(PATHS.PROFILES)) fs.writeFileSync(PATHS.PROFILES, JSON.stringify({}, null, 4), "utf8");
    if (!fs.existsSync(PATHS.PROPOSALS)) fs.writeFileSync(PATHS.PROPOSALS, JSON.stringify({}, null, 4), "utf8");
}

/**
 * Lecture sécurisée d'un registre JSON avec restauration automatique si corrompu
 */
function readJSON(filePath, fallback = {}) {
    try {
        if (!fs.existsSync(filePath)) return fallback;
        const content = fs.readFileSync(filePath, "utf8");
        return JSON.parse(content);
    } catch (error) {
        return fallback;
    }
}

/**
 * Écriture atomique sécurisée via fichier temporaire pour éviter les pertes sur crash/restart
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

// Initialisation au chargement initial du module
initStorage();

module.exports = {
    getMarriages: () => readJSON(PATHS.MARRIAGES),
    saveMarriages: (data) => writeJSON(PATHS.MARRIAGES, data),
    
    getProfiles: () => readJSON(PATHS.PROFILES),
    saveProfiles: (data) => writeJSON(PATHS.PROFILES, data),
    
    getProposals: () => readJSON(PATHS.PROPOSALS),
    saveProposals: (data) => writeJSON(PATHS.PROPOSALS, data),

    /**
     * Récupère ou initialise le profil de mariage individuel d'un utilisateur
     */
    getUserMarriageProfile: function (userId, userName) {
        const profiles = readJSON(PATHS.PROFILES);
        if (!profiles[userId]) {
            profiles[userId] = {
                id: userId,
                name: userName,
                isMarried: false,
                coupleId: null,
                proposalCooldown: 0,
                dailyCooldown: 0,
                history: []
            };
            writeJSON(PATHS.PROFILES, profiles);
        }
        return profiles[userId];
    },

    saveUserMarriageProfile: function (userId, data) {
        const profiles = readJSON(PATHS.PROFILES);
        profiles[userId] = data;
        writeJSON(PATHS.PROFILES, profiles);
    },

    /**
     * Gestion fine du registre des propositions en attente avec expiration
     */
    createProposal: function (fromId, toId, extraData = {}) {
        const proposals = readJSON(PATHS.PROPOSALS);
        proposals[toId] = {
            fromId: fromId,
            toId: toId,
            createdAt: Date.now(),
            expiresAt: Date.now() + (5 * 60 * 1000), // Expiration stricte après 5 minutes
            ...extraData
        };
        writeJSON(PATHS.PROPOSALS, proposals);
        return proposals[toId];
    },

    getProposal: function (targetId) {
        const proposals = readJSON(PATHS.PROPOSALS);
        const prop = proposals[targetId];
        if (prop && Date.now() > prop.expiresAt) {
            delete proposals[targetId];
            writeJSON(PATHS.PROPOSALS, proposals);
            return null;
        }
        return prop;
    },

    removeProposal: function (targetId) {
        const proposals = readJSON(PATHS.PROPOSALS);
        if (proposals[targetId]) {
            delete proposals[targetId];
            writeJSON(PATHS.PROPOSALS, proposals);
            return true;
        }
        return false;
    },

    /**
     * Crée une union officielle et initialise la structure riche du couple V2
     */
    createMarriage: function (userA, userB) {
        const marriages = readJSON(PATHS.MARRIAGES);
        const profiles = readJSON(PATHS.PROFILES);
        const coupleId = `couple_${userA.id}_${userB.id}`;

        const compScore = Math.floor(60 + Math.random() * 40); // Score initial semi-fixe réaliste

        marriages[coupleId] = {
            id: coupleId,
            user1Id: userA.id,
            user2Id: userB.id,
            user1Name: userA.name,
            user2Name: userB.name,
            marriedAt: Date.now(),
            anniversary: Date.now(),
            coupleName: `Union de ${userA.name} & ${userB.name}`,
            quote: "Aucune citation définie.",
            bio: "Une union sacrée nouvellement forgée.",
            ringTier: "Bronze",
            loveLevel: 1,
            bondXp: 0,
            bondLevel: 1,
            totalGiftMoney: 0,
            giftCount: 0,
            lastInteractionAt: Date.now(),
            compatibilityScore: compScore,
            history: [
                { timestamp: Date.now(), type: "MARIAGE", message: `Célébration du mariage de ${userA.name} et ${userB.name}.` }
            ],
            stats: {
                daysTogether: 0,
                giftsSent: 0,
                totalGiftMoney: 0,
                dailyClaimCount: 0,
                lovePoints: 10,
                interactions: 1,
                fights: 0,
                reconciliations: 0
            }
        };

        // Mutation immédiate des deux profils individuels
        profiles[userA.id].isMarried = true;
        profiles[userA.id].coupleId = coupleId;
        profiles[userB.id].isMarried = true;
        profiles[userB.id].coupleId = coupleId;

        writeJSON(PATHS.MARRIAGES, marriages);
        writeJSON(PATHS.PROFILES, profiles);

        return marriages[coupleId];
    },

    /**
     * Dissolution d'un mariage et nettoyage propre sans corruption
     */
    removeMarriage: function (coupleId) {
        const marriages = readJSON(PATHS.MARRIAGES);
        const profiles = readJSON(PATHS.PROFILES);
        const couple = marriages[coupleId];

        if (!couple) return false;

        if (profiles[couple.user1Id]) {
            profiles[couple.user1Id].isMarried = false;
            profiles[couple.user1Id].coupleId = null;
            this.logMarriageEvent(profiles[couple.user1Id], "DIVORCE", `A divorcé de ${couple.user2Name}`);
        }
        if (profiles[couple.user2Id]) {
            profiles[couple.user2Id].isMarried = false;
            profiles[couple.user2Id].coupleId = null;
            this.logMarriageEvent(profiles[couple.user2Id], "DIVORCE", `A divorcé de ${couple.user1Name}`);
        }

        delete marriages[coupleId];
        writeJSON(PATHS.MARRIAGES, marriages);
        writeJSON(PATHS.PROFILES, profiles);
        return true;
    },

    /**
     * Système d'XP et de progression dynamique du couple
     */
    addCoupleXp: function (couple, xpAmount) {
        couple.bondXp += xpAmount;
        let xpNeeded = couple.bondLevel * 500;
        let leveledUp = false;

        while (couple.bondXp >= xpNeeded) {
            couple.bondXp -= xpNeeded;
            couple.bondLevel += 1;
            couple.loveLevel += 1;
            leveledUp = true;
            xpNeeded = couple.bondLevel * 500;
        }

        // Mutation automatique du Ring Tier en fonction du niveau atteint
        if (couple.bondLevel >= 50) couple.ringTier = "Mythique";
        else if (couple.bondLevel >= 35) couple.ringTier = "Rubis";
        else if (couple.bondLevel >= 20) couple.ringTier = "Saphir";
        else if (couple.bondLevel >= 10) couple.ringTier = "Or";
        else if (couple.bondLevel >= 5) couple.ringTier = "Argent";

        return leveledUp;
    },

    /**
     * Journal d'historique circulaire limité à 15 entrées maximum pour éviter l'inflation
     */
    logMarriageEvent: function (targetStruct, type, message) {
        if (!targetStruct.history) targetStruct.history = [];
        targetStruct.history.unshift({
            timestamp: Date.now(),
            type: type,
            message: message
        });
        if (targetStruct.history.length > 15) targetStruct.history.pop();
    }
};
