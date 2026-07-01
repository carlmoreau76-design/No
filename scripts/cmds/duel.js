const fs = require('fs-extra');
const path = require('path');

// ===================================================================================================
// PARTIE 1 : GESTIONNAIRE DE DONNÉES (Intégré)
// ===================================================================================================
const DATA_PATH = path.join(__dirname, 'duelData.json');

let duelData = { players: {}, history: [] };
if (fs.existsSync(DATA_PATH)) {
    try { duelData = fs.readJsonSync(DATA_PATH); } catch (e) { console.error("Erreur lecture duelData", e); }
}

const RANKS = [
    { name: "Débutant", min: 0 },
    { name: "Bronze", min: 100 },
    { name: "Argent", min: 300 },
    { name: "Or", min: 600 },
    { name: "Platine", min: 1000 },
    { name: "Diamant", min: 1500 },
    { name: "Maître", min: 2200 },
    { name: "Grand Maître", min: 3000 },
    { name: "Légende", min: 4000 },
    { name: "GOAT", min: 5500 }
];

const SUCCESS = [
    { id: "first", name: "Premier Duel", desc: "Faire son premier combat", check: p => p.combats >= 1 },
    { id: "v10", name: "10 Victoires", desc: "Gagner 10 combats", check: p => p.victoires >= 10 },
    { id: "v50", name: "50 Victoires", desc: "Gagner 50 combats", check: p => p.victoires >= 50 },
    { id: "v100", name: "100 Victoires", desc: "Gagner 10 combats", check: p => p.victoires >= 100 },
    { id: "champ", name: "Champion", desc: "Atteindre le rang Diamant", check: p => p.points >= 1500 },
    { id: "invincible", name: "Invincible", desc: "Avoir une série de 7 victoires", check: p => p.serie >= 7 },
    { id: "goat_f", name: "GOAT Fighter", desc: "Atteindre le rang maximal GOAT", check: p => p.points >= 5500 }
];

function saveData() {
    fs.writeJsonSync(DATA_PATH, duelData, { spaces: 2 });
}

function getPlayer(id, name) {
    if (!duelData.players[id]) {
        duelData.players[id] = {
            id, name: name || "Guerrier", points: 0, combats: 0, victoires: 0, defaites: 0,
            maxGain: 0, maxSerie: 0, gameSerie: 0, achievements: [], lastDaily: 0
        };
        saveData();
    } else if (name && duelData.players[id].name !== name) {
        duelData.players[id].name = name;
        saveData();
    }
    return duelData.players[id];
}

function getRank(points) {
    let current = RANKS[0].name;
    for (let r of RANKS) {
        if (points >= r.min) current = r.name;
    }
    return current;
}

function checkAchievements(player) {
    let unlocked = [];
    for (let s of SUCCESS) {
        if (!player.achievements.includes(s.id) && s.check(player)) {
            player.achievements.push(s.id);
            unlocked.push(s.name);
        }
    }
    if (unlocked.length > 0) saveData();
    return unlocked;
}

// Stockage temporaire en mémoire des invitations et combats actifs
if (!global.duelSystem) {
    global.duelSystem = {
        invitations: new Map(),
        activeGames: new Map()
    };
}

