const { createCanvas, loadImage } = require('canvas');
const axios = require('axios');

module.exports = {
    config: {
        name: "dice",
        version: "1.0.0",
        author: "AI Collaborator",
        countDown: 5,
        role: 0,
        description: "Bet your virtual coins on a 6-sided dice roll.",
        category: "economy",
        guide: "{p}dice <amount>"
    },

    onStart: async function ({ api, event, args, usersData }) {
        const { threadID, messageID, senderID } = event;

        // 1. Validate Input
        const betAmount = args[0];
        if (!betAmount) {
            return api.sendMessage("❌ Please specify an amount of virtual coins to bet.", threadID, messageID);
        }

        const userData = await usersData.get(senderID);
        let currentBalance = userData.money || 0;

        let bet = 0;
        if (betAmount.toLowerCase() === 'all') {
            bet = currentBalance;
        } else {
            bet = parseInt(betAmount);
        }

        if (isNaN(bet) || bet <= 0) {
            return api.sendMessage("❌ Please enter a valid positive number of coins to bet.", threadID, messageID);
        }

        if (bet > currentBalance) {
            return api.sendMessage(`❌ You don't have enough virtual coins. Your current balance is ${currentBalance.toLocaleString()} coins.`, threadID, messageID);
        }

        // 2. Game Logic
        const userRoll = Math.floor(Math.random() * 6) + 1;
        const botRoll = Math.floor(Math.random() * 6) + 1;
        
        let isWin = userRoll > botRoll;
        let isTie = userRoll === botRoll;
        let newBalance = currentBalance;
        let statusText = "";
        let rewardText = "";

        if (isTie) {
            statusText = "TIE GAME";
            rewardText = "Your coins were returned";
        } else if (isWin) {
            newBalance += bet;
            statusText = "YOU WIN!";
            rewardText = `+${bet.toLocaleString()} coins`;
        } else {
            newBalance -= bet;
            statusText = "YOU LOSE";
            rewardText = `-${bet.toLocaleString()} coins`;
        }

        // Save updated economy data safely
        await usersData.set(senderID, { money: newBalance });

        // 3. Canvas Generation (Premium Dark Red Neon UI / Glassmorphism)
        try {
            const canvas = createCanvas(800, 400);
            const ctx = canvas.getContext('2d');

            // Background: Deep dark red gradient
            const bgGrad = ctx.createLinearGradient(0, 0, 800, 400);
            bgGrad.addColorStop(0, '#0a0202');
            bgGrad.addColorStop(1, '#1a0505');
            ctx.fillStyle = bgGrad;
            ctx.fillRect(0, 0, 800, 400);

            // Ambient Neon Glow (Background Blur Effect)
            ctx.shadowColor = '#ff0033';
            ctx.shadowBlur = 50;
            ctx.fillStyle = 'rgba(255, 0, 51, 0.05)';
            ctx.beginPath();
            ctx.arc(400, 200, 150, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0; // Reset shadow

            // Glassmorphic Card Container
            ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
            ctx.strokeStyle = 'rgba(255, 0, 51, 0.2)';
            ctx.lineWidth = 2;
            roundRect(ctx, 40, 40, 720, 320, 20, true, true);

            // Fetch and Draw User Avatar
            try {
                const avatarUrl = `https://graph.facebook.com/${senderID}/picture?width=500&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
                const response = await axios.get(avatarUrl, { responseType: 'arraybuffer' });
                const avatarImg = await loadImage(Buffer.from(response.data, 'binary'));
                
                // Circular Avatar with Neon Ring
                ctx.save();
                ctx.shadowColor = '#ff0033';
                ctx.shadowBlur = 15;
                ctx.strokeStyle = '#ff0033';
                ctx.lineWidth = 4;
                ctx.beginPath();
                ctx.arc(130, 200, 60, 0, Math.PI * 2);
                ctx.stroke();
                ctx.clip();
                ctx.drawImage(avatarImg, 70, 140, 120, 120);
                ctx.restore();
                ctx.shadowBlur = 0; 
            } catch (avatarError) {
                // Fallback if avatar fails to load
                ctx.fillStyle = '#ff0033';
                ctx.beginPath();
                ctx.arc(130, 200, 60, 0, Math.PI * 2);
                ctx.fill();
            }

            // --- TEXT DETAILS & UI LAYOUT ---

            // Status Headline (WIN/LOSE/TIE) with Neon Glow
            ctx.font = 'bold 42px sans-serif';
            ctx.shadowColor = isTie ? '#ffcc00' : (isWin ? '#00ff66' : '#ff0033');
            ctx.shadowBlur = 20;
            ctx.fillStyle = isTie ? '#ffcc00' : (isWin ? '#00ff66' : '#ff0033');
            ctx.fillText(statusText, 230, 110);
            ctx.shadowBlur = 0;

            // Reward / Loss Info
            ctx.font = '28px sans-serif';
            ctx.fillStyle = '#ffffff';
            ctx.fillText(rewardText, 230, 155);

            // Dice Score Visual Board (Glassmorphic sub-panels)
            ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
            roundRect(ctx, 230, 190, 220, 120, 12, true, true);
            roundRect(ctx, 480, 190, 240, 120, 12, true, true);

            // Scores Text
            ctx.font = '16px sans-serif';
            ctx.fillStyle = '#b3b3b3';
            ctx.fillText("YOUR ROLL", 250, 225);
            ctx.fillText("BOT ROLL", 500, 225);

            ctx.font = 'bold 50px sans-serif';
            ctx.fillStyle = '#ffffff';
            ctx.fillText(userRoll.toString(), 250, 285);
            ctx.fillText(botRoll.toString(), 500, 285);

            // New Balance Footer
            ctx.font = '14px sans-serif';
            ctx.fillStyle = '#8c8c8c';
            ctx.fillText(`Wallet Balance: ${newBalance.toLocaleString()} coins`, 230, 335);

            // Send Final Canvas UI Asset
            const buffer = canvas.toBuffer('image/png');
            return api.sendMessage({
                body: `🎲 **Dice Roll Result** 🎲\nYou rolled a **${userRoll}** vs Bot's **${botRoll}**.`,
                attachment: buffer
            }, threadID, messageID);

        } catch (canvasError) {
            console.error(canvasError);
            // Fallback plain text response if canvas rendering completely fails
            return api.sendMessage(
                `🎲 **Dice Result** 🎲\n\n` +
                `• Your Roll: ${userRoll}\n` +
                `• Bot Roll: ${botRoll}\n\n` +
                `Result: **${statusText}** (${rewardText})\n` +
                `New Balance: ${newBalance.toLocaleString()} coins`, 
                threadID, messageID
            );
        }
    }
};

/**
 * Helper function to draw rounded rectangles for clean UI design
 */
function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
    if (typeof radius === 'number') {
        radius = {tl: radius, tr: radius, br: radius, bl: radius};
    } else {
        var defaultRadius = {tl: 0, tr: 0, br: 0, bl: 0};
        for (var side in defaultRadius) {
            radius[side] = radius[side] || defaultRadius[side];
        }
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
