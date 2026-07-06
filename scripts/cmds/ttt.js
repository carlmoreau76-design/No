/**
 * @author Shade & AI
 * @title Morpion Royal Premium Neon
 * @name ttt
 * @class ttt
 * @version 1.0.0
 * @description Jeu du Morpion Royal en Canvas Premium jouable par Reply (1-9) contre l'IA ou un autre joueur.
 * @usage ttt [@tag/reply/bot/accept/refuse/cancel/leave/stats/top]
 */

const { createCanvas, loadImage } = require("canvas");
const fs = require("fs-extra");
const path = require("path");

// ---- PERSISTANCE DES STATISTIQUES ----
const STATS_DIR = path.join(process.cwd(), "database", "ttt");
const STATS_FILE = path.join(STATS_DIR, "players.json");

fs.ensureDirSync(STATS_DIR);
if (!fs.existsSync(STATS_FILE)) {
    fs.writeJsonSync(STATS_FILE, {});
}

function getStats() {
    try { return fs.readJsonSync(STATS_FILE); } catch { return {}; }
}
function saveStats(data) {
    try { fs.writeJsonSync(STATS_FILE, data, { spaces: 4 }); } catch (e) { console.error(e); }
}

function getPlayerStats(userId, name) {
    const data = getStats();
    if (!data[userId]) {
        data[userId] = {
            id: userId, name: name || `Joueur #${userId.slice(-4)}`,
            totalGames: 0, wins: 0, losses: 0, draws: 0,
            vsBotWins: 0, vsBotLosses: 0, currentStreak: 0,
            bestStreak: 0, totalMoves: 0, lastPlayAt: Date.now()
        };
        saveStats(data);
    }
    return data[userId];
}

function updatePlayerStats(userId, result, isBot, moves, name) {
    const data = getStats();
    if (!data[userId]) getPlayerStats(userId, name);
    const p = data[userId];
    if (name) p.name = name;
    
    p.totalGames += 1;
    p.totalMoves += moves;
    p.lastPlayAt = Date.now();

    if (result === "win") {
        p.wins += 1;
        if (isBot) p.vsBotWins += 1;
        p.currentStreak += 1;
        if (p.currentStreak > p.bestStreak) p.bestStreak = p.currentStreak;
    } else if (result === "loss") {
        p.losses += 1;
        if (isBot) p.vsBotLosses += 1;
        p.currentStreak = 0;
    } else if (result === "draw") {
        p.draws += 1;
    }
    data[userId] = p;
    saveStats(data);
}

// ---- ETAT DES PARTIES EN MEMOIRE VIVE ----
// Structure : { messageID: gameSession, ... } et indexation inversée pour retrouver par joueur
global.tttSessions = global.tttSessions || new Map();
global.tttPlayerMap = global.tttPlayerMap || new Map(); // userId -> messageID actif
global.tttDefis = global.tttDefis || new Map(); // targetId -> { hostId, hostName, timeout }

// ---- ENTRAINEMENT DE L'IA DU BOT ----
function makeBotMove(board) {
    const wins = [
        [0,1,2], [3,4,5], [6,7,8], // Horizontales
        [0,3,6], [1,4,7], [2,5,8], // Verticales
        [0,4,8], [2,4,6]           // Diagonales
    ];

    // Helper : trouve une case vide complétant une ligne pour un symbole donné
    const findWinningMove = (symbol) => {
        for (let combo of wins) {
            const counts = combo.map(idx => board[idx]);
            if (counts.filter(s => s === symbol).length === 2 && counts.filter(s => s === null).length === 1) {
                return combo[counts.indexOf(null)];
            }
        }
        return null;
    };

    // 1. Gagner si possible (Le bot est 'O')
    let move = findWinningMove('O');
    if (move !== null) return move;

    // 2. Bloquer si l'adversaire ('X') s'apprête à gagner
    move = findWinningMove('X');
    if (move !== null) return move;

    // 3. Prendre le centre (index 4)
    if (board[4] === null) return 4;

    // 4. Prendre un coin disponible
    const coins = [0, 2, 6, 8].filter(idx => board[idx] === null);
    if (coins.length > 0) return coins[Math.floor(Math.random() * coins.length)];

    // 5. Prendre n'importe quelle case restante
    const disponibles = board.map((val, idx) => val === null ? idx : null).filter(val => val !== null);
    return disponibles[Math.floor(Math.random() * disponibles.length)];
}

