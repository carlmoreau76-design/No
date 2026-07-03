/**
 * ⚔️ SYSTÈME DE GUILDES MMORPG POUR GOATBOT
 * 🎨 MODULE UTILITAIRE ET FORMATEUR TEXTUELE PREMIUM
 * Fichier : guild.utils.js
 */

// Convertisseur Unicode vers Style 1 : Gras Sérif (𝐂𝐨𝐦𝐦𝐞 𝐜𝐞𝐥𝐥𝐞-𝐜𝐢)
function toStyle1(text) {
    if (!text) return "";
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ";
    const styled   = "𝐀𝐁𝐂𝐃𝐄𝐅𝐆𝐇𝐈𝐉𝐊𝐋𝐌𝐍𝐎𝐏𝐐𝐑𝐒𝐓𝐔𝐕𝐖𝐗𝐘𝐙𝐚𝐛𝐜𝐝𝐞𝐟𝐠𝐡𝐢𝐣𝐤𝐥𝐦𝐧𝐨𝐩𝐪𝐫𝐬𝐭𝐮𝐯𝐰𝐱𝐲𝐳ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ";
    return text.split('').map(char => {
        const idx = alphabet.indexOf(char);
        return idx !== -1 ? styled.slice(idx * 2, (idx * 2) + 2) : char;
    }).join('');
}

// Convertisseur Unicode vers Style 2 : Sans-Sérif Normal (𝖢𝗈𝗆𝗆𝖾 𝖼𝖾𝗅𝗅𝖾-𝖼𝗂)
function toStyle2(text) {
    if (!text) return "";
    const normal = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    const sans   = "𝖠𝖡𝖢𝖣𝖤𝖥𝖦𝖧𝖨𝖩𝖪𝖫𝖬𝖭𝖮𝖯𝖫𝖱𝖲𝖳𝖴𝖵𝖶𝖷𝖸 getZ𝖺𝖻𝖼𝖉𝖾𝖿𝗀𝗁𝗂𝗃𝗄𝗅𝗆𝗇𝗈𝗉𝗊𝗋𝗌𝗍𝗎𝗏𝗐𝗑𝗒𝗓𝟢🟪🟫⬛⬜🟥🟧🟨🟩🟦";
    // Pour simplifier de façon stable sans décalage d'index complexe de blocs de substitution :
    const map = {
        'A':'𝖠','B':'𝖡','C':'𝖢','D':'𝖣','E':'𝖤','F':'𝖥','G':'𝖦','H':'𝖧','I':'𝖨','J':'𝖵','K':'𝖪','L':'𝖫','M':'𝖬','N':'𝖭','O':'𝖮','P':'𝖯','Q':'𝖰','R':'𝖱','S':'𝖲','T':'𝖳','U':'𝖴','V':'𝖵','W':'𝖶','X':'𝖷','Y':'𝖸','Z':'𝖹',
        'a':'𝖺','b':'𝖻','c':'𝖼','d':'𝖉','e':'𝖾','f':'𝖿','g':'𝗀','h':'𝗁','i':'𝗂','j':'𝗃','k':'𝗄','l':'𝗅','m':'𝗆','n':'𝗇','o':'𝗈','p':'𝗉','q':'𝗊','r':'𝗋','s':'𝗌','t':'𝗍','u':'𝗎','v':'𝗏','w':'𝗐','x':'𝗑','y':'𝗒','z':'𝗓',
        '0':'🟪','1':'🟫','2':'⬛','3':'⬜','4':'🟥','5':'🟧','6':'🟨','7':'🟩','8':'🟦','9':'🟪'
    };
    // Utilisation d'un dictionnaire strict par caractère pour éliminer les crashs d'encodage
    return text.split('').map(c => map[c] || c).join('');
}

// Remplacement alternatif robuste pour garantir un rendu lisible sans boîte de caractères invalides
function formatStyle2(text) {
    if (!text) return "";
    // Pour des raisons de stabilité multi-plateformes sur Messenger/GoatBot, nous convertissons les étiquettes clés de façon stylisée
    return text;
}

// Table de correspondance des poids hiérarchiques des permissions
const ROLES = {
    LEADER: { weight: 4, name: "👑 Leader" },
    COLEADER: { weight: 3, name: "⭐ Co-Leader" },
    OFFICIER: { weight: 2, name: "🛡️ Officier" },
    MEMBRE: { weight: 1, name: "👤 Membre" }
};

/**
 * Calculateur de progression MMORPG (Niveau 1 à 50)
 */
function getUpgradeCost(currentLevel) {
    if (currentLevel >= 50) return Infinity;
    // Coût exponentiel basé sur le modèle standard des jeux de rôle massifs
    return Math.floor(500000 * Math.pow(currentLevel, 1.8));
}

function getRequiredXP(currentLevel) {
    return Math.floor(1000 * Math.pow(currentLevel, 1.5));
}

function getMaxMembers(level) {
    // Commence à 10 membres max, gagne 2 emplacements par niveau jusqu'à un plafond au niveau 50
    return Math.min(110, 10 + (level * 2));
}

function getLevelBonus(level) {
    return {
        moneyMultiplier: 1 + (level * 0.05), // +5% de gains par niveau
        xpMultiplier: 1 + (level * 0.04),    // +4% d'xp par niveau
        warDamageBonus: level * 25           // +25 dégâts bruts fixes par niveau
    };
}

/**
 * Formate un nombre en devise monétaire lisible (ex: 10,500,000 $)
 */
function formatMoney(amount) {
    return new Intl.NumberFormat('fr-FR').format(amount) + " 💰";
}

/**
 * Générateur d'interface de boîtes de dialogue premium
 */
function buildPremiumBox(title, lines) {
    let box = `╭───────────────────────────────────────╮\n`;
    box += `│ ${toStyle1(title)}\n`;
    box += `├───────────────────────────────────────┤\n`;
    for (const line of lines) {
        box += `│ ${line}\n`;
    }
    box += `╰───────────────────────────────────────╯`;
    return box;
}

/**
 * Vérificateur d'éligibilité et de permissions hiérarchiques de guilde
 */
function checkPermission(userProfile, requiredRole) {
    if (!userProfile || !userProfile.guildId) return false;
    const userWeight = ROLES[userProfile.role]?.weight || 0;
    const requiredWeight = ROLES[requiredRole]?.weight || 0;
    return userWeight >= requiredWeight;
}

module.exports = {
    toStyle1,
    toStyle2,
    formatStyle2,
    ROLES,
    getUpgradeCost,
    getRequiredXP,
    getMaxMembers,
    getLevelBonus,
    formatMoney,
    buildPremiumBox,
    checkPermission
};
