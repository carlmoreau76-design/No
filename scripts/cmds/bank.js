/**
 * 🏦 COMMANDE BANQUE PRINCIPALE, EMPIRE FINANCIER & RENDU CANVAS GRAPHIQUE V2
 * Intégration Native : Système Économique Virtuel Fictif & PvP MMORPG pour GoatBot.
 * S'interface sur global.data.allUserData pour le Cash & sur userData.data.bank.balance.
 */

const fs = require("fs");
const path = require("path");
const moment = require("moment-timezone");
const { createCanvas, loadImage } = require("canvas");
const storage = require("./MMORPG_System/bankMMO/bank.storage.js");

// Configuration du module compatible avec le gestionnaire de commandes GoatBot
module.exports = {
    config: {
        name: "bank",
        version: "2.5.0",
        author: "Premium Financial Engine & Graphic Canvas",
        countDown: 2,
        role: 0,
        description: "Simulation d'un empire financier : Banque, Crédits, Bourse, Entreprises et Rendu Canvas.",
        category: "economy"
    },

    onStart: async function ({ api, event, args, usersData }) {
        const { threadID, messageID, senderID } = event;
        const now = Date.now();

        // Récupération sécurisée du nom du joueur
        const senderName = event.senderName || `Aventurier #${senderID.slice(-4)}`;
                
        // Chargement du profil d'extension bancaire secondaire
        const account = storage.getUserBankProfile(senderID, senderName);
        const fNum = storage.formatMoney;

        // --- SYNCHRONISATION NATIVE AVEC LES SYSTEMES DE STOCKAGE GOATBOT ---
        let walletCash = global.data && global.data.allUserData?.[senderID] ? (global.data.allUserData[senderID].money || 0) : 0;
        
        const syncWalletCash = (uid, amount) => {
            if (global.data && global.data.allUserData?.[uid]) {
                global.data.allUserData[uid].money = Math.max(0, Math.floor(amount));
            }
        };

        if (global.data && global.data.allUserData?.[senderID]) {
            if (!global.data.allUserData[senderID].data) global.data.allUserData[senderID].data = {};
            if (!global.data.allUserData[senderID].data.bank) global.data.allUserData[senderID].data.bank = {};
            if (global.data.allUserData[senderID].data.bank.balance === undefined) {
                global.data.allUserData[senderID].data.bank.balance = account.bankBalance || 0;
            }
        }

        const getBankBalance = (uid) => {
            return global.data?.allUserData?.[uid]?.data?.bank?.balance || 0;
        };

        const setBankBalance = (uid, amount) => {
            if (global.data && global.data.allUserData?.[uid]) {
                if (!global.data.allUserData[uid].data) global.data.allUserData[uid].data = {};
                if (!global.data.allUserData[uid].data.bank) global.data.allUserData[uid].data.bank = {};
                global.data.allUserData[uid].data.bank.balance = Math.max(0, Math.floor(amount));
            }
            account.bankBalance = Math.max(0, Math.floor(amount));
        };

        const primary = args[0] ? args[0].toLowerCase() : null;
        const secondary = args[1] ? args[1].toLowerCase() : null;

        // =========================================================================
        // 🛠️ FONCTIONS HELPERS POUR LES DESSINS CANVAS GRAPHIDIQUES
        // =========================================================================
        const roundRect = (ctx, x, y, w, h, r) => {
            ctx.beginPath();
            ctx.moveTo(x + r, y);
            ctx.lineTo(x + w - r, y);
            ctx.quadraticCurveTo(x + w, y, x + w, y + r);
            ctx.lineTo(x + w, y + h - r);
            ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
            ctx.lineTo(x + r, y + h);
            ctx.quadraticCurveTo(x, y + h, x, y + h - r);
            ctx.lineTo(x, y + r);
            ctx.quadraticCurveTo(x, y, x + r, y);
            ctx.closePath();
        };

        const formatShortMoney = (num) => {
            if (num >= 1e15) return (num / 1e15).toFixed(1).replace(/\.0$/, "") + "Q";
            if (num >= 1e12) return (num / 1e12).toFixed(1).replace(/\.0$/, "") + "T";
            if (num >= 1e9) return (num / 1e9).toFixed(1).replace(/\.0$/, "") + "B";
            if (num >= 1e6) return (num / 1e6).toFixed(1).replace(/\.0$/, "") + "M";
            if (num >= 1e3) return (num / 1e3).toFixed(1).replace(/\.0$/, "") + "K";
            return num.toString();
        };

        const generateFinancialCanvas = async (title, statsArray, uid) => {
            const W = 1100, H = 450;
            const canvas = createCanvas(W, H);
            const ctx = canvas.getContext("2d");

            ctx.fillStyle = "#0d0e15";
            ctx.fillRect(0, 0, W, H);

            const glowGrad = ctx.createRadialGradient(200, 225, 50, 200, 225, 400);
            glowGrad.addColorStop(0, "rgba(9, 132, 227, 0.2)");
            glowGrad.addColorStop(1, "rgba(13, 14, 21, 0)");
            ctx.fillStyle = glowGrad;
            ctx.fillRect(0, 0, W, H);

            ctx.fillStyle = "rgba(255, 255, 255, 0.03)";
            roundRect(ctx, 30, 30, W - 60, H - 60, 30);
            ctx.fill();
            ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
            ctx.lineWidth = 1.5;
            ctx.stroke();

            let avatar;
            try {
                avatar = await loadImage(await usersData.getAvatarUrl(uid));
            } catch {
                avatar = await loadImage("https://i.imgur.com/I3VsBEt.png");
            }

            const avX = 160, avY = 225, radius = 95;
            ctx.save();
            ctx.beginPath();
            ctx.arc(avX, avY, radius, 0, Math.PI * 2);
            ctx.clip();
            ctx.drawImage(avatar, avX - radius, avY - radius, radius * 2, radius * 2);
            ctx.restore();

            const borderGrad = ctx.createLinearGradient(avX - radius, avY, avX + radius, avY);
            borderGrad.addColorStop(0, "#0984e3");
            borderGrad.addColorStop(1, "#00cec9");
            ctx.strokeStyle = borderGrad;
            ctx.lineWidth = 6;
            ctx.beginPath();
            ctx.arc(avX, avY, radius + 3, 0, Math.PI * 2);
            ctx.stroke();

            ctx.textAlign = "left";
            ctx.font = "bold 44px Arial";
            ctx.fillStyle = "#ffffff";
            ctx.fillText(account.name, 310, 110);
            ctx.font = "bold 22px Arial";
            ctx.fillStyle = "#00cec9";
            ctx.fillText(title, 310, 145);

            const drawStatBox = (x, y, w, h, label, value, color) => {
                ctx.fillStyle = "rgba(255, 255, 255, 0.02)";
                roundRect(ctx, x, y, w, h, 15);
                ctx.fill();
                ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
                ctx.stroke();
                ctx.font = "16px Arial";
                ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
                ctx.fillText(label, x + 20, y + 32);
                ctx.font = "bold 22px Arial";
                ctx.fillStyle = color;
                ctx.fillText(value, x + 20, y + 68);
            };

            const positions = [
                { x: 310, y: 180, w: 220, h: 85 }, { x: 550, y: 180, w: 220, h: 85 }, { x: 790, y: 180, w: 240, h: 85 },
                { x: 310, y: 285, w: 220, h: 85 }, { x: 550, y: 285, w: 220, h: 85 }, { x: 790, y: 285, w: 240, h: 85 }
            ];

            statsArray.forEach((stat, idx) => {
                if (positions[idx]) {
                    drawStatBox(positions[idx].x, positions[idx].y, positions[idx].w, positions[idx].h, stat.label, stat.val, stat.color);
                }
            });

            ctx.font = "14px Arial";
            ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
            ctx.textAlign = "center";
            ctx.fillText(`Généré via Système Empire V2 • ${moment().tz("Africa/Abidjan").format("DD/MM/YYYY HH:mm")}`, W / 2, 425);

            const cacheDir = path.join(__dirname, "cache");
            if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);
            const filePath = path.join(cacheDir, `bank_${uid}_${Math.random().toString(36).substring(2, 7)}.png`);
            fs.writeFileSync(filePath, canvas.toBuffer("image/png"));
            return filePath;
        };