function checkWinner(board) {
    const lines = [
        [0,1,2], [3,4,5], [6,7,8],
        [0,3,6], [1,4,7], [2,5,8],
        [0,4,8], [2,4,6]
    ];
    for (let line of lines) {
        if (board[line[0]] && board[line[0]] === board[line[1]] && board[line[0]] === board[line[2]]) {
            return { winner: board[line[0]], combo: line };
        }
    }
    if (board.every(cell => cell !== null)) return { winner: "draw", combo: [] };
    return null;
}

// ---- MOTEUR RENDER GRAPH_CANVAS NEON ----
async function createBoardCanvas(game) {
    const canvas = createCanvas(600, 750);
    const ctx = canvas.getContext("2d");

    // Fond Matrix Sombre / Ultra Violet Nuit
    ctx.fillStyle = "#09070f";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Ambiance Luminescente au centre du Grid
    const radGrad = ctx.createRadialGradient(300, 380, 50, 300, 380, 280);
    radGrad.addColorStop(0, "rgba(139, 92, 246, 0.12)");
    radGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = radGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // En-tête : TITRE ROYAL NEON
    ctx.save();
    ctx.shadowBlur = 15;
    ctx.shadowColor = "#ec4899";
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 34px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("👑 MORPION ROYAL 👑", 300, 55);
    ctx.restore();

    // Box des Joueurs
    ctx.fillStyle = "rgba(255, 255, 255, 0.03)";
    ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
    ctx.lineWidth = 1;
    ctx.fillRect(30, 90, 540, 75);
    ctx.strokeRect(30, 90, 540, 75);

    // Texte Joueur X (Rouge Néon)
    ctx.save();
    ctx.shadowBlur = 8;
    ctx.shadowColor = "#ef4444";
    ctx.fillStyle = "#ef4444";
    ctx.font = "bold 18px sans-serif";
    ctx.fillText("❌ X : " + game.p1Name.slice(0, 14), 50, 133);
    ctx.restore();

    // VS Central
    ctx.fillStyle = "#6b7280";
    ctx.font = "italic 16px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("VS", 300, 133);

    // Texte Joueur O (Bleu Néon)
    ctx.save();
    ctx.shadowBlur = 8;
    ctx.shadowColor = "#3b82f6";
    ctx.fillStyle = "#3b82f6";
    ctx.font = "bold 18px sans-serif";
    ctx.textAlign = "right";
    ctx.fillText((game.isBot ? "🤖 [BOT]" : "⭕ O : " + game.p2Name.slice(0, 14)), 550, 133);
    ctx.restore();

    // GRILLE DU PLATEAU 3X3 (Coordonnées de départ : 110, 200)
    const startX = 110, startY = 210, cellSize = 120, gap = 10;
    
    for (let i = 0; i < 9; i++) {
        const row = Math.floor(i / 3);
        const col = i % 3;
        const x = startX + col * (cellSize + gap);
        const y = startY + row * (cellSize + gap);

        // Fond de la case
        ctx.fillStyle = "rgba(20, 16, 34, 0.7)";
        ctx.fillRect(x, y, cellSize, cellSize);

        // Bordure fine néon de base
        ctx.strokeStyle = "rgba(139, 92, 246, 0.2)";
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, cellSize, cellSize);

        const val = game.board[i];
        if (val === null) {
            // Affichage du numéro discret pour le reply
            ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
            ctx.font = "600 24px monospace";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(String(i + 1), x + cellSize/2, y + cellSize/2);
        } else if (val === "X") {
            ctx.save();
            ctx.shadowBlur = 12;
            ctx.shadowColor = "#ef4444";
            ctx.strokeStyle = "#ef4444";
            ctx.lineWidth = 8;
            ctx.lineCap = "round";
            ctx.beginPath();
            const offset = 28;
            ctx.moveTo(x + offset, y + offset);
            ctx.lineTo(x + cellSize - offset, y + cellSize - offset);
            ctx.moveTo(x + cellSize - offset, y + offset);
            ctx.lineTo(x + offset, y + cellSize - offset);
            ctx.stroke();
            ctx.restore();
        } else if (val === "O") {
            ctx.save();
            ctx.shadowBlur = 12;
            ctx.shadowColor = "#3b82f6";
            ctx.strokeStyle = "#3b82f6";
            ctx.lineWidth = 8;
            ctx.beginPath();
            ctx.arc(x + cellSize/2, y + cellSize/2, cellSize/2 - 28, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }
    }

    // Zone Bas : Journal & Statut du Tour
    ctx.fillStyle = "rgba(255, 255, 255, 0.02)";
    ctx.fillRect(30, 610, 540, 110);
    ctx.strokeStyle = "rgba(139, 92, 246, 0.1)";
    ctx.strokeRect(30, 610, 540, 110);

    // Rendu Logs de coups
    ctx.fillStyle = "#a78bfa";
    ctx.font = "14px monospace";
    ctx.textAlign = "left";
    ctx.fillText(game.logs[game.logs.length - 2] || "• Initialisation de la grille...", 45, 642);
    ctx.fillText(game.logs[game.logs.length - 1] || "• En attente du premier coup.", 45, 667);

    // Statut en surbrillance verte / rose
    ctx.save();
    let statusText = "";
    if (game.status === "playing") {
        const activeName = game.turn === game.p1ID ? game.p1Name : game.p2Name;
        statusText = `👉 TOUR DE : ${activeName.toUpperCase()} (${game.turn === game.p1ID ? 'X' : 'O'})`;
        ctx.fillStyle = "#10b981";
    } else if (game.status === "draw") {
        statusText = "🤝 MATCH NUL ! FIN DE LA PARTIE.";
        ctx.fillStyle = "#f59e0b";
    } else {
        const winName = game.status === game.p1ID ? game.p1Name : game.p2Name;
        statusText = `🏆 VICTOIRE DE : ${winName.toUpperCase()} !`;
        ctx.shadowBlur = 10;
        ctx.shadowColor = "#f43f5e";
        ctx.fillStyle = "#f43f5e";
    }
    ctx.font = "bold 16px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(statusText, 300, 703);
    ctx.restore();

    // Génération du Buffer Streamable
    const cachePath = path.join(__dirname, "cache", `ttt_${Date.now()}.png`);
    fs.ensureDirSync(path.dirname(cachePath));
    fs.writeFileSync(cachePath, canvas.toBuffer("image/png"));
    return cachePath;
}

