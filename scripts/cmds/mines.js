const { createCanvas, loadImage } = require('canvas');
const axios = require('axios');

// Global memory tracker for active sessions
if (!global.minesGames) {
    global.minesGames = new Map();
}

/**
 * Utility function to format numbers cleanly (e.g., 1.5K, 2.3M)
 */
function formatNumber(num) {
    if (num >= 1e12) return (num / 1e12).toFixed(1).replace(/\.0$/, '') + 'T';
    if (num >= 1e9) return (num / 1e9).toFixed(1).replace(/\.0$/, '') + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(1).replace(/\.0$/, '') + 'K';
    return num.toLocaleString();
}

/**
 * Helper to calculate dynamically increasing multipliers based on gems uncovered
 */
function getMultiplier(gemsFound) {
    if (gemsFound === 0) return 1.0;
    // Premium mathematical scaling model for 5 bombs on a 5x5 board
    let baseMult = 1.15;
    let scale = 0.12;
    return parseFloat((baseMult + (gemsFound * scale) * Math.pow(1.08, gemsFound)).toFixed(2));
}

module.exports = {
    config: {
        name: "mines",
        version: "1.1.0",
        author: "AI Collaborator",
        countDown: 5,
        role: 0,
        description: "Adventure mini-game. Uncover gems on a 5x5 grid and avoid 5 hidden bombs.",
        category: "economy",
        guide: "{p}mines <bet_amount>"
    },

    onStart: async function ({ api, event, args, usersData }) {
        const { threadID, messageID, senderID } = event;

        if (global.minesGames.has(senderID)) {
            return api.sendMessage("❌ You already have an active game running! Finish it or type 'cashout'.", threadID, messageID);
        }

        const betInput = args[0];
        if (!betInput) {
            return api.sendMessage("❌ Please specify an amount of virtual coins to start the adventure.", threadID, messageID);
        }

        const userData = await usersData.get(senderID) || {};
        const currentBalance = userData.money || 0;

        let bet = 0;
        if (betInput.toLowerCase() === 'all') {
            bet = currentBalance;
        } else {
            bet = parseInt(betInput);
        }

        if (isNaN(bet) || bet <= 0) {
            return api.sendMessage("❌ Please enter a valid positive balance amount.", threadID, messageID);
        }

        if (bet > currentBalance) {
            return api.sendMessage(`❌ Insufficient balance. Your current wallet contains: ${formatNumber(currentBalance)} coins.`, threadID, messageID);
        }

        // Deduct entry fee immediately via usersData
        const updatedBalance = currentBalance - bet;
        await usersData.set(senderID, { money: updatedBalance });

        // Initialize internal state: 5x5 grid layout (0: Unrevealed, 1: Gem Revealed, 2: Bomb Hit)
        const gridState = Array(25).fill(0);
        const bombPositions = [];
        
        while (bombPositions.length < 5) {
            let randPos = Math.floor(Math.random() * 25);
            if (!bombPositions.includes(randPos)) {
                bombPositions.push(randPos);
            }
        }

        // Construct complete game state payload
        const gameState = {
            senderID: senderID,
            bet: bet,
            gemsFound: 0,
            bombs: bombPositions,
            grid: gridState,
            isGameOver: false,
            currentWallet: updatedBalance,
            name: userData.name || "Player"
        };

        global.minesGames.set(senderID, gameState);

        // Generate Graphical Canvas UI
        const imageBuffer = await drawMinesBoard(gameState);

        return api.sendMessage({
            body: `💎 **Mines Adventure Initiated** 💎\n\n• **Instructions:** Reply with a grid number from **1 to 25** to flip that tile.\n• Type **cashout** at any turn to exit with your accumulated virtual rewards safely.`,
            attachment: imageBuffer
        }, threadID, (err, info) => {
            if (err) return console.error(err);
            global.GoatBot.onReply.set(info.messageID, {
                commandName: this.config.name,
                messageID: info.messageID,
                author: senderID
            });
        }, messageID);
    },

    onReply: async function ({ api, event, Reply, usersData }) {
        const { senderID, body, threadID, messageID } = event;
        
        // Match response authentication check
        if (senderID !== Reply.author) return;

        const gameState = global.minesGames.get(senderID);
        if (!gameState) return;

        const input = body.trim().toLowerCase();

        // Check if user requested to Cashout safely
        if (input === 'cashout') {
            const finalMultiplier = getMultiplier(gameState.gemsFound);
            const winAmount = Math.floor(gameState.bet * finalMultiplier);
            const finalWallet = gameState.currentWallet + winAmount;

            await usersData.set(senderID, { money: finalWallet });
            global.minesGames.delete(senderID);

            // Clean up framework event listening nodes
            global.GoatBot.onReply.delete(Reply.messageID);

            return api.sendMessage(`💰 **Successful Cashout!** 💰\n\nYou safely extracted your earnings!\n• **Gems Recovered:** ${gameState.gemsFound}\n• **Final Multiplier:** ${finalMultiplier}x\n• **Earnings Multiplied:** +${formatNumber(winAmount)} coins\n• **Updated Wallet Balance:** ${formatNumber(finalWallet)} coins`, threadID, messageID);
        }

        // Validate choice indexing selection parameters
        const tileIdx = parseInt(input) - 1;
        if (isNaN(tileIdx) || tileIdx < 0 || tileIdx > 24) {
            return api.sendMessage("❌ Invalid action. Choose a tile index between 1 and 25, or type 'cashout'.", threadID, messageID);
        }

        if (gameState.grid[tileIdx] !== 0) {
            return api.sendMessage("⚠️ That selection tile has already been flipped open! Choose another number.", threadID, messageID);
        }

        // Process Choice Evaluation
        if (gameState.bombs.includes(tileIdx)) {
            // Hit a Bomb! Game instantly triggers forced liquidation failure
            gameState.grid[tileIdx] = 2; // Mark as Exploded
            gameState.isGameOver = true;
            
            // Reveal full structural board mapping layout configuration on loss
            gameState.bombs.forEach(bPos => {
                if(gameState.grid[bPos] === 0) gameState.grid[bPos] = 2;
            });

            const renderBuffer = await drawMinesBoard(gameState);
            global.minesGames.delete(senderID);
            global.GoatBot.onReply.delete(Reply.messageID);

            return api.sendMessage({
                body: `💥 **BOOM! Exploded!** 💥\n\nYou struck a hidden charge at tile ${input}. You lost your entry stake of ${formatNumber(gameState.bet)} coins.`,
                attachment: renderBuffer
            }, threadID, messageID);
        } else {
            // Uncovered a Safe Diamond Gem
            gameState.grid[tileIdx] = 1;
            gameState.gemsFound += 1;

            // Maximum Win condition achieved: 20 gems found (25 tiles total - 5 bombs)
            if (gameState.gemsFound === 20) {
                const absoluteMaxMult = getMultiplier(20);
                const absolutePayout = Math.floor(gameState.bet * absoluteMaxMult);
                const endWallet = gameState.currentWallet + absolutePayout;

                await usersData.set(senderID, { money: endWallet });
                global.minesGames.delete(senderID);
                global.GoatBot.onReply.delete(Reply.messageID);

                const finalWinBuffer = await drawMinesBoard(gameState);
                return api.sendMessage({
                    body: `🏆 **PERFECT GAME RECORD!** 🏆\n\nYou unlocked all 20 gems without triggering a single mine!\n• Total Win: +${formatNumber(absolutePayout)} coins.`,
                    attachment: finalWinBuffer
                }, threadID, messageID);
            }

            // Game carries onward to next turn selection iteration cycle
            const updatedBuffer = await drawMinesBoard(gameState);
            
            return api.sendMessage({
                body: `💎 **Safe Tile Flipped! (+1 Gem)**\n\n• Current Streak Multiplier: **${getMultiplier(gameState.gemsFound)}x**\n• Value if you cashout now: **${formatNumber(Math.floor(gameState.bet * getMultiplier(gameState.gemsFound)))} coins**\n\nReply with another tile number (1-25) or send 'cashout'.`,
                attachment: updatedBuffer
            }, threadID, (err, info) => {
                if (err) return console.error(err);
                // Cycle system registration validation reference nodes backward tracking
                global.GoatBot.onReply.delete(Reply.messageID);
                global.GoatBot.onReply.set(info.messageID, {
                    commandName: this.config.name,
                    messageID: info.messageID,
                    author: senderID
                });
            }, messageID);
        }
    }
};

