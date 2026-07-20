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

         // =========================================================================
        // 🏦 MENU D'INTERFACE TEXTE PRINCIPAL
        // =========================================================================
        if (!primary) {
            let menu = `╭───────────────────────────────────────╮\n`;
            menu += `│ 🏦 𝐁𝐀𝐍𝐊 𝐄𝐌𝐏𝐈𝐑𝐄 𝐅𝐈𝐍𝐀𝐍𝐂𝐈𝐄𝐑 𝐕𝟐\n`;
            menu += `├───────────────────────────────────────┤\n`;
            menu += `│ 💰 **𝗕𝗮𝘀𝗲 𝗕𝗮𝗻𝗸𝗶𝗻𝗴**\n`;
            menu += `│ 🔹 bank balance | bal            : Voir votre profil (Canvas 📈)\n`;
            menu += `│ 🔹 bank deposit <montant|all>    : Déposer votre cash en banque\n`;
            menu += `│ 🔹 bank withdraw <montant>       : Retirer vos fonds vers le cash\n`;
            menu += `│ 🔹 bank transfer <uid> <montant>   : Virement securise\n`;
            menu += `│ 🔹 bank vault [deposit|withdraw]  : Gestion du Coffre-Fort \n`;
            menu += `│ 🔹 bank history                  : Releve des 15 derniers flux\n`;
            menu += `├───────────────────────────────────────┤\n`;
            menu += `│ 💳 **𝗖𝗿𝗲𝗱𝗶𝘁 & 𝗟𝗼𝗮𝗻𝘀**\n`;
            menu += `│ 🔹 bank credit                   : Analyse du score de confiance\n`;
            menu += `│ 🔹 bank loan <montant>           : Emprunter de l'argent\n`;
            menu += `│ 🔹 bank repay <montant|all>      : Rembourser votre dette\n`;
            menu += `├───────────────────────────────────────┤\n`;
            menu += `│ 📈 **𝗜𝗻𝘃𝗲𝘀𝘁𝗶𝘀𝘀𝗲𝗺𝗲𝗻𝘁𝘀**\n`;
            menu += `│ 🔹 bank stocks [list|buy|sell]   : Bourse d'Actions fictives\n`;
            menu += `│ 🔹 bank crypto [list|buy|sell]   : Marche Crypto volatil\n`;
            menu += `│ 🔹 bank portfolio                : Vue des actifs\n`;
            menu += `├───────────────────────────────────────┤\n`;
            menu += `│ 🏢 **𝗘𝗺𝗽𝗶𝗿𝗲 𝗖𝗼𝗺𝗺𝗲𝗿𝗰𝗶𝗮𝗹 & 𝗜𝗺𝗺𝗼**\n`;
            menu += `│ 🔹 bank business [list|buy|upgrade] : Entreprises & Rejoints\n`;
            menu += `│ 🔹 bank business collect            : Récolte des Profits\n`;
            menu += `│ 🔹 bank property [list|buy|sell] : Achat / Vente de biens\n`;
            menu += `│ 🔹 bank rent                     : Collecte des loyers passifs\n`;
            menu += `├───────────────────────────────────────┤\n`;
            menu += `│ 🏴‍☠️ **𝗣𝘃𝗣, 𝗦𝘁𝗮𝘁𝘀 & 𝗖𝗹𝗮𝘀𝘀𝗲𝘀**\n`;
            menu += `│ 🔹 bank rob <uid>                : Tentative de vol PvP (RPG)\n`;
            menu += `│ 🔹 bank stats                     : Tableau de bord (Canvas 📊)\n`;
            menu += `│ 🔹 bank leaderboard | networth   : Classements globaux\n`;
            menu += `╰───────────────────────────────────────╯`;
            return api.sendMessage(menu, threadID, messageID);
        }

        const validCommands = [
            "balance", "bal", "deposit", "withdraw", "transfer", "vault", "history",
            "loan", "repay", "debt", "credit", "invest", "stocks", "crypto", 
            "portfolio", "business", "property", "rent", "achievements", "leaderboard", 
            "networth", "stats", "rob"
        ];
        if (!validCommands.includes(primary)) {
            return api.sendMessage("❌ Sous-commande invalide. Veuillez vous référer au menu `bank`.", threadID, messageID);
        }

        // =========================================================================
        // 💰 EXECUTION DE LA LOGIQUE COMPTE / BALANCE (INTEGRATION CANVAS)
        // =========================================================================
        if (primary === "balance" || primary === "bal") {
            let passiveIncomes = 0;
            const BIZ_PRESETS_VAL = { "b1": 800, "b2": 2500, "b3": 7500, "b4": 22000, "b5": 65000 };
            const PROP_PRESETS_VAL = { "p1": 1500, "p2": 4200, "p3": 11000, "p4": 35000, "p5": 120000 };
            
            for (let bId in account.businesses) passiveIncomes += (BIZ_PRESETS_VAL[bId] || 0) * account.businesses[bId].level;
            for (let pId in account.properties) passiveIncomes += (PROP_PRESETS_VAL[pId] || 0) * account.properties[pId].qty;

            let currentBankBal = getBankBalance(senderID);
            let netWorth = walletCash + currentBankBal + account.vaultBalance;
            if (account.loan.hasActiveLoan) netWorth -= account.loan.remainingDebt;

            const dataset = [
                { label: "CASH GLOBAL", val: `${formatShortMoney(walletCash)} Or`, color: "#00b894" },
                { label: "COMPTE COURANT", val: `${formatShortMoney(currentBankBal)} Or`, color: "#0984e3" },
                { label: "RESERVES COFFRE", val: `${formatShortMoney(account.vaultBalance)} Or`, color: "#e17055" },
                { label: "DETTE ACTIVE", val: account.loan.hasActiveLoan ? `${formatShortMoney(account.loan.remainingDebt)} Or` : "0 Or", color: "#d63031" },
                { label: "SCORE CREDIT", val: `${account.creditScore} pts`, color: "#ffeaa7" },
                { label: "REVENUS PASSIFS", val: `+${formatShortMoney(passiveIncomes)}/cyc`, color: "#00cec9" }
            ];

            const filePath = await generateFinancialCanvas("SITUATION PATRIMONIALE GRAPHIQUE", dataset, senderID);
            await api.sendMessage({ attachment: fs.createReadStream(filePath) }, threadID, () => {
                try { fs.unlinkSync(filePath); } catch(e) {}
            }, messageID);
            return;
        }

        if (primary === "deposit") {
            let argAmt = args[1];
            if (!argAmt) return api.sendMessage("💡 Usage : `bank deposit <montant|all>`", threadID, messageID);
            let amountToDeposit = argAmt.toLowerCase() === "all" ? walletCash : parseInt(argAmt);
            if (isNaN(amountToDeposit) || amountToDeposit <= 0) return api.sendMessage("❌ Montant de dépôt invalide.", threadID, messageID);
            if (walletCash < amountToDeposit) return api.sendMessage("❌ Vous ne possédez pas assez de cash.", threadID, messageID);
            
            walletCash -= amountToDeposit;
            let currentBankBal = getBankBalance(senderID) + amountToDeposit;
            
            setBankBalance(senderID, currentBankBal);
            syncWalletCash(senderID, walletCash);
            
            account.totalDeposited += amountToDeposit;
            if (!account.achievements.includes("Premier Dépôt")) account.achievements.push("Premier Dépôt");
            
            storage.logTransaction(account, "DEPOSIT", `Dépôt de ${fNum(amountToDeposit)} Or.`);
            storage.saveUserBankProfile(senderID, account);
            return api.sendMessage(`✅ DÉPÔT RÉUSSI : ${fNum(amountToDeposit)} Or ont été déposés sur votre compte courant.`, threadID, messageID);
        }

        if (primary === "withdraw") {
            let argAmt = args[1];
            if (!argAmt) return api.sendMessage("💡 Usage : `bank withdraw <montant>`", threadID, messageID);
            let amountToWithdraw = parseInt(argAmt);
            let currentBankBal = getBankBalance(senderID);
            if (isNaN(amountToWithdraw) || amountToWithdraw <= 0) return api.sendMessage("❌ Montant de retrait invalide.", threadID, messageID);
            if (currentBankBal < amountToWithdraw) return api.sendMessage("❌ Solde insuffisant sur votre compte courant.", threadID, messageID);
            
            currentBankBal -= amountToWithdraw;
            walletCash += amountToWithdraw;
            
            setBankBalance(senderID, currentBankBal);
            syncWalletCash(senderID, walletCash);
            
            account.totalWithdrawn += amountToWithdraw;
            storage.logTransaction(account, "WITHDRAW", `Retrait de ${fNum(amountToWithdraw)} Or.`);
            storage.saveUserBankProfile(senderID, account);
            return api.sendMessage(`✅ RETRAIT EFFECTUÉ : ${fNum(amountToWithdraw)} Or replacés dans votre portefeuille liquide.`, threadID, messageID);
        }