// ===================================================================================================
// PARTIE 2 : COMMANDE PRINCIPALE GOATBOT
// ===================================================================================================
module.exports = {
    config: {
        name: "duel",
        version: "2.5.0",
        author: "AI Collaborator",
        countDown: 5,
        role: 0,
        description: "Système de combat PvP complet tout-en-un.",
        category: "game",
        guide: {
            fr: "{p}duel [@user] <mise>\n{p}duel accept\n{p}duel decline\n{p}duel stats\n{p}duel top\n{p}duel history\n{p}duel rank\n{p}duel daily\n{p}duel spectate\n{p}duel leaderboard"
        }
    },

    onStart: async function ({ api, event, args, Users }) {
        const { threadID, messageID, senderID } = event;
        const subCmd = args[0]?.toLowerCase();

        // Helpers d'économie GoatBot
        const getBalance = async (id) => {
            const userData = await Users.getData(id);
            return userData?.money || 0;
        };
        const decreaseMoney = async (id, amount) => {
            await Users.decreaseMoney(id, amount);
        };
        const increaseMoney = async (id, amount) => {
            await Users.increaseMoney(id, amount);
        };

        const helpMessage = `━━━━━━━━━━━━━━━━━━━━━━━━
⚔️ **COLISÉE PVP - GOATBOT** ⚔️
━━━━━━━━━━━━━━━━━━━━━━━━
• \`duel @user <mise>\` : Défier un joueur
• \`duel accept\` : Accepter le défi en cours
• \`duel decline\` : Refuser le défi
• \`duel spectate\` : Regarder le combat du salon
• \`duel stats\` : Voir vos statistiques
• \`duel rank\` : Progression des rangs PvP
• \`duel top\` / \`leaderboard\` : Classements
• \`duel history\` : Vos 20 derniers combats
• \`duel daily\` : Récompense quotidienne de rang
━━━━━━━━━━━━━━━━━━━━━━━━`;

        if (!subCmd) return api.sendMessage(helpMessage, threadID, messageID);

        // --- SUB-COMMAND: STATS ---
        if (subCmd === 'stats') {
            const pName = await Users.getNameUser(senderID);
            const p = getPlayer(senderID, pName);
            const wr = p.combats > 0 ? ((p.victoires / p.combats) * 100).toFixed(1) : 0;
            const msg = `━━━━━━━━━━━━━━━━━━━━━━━━
📊 **STATS PVP - ${p.name.toUpperCase()}**
━━━━━━━━━━━━━━━━━━━━━━━━
⚔️ Matchs : ${p.combats}
🏆 Victoires : ${p.victoires} | ❌ Défaites : ${p.defaites}
📈 Taux de Win : ${wr}%
🎖️ Rang Actuel : **${getRank(p.points)}** (${p.points} pts)
🔥 Série Actuelle : ${p.gameSerie} (Max : ${p.maxSerie})
💰 Plus gros gain : ${p.maxGain.toLocaleString()} $
🏅 Succès Débloqués : ${p.achievements.length}/${SUCCESS.length}
━━━━━━━━━━━━━━━━━━━━━━━━`;
            return api.sendMessage(msg, threadID, messageID);
        }

        // --- SUB-COMMAND: RANK ---
        if (subCmd === 'rank') {
            const pName = await Users.getNameUser(senderID);
            const p = getPlayer(senderID, pName);
            const currentRank = getRank(p.points);
            let rankList = RANKS.map(r => `${currentRank === r.name ? '👉 ' : '• '}**${r.name}** : ${r.min} pts`).join('\n');
            
            const msg = `━━━━━━━━━━━━━━━━━━━━━━━━
🎖️ **RANGS & PROGRESSION PVP**
━━━━━━━━━━━━━━━━━━━━━━━━
${rankList}
━━━━━━━━━━━━━━━━━━━━━━━━
Votre score : **${p.points} points**`;
            return api.sendMessage(msg, threadID, messageID);
        }

        // --- SUB-COMMAND: TOP / LEADERBOARD ---
        if (subCmd === 'top' || subCmd === 'leaderboard') {
            const arr = Object.values(duelData.players);
            if (arr.length === 0) return api.sendMessage("❌ Aucun historique de combat enregistré.", threadID, messageID);

            const topWins = [...arr].sort((a,b) => b.victoires - a.victoires).slice(0, 3);
            const topGains = [...arr].sort((a,b) => b.maxGain - a.maxGain).slice(0, 3);
            const topSerie = [...arr].sort((a,b) => b.maxSerie - a.maxSerie).slice(0, 3);
            const topKing = [...arr].sort((a,b) => b.points - a.points).slice(0, 1)[0];

            let msg = `━━━━━━━━━━━━━━━━━━━━━━━━
🏆 **TABLEAU DES CHAMPIONS PVP**
━━━━━━━━━━━━━━━━━━━━━━━━
👑 **MEILLEUR JOUEUR (GOAT)**
🥇 ${topKing.name} - ${topKing.points} pts (${getRank(topKing.points)})

🥇 **PLUS DE VICTOIRES**
${topWins.map((p, i) => `${i+1}. ${p.name} (${p.victoires} ⚔️)`).join('\n')}

💰 **PLUS GROS GAINS**
${topGains.map((p, i) => `${i+1}. ${p.name} (${p.maxGain.toLocaleString()} $)`).join('\n')}

🔥 **PLUS LONGUE SÉRIE**
${topSerie.map((p, i) => `${i+1}. ${p.name} (${p.maxSerie} de suite)`).join('\n')}
━━━━━━━━━━━━━━━━━━━━━━━━`;
            return api.sendMessage(msg, threadID, messageID);
        }

        // --- SUB-COMMAND: HISTORY ---
        if (subCmd === 'history') {
            const userHistory = duelData.history.filter(h => h.p1Id === senderID || h.p2Id === senderID).slice(-20).reverse();
            if (userHistory.length === 0) return api.sendMessage("📜 Votre historique de combat est vide.", threadID, messageID);

            let msg = `━━━━━━━━━━━━━━━━━━━━━━━━
📜 **20 DERNIERS COMBATS**
━━━━━━━━━━━━━━━━━━━━━━━━\n`;
            userHistory.forEach((h, idx) => {
                const isP1 = h.p1Id === senderID;
                const opponent = isP1 ? h.p2Name : h.p1Name;
                const result = h.winnerId === senderID ? "🏆 GAGNÉ" : "❌ PERDU";
                const gain = h.winnerId === senderID ? `+${h.gain.toLocaleString()} $` : `-${h.mise.toLocaleString()} $`;
                msg += `[${idx+1}] vs **${opponent}** | ${result} (${gain})\n📅 _${h.date}_\n\n`;
            });
            msg += `━━━━━━━━━━━━━━━━━━━━━━━━`;
            return api.sendMessage(msg, threadID, messageID);
        }

        // --- SUB-COMMAND: DAILY ---
        if (subCmd === 'daily') {
            const pName = await Users.getNameUser(senderID);
            const p = getPlayer(senderID, pName);
            const now = Date.now();
            if (now - p.lastDaily < 86400000) {
                const remains = 86400000 - (now - p.lastDaily);
                const hours = Math.floor(remains / 3600000);
                const mins = Math.floor((remains % 3600000) / 60000);
                return api.sendMessage(`❌ Récompense déjà récupérée ! Revenez dans ${hours}h ${mins}m.`, threadID, messageID);
            }

            const rank = getRank(p.points);
            const rewards = { "Débutant": 5000, "Bronze": 10000, "Argent": 25000, "Or": 50000, "Platine": 100000, "Diamant": 250000, "Maître": 500000, "Grand Maître": 1000000, "Légende": 2500000, "GOAT": 5000000 };
            const cash = rewards[rank] || 5000;

            await increaseMoney(senderID, cash);
            p.lastDaily = now;
            saveData();

            return api.sendMessage(`💰 **RÉCOMPENSE DIURNE**\n━━━━━━━━━━━━━━━━━━━━\nEn tant que rang **${rank}**, vous recevez **${cash.toLocaleString()} $** !`, threadID, messageID);
        }

        // --- SUB-COMMAND: SPECTATE ---
        if (subCmd === 'spectate') {
            const game = global.duelSystem.activeGames.get(threadID);
            if (!game) return api.sendMessage("❌ Aucun duel n'est actif dans ce salon actuellement.", threadID, messageID);
            if (game.p1.id === senderID || game.p2.id === senderID) return api.sendMessage("⚠️ Vous êtes déjà acteur de ce combat !", threadID, messageID);
            
            if (game.spectators.includes(senderID)) return api.sendMessage("👀 Vous observez déjà ce duel.", threadID, messageID);
            game.spectators.push(senderID);
            return api.sendMessage("👀 Vous avez rejoint les tribunes du Colisée en tant que spectateur !", threadID, messageID);
        }

        // --- SUB-COMMAND: DECLINE ---
        if (subCmd === 'decline') {
            if (!global.duelSystem.invitations.has(senderID)) return api.sendMessage("❌ Aucun défi ne vous est destiné actuellement.", threadID, messageID);
            global.duelSystem.invitations.delete(senderID);
            return api.sendMessage("❌ Défi refusé !", threadID, messageID);
        }

        // --- SUB-COMMAND: ACCEPT ---
        if (subCmd === 'accept') {
            const challenge = global.duelSystem.invitations.get(senderID);
            if (!challenge) return api.sendMessage("❌ Aucun défi actif à votre encontre.", threadID, messageID);
            if (global.duelSystem.activeGames.has(threadID)) return api.sendMessage("⚔️ Un combat se déroule déjà dans cette arène. Attendez sa fin.", threadID, messageID);

            const { challengerId, mise } = challenge;

            const balP1 = await getBalance(challengerId);
            const balP2 = await getBalance(senderID);

            if (balP1 < mise || balP2 < mise) {
                global.duelSystem.invitations.delete(senderID);
                return api.sendMessage("❌ L'un des participants n'a plus les fonds nécessaires pour honorer la mise.", threadID, messageID);
            }

            await decreaseMoney(challengerId, mise);
            await decreaseMoney(senderID, mise);
            global.duelSystem.invitations.delete(senderID);

            const nameP1 = await Users.getNameUser(challengerId);
            const nameP2 = await Users.getNameUser(senderID);
            const dP1 = getPlayer(challengerId, nameP1);
            const dP2 = getPlayer(senderID, nameP2);

            const initFighter = (id, name, dataPlayer) => ({
                id, name,
                hp: 500 + (dataPlayer.points * 0.1),
                maxHp: 500 + (dataPlayer.points * 0.1),
                atk: 45 + Math.floor(Math.random() * 15),
                def: 20 + Math.floor(Math.random() * 10),
                crit: 15, esc: 10, prec: 90, chance: 10, buffs: {}
            });

            const f1 = initFighter(challengerId, nameP1, dP1);
            const f2 = initFighter(senderID, nameP2, dP2);

            global.duelSystem.activeGames.set(threadID, { p1: f1, p2: f2, spectators: [], step: 0 });
            api.sendMessage(`⚔️ **LE COMBAT COMMENCE** ⚔️\n━━━━━━━━━━━━━━━━━━━━\n**${f1.name}** VS **${f2.name}**\n💰 Pot total : **${(mise * 2).toLocaleString()} $**\n\n_Préparation de l'arène..._`, threadID);

            runBattle(api, threadID, f1, f2,拦截_mise = mise, increaseMoney);
            return;
        }

        // --- ENCLENCHEMENT DUEL : duel @user <mise> ---
        const targetID = Object.keys(event.mentions)[0];
        if (!targetID) return api.sendMessage("⚠️ Mentionnez un opposant valide. Exemple : `duel @nom 50000`", threadID, messageID);
        if (targetID === senderID) return api.sendMessage("🚫 Vous ne pouvez pas vous défier vous-même !", threadID, messageID);

        const mise = parseInt(args.filter(arg => !arg.includes('@')).join(''));
        if (isNaN(mise) || mise < 0) return api.sendMessage("⚠️ Définissez une mise valide et supérieure ou égale à 0.", threadID, messageID);

        const senderBal = await getBalance(senderID);
        const targetBal = await getBalance(targetID);

        if (senderBal < mise) return api.sendMessage(`❌ Solde insuffisant ! Vous n'avez que ${senderBal.toLocaleString()} $ sur votre compte.`, threadID, messageID);
        if (targetBal < mise) return api.sendMessage(`❌ Votre adversaire n'a pas les fonds nécessaires (${targetBal.toLocaleString()} $).`, threadID, messageID);

        if (global.duelSystem.invitations.has(targetID)) return api.sendMessage("⚠️ Cet utilisateur a déjà un défi en attente.", threadID, messageID);

        global.duelSystem.invitations.set(targetID, { challengerId: senderID, mise: mise, time: Date.now() });

        const nameTarget = await Users.getNameUser(targetID);
        api.sendMessage(`━━━━━━━━━━━━━━━━━━━━\n⚔️ **DÉFI DE DUEL LANÇÉ** ⚔️\n━━━━━━━━━━━━━━━━━━━━\n**${await Users.getNameUser(senderID)}** provoque **${nameTarget}** en duel !\n💰 Enjeu : **${mise.toLocaleString()} $**\n\nRépondez par :\n✅ \`duel accept\`\n❌ \`duel decline\`\n⏳ Expire dans 60 secondes.`, threadID);

        setTimeout(() => {
            if (global.duelSystem.invitations.has(targetID) && global.duelSystem.invitations.get(targetID).challengerId === senderID) {
                global.duelSystem.invitations.delete(targetID);
                api.sendMessage(`⏳ Le défi pour **${nameTarget}** a expiré.`, threadID);
            }
        }, 60000);
    }
};