/**
 * Premium Render Engine producing high fidelity Canvas Graphic Framework Design layout
 */
async function drawMinesBoard(gameState) {
    const canvas = createCanvas(900, 520);
    const ctx = canvas.getContext('2d');

    // 1. Foundation: Deep Dark Crimson Gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 900, 520);
    bgGrad.addColorStop(0, '#050101');
    bgGrad.addColorStop(0.5, '#120202');
    bgGrad.addColorStop(1, '#1f0404');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 900, 520);

    // 2. High-Tech Background Ambiance Grid Accents
    ctx.strokeStyle = 'rgba(255, 0, 51, 0.03)';
    ctx.lineWidth = 1;
    for (let i = 0; i < canvas.width; i += 30) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height); ctx.stroke();
    }
    for (let j = 0; j < canvas.height; j += 30) {
        ctx.beginPath(); ctx.moveTo(0, j); ctx.lineTo(canvas.width, j); ctx.stroke();
    }

    // 3. Right Dashboard Panel: Glassmorphism Card Element Frame
    ctx.fillStyle = 'rgba(20, 5, 5, 0.6)';
    ctx.strokeStyle = 'rgba(255, 0, 51, 0.25)';
    ctx.lineWidth = 2;
    ctx.shadowColor = 'rgba(255, 0, 51, 0.15)';
    ctx.shadowBlur = 20;
    roundRect(ctx, 480, 30, 390, 460, 16, true, true);
    ctx.shadowBlur = 0; // Reset canvas structural shadows

    // 4. Fetch and Process User Avatar Image Assets
    try {
        const avatarUrl = `https://graph.facebook.com/${gameState.senderID}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
        const res = await axios.get(avatarUrl, { responseType: 'arraybuffer' });
        const img = await loadImage(Buffer.from(res.data, 'binary'));

        ctx.save();
        ctx.shadowColor = '#ff0033';
        ctx.shadowBlur = 15;
        ctx.strokeStyle = '#ff0033';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(550, 95, 40, 0, Math.PI * 2);
        ctx.stroke();
        ctx.clip();
        ctx.drawImage(img, 510, 55, 80, 80);
        ctx.restore();
        ctx.shadowBlur = 0;
    } catch (e) {
        // Fallback Avatar Icon circle metric parameters if server requests timeout
        ctx.fillStyle = '#ff0033';
        ctx.beginPath(); ctx.arc(550, 95, 40, 0, Math.PI * 2); ctx.fill();
    }

    // 5. Render User Identification Metrics
    ctx.font = 'bold 24px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(gameState.name.substring(0, 16), 610, 85);

    ctx.font = '14px sans-serif';
    ctx.fillStyle = '#8c8c8c';
    ctx.fillText('ACTIVE CHALENGER', 610, 110);

    // Decorative Separator Line
    ctx.strokeStyle = 'rgba(255, 0, 51, 0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(510, 160); ctx.lineTo(840, 160); ctx.stroke();

    // 6. Dynamic Financial Stat Analytics Rendering
    const currentMult = getMultiplier(gameState.gemsFound);
    const estimatedValue = Math.floor(gameState.bet * currentMult);

    const stats = [
        { label: 'STAKE ENTRY', val: `${formatNumber(gameState.bet)} COINS`, color: '#ffffff' },
        { label: 'MULTIPLIER STREAK', val: `${currentMult}x`, color: '#ffcc00' },
        { label: 'GEMS UNCOVERED', val: `${gameState.gemsFound} / 20`, color: '#00ffcc' },
        { label: 'LIQUID REWARD VALUE', val: `${formatNumber(estimatedValue)} COINS`, color: gameState.isGameOver ? '#ff0033' : '#00ff66' },
        { label: 'WALLET BALANCE', val: `${formatNumber(gameState.currentWallet)} COINS`, color: '#ffffff' }
    ];

    let currentYOffset = 200;
    stats.forEach(st => {
        ctx.font = '12px sans-serif';
        ctx.fillStyle = '#a19999';
        ctx.fillText(st.label, 510, currentYOffset);

        ctx.font = 'bold 20px sans-serif';
        ctx.fillStyle = st.color;
        ctx.fillText(st.val, 510, currentYOffset + 24);

        currentYOffset += 56;
    });

    // 7. Render 5x5 Matrix Board Graphic Tiles
    const boardOffsetX = 30;
    const boardOffsetY = 30;
    const tileSize = 80;
    const padding = 10;

    for (let row = 0; row < 5; row++) {
        for (let col = 0; col < 5; col++) {
            const index = row * 5 + col;
            const x = boardOffsetX + col * (tileSize + padding);
            const y = boardOffsetY + row * (tileSize + padding);

            const status = gameState.grid[index];

            if (status === 0) {
                // UNREVEALED TILE: Premium Dark Metallic Plate
                ctx.fillStyle = 'rgba(40, 15, 15, 0.7)';
                ctx.strokeStyle = 'rgba(255, 0, 51, 0.2)';
                ctx.lineWidth = 1.5;
                roundRect(ctx, x, y, tileSize, tileSize, 8, true, true);

                // Grid Numeric Identity text centering mapping calculations
                ctx.font = 'bold 18px sans-serif';
                ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText((index + 1).toString(), x + tileSize / 2, y + tileSize / 2);
                ctx.textAlign = 'start'; // Reset global configuration align parameters
                ctx.textBaseline = 'alphabetic';
            } 
            else if (status === 1) {
                // REVEALED TILE: Sparkling Emerald Diamond Plate Panel
                ctx.fillStyle = 'rgba(0, 255, 204, 0.08)';
                ctx.strokeStyle = '#00ffcc';
                ctx.lineWidth = 2;
                ctx.shadowColor = '#00ffcc';
                ctx.shadowBlur = 10;
                roundRect(ctx, x, y, tileSize, tileSize, 8, true, true);
                ctx.shadowBlur = 0;

                // Simple high tech vector shape placeholder design representing Gem element
                ctx.fillStyle = '#00ffcc';
                ctx.beginPath();
                ctx.moveTo(x + tileSize / 2, y + 22);
                ctx.lineTo(x + tileSize - 22, y + tileSize / 2);
                ctx.lineTo(x + tileSize / 2, y + tileSize - 22);
                ctx.lineTo(x + 22, y + tileSize / 2);
                ctx.closePath();
                ctx.fill();
            } 
            else if (status === 2) {
                // DETONATED BOMB TILE: Incinerating Plasma Red Explosion Panel
                ctx.fillStyle = 'rgba(255, 0, 51, 0.15)';
                ctx.strokeStyle = '#ff0033';
                ctx.lineWidth = 2;
                ctx.shadowColor = '#ff0033';
                ctx.shadowBlur = 12;
                roundRect(ctx, x, y, tileSize, tileSize, 8, true, true);
                ctx.shadowBlur = 0;

                // Center warning symbol geometry elements
                ctx.fillStyle = '#ff0033';
                ctx.beginPath();
                ctx.arc(x + tileSize / 2, y + tileSize / 2, 16, 0, Math.PI * 2);
                ctx.fill();
                
                // Cross shards accentuation sparks
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(x + 32, y + 32); ctx.lineTo(x + 48, y + 48);
                ctx.moveTo(x + 48, y + 32); ctx.lineTo(x + 32, y + 48);
                ctx.stroke();
            }
        }
    }

    return canvas.toBuffer('image/png');
}

/**
 * Clean Canvas Rounded Rectangle drawing plugin functionality logic module
 */
function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
    if (typeof radius === 'number') {
        radius = { tl: radius, tr: radius, br: radius, bl: radius };
    }
    ctx.beginPath();
    ctx.moveTo(x + radius.tl, y);
    ctx.lineTo(x + width - radius.tr, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
    ctx.lineTo(x + width, y + height - radius.br);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
    ctx.lineTo(x + radius.bl, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
    ctx.lineTo(x, y + radius.tl);
    ctx.quadraticCurveTo(x, y, x + radius.tl, y);
    ctx.closePath();
    if (fill) ctx.fill();
    if (stroke) ctx.stroke();
}
