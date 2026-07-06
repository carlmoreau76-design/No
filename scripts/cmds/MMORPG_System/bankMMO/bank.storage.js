/**
 * 💾 MOTEUR DE STOCKAGE BANCAIRE PERSISTANT & IMMUTABLE (V2 PREMIUM)
 * Conçu spécifiquement pour l'architecture MMORPG Économique de GoatBot.
 * Assure la sécurité des mutations, la normalisation des profils et le cycle de marché.
 */

const fs = require("fs-extra");
const path = require("path");

const DB_DIR = path.join(process.cwd(), "database", "bankMMO");
const PATHS = {
    users: path.join(DB_DIR, "bank_users.json"),
    market: path.join(DB_DIR, "bank_market.json"),
    events: path.join(DB_DIR, "bank_events.json")
};

// Structures de données par défaut (Normalisation d'infrastructure)
const DEFAULT_MARKET = {
    lastUpdate: Date.now(),
    stocks: {
        "AAPL": { id: "AAPL", name: "MegaCorp Tech", price: 150, trend: "UP", volatility: 0.05, stability: "Stable" },
        "TSLA": { id: "TSLA", name: "Fictional CyberCar", price: 320, trend: "DOWN", volatility: 0.12, stability: "Volatile" },
        "AMZN": { id: "AMZN", name: "Orion Logistics", price: 210, trend: "UP", volatility: 0.04, stability: "Très Stable" },
        "GME": { id: "GME", name: "Stellar Gaming Guild", price: 45, trend: "UP", volatility: 0.35, stability: "Chaotique" }
    },
    cryptos: {
        "BTC": { id: "BTC", name: "FictiveCoin Prime", price: 45000, trend: "UP", volatility: 0.15 },
        "ETH": { id: "ETH", name: "Nebula Ether", price: 2800, trend: "DOWN", volatility: 0.22 },
        "DOGE": { id: "DOGE", name: "MemeShiba Gold", price: 0.5, trend: "UP", volatility: 0.55 },
        "XRP": { id: "XRP", name: "Quantum Ledger", price: 1.2, trend: "DOWN", volatility: 0.18 }
    }
};

// Initialisation immédiate et sécurisée du système de fichiers
fs.ensureDirSync(DB_DIR);
if (!fs.existsSync(PATHS.users)) fs.writeJsonSync(PATHS.users, {});
if (!fs.existsSync(PATHS.events)) fs.writeJsonSync(PATHS.events, []);
if (!fs.existsSync(PATHS.market)) fs.writeJsonSync(PATHS.market, DEFAULT_MARKET);

/**
 * Formate un nombre de manière élégante et lisible (Ex: 1.2M, 4.5B)
 */
function formatMoney(value) {
    if (value === undefined || isNaN(value)) return "0";
    const absolute = Math.abs(value);
    const sign = value < 0 ? "-" : "";
    
    if (absolute >= 1e12) return sign + (absolute / 1e12).toFixed(1) + "T";
    if (absolute >= 1e9) return sign + (absolute / 1e9).toFixed(1) + "B";
    if (absolute >= 1e6) return sign + (absolute / 1e6).toFixed(1) + "M";
    if (absolute >= 1e3) return sign + (absolute / 1e3).toFixed(1) + "K";
    return sign + Math.floor(absolute).toString();
}

/**
 * Génère un profil bancaire vierge et standardisé
 */
function createBlankProfile(userId, userName) {
    return {
        id: userId,
        name: userName,
        bankBalance: 0,
        vaultBalance: 0,
        creditScore: 500, // Score médian de départ
        totalDeposited: 0,
        totalWithdrawn: 0,
        totalTransferred: 0,
        totalEarnedFromBusiness: 0,
        totalEarnedFromRent: 0,
        totalLostToRob: 0,
        totalStolen: 0,
        dailyState: { lastClaim: 0, streak: 0 },
        weeklyState: { lastClaim: 0 },
        monthlyState: { lastClaim: 0 },
        loan: { hasActiveLoan: false, principal: 0, remainingDebt: 0, dueDate: 0, lastPenaltyAt: 0 },
        robberyState: { lastRobAt: 0, lastRobTarget: null, robSuccess: 0, robFail: 0, shieldUntil: 0 },
        portfolio: { stocks: {}, crypto: {} },
        businesses: {},
        properties: {},
        achievements: [],
        history: [],
        createdAt: Date.now(),
        updatedAt: Date.now()
    };
}

const storage = {
    formatMoney,

    getUsers: () => fs.readJsonSync(PATHS.users),
    saveUsers: (data) => fs.writeJsonSync(PATHS.users, data, { spaces: 2 }),

    getMarket: () => fs.readJsonSync(PATHS.market),
    saveMarket: (data) => fs.writeJsonSync(PATHS.market, data, { spaces: 2 }),

    /**
     * Récupère ou instancie de manière atomique le profil d'un joueur
     */
    getUserBankProfile: function (userId, userName) {
        const users = this.getUsers();
        if (!users[userId]) {
            users[userId] = createBlankProfile(userId, userName);
            this.saveUsers(users);
        } else {
            // Remplissage automatique des champs manquants si mise à jour à chaud
            const blank = createBlankProfile(userId, userName);
            let updated = false;
            for (let key in blank) {
                if (users[userId][key] === undefined) {
                    users[userId][key] = blank[key];
                    updated = true;
                }
            }
            if (updated) this.saveUsers(users);
        }
        return users[userId];
    },

    saveUserBankProfile: function (userId, profile) {
        const users = this.getUsers();
        profile.updatedAt = Date.now();
        users[userId] = profile;
        this.saveUsers(users);
    },

    /**
     * Enregistre un événement financier avec rotation automatique (Max 15 entrées par utilisateur)
     */
    logTransaction: function (profile, type, message) {
        if (!profile.history) profile.history = [];
        profile.history.unshift({
            timestamp: Date.now(),
            type: type.toUpperCase(),
            message: message
        });
        if (profile.history.length > 15) {
            profile.history.pop();
        }
    },

    /**
     * Simulation des fluctuations boursières (Mise à jour toutes les 15 minutes max)
     */
    updateMarketPrices: function () {
        const market = this.getMarket();
        const now = Date.now();
        // Cooldown interne de 15 minutes pour stabiliser le marché par cycle de commande
        if (now - market.lastUpdate < 15 * 60 * 1000) return market;

        // Évolution des actions
        for (let id in market.stocks) {
            let asset = market.stocks[id];
            let changePercent = (Math.random() * asset.volatility);
            asset.trend = Math.random() > 0.48 ? "UP" : "DOWN";
            if (asset.trend === "UP") {
                asset.price = Math.floor(asset.price * (1 + changePercent));
            } else {
                asset.price = Math.max(10, Math.floor(asset.price * (1 - changePercent)));
            }
        }

        // Évolution ultra-volatile des cryptos
        for (let id in market.cryptos) {
            let crypto = market.cryptos[id];
            let changePercent = (Math.random() * crypto.volatility);
            // Événement rare : Krach ou Pump massif (1% de chance)
            if (Math.random() < 0.02) changePercent *= 3;
            crypto.trend = Math.random() > 0.52 ? "UP" : "DOWN";
            if (crypto.trend === "UP") {
                crypto.price = parseFloat((crypto.price * (1 + changePercent)).toFixed(2));
            } else {
                crypto.price = Math.max(0.01, parseFloat((crypto.price * (1 - changePercent)).toFixed(2)));
            }
        }

        market.lastUpdate = now;
        this.saveMarket(market);
        return market;
    }
};

module.exports = storage;
