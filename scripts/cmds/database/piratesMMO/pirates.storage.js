/**
 * 🏴‍☠️ MOTEUR DE SAUVEGARDE & CONFIGURATION GENERALE MMORPG PIRATES
 * Fichier : pirates.storage.js
 * Emplacement recommandé : database/piratesMMO/pirates.storage.js
 */

const fs = require("fs-extra");
const path = require("path");

// Définition des répertoires persistants (Strictement hors du cache/tmp)
const DATA_DIR = path.join(process.cwd(), "database", "piratesMMO");
const USERS_FILE = path.join(DATA_DIR, "users_registry.json");
const CREWS_FILE = path.join(DATA_DIR, "crews_registry.json");
const WORLD_FILE = path.join(DATA_DIR, "world_state.json");

// Tableaux de conversion pour le style de texte premium requis
const STYLE1_MAP = {
    'A':'𝐀','B':'𝐁','C':'𝐂','D':'𝐃','E':'𝐄','F':'𝐅','G':'𝐆','H':'𝐇','I':'𝐈','J':'𝐉','K':'𝐊','L':'𝐋','M':'𝐌',
    'N':'𝐍','O':'𝐎','P':'𝐏','Q':'𝐐','R':'𝐑','S':'𝐒','T':'𝐓','U':'𝐔','V':'𝐕','W':'𝐖','X':'𝐗','Y':'𝐘','Z':'𝐙',
    'a':'𝐀','b':'𝐁','c':'𝐂','d':'𝐃','e':'𝐄','f':'𝐅','g':'𝐆','h':'𝐇','i':'𝐈','j':'𝐉','k':'𝐊','l':'𝐋','m':'𝐌',
    'n':'𝐍','o':'𝐎','p':'𝐏','q':'𝐐','r':'𝐑','s':'𝐒','t':'𝐓','u':'𝐔','v':'𝐕','w':'𝐖','x':'𝐗','y':'𝐘','z':'𝐙'
};

const STYLE2_MAP = {
    'A':'𝖠','B':'𝖡','C':'𝖢','D':'𝖣','E':'𝖤','F':'𝖥','G':'𝖦','H':'𝖧','I':'𝖨','J':'𝖩','K':'𝖪','L':'𝖫','M':'𝖬',
    'N':'𝖭','O':'𝖮','P':'𝖯','Q':'𝖭','R':'𝖱','S':'𝖲','T':'𝖳','U':'𝖴','V':'𝖵','W':'𝖶','X':'𝖷','Y':'𝖸','Z':'𝖹',
    'a':'𝖺','b':'𝖻','c':'𝖼','d':'𝖽','e':'𝖾','f':'𝖿','g':'𝗀','h':'𝖸','i':'𝗂','j':'𝗃','k':'𝗄','l':'𝗅','m':'𝗆',
    'n':'𝗇','o':'𝗈','p':'𝗉','q':'𝗊','r':'𝗋','s':'𝗌','t':'𝗍','u':'𝗎','v':'𝗏','w':'𝗐','x':'𝗑','y':'𝗒','z':'𝗓'
};

// Structures en mémoire vive pour des accès instantanés à l'écriture
let _users = {};
let _crews = {};
let _world = { activeKrakenHP: 0, lastSpawn: 0, serverRaidsCount: 0 };

const Storage = {
    init: () => {
        fs.ensureDirSync(DATA_DIR);
        
        if (!fs.existsSync(USERS_FILE)) fs.writeJsonSync(USERS_FILE, {});
        if (!fs.existsSync(CREWS_FILE)) fs.writeJsonSync(CREWS_FILE, {});
        if (!fs.existsSync(WORLD_FILE)) fs.writeJsonSync(WORLD_FILE, _world);

        _users = fs.readJsonSync(USERS_FILE);
        _crews = fs.readJsonSync(CREWS_FILE);
        _world = fs.readJsonSync(WORLD_FILE);
    },

    getUsers: () => _users,
    getCrews: () => _crews,
    getWorld: () => _world,

    saveUsers: () => fs.writeJsonSync(USERS_FILE, _users, { spaces: 2 }),
    saveCrews: () => fs.writeJsonSync(CREWS_FILE, _crews, { spaces: 2 }),
    saveWorld: () => fs.writeJsonSync(WORLD_FILE, _world, { spaces: 2 }),

    /**
     * Instancie le profil persistant d'un joueur s'il est inexistant
     */
    getUserProfile: (uid, fallbackName = "Pirate Anonyme") => {
        if (!_users[uid]) {
            _users[uid] = {
                uid: uid,
                name: fallbackName,
                crewId: null,
                role: "PIRATE",
                gold: 1500,
                doubloons: 10,
                xp: 0,
                level: 1,
                stats: { explorations: 0, chestsOpened: 0, duelsWon: 0, bossKilled: 0, goldPlundered: 0 },
                inventory: { repair_kit: 3, rum_bottle: 2, treasure_map_common: 1 },
                cooldowns: { explore: 0, work: 0, daily: 0, duel: 0, boss: 0 },
                missions: { current: [], daystamp: 0 },
                achievements: []
            };
            Storage.saveUsers();
        }
        return _users[uid];
    },

    /**
     * Journalisation interne des événements d'un équipage
     */
    logCrewEvent: (crewId, type, message) => {
        if (!_crews[crewId]) return;
        if (!_crews[crewId].logs) _crews[crewId].logs = [];
        
        _crews[crewId].logs.unshift({
            timestamp: Date.now(),
            type: type,
            message: message
        });

        if (_crews[crewId].logs.length > 25) _crews[crewId].logs.pop();
        Storage.saveCrews();
    },

    // Fonctions de formatage et polices Unicode requises
    toStyle1: (text) => text.split('').map(c => STYLE1_MAP[c] || c).join(''),
    toStyle2: (text) => text.split('').map(c => STYLE2_MAP[c] || c).join(''),

    formatMoney: (amount) => {
        return new Intl.NumberFormat('fr-FR').format(amount) + " 🪙";
    },

    buildPremiumBox: (title, lines) => {
        let box = `╭───────────────────────────────────────╮\n`;
        box += `│ 🏴‍☠️  ${Storage.toStyle1(title)}\n`;
        box += `├───────────────────────────────────────┤\n`;
        lines.forEach(line => {
            box += `│ ${line}\n`;
        });
        box += `╰───────────────────────────────────────╯`;
        return box;
    }
};

Storage.init();
module.exports = Storage;