// ===================================================================================================
// PARTIE 3 : MOTEUR DE COMBAT AUTOMATIQUE
// ===================================================================================================
function runBattle(api, threadID, p1, p2, mise, increaseMoney) {
    let turn = Math.random() > 0.5 ? 1 : 2;
    
    const interval = setInterval(async () => {
        const game = global.duelSystem.activeGames.get(threadID);
        if (!game) {
            clearInterval(interval);
            return;
        }

        let attacker = turn === 1 ? game.p1 : game.p2;
        let defender = turn === 1 ? game.p2 : game.p1;
        let journal = [];

        // Apparition aléatoire des bonus (25% de chance)
        if (Math.random() * 100 < 25) {
            const bonuses = [
                { name: "🔥 Rage", action: (a) => { a.atk += 15; return "son attaque augmente !"; } },
                { name: "🛡️ Bouclier", action: (a) => { a.def += 10; return "sa défense se renforce !"; } },
                { name: "⚡ Double attaque", action: (a) => { a.buffs.double = true; return "obtient une double frappe !"; } },
                { name: "❤️ Régénération", action: (a) => { const heal = 40; a.hp = Math.min(a.maxHp, a.hp + heal); return `se soigne de +${heal} HP !`; } },
                { name: "🎯 Précision parfaite", action: (a) => { a.prec += 30; return "verrouille sa cible !"; } }
            ];
            const chosen = bonuses[Math.floor(Math.random() * bonuses.length)];
            const resBonus = chosen.action(attacker);
            journal.push(`✨ **${chosen.name}** s'active sur **${attacker.name}** : ${resBonus}`);
        }

        let strikes = attacker.buffs.double ? 2 : 1;
        attacker.buffs.double = false;

        for (let s = 0; s < strikes; s++) {
            // Esquive
            const checkEsc = (Math.random() * 100 < defender.esc) && (Math.random() * 100 > attacker.prec - 80);
            if (checkEsc) {
                journal.push(`💨 **${defender.name}** a fait une esquive magistrale !`);
                continue;
            }

            // Dégâts
            let baseDmg = Math.max(5, attacker.atk - (defender.def * 0.4));
            const isCrit = Math.random() * 100 < attacker.crit;
            if (isCrit) baseDmg *= 1.5;

            const isBlock = Math.random() * 100 < (defender.def / 2);
            if (isBlock) baseDmg *= 0.5;

            let finalDmg = Math.floor(baseDmg);
            defender.hp = Math.max(0, defender.hp - finalDmg);

            let strikeMsg = `⚔️ **${attacker.name}** attaque **${defender.name}** :`;
            if (isCrit) strikeMsg += `\n💥 **COUP CRITIQUE !**`;
            if (isBlock) strikeMsg += `\n🛡️ **Défense réussie ! Dégâts réduits.**`;
            strikeMsg += `\n❤️ -${finalDmg} HP (Reste : ${Math.floor(defender.hp)}/${Math.floor(defender.maxHp)})`;
            journal.push(strikeMsg);

            if (defender.hp <= 0) break;
        }

        let displayMsg = `━━━━━━━━━━━━━━━━━━━━━━━━\n⚔️ **TOUR DE COMBAT** ⚔️\n━━━━━━━━━━━━━━━━━━━━━━━━\n${journal.join('\n\n')}\n━━━━━━━━━━━━━━━━━━━━━━━━`;
        
        api.sendMessage(displayMsg, threadID);
        game.spectators.forEach(specID => {
            api.sendMessage(`📡 [SPECTATEUR] Salon #${threadID}\n${displayMsg}`, specID);
        });

        // Fin du combat
        if (defender.hp <= 0) {
            clearInterval(interval);
            global.duelSystem.activeGames.delete(threadID);
            
            const potTotal = mise * 2;
            const tax = Math.floor(potTotal * 0.05);
            const netGain = potTotal - tax;

            const winnerData = getPlayer(attacker.id, attacker.name);
            const loserData = getPlayer(defender.id, defender.name);

            winnerData.combats += 1;
            winnerData.victoires += 1;
            winnerData.gameSerie += 1;
            if (winnerData.gameSerie > winnerData.maxSerie) winnerData.maxSerie = winnerData.gameSerie;
            if (netGain > winnerData.maxGain) winnerData.maxGain = netGain;
            winnerData.points += 25;
            
            // Créditer le vainqueur via l'injection
            if (mise > 0 && increaseMoney) {
                try { await increaseMoney(attacker.id, netGain); } catch(e) { console.error(e); }
            }

            loserData.combats += 1;
            loserData.defaites += 1;
            loserData.gameSerie = 0;
            loserData.points = Math.max(0, loserData.points - 15);

            duelData.history.push({
                p1Id: attacker.id, p1Name: attacker.name,
                p2Id: defender.id, p2Name: defender.name,
                winnerId: attacker.id, mise, gain: netGain,
                date: new D