module.exports = {
    config: {
        name: "ttt",
        version: "1.0.0",
        role: 0,
        author: "Shade & AI",
        description: "Morpion Royal Premium en Canvas Néon interactif par Reply",
        category: "game",
        guide: { fr: "{p}{n} [@tag / bot / stats / top / leave]" },
        countDown: 2
    },

    onStart: async function ({ api, event, args, usersData }) {
        const { threadID, messageID, senderID, mentions, type, messageReply } = event;
        const sub = args[0] ? args[0].toLowerCase() : null;

        // ---- MENU D'AIDE PAR DÉFAUT ----
        if (!sub) {
            let helpMsg = `🎮 𝐌𝐎𝐑𝐏𝐈𝐎𝐍 𝐑𝐎𝐘𝐀𝐋 𝐍𝐄́𝐎𝐍\n━━━━━━━━━━━━━━━━━━\n`;
            helpMsg += `🔹 \`ttt @user\` ➔ Défier un joueur de la boîte\n`;
            helpMsg += `🔹 \`ttt bot\` ➔ Lancer un duel contre l'IA\n`;
            helpMsg += `🔹 \`ttt accept\` ➔ Accepter le défi en attente\n`;
            helpMsg += `🔹 \`ttt refuse\` ➔ Décliner un duel proposé\n`;
            helpMsg += `🔹 \`ttt cancel\` ➔ Retirer votre invitation\n`;
            helpMsg += `🔹 \`ttt stats\` ➔ Consulter votre profil de jeu\n`;
            helpMsg += `🔹 \`ttt top\` ➔ Tableau d'honneur des Maîtres\n`;
            helpMsg += `🔹 \`ttt leave\` ➔ Déclarer forfait / abandonner\n━━━━━━━━━━━━━━━━━━\n`;
            helpMsg += `🧠 **Mécanique Premium :** Répondez (reply) directement à la carte graphique avec le numéro d'une case vide (1 à 9) pour jouer votre tour instantanément !`;
            return api.sendMessage(helpMsg, threadID, messageID);
        }

        // ---- RECONNAISSANCE DE LA CIBLE DE DÉFI (TAG / REPLY / ID) ----
        let targetID = null;
        if (type === "message_reply" && messageReply && !["bot","accept","refuse","cancel","leave","stats","top"].includes(sub)) {
            targetID = messageReply.senderID;
        } else if (mentions && Object.keys(mentions).length > 0) {
            targetID = Object.keys(mentions)[0];
        } else if (sub && !isNaN(sub) && sub.length > 5) {
            targetID = sub;
        }

        if (targetID) {
            if (targetID === senderID) return api.sendMessage("❌ Vos dédoublements de personnalité fatiguent l'arbitre. Défiez quelqu'un d'autre.", threadID, messageID);
            if (global.tttPlayerMap.has(senderID)) return api.sendMessage("❌ Vous êtes déjà engagé sur un champ de bataille actif. Terminez-le ou quittez-le via `ttt leave`.", threadID, messageID);
            if (global.tttPlayerMap.has(targetID)) return api.sendMessage("❌ Cet adversaire livre déjà un duel en ce moment même.", threadID, messageID);

            const hostName = await usersData.getName(senderID);
            const targetName = await usersData.getName(targetID);

            // Création de la requête de duel expirant dans 2 min
            global.tttDefis.set(targetID, {
                hostID: senderID,
                hostName: hostName,
                timeout: setTimeout(() => {
                    if (global.tttDefis.has(targetID)) {
                        global.tttDefis.delete(targetID);
                        api.sendMessage(`⏳ Le défi de **${hostName}** envers **${targetName}** a expiré dans les limbes du temps.`, threadID);
                    }
                }, 120000)
            });

            return api.sendMessage(`⚔️ **𝐃𝐄́𝐅𝐈 𝐌𝐎𝐑𝐏𝐈𝐎𝐍 𝐑𝐎𝐘𝐀𝐋**\n\n**${hostName}** jette son gant de combat au visage de **${targetName}** !\n\nRépondez avec :\n👉 \`ttt accept\` pour relever le défi\n👉 \`ttt refuse\` pour sauver votre peau`, threadID, messageID);
        }

        // ---- LE BOT IA DE COMBAT ----
        if (sub === "bot" || sub === "ia") {
            if (global.tttPlayerMap.has(senderID)) return api.sendMessage("❌ Terminez d'abord votre session en cours.", threadID, messageID);

            const p1Name = await usersData.getName(senderID);
            const gameSession = {
                p1ID: senderID, p1Name: p1Name,
                p2ID: "BOT", p2Name: "Cyber_Bot v1.2",
                isBot: true, board: Array(9).fill(null),
                turn: senderID, status: "playing", moves: 0,
                logs: [`• ${p1Name} entre dans l'arène.`]
            };

            const imgPath = await createBoardCanvas(gameSession);
            return api.sendMessage({
                body: `🎮 La matrice s'active ! Début de votre combat contre le Bot.\n👉 C'est à vous de jouer, répondez avec un chiffre (1-9).`,
                attachment: fs.createReadStream(imgPath)
            }, threadID, (err, info) => {
                if (!err) {
                    global.tttSessions.set(info.messageID, gameSession);
                    global.tttPlayerMap.set(senderID, info.messageID);
                }
                if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
            });
        }

        // ---- GESTION ACCEPTATION DU DÉFI ----
        if (sub === "accept") {
            if (!global.tttDefis.has(senderID)) return api.sendMessage("❌ Aucun défi ne vous attend actuellement.", threadID, messageID);
            if (global.tttPlayerMap.has(senderID)) return api.sendMessage("❌ Vous êtes déjà en jeu.", threadID, messageID);

            const defi = global.tttDefis.get(senderID);
            clearTimeout(defi.timeout);
            global.tttDefis.delete(senderID);

            const p2Name = await usersData.getName(senderID);
            const gameSession = {
                p1ID: defi.hostID, p1Name: defi.hostName,
                p2ID: senderID, p2Name: p2Name,
                isBot: false, board: Array(9).fill(null),
                turn: defi.hostID, status: "playing", moves: 0,
                logs: [`• Duel lancé : ${defi.hostName} vs ${p2Name}.`]
            };

            const imgPath = await createBoardCanvas(gameSession);
            return api.sendMessage({
                body: `⚔️ Le défi est accepté ! Que le sang et la logique coulent.\n👉 À vous l'honneur, **${defi.hostName}** (Répondez avec 1-9 à cette image).`,
                attachment: fs.createReadStream(imgPath)
            }, threadID, (err, info) => {
                if (!err) {
                    global.tttSessions.set(info.messageID, gameSession);
                    global.tttPlayerMap.set(defi.hostID, info.messageID);
                    global.tttPlayerMap.set(senderID, info.messageID);
                }
                if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
            });
        }

        // ---- DECLINER LE DUEL ----
        if (sub === "refuse") {
            if (!global.tttDefis.has(senderID)) return api.sendMessage("❌ Aucun défi à refuser.", threadID, messageID);
            const defi = global.tttDefis.get(senderID);
            clearTimeout(defi.timeout);
            global.tttDefis.delete(senderID);
            return api.sendMessage(`🏳️ **${await usersData.getName(senderID)}** a décliné l'invitation de **${defi.hostName}**. Sage décision.`, threadID, messageID);
        }

        // ---- ANNULER UN DÉFI ÉMIS ----
        if (sub === "cancel") {
            let found = false;
            for (let [target, item] of global.tttDefis.entries()) {
                if (item.hostID === senderID) {
                    clearTimeout(item.timeout);
                    global.tttDefis.delete(target);
                    found = true;
                    break;
                }
            }
            return api.sendMessage(found ? "✅ Votre invitation de duel a été retirée." : "❌ Aucun défi émis par vos soins n'est en attente.", threadID, messageID);
        }

        // ---- ABANDON DE PARTIE (LEAVE) ----
        if (sub === "leave" || sub === "forfait") {
            if (!global.tttPlayerMap.has(senderID)) return api.sendMessage("❌ Vous ne jouez dans aucune partie en ce moment.", threadID, messageID);
            const mID = global.tttPlayerMap.get(senderID);
            const game = global.tttSessions.get(mID);

            const winnerID = game.p1ID === senderID ? game.p2ID : game.p1ID;
            const winnerName = game.p1ID === senderID ? game.p2Name : game.p1Name;

            // Enregistrement de la défaite par abandon
            updatePlayerStats(senderID, "loss", game.isBot, 0);
            if (winnerID !== "BOT") updatePlayerStats(winnerID, "win", false, 0, winnerName);

            global.tttPlayerMap.delete(game.p1ID);
            if (game.p2ID !== "BOT") global.tttPlayerMap.delete(game.p2ID);
            global.tttSessions.delete(mID);

            return api.sendMessage(`🏳️ **FORFAIT**\n**${game.p1ID === senderID ? game.p1Name : game.p2Name}** s'enfuit en courant ! Victoire par abandon octroyée à **${winnerName}** !`, threadID, messageID);
        }

        // ---- INTERFACE STATISTIQUES INDIVIDUELLES ----
        if (sub === "stats") {
            let reqID = targetID || senderID;
            const pName = await usersData.getName(reqID);
            const p = getPlayerStats(reqID, pName);

            const wr = p.totalGames > 0 ? ((p.wins / p.totalGames) * 100).toFixed(1) : "0.0";
            let cMsg = `📊 **𝐒𝐓𝐀𝐓𝐈𝐒𝐓𝐈𝐐𝐔𝐄𝐒 𝐌𝐎𝐑𝐏𝐈𝐎𝐍 𝐑𝐎𝐘𝐀𝐋**\n━━━━━━━━━━━━━━━━━━\n`;
            cMsg += `👤 Nom d'Armes : **${p.name}**\n`;
            cMsg += `🎮 Total Parties : **${p.totalGames}**\n`;
            cMsg += `🏆 Victoires     : **${p.wins}** *(vs Bot: ${p.vsBotWins})*\n`;
            cMsg += `💀 Défaites      : **${p.losses}** *(vs Bot: ${p.vsBotLosses})*\n`;
            cMsg += `🤝 Matchs Nuls    : **${p.draws}**\n`;
            cMsg += `📈 Winrate        : **${wr}%**\n`;
            cMsg += `🔥 Série Actuelle : **${p.currentStreak} v.**\n`;
            cMsg += `⭐ Record Série   : **${p.bestStreak} v.**\n`;
            cMsg += `🧩 Total Coups    : **${p.totalMoves}**\n━━━━━━━━━━━━━━━━━━`;
            return api.sendMessage(cMsg, threadID, messageID);
        }

        // ---- LEADERBOARD GLOBAL (TOP 10) ----
        if (sub === "top") {
            const data = getStats();
            let arr = Object.values(data);
            if (arr.length === 0) return api.sendMessage("👑 Le Panthéon est encore vierge de héros.", threadID, messageID);

            arr.sort((a, b) => b.wins - a.wins);
            let topMsg = `🏆 **𝐏𝐀𝐍𝐓𝐇𝐄́𝐎𝐍 𝐃𝐄𝐒 𝐌𝐀𝐈̂𝐓𝐑𝐄𝐒 𝐃𝐔 𝐌𝐎𝐑𝐏𝐈𝐎𝐍**\n\n`;
            arr.slice(0, 10).forEach((p, idx) => {
                let medal = idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : "🔹";
                topMsg += `${medal} #${idx + 1} **${p.name}** — **${p.wins} Victoires** (Games: ${p.totalGames})\n`;
            });
            return api.sendMessage(topMsg, threadID, messageID);
        }
    },

    // =========================================================================
    // ⭐ MOTEUR INTERACTIF EXCLUSIF PAR REPLY GOATBOT (1-9)
    // =========================================================================
    onReply: async function ({ api, event, Reply, usersData }) {
        const { senderID, threadID, messageID, body } = event;
        const game = global.tttSessions.get(Reply.messageID);

        // 1. Vérification de l'existence de la session sur ce message
        if (!game) return;

        // 2. Contrôle de participation
        if (senderID !== game.p1ID && senderID !== game.p2ID) return;

        // 3. Sécurité du tour de jeu
        if (senderID !== game.turn) {
            return api.sendMessage("⏳ Doucement ! Ce n'est pas votre tour de placer un pion.", threadID, messageID);
        }

        // 4. Validation du format d'entrée (Doit être STRICTEMENT un chiffre entre 1 et 9)
        const moveIndex = parseInt(body?.trim()) - 1;
        if (isNaN(moveIndex) || moveIndex < 0 || moveIndex > 8) {
            return api.sendMessage("❌ Saisie invalide. Répondez uniquement avec un chiffre de 1 à 9.", threadID, messageID);
        }

        // 5. Case déjà occupée
        if (game.board[moveIndex] !== null) {
            return api.sendMessage("❌ Cette case est déjà verrouillée ! Choisissez un autre numéro.", threadID, messageID);
        }

        // ---- APPLICATION DU COUP JOUEUR ----
        const currentSymbol = game.turn === game.p1ID ? "X" : "O";
        const currentName = game.turn === game.p1ID ? game.p1Name : game.p2Name;
        
        game.board[moveIndex] = currentSymbol;
        game.moves += 1;
        game.logs.push(`• [${currentSymbol}] ${currentName.slice(0, 10)} joue case ${moveIndex + 1}`);

        // Nettoyage de l'ancien message de Grid pour éviter le flooding
        try { api.unsendMessage(Reply.messageID); } catch(e){}

        // Analyse fin de partie post-coup joueur
        let check = checkWinner(game.board);
        if (check) {
            return await CloturerPartie(api, threadID, messageID, game, check, Reply.messageID);
        }

        // ---- SÉQUENCE INTERNE TOUR DU BOT SI ACTIF ----
        if (game.isBot) {
            game.logs.push(`• Le processeur du Bot calcule...`);
            const botIdx = makeBotMove(game.board);
            
            game.board[botIdx] = "O";
            game.moves += 1;
            game.logs.push(`• [O] Cyber_Bot place en case ${botIdx + 1}`);

            // Analyse fin de partie post-coup Bot
            check = checkWinner(game.board);
            if (check) {
                return await CloturerPartie(api, threadID, messageID, game, check, Reply.messageID);
            }
            // Le tour revient au joueur principal
            game.turn = game.p1ID;
        } else {
            // Alternance classique Joueur contre Joueur
            game.turn = game.turn === game.p1ID ? game.p2ID : game.p1ID;
        }

        // ---- RE-GÉNÉRATION ET ENVOI DE LA NOUVELLE CARTE GRAPHIQUE ----
        const imgPath = await createBoardCanvas(game);
        return api.sendMessage({
            body: `🎮 Le combat continue !\n👉 Au tour de : **${game.turn === game.p1ID ? game.p1Name : game.p2Name}** (${game.turn === game.p1ID ? 'X' : 'O'})`,
            attachment: fs.createReadStream(imgPath)
        }, threadID, (err, info) => {
            if (!err) {
                // Synchronisation du nouvel ID de message pour le prochain Reply
                global.tttSessions.delete(Reply.messageID);
                global.tttSessions.set(info.messageID, game);
                global.tttPlayerMap.set(game.p1ID, info.messageID);
                if (!game.isBot) global.tttPlayerMap.set(game.p2ID, info.messageID);
            }
            if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
        });
    }
};

