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

        // Récupération stable du profil et du vrai nom depuis la base de données
        const userData = await usersData.get(senderID);
        const senderName = userData ? userData.name : `Aventurier #${senderID.slice(-4)}`;
                
        // Chargement du profil d'extension bancaire secondaire
        const account = storage.getUserBankProfile(senderID, senderName);
        const fNum = storage.formatMoney;

        // Récupération du VRAI cash de l'utilisateur mis à jour
        let walletCash = userData ? (userData.money || 0) : 0;
        
        // Système de synchronisation direct avec la base de données GoatBot
        const syncWalletCash = async (uid, amount) => {
            await usersData.set(uid, { money: Math.max(0, Math.floor(amount)) });
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
            await syncWalletCash(senderID, walletCash);
            
            account.totalWithdrawn += amountToWithdraw;
            storage.logTransaction(account, "WITHDRAW", `Retrait de ${fNum(amountToWithdraw)} Or.`);
            storage.saveUserBankProfile(senderID, account);
            return api.sendMessage(`✅ RETRAIT EFFECTUÉ : ${fNum(amountToWithdraw)} Or replacés dans votre portefeuille liquide.`, threadID, messageID);
        }

        // =========================================================================
        // 💸 TRANSFERT SECURISE INTER-JOUEURS (COMPTE A COMPTE) - TEXTE PUR MENTION
        // =========================================================================
        if (primary === "transfer") {
            let targetID = null;
            if (event.type === "message_reply") {
                targetID = event.messageReply.senderID;
            } else if (Object.keys(event.mentions).length > 0) {
                targetID = Object.keys(event.mentions)[0];
            } else if (args[1] && !isNaN(args[1])) {
                targetID = args[1];
            }
            let amountIndex = (event.type === "message_reply") ? 1 : 2;
            let amountStr = args[amountIndex];
            let amountToTransfer = parseInt(amountStr);
            let currentBankBal = getBankBalance(senderID);

            if (!targetID || isNaN(amountToTransfer) || amountToTransfer <= 0) {
                return api.sendMessage("💡 Usage : Indiquez l'UID ou répondez à son message : `bank transfer <uid> <montant>`", threadID, messageID);
            }
            if (targetID === senderID) return api.sendMessage("❌ Impossible de cibler votre propre compte.", threadID, messageID);
            if (currentBankBal < amountToTransfer) return api.sendMessage("❌ Solde bancaire insuffisant.", threadID, messageID);

            const tax = Math.floor(amountToTransfer * 0.02);
            const netReceived = amountToTransfer - tax;

            const targetName = global.data?.allUserData?.[targetID]?.name || `Client #${targetID.slice(-4)}`;
            const targetAccount = storage.getUserBankProfile(targetID, targetName);
            let targetBankBal = getBankBalance(targetID);

            setBankBalance(senderID, currentBankBal - amountToTransfer);
            setBankBalance(targetID, targetBankBal + netReceived);
            
            account.totalTransferred += amountToTransfer;

            storage.logTransaction(account, "TRANSFER", `Virement émis vers ${targetName} : -${fNum(amountToTransfer)} Or.`);
            storage.logTransaction(targetAccount, "TRANSFER", `Virement reçu de ${account.name} : +${fNum(netReceived)} Or.`);

            storage.saveUserBankProfile(senderID, account);
            storage.saveUserBankProfile(targetID, targetAccount);

            let transMsg = `💸 VIREMENT EFFECTUÉ\n\n`;
            transMsg += `📤 Émetteur : ${account.name}\n`;
            transMsg += `📥 Bénéficiaire : ${targetName}\n`;
            transMsg += `🏛️ Frais (2%) : ${fNum(tax)} Or\n`;
            transMsg += `💰 Montant Net Reçu : ${fNum(netReceived)} Or`;
            return api.sendMessage(transMsg, threadID, messageID);
        }

        // =========================================================================
        // 🔐 COFFRE-FORT SECURISE
        // =========================================================================
        if (primary === "vault") {
            let currentBankBal = getBankBalance(senderID);
            if (!secondary) {
                let vaultMsg = `╭───────────────────────────────────────╮\n`;
                vaultMsg += `│ 🔐 **COFFRE-FORT DE HAUTE SECURITE**\n`;
                vaultMsg += `├───────────────────────────────────────┤\n`;
                vaultMsg += `│ Protégé à 100% contre les commandes de vol.\n`;
                vaultMsg += `├───────────────────────────────────────┤\n`;
                vaultMsg += `│ 🔐 Solde du Coffre : **${fNum(account.vaultBalance)} Or**\n`;
                vaultMsg += `├───────────────────────────────────────┤\n`;
                vaultMsg += `│ 💡 \`bank vault deposit <montant>\`\n`;
                vaultMsg += `│ 💡 \`bank vault withdraw <montant>\`\n`;
                vaultMsg += `╰───────────────────────────────────────╯`;
                return api.sendMessage(vaultMsg, threadID, messageID);
            }
            let amount = parseInt(args[2]);
            if (secondary === "deposit") {
                if (isNaN(amount) || amount <= 0) return api.sendMessage("❌ Montant invalide.", threadID, messageID);
                if (currentBankBal < amount) return api.sendMessage("❌ Fonds insuffisants en compte courant.", threadID, messageID);
                
                setBankBalance(senderID, currentBankBal - amount);
                account.vaultBalance += amount;
                
                storage.logTransaction(account, "VAULT_IN", `Mise sous clé de ${fNum(amount)} Or.`);
                storage.saveUserBankProfile(senderID, account);
                return api.sendMessage(`🔐 COFFRE MIS A JOUR : +${fNum(amount)} Or sécurisés.`, threadID, messageID);
            }
            if (secondary === "withdraw") {
                if (isNaN(amount) || amount <= 0) return api.sendMessage("❌ Montant invalide.", threadID, messageID);
                if (account.vaultBalance < amount) return api.sendMessage("❌ Le coffre ne contient pas cette somme.", threadID, messageID);
                
                account.vaultBalance -= amount;
                setBankBalance(senderID, currentBankBal + amount);
                
                storage.logTransaction(account, "VAULT_OUT", `Retrait de ${fNum(amount)} Or depuis le coffre.`);
                storage.saveUserBankProfile(senderID, account);
                return api.sendMessage(`🔓 RETRAIT COFFRE : +${fNum(amount)} Or replacés en compte courant.`, threadID, messageID);
            }
        }

        // =========================================================================
        // 💳 CREDIT, PRÊTS & HISTORIQUE
        // =========================================================================
        if (primary === "loan") {
            let currentBankBal = getBankBalance(senderID);
            let amountToLoan = parseInt(args[1]);
            let maxLoanAllowed = Math.floor((account.creditScore / 500) * 250000);
            if (isNaN(amountToLoan) || amountToLoan <= 0) {
                return api.sendMessage(`💡 Usage : \`bank loan <montant>\` (Votre limite : **${fNum(maxLoanAllowed)} Or**)`, threadID, messageID);
            }
            if (account.loan.hasActiveLoan) return api.sendMessage("❌ Vous avez déjà un emprunt actif.", threadID, messageID);
            if (amountToLoan > maxLoanAllowed) return api.sendMessage(`❌ Plafond dépassé pour votre score actuel.`, threadID, messageID);

            let debtWithInterest = Math.floor(amountToLoan * 1.15);
            account.loan = {
                hasActiveLoan: true,
                principal: amountToLoan,
                remainingDebt: debtWithInterest,
                dueDate: now + (24 * 60 * 60 * 1000 * 3),
                lastPenaltyAt: now
            };
            
            setBankBalance(senderID, currentBankBal + amountToLoan);
            account.creditScore = Math.max(300, account.creditScore - 15);
            
            storage.logTransaction(account, "LOAN", `Emprunt de ${fNum(amountToLoan)} Or.`);
            storage.saveUserBankProfile(senderID, account);
            return api.sendMessage(`✅ EMPRUNT ACCORDÉ : +${fNum(amountToLoan)} Or en compte. À rembourser : ${fNum(debtWithInterest)} Or.`, threadID, messageID);
        }

        if (primary === "repay") {
            if (!account.loan.hasActiveLoan) return api.sendMessage("❌ Aucune dette active.", threadID, messageID);
            let currentBankBal = getBankBalance(senderID);
            let amountStr = args[1];
            let amountToRepay = amountStr && amountStr.toLowerCase() === "all" ? account.loan.remainingDebt : parseInt(amountStr);
            if (isNaN(amountToRepay) || amountToRepay <= 0) return api.sendMessage("💡 Usage : `bank repay <montant|all>`", threadID, messageID);
            if (currentBankBal < amountToRepay) return api.sendMessage("❌ Solde bancaire insuffisant.", threadID, messageID);

            setBankBalance(senderID, currentBankBal - amountToRepay);
            account.loan.remainingDebt -= amountToRepay;

            if (account.loan.remainingDebt <= 0) {
                account.loan.hasActiveLoan = false;
                account.loan.remainingDebt = 0;
                account.creditScore = Math.min(850, account.creditScore + 45);
                storage.logTransaction(account, "LOAN_CLOSE", "Remboursement intégral.");
            } else {
                storage.logTransaction(account, "LOAN_REPAY", `Remboursement partiel.`);
            }
            storage.saveUserBankProfile(senderID, account);
            return api.sendMessage(`📉 Dette mise à jour. Reste dû : ${fNum(account.loan.remainingDebt)} Or.`, threadID, messageID);
        }

        if (primary === "credit") {
            let status = "Médiocre";
            if (account.creditScore > 700) status = "Excellent";
            else if (account.creditScore > 600) status = "Bon";
            else if (account.creditScore > 450) status = "Stable";
            return api.sendMessage(`📊 CONFIANCE BANCAIRE : **${account.creditScore} pts** [**${status}**]`, threadID, messageID);
        }

        if (primary === "history") {
            if (!account.history || account.history.length === 0) return api.sendMessage("📭 Aucun flux récent.", threadID, messageID);
            let histMsg = `📜 RELEVÉ DE COMPTE DE : ${account.name.toUpperCase()}\n\n`;
            account.history.slice(-10).forEach((log, idx) => {
                histMsg += `${idx + 1}. [${log.type}] ${log.message}\n`;
            });
            return api.sendMessage(histMsg, threadID, messageID);
    }

        // =========================================================================
        // 📈 INVESTISSEMENTS (MARCHÉ ACTIONS & CRYPTO-MONNAIES SIMULÉ)
        // =========================================================================
        const market = storage.updateMarketPrices();

        if (primary === "portfolio") {
            let pMsg = `💼 **PORTEFEUILLE D'ACTIFS VIRTURELS**\n\n📈 **Actions :**\n`;
            let totalValue = 0;
            if (account.portfolio.stocks) {
                for (let id in account.portfolio.stocks) {
                    let qty = account.portfolio.stocks[id].qty;
                    let assetVal = qty * (market.stocks[id]?.price || 0);
                    totalValue += assetVal;
                    pMsg += `  • **${id}** : ${qty} u (Valeur: ${fNum(assetVal)} Or)\n`;
                }
            }
            pMsg += `\n🪙 **Cryptomonnaies :**\n`;
            if (account.portfolio.crypto) {
                for (let id in account.portfolio.crypto) {
                    let qty = account.portfolio.crypto[id].qty;
                    let assetVal = qty * (market.cryptos[id]?.price || 0);
                    totalValue += assetVal;
                    pMsg += `  • **${id}** : ${qty} u (Valeur: ${fNum(assetVal)} Or)\n`;
                }
            }
            pMsg += `\n📊 Estimation totale : **${fNum(totalValue)} Or**`;
            return api.sendMessage(pMsg, threadID, messageID);
        }

        if (primary === "stocks" || primary === "crypto") {
            const isStock = primary === "stocks";
            const currentAssetList = isStock ? market.stocks : market.cryptos;
            let currentBankBal = getBankBalance(senderID);

            if (secondary === "list") {
                let mMsg = `📊 **MARCHÉ FICTIF DES ${primary.toUpperCase()}**\n\n`;
                for (let id in currentAssetList) {
                    mMsg += `🔹 **${currentAssetList[id].name}** [\`${id}\`] : **${fNum(currentAssetList[id].price)} Or** (${currentAssetList[id].trend})\n`;
                }
                return api.sendMessage(mMsg, threadID, messageID);
            }

            if (secondary === "buy") {
                let assetId = args[2]?.toUpperCase();
                let qty = parseInt(args[3]);
                if (!assetId || !currentAssetList[assetId] || isNaN(qty) || qty <= 0) return api.sendMessage("💡 Erreur de syntaxe. Exemple : `bank stocks buy AAPL 5`", threadID, messageID);

                let totalCost = Math.floor(currentAssetList[assetId].price * qty);
                if (currentBankBal < totalCost) return api.sendMessage(`❌ Fonds insuffisants (Requis: ${fNum(totalCost)} Or).`, threadID, messageID);

                if (!account.portfolio[primary]) account.portfolio[primary] = {};
                if (!account.portfolio[primary][assetId]) account.portfolio[primary][assetId] = { qty: 0, avgPrice: 0 };

                account.portfolio[primary][assetId].qty += qty;
                setBankBalance(senderID, currentBankBal - totalCost);

                storage.logTransaction(account, "INVEST_BUY", `Achat de ${qty} ${assetId}.`);
                storage.saveUserBankProfile(senderID, account);
                return api.sendMessage(`✅ Ordre d'achat exécuté pour ${qty} unités de ${assetId}.`, threadID, messageID);
            }

            if (secondary === "sell") {
                let assetId = args[2]?.toUpperCase();
                let qty = parseInt(args[3]);
                let holding = account.portfolio[primary]?.[assetId];
                if (!assetId || !holding || holding.qty < qty || isNaN(qty) || qty <= 0) return api.sendMessage("❌ Portefeuille ou quantité invalide.", threadID, messageID);

                let payout = Math.floor(currentAssetList[assetId].price * qty);
                holding.qty -= qty;
                setBankBalance(senderID, currentBankBal + payout);

                if (holding.qty === 0) delete account.portfolio[primary][assetId];
                storage.logTransaction(account, "INVEST_SELL", `Vente de ${qty} ${assetId}.`);
                storage.saveUserBankProfile(senderID, account);
                return api.sendMessage(`✅ Ordre de vente validé. +${fNum(payout)} Or en compte courant.`, threadID, messageID);
            }
                    }

        // =========================================================================
        // 🏢 SECTION EMPIRE COMMERCIAL & PARC IMMOBILIER (PASSIVE INCOMES)
        // =========================================================================
        const BIZ_PRESETS = {
            "b1": { name: "Stand de rue fictif", price: 50000, revenue: 800 },
            "b2": { name: "Café Gaming RPG", price: 150000, revenue: 2500 },
            "b3": { name: "Restaurant 5 étoiles", price: 450000, revenue: 7500 },
            "b4": { name: "Studio de Jeux Virtuels", price: 1200000, revenue: 22000 },
            "b5": { name: "Casino Hôtel de Luxe", price: 3500000, revenue: 65000 }
        };

        const PROP_PRESETS = {
            "p1": { name: "Studio Étudiant RPG", price: 80000, rent: 1500 },
            "p2": { name: "Appartement Central", price: 220000, rent: 4200 },
            "p3": { name: "Villa avec Piscine", price: 600000, rent: 11000 },
            "p4": { name: "Immeuble de Résidences", price: 1800000, rent: 35000 },
            "p5": { name: "Île Privée Premium", price: 6000000, rent: 120000 }
        };

        let currentBankBal = getBankBalance(senderID);

        if (primary === "business") {
            if (!secondary || secondary === "list") {
                let bMsg = `🏢 **MARCHÉ DES ENTREPRISES**\n\n`;
                for (let id in BIZ_PRESETS) {
                    let lvl = account.businesses[id]?.level || 0;
                    bMsg += `🔹 **${BIZ_PRESETS[id].name}** [\`${id}\`] : ${fNum(BIZ_PRESETS[id].price)} Or | Prod: +${fNum(BIZ_PRESETS[id].revenue)}/cyc (Niv: ${lvl})\n`;
                }
                return api.sendMessage(bMsg, threadID, messageID);
            }
            if (secondary === "buy") {
                let id = args[2]?.toLowerCase();
                if (!id || !BIZ_PRESETS[id] || account.businesses[id]) return api.sendMessage("❌ ID invalide ou déjà acheté.", threadID, messageID);
                if (currentBankBal < BIZ_PRESETS[id].price) return api.sendMessage("❌ Solde bancaire insuffisant.", threadID, messageID);
                
                setBankBalance(senderID, currentBankBal - BIZ_PRESETS[id].price);
                account.businesses[id] = { id, level: 1, lastCollected: now };
                
                storage.saveUserBankProfile(senderID, account);
                return api.sendMessage(`✅ Vous avez acheté l'entreprise : ${BIZ_PRESETS[id].name}.`, threadID, messageID);
            }
            if (secondary === "collect") {
                let total = 0, cooldown = 4 * 60 * 60 * 1000;
                for (let id in account.businesses) {
                    let biz = account.businesses[id];
                    if (now - biz.lastCollected >= cooldown) {
                        let cycles = Math.min(6, Math.floor((now - biz.lastCollected) / cooldown));
                        total += BIZ_PRESETS[id].revenue * biz.level * cycles;
                        biz.lastCollected = now;
                    }
                }
                if (total === 0) return api.sendMessage("⏳ Pas assez de profits accumulés.", threadID, messageID);
                setBankBalance(senderID, currentBankBal + total);
                storage.saveUserBankProfile(senderID, account);
                return api.sendMessage(`💸 Profits commerciaux récoltés : +${fNum(total)} Or en compte.`, threadID, messageID);
            }
        }

        if (primary === "property") {
            if (!secondary || secondary === "list") {
                let pList = `🏠 **AGENCE IMMOBILIÈRE IMMO V2**\n\n`;
                for (let id in PROP_PRESETS) {
                    let qty = account.properties[id]?.qty || 0;
                    pList += `🔹 **${PROP_PRESETS[id].name}** [\`${id}\`] : ${fNum(PROP_PRESETS[id].price)} Or | Loyer: +${fNum(PROP_PRESETS[id].rent)}/cyc (Possédé: ${qty})\n`;
                }
                return api.sendMessage(pList, threadID, messageID);
            }
            if (secondary === "buy") {
                let id = args[2]?.toLowerCase();
                if (!id || !PROP_PRESETS[id]) return api.sendMessage("❌ Modèle immobilier invalide.", threadID, messageID);
                if (currentBankBal < PROP_PRESETS[id].price) return api.sendMessage("❌ Solde insuffisant.", threadID, messageID);

                setBankBalance(senderID, currentBankBal - PROP_PRESETS[id].price);
                if (!account.properties[id]) account.properties[id] = { id, qty: 0, lastCollected: now };
                account.properties[id].qty += 1;

                storage.saveUserBankProfile(senderID, account);
                return api.sendMessage(`✅ Propriété acquise avec succès !`, threadID, messageID);
            }
        }

        if (primary === "rent") {
            let totalRent = 0, cooldown = 6 * 60 * 60 * 1000;
            for (let id in account.properties) {
                let prop = account.properties[id];
                if (now - prop.lastCollected >= cooldown) {
                    let cycles = Math.min(4, Math.floor((now - prop.lastCollected) / cooldown));
                    totalRent += PROP_PRESETS[id].rent * prop.qty * cycles;
                    prop.lastCollected = now;
                }
            }
            if (totalRent === 0) return api.sendMessage("⏳ Aucun loyer en attente.", threadID, messageID);
            setBankBalance(senderID, currentBankBal + totalRent);
            storage.saveUserBankProfile(senderID, account);
            return api.sendMessage(`🏠 Perception immobilière terminée : +${fNum(totalRent)} Or perçus.`, threadID, messageID);
        }

        // =========================================================================
        // 🏴‍☠️ MECANIQUE PvP "BANK ROB" & CLASSEMENTS GLOBAL
        // =========================================================================
        if (primary === "rob") {
            let targetID = null;
            if (event.type === "message_reply") {
                targetID = event.messageReply.senderID;
            } else if (Object.keys(event.mentions).length > 0) {
                targetID = Object.keys(event.mentions)[0];
            } else if (args[1] && !isNaN(args[1])) {
                targetID = args[1];
            }

            if (!targetID) return api.sendMessage("💡 Usage : Spécifiez l'UID ou répondez : `bank rob <uid>`", threadID, messageID);
            if (targetID === senderID) return api.sendMessage("❌ Impossible de s'auto-braquer.", threadID, messageID);

            const cooldown = 12 * 60 * 60 * 1000;
            if (now - (account.robberyState?.lastRobAt || 0) < cooldown) {
                return api.sendMessage("⏳ Vos complices se font discrets. Réessayez plus tard.", threadID, messageID);
            }

            const targetName = global.data?.allUserData?.[targetID]?.name || `Cible #${targetID.slice(-4)}`;
            let targetCash = global.data && global.data.allUserData?.[targetID] ? (global.data.allUserData[targetID].money || 0) : 0;
            const targetAccount = storage.getUserBankProfile(targetID, targetName);

            if (now < (targetAccount.robberyState?.shieldUntil || 0)) {
                return api.sendMessage(`🛡️ Infiltration échouée. ${targetName} possède un système de protection actif.`, threadID, messageID);
            }
            if (targetCash < 5000) return api.sendMessage(`❌ Cible non rentable (moins de 5 000 Or en poche).`, threadID, messageID);
            if (walletCash < 2500) return api.sendMessage(`❌ Il vous faut au moins 2 500 Or pour orchestrer le casse.`, threadID, messageID);

            account.robberyState.lastRobAt = now;
            let isSuccess = Math.random() < 0.45;

            if (isSuccess) {
                let stolen = Math.floor(targetCash * (0.10 + Math.random() * 0.15));
                if (targetAccount.vaultBalance > 1000000) stolen = Math.floor(stolen * 0.85);

                walletCash += stolen;
                targetCash -= stolen;
                targetAccount.robberyState.shieldUntil = now + (2 * 60 * 60 * 1000);
                account.robberyState.robSuccess = (account.robberyState.robSuccess || 0) + 1;

                // 🟢 Ajout des await ici pour la réussite
                await syncWalletCash(senderID, walletCash);
                await syncWalletCash(targetID, targetCash);
                storage.saveUserBankProfile(senderID, account);
                storage.saveUserBankProfile(targetID, targetAccount);

                return api.sendMessage(`🏴‍☠️ SUCCÈS ! Vous pillez les réserves de ${targetName} et repartez avec +${fNum(stolen)} Or en liquide.`, threadID, messageID);
            } else {
                let fine = 5000;
                walletCash = Math.max(0, walletCash - fine);
                targetCash += fine;
                account.creditScore = Math.max(300, account.creditScore - 30);

                // 🟢 Ajout des await ici pour l'échec (l'amende)
                await syncWalletCash(senderID, walletCash);
                await syncWalletCash(targetID, targetCash);
                storage.saveUserBankProfile(senderID, account);
                storage.saveUserBankProfile(targetID, targetAccount);

                return api.sendMessage(`🚨 ÉCHEC ! Les caméras ont capturé votre visage chez ${targetName}. Amende de -${fNum(fine)} Or prélevée.`, threadID, messageID);
            }
        }
        
        if (primary === "networth") {
            let bizVal = 0, propVal = 0;
            for (let id in account.businesses) bizVal += (BIZ_PRESETS[id]?.price || 0) * account.businesses[id].level;
            for (let id in account.properties) propVal += (PROP_PRESETS[id]?.price || 0) * account.properties[id].qty;

            let netTotal = walletCash + getBankBalance(senderID) + account.vaultBalance + bizVal + propVal;
            return api.sendMessage(`💎 ANALYSE DISCRÈTE : Valeur nette estimée de votre patrimoine : **${fNum(netTotal)} Or**.`, threadID, messageID);
        }

        if (primary === "leaderboard") {
            const all = storage.getUsers();
            let data = [];
            for (let id in all) {
                let c = global.data?.allUserData?.[id]?.money || 0;
                let b = global.data?.allUserData?.[id]?.data?.bank?.balance || all[id].bankBalance || 0;
                data.push({ name: all[id].name, total: c + b + all[id].vaultBalance });
            }
            data.sort((a, b) => b.total - a.total);
            let msg = `🏆 **CLASSEMENT DE L'EMPIRE (FORTUNE FINANCIÈRE)**\n\n`;
            data.slice(0, 10).forEach((u, i) => {
                msg += `#${i + 1} **${u.name}** — ${fNum(u.total)} Or\n`;
            });
            return api.sendMessage(msg, threadID, messageID);
        }

        // =========================================================================
        // 📊 SOUS-COMMANDE "STATS" (INTEGRATION CANVAS DU RAPPORT COMPLET)
        // =========================================================================
        if (primary === "stats") {
            let bizVal = 0, propVal = 0, bizCount = 0, propCount = 0;
            for (let id in account.businesses) {
                bizVal += (BIZ_PRESETS[id]?.price || 0) * account.businesses[id].level;
                bizCount++;
            }
            for (let id in account.properties) {
                propVal += (PROP_PRESETS[id]?.price || 0) * account.properties[id].qty;
                propCount += account.properties[id].qty;
            }

            let totalNet = walletCash + currentBankBal + account.vaultBalance + bizVal + propVal;
            let rankTitle = "Novice Financier";
            if (totalNet > 10000000) rankTitle = "Légende de WallStreet";
            else if (totalNet > 2500000) rankTitle = "Magnat de l'Empire";
            else if (totalNet > 500000) rankTitle = "Investisseur Émérite";

            const datasetStats = [
                { label: "TYCOON RANK", val: rankTitle, color: "#ffeaa7" },
                { label: "ENTREPRISES", val: `${bizCount} Actives`, color: "#0984e3" },
                { label: "IMMOBILIER", val: `${propCount} Biens`, color: "#fd79a8" },
                { label: "RAIDS PvP REUSSIS", val: `${account.robberyState?.robSuccess || 0}`, color: "#00b894" },
                { label: "LIQUIDITÉS POCHE", val: `${formatShortMoney(walletCash)} Or`, color: "#00cec9" },
                { label: "VALEUR NETTE", val: `${formatShortMoney(totalNet)} Or`, color: "#6c5ce7" }
            ];

            const filePath = await generateFinancialCanvas("TABLEAU DE BORD EMPIRE DE HAUT NIVEAU", datasetStats, senderID);
            await api.sendMessage({ attachment: fs.createReadStream(filePath) }, threadID, () => {
                try { fs.unlinkSync(filePath); } catch(e) {}
            }, messageID);
            return;
        }
    }
};