// ---- UTILS : ALGORITHME DE CLÔTURE ET DE DISTRIBUTION ----
async function CloturerPartie(api, threadID, messageID, game, check, oldMessageID) {
    game.status = check.winner === "draw" ? "draw" : (check.winner === "X" ? game.p1ID : game.p2ID);
    
    const imgPath = await createBoardCanvas(game);

    // Distribution persistante des gains d'expérience & stats
    if (game.status === "draw") {
        updatePlayerStats(game.p1ID, "draw", game.isBot, 0, game.p1Name);
        if (!game.isBot) updatePlayerStats(game.p2ID, "draw", false, 0, game.p2Name);
    } else {
        const loserID = game.status === game.p1ID ? game.p2ID : game.p1ID;
        updatePlayerStats(game.status, "win", (game.isBot && game.status === "BOT"), 1, (game.status === game.p1ID ? game.p1Name : game.p2Name));
        if (loserID !== "BOT") updatePlayerStats(loserID, "loss", game.isBot, 1, (loserID === game.p1ID ? game.p1Name : game.p2Name));
    }

    // Libération de la mémoire
    global.tttSessions.delete(oldMessageID);
    global.tttPlayerMap.delete(game.p1ID);
    if (!game.isBot) global.tttPlayerMap.delete(game.p2ID);

    let endBody = "";
    if (game.status === "draw") {
        endBody = `🤝 **𝐌𝐀𝐓𝐂𝐇 𝐍𝐔𝐋** !\nTous les quadrants sont verrouillés. Aucune faille n'a été trouvée. (+0 RP)`;
    } else {
        const wName = game.status === game.p1ID ? game.p1Name : game.p2Name;
        endBody = `👑 **𝐕𝐈𝐂𝐓𝐎𝐈𝐑𝐄 𝐑𝐎𝐘𝐀𝐋𝐄**\n\nL'éclat céleste couronne **${wName.toUpperCase()}** ! Échiquier plié en **${game.moves} coups** ! (+1 Victoire enregistrée)`;
    }

    return api.sendMessage({
        body: endBody,
        attachment: fs.createReadStream(imgPath)
    }, threadID, () => {
        if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
    }, messageID);
}
