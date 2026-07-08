/**
 * 🏦 COMMANDE BANQUE PRINCIPALE & EMPIRE FINANCIER V2 (PARTIE 2)
 * Intégration Native : Système Économique Virtuel Fictif & PvP MMORPG pour GoatBot.
 * S'interface directement sur global.data.allUserData pour le Cash.
 */

const path = require("path");
const storage = require("./MMORPG_System/bankMMO/bank.storage.js");

// Configuration du module compatible avec le gestionnaire de commandes GoatBot
module.exports = {
    config: {
        name: "bank",
        version: "2.0.0",
        author: "Premium Financial Engine",
        countDown: 2,
        role: 0,
        description: "Simulation d'un empire financier : Banque, Crédits, Bourse et Entreprises.",
        category: "economy"
    },

    onStart: async function ({ api, event, args }) {
        const { threadID, messageID, senderID } = event;
        const now = Date.now();

        // Récupération sécurisée du nom du joueur
        const senderName = event.senderName || `Aventurier #${senderID.slice(-4)}`;
        
        // Chargement du profil d'extension bancaire secondaire
        const account = storage.getUserBankProfile(senderID, senderName);
        const fNum = storage.formatMoney;

        // Extraction dynamique du Cash depuis l'infrastructure centrale de GoatBot
        let walletCash = global.data && global.data.allUserData?.[senderID] ? (global.data.allUserData[senderID].money || 0) : 0;

        // Helper pour synchroniser instantanément les modifications de Cash vers le Bot
        const syncWalletCash = (uid, amount) => {
            if (global.data && global.data.allUserData?.[uid]) {
                global.data.allUserData[uid].money = Math.max(0, Math.floor(amount));
            }
        };

        // Routage des sous-commandes
        const primary = args[0] ? args[0].toLowerCase() : null;
        const secondary = args[1] ? args[1].toLowerCase() : null;

        // =========================================================================
        // 🏦 MENU D'INTERFACE TEXTE PREMIUM (SI COMMANDE MANQUE DE SUB-CMD)
        // =========================================================================
        if (!primary) {
            let menu = `╭───────────────────────────────────────╮\n`;
            menu += `│ 🏦 𝐁𝐀𝐍𝐊 𝐄𝐌𝐏𝐈𝐑𝐄 𝐅𝐈𝐍𝐀𝐍𝐂𝐈𝐄𝐑 𝐕𝟐\n`;
            menu += `├───────────────────────────────────────┤\n`;
            menu += `│ 💰 **𝗕𝗮𝘀𝗲 𝗕𝗮𝗻𝗸𝗶𝗻𝗴**\n`;
            menu += `│ 🔹 𝖻𝖺𝗇𝗄 𝖻𝖺𝗅𝖺𝗇𝖼𝖾                  : 𝖵𝗈𝗂𝗋 𝗏𝗈𝗍𝗋𝖾 𝗉𝗋𝗈𝖿𝗂𝗅 𝖿𝗂𝗇𝖺𝗇𝖼𝗂𝖾𝗋\n`;
            menu += `│ 🔹 𝖻𝖺𝗇𝗄 𝖽𝖾𝗉𝗈𝗌𝗂𝗍 <𝗆𝗈𝗇𝗍𝖺𝗇𝗍|𝖺𝗅𝗅>    : 𝖣𝖾𝗉𝗈𝗌𝖾𝗋 𝗏𝗈𝗍𝗋𝖾 𝖼𝖺𝗌𝗁 𝖾𝗇 𝖻𝖺𝗇𝗊𝗎𝖾\n`;
            menu += `│ 🔹 𝖻𝖺𝗇𝗄 𝗐𝗂𝗍𝗁𝖽𝗋𝖺𝗐 <𝗆𝗈𝗇𝗍𝖺𝗇𝗍>       : 𝖱𝖾𝗍𝗂𝗋𝖾𝗋 𝗏𝗈𝗌 𝖿𝗈𝗇𝖽𝗌 𝗏𝖾𝗋𝗌 𝗅𝖾 𝖼𝖺𝗌𝗁\n`;
            menu += `│ 🔹 𝖻𝖺𝗇𝗄 𝗍𝗋𝖺𝗇𝗌𝖿𝖾𝗋 <@𝗎𝗌𝖾𝗋|𝗎𝗂𝖽> <𝗆> : 𝖵𝗂𝗋𝖾𝗆𝖾𝗇𝗍 𝗌𝖾𝖼𝗎𝗋𝗂𝗌𝖾\n`;
            menu += `│ 🔹 𝖻𝖺𝗇𝗄 𝗏𝖺𝗎𝗅𝗍 [𝖽𝖾𝗉𝗈𝗌𝗂𝗍|𝗐𝗂𝗍𝗁𝖽𝗋𝖺𝗐]  : 𝖦𝖾𝗌𝗍𝗂𝗈𝗇 𝖽𝗎 𝖢𝗈𝖿𝖿𝗋𝖾-𝖥𝗈𝗋𝗍 \n`;
            menu += `│ 🔹 𝖻𝖺𝗇𝗄 𝗁𝗂𝗌𝗍𝗈𝗋𝗒                  : 𝖱𝖾𝗅𝖾𝗏𝖾 𝖽𝖾𝗌 𝟣𝟧 𝖽𝖾𝗋𝗇𝗂𝖾𝗋𝗌 𝖿𝗅𝗎flux\n`;
            menu += `├───────────────────────────────────────┤\n`;
            menu += `│ 📆 **𝗥𝗲𝗰𝗼𝗺𝗽𝗲𝗻𝘀𝗲𝘀**\n`;
            menu += `│ 🔹 𝖻𝖺𝗇𝗄 𝖽𝖺𝗂𝗅𝗒 | 𝗐𝖾𝖾𝗄𝗅𝗒             : 𝖣𝗈𝗍𝖺𝗍𝗂𝗈𝗇𝗌 𝗉𝖾𝗋𝗂𝗈𝖽𝗂𝗊𝗎𝖾𝗌 𝖽'𝖾𝗉𝖺𝗋𝗀𝗇𝖾\n`;
            menu += `├───────────────────────────────────────┤\n`;
            menu += `│ 💳 **𝗖𝗿𝗲𝗱𝗶𝘁 & 𝗟𝗼𝗮𝗻𝘀**\n`;
            menu += `│ 🔹 𝖻𝖺𝗇𝗄 𝗅𝗈𝖺𝗇 <𝗆𝗈𝗇𝗍𝖺𝗇𝗍>           : 𝖤𝗆𝗉𝗋𝗎𝗇𝗍𝖾𝗋 𝖽𝖾 𝗅'𝖺𝗋𝗀𝖾𝗇𝗍\n`;
            menu += `│ 🔹 𝖻𝖺𝗇𝗄 𝗋𝖾𝗉𝖺𝗒 <𝗆𝗈𝗇𝗍𝖺𝗇𝗍|𝖺𝗅𝗅>      : 𝖱𝖾rem𝖻𝗈𝗎𝗋𝗌𝖾𝗋 𝗏𝗈𝗍𝗋𝖾 𝖽𝖾𝗍𝗍𝖾\n`;
            menu += `│ 🔹 𝖻𝖺𝗇𝗄 𝖽𝖾𝖻𝗍 | 𝖼𝗋𝖾𝖽𝗂𝗍            : 𝖠𝗇𝖺𝗅𝗒𝗌𝖾 𝖽𝗎 𝗌𝖼𝗈𝗋𝖾 𝖽𝖾 𝖼𝗈𝗇𝖿𝗂𝖺𝗇𝖼𝖾\n`;
            menu += `├───────────────────────────────────────┤\n`;
            menu += `│ 📈 **𝗜𝗻𝘃𝗲𝘀𝘁𝗶𝘀𝘀𝗲𝗺𝗲𝗻𝘁𝘀**\n`;
            menu += `│ 🔹 𝖻𝖺𝗇𝗄 𝗌𝗍𝗈𝖼𝗄𝗌 [𝗅𝗂𝗌𝗍|𝖻𝗎𝗒|𝗌𝖾𝗅𝗅]   : 𝖡𝗈𝗎𝗋𝗌𝖾 𝖽'𝖠𝖼𝗍𝗂𝗈𝗇𝗌 𝖿𝗂𝖼𝗍𝗂𝗏𝖾𝗌\n`;
            menu += `│ 🔹 𝖻𝖺𝗇𝗄 𝖼𝗋𝗒𝗉𝗍𝗈 [𝗅𝗂𝗌𝗍|𝖻𝗎𝗒|𝗌𝖾𝗅𝗅]   : 𝖬𝖺𝗋𝖼𝗁𝖾 𝖢𝗋𝗒𝗉𝗍𝗈 𝗏𝗈𝗅𝖺𝗍𝗂𝗅\n`;
            menu += `│ 🔹 𝖻𝖺𝗇𝗄 𝗉𝗈𝗋𝗍𝖿𝗈𝗅𝗂𝗈                : 𝖵𝗎𝖾 𝖽𝖾𝗌 𝖺𝖼𝗍𝗂𝖿𝗌\n`;
            menu += `├───────────────────────────────────────┤\n`;
            menu += `│ 🏢 **𝗘𝗺𝗽𝗶𝗿𝗲 𝗖𝗼𝗺𝗺𝗲𝗿𝗰𝗶𝗮𝗹**\n`;
            menu += `│ 🔹 𝖻𝖺𝗇𝗄 𝖻𝗎𝗌𝗂𝗇𝖾𝗌𝗌 [𝗅𝗂𝗌𝗍|𝖻𝗎𝗒|𝗎𝗉𝗀𝗋𝖺𝖽𝖾] : 𝖤𝗇𝗍𝗋𝖾𝗉𝗋𝗂𝗌𝖾𝗌 & 𝖱𝖾𝗏𝖾𝗇𝗎𝗌\n`;
            menu += `│ 🔹 𝖻𝖺𝗇𝗄 𝖻𝗎𝗌𝗂𝗇𝖾𝗌𝗌 𝖼𝗈𝗅𝗅𝖾𝗼𝗍            : 𝖱𝖾𝖼𝗎𝗉𝖾𝗋𝖾𝗋 𝗅𝖾𝗌 𝗉𝗋𝗈𝖿𝗂𝗍𝗌\n`;
            menu += `├───────────────────────────────────────┤\n`;
            menu += `│ 🏠 **𝗜𝗺𝗺𝗼𝗯𝗶𝗹𝗶𝗲𝗿**\n`;
            menu += `│ 🔹 𝖻𝖺𝗇𝗄 𝗉𝗋𝗈𝗉𝖾𝗋𝗍𝗒 [𝗅𝗂𝗌𝗍|𝖻𝗎𝗒|𝗌𝖾𝗅𝗅] : 𝖠𝖼𝗁𝖺𝗍 𝖾𝗍 𝗀𝖾𝗌𝗍𝗂𝗈𝗇 𝖽𝖾 𝖻𝗂𝖾𝗇𝗌\n`;
            menu += `│ 🔹 𝖻𝖺𝗇𝗄 𝗋𝖾𝗇𝗍                     : 𝖢𝗈𝗅𝗅𝖾𝖼𝗍𝖾 𝖽𝖾𝗌 𝗅𝗈𝗒𝖾𝗋𝗌 𝗉𝖺𝗌𝗌𝗂𝖿𝗌\n`;
            menu += `├───────────────────────────────────────┤\n`;
            menu += `│ 🏴‍☠️ **𝗣𝘃𝗣 & 𝗦𝗰𝗼𝗿𝗲𝘀**\n`;
            menu += `│ 🔹 𝖻𝖺𝗇𝗄 𝗋𝗈𝖻 <@𝗎𝗌𝖾𝗋>              : 𝖳𝖾𝗇𝗍𝖺𝗍𝗂𝗏𝖾 𝖽𝖾 𝗏𝗈𝗅 (𝖯𝗏𝖯 𝖱𝖯𝖦)\n`;
            menu += `│ 🔹 𝖻𝖺𝗇𝗄 𝗅𝖾𝖺𝖽𝖾𝗋𝖻𝗈𝖺𝗋𝖽 | 𝗇𝖾𝗍𝗐𝗈𝗋𝗍𝗁   : 𝖢𝗅𝖺𝗌𝗌𝖾𝗆𝖾𝗇𝗍 & 𝖥𝗈𝗋𝗍𝗎𝗇𝖾\n`;
            menu += `│ 🔹 𝖻𝖺𝗇𝗄 𝗌𝗍𝖺𝗍𝗌 | 𝖺𝖼𝗁𝗂𝖾𝗏𝖾𝗆𝖾𝗇𝗍𝗌       : 𝖳𝖺𝖻𝗅𝖾𝖺𝗎 𝖽𝖾 𝖻𝗈𝗋𝖽 𝗉𝖾𝗋𝗌𝗈𝗇𝗇𝖾𝗅\n`;
            menu += `╰───────────────────────────────────────╯`;
            return api.sendMessage(menu, threadID, messageID);
        }

        // Détecteur d'incohérence ou injection de sous-commandes invalides
        const validCommands = [
            "balance", "deposit", "withdraw", "transfer", "vault", "history",
            "daily", "weekly", "monthly", "loan", "repay", "debt", "credit",
            "invest", "stocks", "crypto", "portfolio", "business", "property",
            "rent", "achievements", "leaderboard", "networth", "stats", "rob"
        ];

        if (!validCommands.includes(primary)) {
            return api.sendMessage("❌ 𝖲𝗈𝗎𝗌-𝖼𝗈𝗆𝗆𝖺𝗇𝖽𝖾 𝗂𝗇𝗏𝖺𝗅𝗂𝖽𝖾. 𝖵𝖾𝗎𝗂𝗅𝗅𝖾𝗓 𝗏𝗈𝗎𝗌 𝗋𝖾𝖿𝖾𝗋𝖾𝗋 𝖺𝗎 𝗆𝖾𝗇𝗎 `𝖻𝖺𝗇𝗄`.", threadID, messageID);
        }

        // =========================================================================
        // 💰 EXECUTION DE LA LOGIQUE BANQUE DE BASE
        // =========================================================================
        if (primary === "balance") {
            // Calcul des revenus passifs combinés (Infrastructures + Loyers)
            let passiveIncomes = 0;
            const BIZ_PRESETS = { "b1": 800, "b2": 2500, "b3": 7500, "b4": 22000, "b5": 65000 };
            const PROP_PRESETS = { "p1": 1500, "p2": 4200, "p3": 11000, "p4": 35000, "p5": 120000 };
            
            for (let bId in account.businesses) passiveIncomes += (BIZ_PRESETS[bId] || 0) * account.businesses[bId].level;
            for (let pId in account.properties) passiveIncomes += (PROP_PRESETS[pId] || 0) * account.properties[pId].qty;

            // Estimation de la fortune totale nette
            let netWorth = walletCash + account.bankBalance + account.vaultBalance;
            if (account.loan.hasActiveLoan) netWorth -= account.loan.remainingDebt;

            let balMsg = `╭───────────────────────────────────────╮\n`;
            balMsg += `│ 🏦 **𝐒𝐈𝐓𝐔𝐀𝐓𝐈𝐎𝐍 𝐅𝐈𝐍𝐀𝐍𝐂𝐈𝐄̀𝐑𝐄**\n`;
            balMsg += `├───────────────────────────────────────┤\n`;
            balMsg += `│ 💵 𝖢𝖺𝗌𝗁 (𝖶𝖺𝗅𝗅𝖾𝗍)  : **${fNum(walletCash)} 𝖮𝗋**\n`;
            balMsg += `│ 💳 𝖢𝗈𝗆𝗉𝗍𝖾 𝖢𝗈𝗎𝗋𝖺𝗇𝗍 : **${fNum(account.bankBalance)} 𝖮𝗋**\n`;
            balMsg += `│ 🔐 𝖢𝗈𝖿𝖿𝗋𝖾-𝖥𝗈𝗋𝗍    : **${fNum(account.vaultBalance)} 𝖮𝗋**\n`;
            balMsg += `├───────────────────────────────────────┤\n`;
            balMsg += `│ 📉 𝖣𝖾𝗍𝗍𝖾 𝖠𝖼𝗍𝗂𝗏𝖾   : **${account.loan.hasActiveLoan ? fNum(account.loan.remainingDebt) : "𝟢"} 𝖮𝗋**\n`;
            balMsg += `│ 📊 𝖲𝖼𝗈𝗋𝖾 𝖢𝗋𝖾𝖽𝗂𝗍   : **${account.creditScore} 𝗉𝗍𝗌**\n`;
            balMsg += `│ 📈 𝖱𝖾𝗏𝖾𝗇𝗎𝗌 𝖯𝖺𝗌𝗌𝗂𝖿𝗌 : **+${fNum(passiveIncomes)} 𝖮𝗋 /𝖼𝗒𝖼𝗅𝖾**\n`;
            balMsg += `├───────────────────────────────────────┤\n`;
            balMsg += `│ 💎 𝖵𝖺𝗅𝖾𝗎𝗋 𝖭𝖾𝗍𝗍𝖾    : **${fNum(netWorth)} 𝖮𝗋**\n`;
            balMsg += `╰───────────────────────────────────────╯`;
            return api.sendMessage(balMsg, threadID, messageID);
        }

        if (primary === "deposit") {
            let argAmt = args[1];
            if (!argAmt) return api.sendMessage("💡 𝖴𝗌𝖺𝗀𝖾 : `𝖻𝖺𝗇𝗄 𝖽𝖾𝗉𝗈𝗌𝗂𝗍 <𝗆𝗈𝗇𝗍𝖺𝗇𝗍|𝖺𝗅𝗅>`", threadID, messageID);

            let amountToDeposit = argAmt.toLowerCase() === "all" ? walletCash : parseInt(argAmt);
            if (isNaN(amountToDeposit) || amountToDeposit <= 0) return api.sendMessage("❌ 𝖬𝗈𝗇𝗍𝖺𝗇𝗍 𝖽𝖾 𝖽𝖾𝗉𝗈𝗍 𝗂𝗇𝗏𝖺𝗅𝗂𝖽𝖾.", threadID, messageID);
            if (walletCash < amountToDeposit) return api.sendMessage("❌ 𝖵𝗈𝗎𝗌 𝗇𝖾 𝗉𝗈𝗌𝗌𝖾𝖽𝖾𝗓 𝗉𝖺𝗌 𝖺𝗌𝗌𝖾𝗓 𝖽'𝖺𝗋𝗀𝖾𝗇𝗍 𝗅𝗂𝗊𝗎𝗂𝖽𝖾 𝖽𝖺𝗇𝗌 𝗏𝗈𝗍𝗋𝖾 𝖶𝖺𝗅𝗅𝖾𝗍.", threadID, messageID);

            walletCash -= amountToDeposit;
            account.bankBalance += amountToDeposit;
            account.totalDeposited += amountToDeposit;

            // Déclenchement de l'achievement Premier Dépôt
            if (!account.achievements.includes("𝖯𝗋𝖾𝗆𝗂𝖾𝗋 𝖣𝖾𝗉𝗈𝗍")) account.achievements.push("𝖯𝗋𝖾𝗆𝗂𝖾𝗋 𝖣𝖾𝗉𝗈𝗍");

            syncWalletCash(senderID, walletCash);
            storage.logTransaction(account, "DEPOSIT", `Dépôt de ${fNum(amountToDeposit)} Or.`);
            storage.saveUserBankProfile(senderID, account);

            return api.sendMessage(`✅ **𝖣𝖤𝖯𝖮𝖲𝖨𝖳 𝖱𝖤𝖴𝖲𝖲𝖨**\n💰 **${fNum(amountToDeposit)} 𝖮𝗋** 𝗍𝗋𝖺𝗇𝗌𝖿𝖾𝗋𝖾𝗌 𝖺𝗏𝖾𝖼 𝗌𝗎𝖼𝖼𝖾𝗌 𝗏𝖾𝗋𝗌 𝗏𝗈𝗍𝗋𝖾 𝖼𝗈𝗆𝗉𝗍𝖾 𝖻𝖺𝗇𝖼𝖺𝗂𝗋𝖾.`, threadID, messageID);
        }

        if (primary === "withdraw") {
            let argAmt = args[1];
            if (!argAmt) return api.sendMessage("💡 𝖴𝗌𝖺𝗀𝖾 : `𝖻𝖺𝗇𝗄 𝗐𝗂𝗍𝗁𝖽𝗋𝖺𝗐 <# 𝗆𝗈𝗇𝗍𝖺𝗇𝗍>`", threadID, messageID);

            let amountToWithdraw = parseInt(argAmt);
            if (isNaN(amountToWithdraw) || amountToWithdraw <= 0) return api.sendMessage("❌ 𝖬𝗈𝗇𝗍𝖺𝗇𝗍 𝖽𝖾 𝗋𝖾𝗍𝗋𝖺𝗂𝗍 𝗂𝗇𝗏𝖺𝗅𝗂𝖽𝖾.", threadID, messageID);
            if (account.bankBalance < amountToWithdraw) return api.sendMessage("❌ 𝖲𝗈𝗅𝖽𝖾 𝖻𝖺𝗇𝖼𝖺𝗂𝗋𝖾 𝗂𝗇𝗌𝗎𝖿𝖿𝗂𝗌𝖺𝗇𝗍 𝗌𝗎𝗋 𝗏𝗈𝗍𝗋𝖾 𝖼𝗈𝗆𝗉𝗍𝖾 𝖼𝗈𝗎𝗋𝖺𝗇𝗍.", threadID, messageID);

            account.bankBalance -= amountToWithdraw;
            walletCash += amountToWithdraw;
            account.totalWithdrawn += amountToWithdraw;

            syncWalletCash(senderID, walletCash);
            storage.logTransaction(account, "WITHDRAW", `Retrait de ${fNum(amountToWithdraw)} Or.`);
            storage.saveUserBankProfile(senderID, account);

            return api.sendMessage(`✅ **𝖱𝖤𝖳𝖱𝖠𝖨𝖳 𝖤𝖥𝖥𝖤𝖢𝖳𝖴𝖤**\n💵 **${fNum(amountToWithdraw)} 𝖮𝗋** 𝗋𝖾𝗉𝗅𝖺𝖼𝖾𝗌 𝖽𝖺𝗇𝗌 𝗏𝗈𝗍𝗋𝖾 𝖶𝖺𝗅𝗅𝖾𝗍 𝗀𝗅𝗈𝖻𝖺𝗅.`, threadID, messageID);
        }

        // Transmission de l'exécution vers la suite logique du système
        global.bankEngine = { walletCash, syncWalletCash, account, fNum, primary, secondary, now };

        // =========================================================================
        // 💸 TRANSFERT SECURISE INTER-JOUEURS (COMPTE A COMPTE)
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

            if (!targetID || isNaN(amountToTransfer) || amountToTransfer <= 0) {
                return api.sendMessage("💡 𝖴𝗌𝖺𝗀𝖾 : 𝖬𝖾𝗇𝗍𝗂𝗈𝗇𝗇𝖾𝗓 𝗎𝗇 𝗃𝗈𝗎𝖾𝗎𝗋 𝗈𝗎 𝗋𝖾𝗉𝗈𝗇𝖽𝖾𝗓 à 𝗌𝗈𝗇 𝗆𝖾𝗌𝗌𝖺𝗀𝖾 : `𝖻𝖺𝗇𝗄 𝗍𝗋𝖺𝗇𝗌𝖿𝖾𝗋 <@𝗎𝗌𝖾𝗋> <𝗆𝗈𝗇𝗍𝖺𝗇𝗍>`", threadID, messageID);
            }
            if (targetID === senderID) return api.sendMessage("❌ 𝖨𝗆𝗉𝗈𝗌𝗌𝗂𝖻𝗅𝖾 𝖽'𝖼𝗂𝖻𝗅𝖾𝗋 𝗏𝗈𝗍𝗋𝖾 𝗉𝗋𝗈𝗉𝗋𝖾 𝖼𝗈𝗆𝗉𝗍𝖾.", threadID, messageID);
            if (account.bankBalance < amountToTransfer) return api.sendMessage("❌ 𝖲𝗈𝗅𝖽𝖾 𝖻𝖺𝗇𝖼𝖺𝗂𝗋𝖾 𝗂𝗇𝗌𝗎𝖿𝖿𝗂𝗌𝖺𝗇𝗍 𝗉𝗈𝗎𝗋 𝖼𝗈𝗎𝗏𝗋𝗂𝗋 𝖼𝖾 𝗏𝗂𝗋𝖾𝗆𝖾𝗇𝗍.", threadID, messageID);

            // Application d'une taxe bancaire de 2% (Régulation MMORPG)
            const tax = Math.floor(amountToTransfer * 0.02);
            const netReceived = amountToTransfer - tax;

            // Chargement du profil de la cible
            const targetName = global.data?.allUserData?.[targetID]?.name || `Client #${targetID.slice(-4)}`;
            const targetAccount = storage.getUserBankProfile(targetID, targetName);

            // Mutation des soldes bancaires
            account.bankBalance -= amountToTransfer;
            targetAccount.bankBalance += netReceived;

            account.totalTransferred += amountToTransfer;

            // Mise à jour de l'historique des deux entités
            storage.logTransaction(account, "TRANSFER", `Virement émis vers ${targetAccount.name} : -${fNum(amountToTransfer)} Or.`);
            storage.logTransaction(targetAccount, "TRANSFER", `Virement reçu de ${account.name} : +${fNum(netReceived)} Or.`);

            // Sauvegarde synchronisée
            storage.saveUserBankProfile(senderID, account);
            storage.saveUserBankProfile(targetID, targetAccount);

            let transMsg = `💸 **𝖵𝖨𝖱𝖤𝖬𝖤𝖭𝖳 𝖤𝖥𝖥𝖤𝖢𝖳𝖴𝖤**\n\n`;
            transMsg += `📤 𝖤𝗆𝗂𝗍𝗍𝖾𝗎𝗋 : **${account.name}**\n`;
            transMsg += `📥 𝖡𝖾𝗇𝖾𝖿𝗂𝖼𝗂𝖺𝗂𝗋𝖾 : **${targetAccount.name}**\n`;
            transMsg += `🏛️ 𝖥𝗋𝖺𝗂𝗌 𝖽𝖾 𝖢𝗁𝖺𝗇𝗀𝖾 (𝟤%) : **${fNum(tax)} 𝖮𝗋**\n`;
            transMsg += `💰 𝖬𝗈𝗇𝗍𝖺𝗇𝗍 𝖭𝖾𝗍 𝖱𝖾ç𝗎 : **${fNum(netReceived)} 𝖮𝗋**`;
            return api.sendMessage(transMsg, threadID, messageID);
        }

        // =========================================================================
        // 🔐 COFFRE-FORT SECURISE (ANTI-ROB SYSTEM)
        // =========================================================================
        if (primary === "vault") {
            if (!secondary) {
                let vaultMsg = `╭───────────────────────────────────────╮\n`;
                vaultMsg += `│ 🔐 **𝖢𝖮𝖥𝖥𝖱𝖤-𝖥𝖮𝖱𝖳 𝖣𝖤 𝖧𝖠𝖴𝖳𝖤 𝖲𝖤𝖢𝖴𝖱𝖨𝖳𝖤**\n`;
                vaultMsg += `├───────────────────────────────────────┤\n`;
                vaultMsg += `│ L'argent stocké dans le Vault est 100% protégé\n`;
                vaultMsg += `│ contre les mécaniques de vol PvP (\`bank rob\`).\n`;
                vaultMsg += `├───────────────────────────────────────┤\n`;
                vaultMsg += `│ 🔐 Solde du Coffre : **${fNum(account.vaultBalance)} 𝖮𝗋**\n`;
                vaultMsg += `├───────────────────────────────────────┤\n`;
                vaultMsg += `│ 💡 \`bank vault deposit <montant>\`\n`;
                vaultMsg += `│ 💡 \`bank vault withdraw <montant>\`\n`;
                vaultMsg += `╰───────────────────────────────────────╯`;
                return api.sendMessage(vaultMsg, threadID, messageID);
            }

            let amountStr = args[2];
            let amount = parseInt(amountStr);

            if (secondary === "deposit") {
                if (isNaN(amount) || amount <= 0) return api.sendMessage("❌ 𝖬𝗈𝗇𝗍𝖺𝗇𝗍 𝗂𝗇𝗏𝖺𝗅𝗂𝖽𝖾.", threadID, messageID);
                if (account.bankBalance < amount) return api.sendMessage("❌ 𝖥𝗈𝗇𝖽s 𝖻𝖺𝗇𝖼𝖺𝗂𝗋𝖾𝗌 𝗂𝗇𝗌𝗎𝖿𝖿𝗂𝗌𝖺𝗇𝗍𝗌 (𝗅'𝖺𝗋𝗀𝖾𝗇𝗍 𝖽𝗈𝗂𝗍 ê𝗍𝗋𝖾 𝖾𝗇 𝖻𝖺𝗇𝗊𝗎𝖾).", threadID, messageID);

                account.bankBalance -= amount;
                account.vaultBalance += amount;

                storage.logTransaction(account, "VAULT_IN", `Mise sous clé de ${fNum(amount)} Or.`);
                storage.saveUserBankProfile(senderID, account);
                return api.sendMessage(`🔐 **𝖢𝖮𝖥𝖥𝖱𝖤-𝖥𝖮𝖱𝖳 𝖬𝖨𝖲 𝖠 𝖩𝖮𝖴𝖱**\n**${fNum(amount)} 𝖮𝗋** 𝗌𝗈𝗇𝗍 𝗆𝖺𝗂𝗇𝗍𝖾𝗇𝖺𝗇𝗍 𝗌é𝖼𝗎𝗋𝗂𝗌é𝗌 𝖽𝖺𝗇𝗌 𝗏𝗈𝗍𝗋𝖾 𝖼𝗈𝖿𝖿𝗋𝖾-𝖿𝗈𝗋𝗍.`, threadID, messageID);
            }

            if (secondary === "withdraw") {
                if (isNaN(amount) || amount <= 0) return api.sendMessage("❌ 𝖬𝗈𝗇𝗍𝖺𝗇𝗍 𝗂𝗇𝗏𝖺𝗅𝗂𝖽𝖾.", threadID, messageID);
                if (account.vaultBalance < amount) return api.sendMessage("❌ 𝖵𝗈𝗍𝗋𝖾 𝖼𝗈𝖿𝖿𝗋𝖾-𝖿𝗈𝗋𝗍 𝗇𝖾 𝖼𝗈𝗇𝗍𝗂𝖾𝗇𝗍 𝗉𝖺𝗌 𝖼𝖾𝗍𝗍𝖾 𝗌𝗈𝗆𝗆𝖾.", threadID, messageID);

                account.vaultBalance -= amount;
                account.bankBalance += amount;

                storage.logTransaction(account, "VAULT_OUT", `Retrait de ${fNum(amount)} Or depuis le coffre.`);
                storage.saveUserBankProfile(senderID, account);
                return api.sendMessage(`🔓 **𝖱𝖤𝖳𝖱𝖸𝖨𝖳 𝖢𝖮𝖥𝖱𝖤-𝖥𝖮𝖱𝖳**\n**${fNum(amount)} 𝖮𝗋** 𝗈𝗇𝗍 é𝗍é 𝗋𝖾𝗉𝗅𝖺𝖿é𝗌 𝗏𝖾𝗋𝗌 𝗏𝗈𝗍𝗋𝖾 𝖼𝗈𝗆𝗉𝗍𝖾 𝖻𝖺𝗇𝖼𝖺𝗂𝗋𝖾 courant.`, threadID, messageID);
            }
        }

        // =========================================================================
        // 💳 CREDIT & INTEGRATION DE DETTES DYNAMIQUES
        // =========================================================================
        if (primary === "loan") {
            let amountToLoan = parseInt(args[1]);
            // Calcul du plafond maximum basé sur l'indice de crédit du joueur
            let maxLoanAllowed = Math.floor((account.creditScore / 500) * 250000);

            if (isNaN(amountToLoan) || amountToLoan <= 0) {
                return api.sendMessage(`💡 𝖴𝗌𝖺𝗀𝖾 : \`𝖻𝖺𝗇𝗄 𝗅𝗈𝖺𝗇 <𝗆𝗈𝗇𝗍𝖺𝗇𝗍>\` (𝖵𝗈𝗍𝗋𝖾 𝗅𝗂𝗆𝗂𝗍𝖾 : **${fNum(maxLoanAllowed)} 𝖮𝗋**)`, threadID, messageID);
            }
            if (account.loan.hasActiveLoan) return api.sendMessage("❌ 𝖵𝗈𝗎𝗌 𝖺𝗏𝖾𝗓 déjà 𝗎𝗇 𝖾𝗆𝗉𝗋𝗎𝗇𝗍 𝖺𝖼𝗍𝗂𝖿 𝗇𝗈𝗇 𝗋𝖾𝗆𝖻𝗈𝗎𝗋𝗌é.", threadID, messageID);
            if (amountToLoan > maxLoanAllowed) return api.sendMessage(`❌ 𝖣𝖾𝗆𝖺𝗇𝖽𝖾 𝗋𝖾𝗃𝖾𝗍é𝖾. 𝖵𝗈𝗍𝗋𝖾 𝗌𝖼𝗈𝗋𝖾 𝖽𝖾 𝖼𝗋é𝖽𝗂𝗍 𝖻𝖺𝗋è𝗆𝖾 𝗏𝗈𝗎𝗌 𝖺𝗎𝗍𝗈𝗋𝗂𝗌𝖾 un 𝗆𝖺𝗑𝗂𝗆𝗎𝗆 𝖽𝖾 **${fNum(maxLoanAllowed)} 𝖮𝗋**.`, threadID, messageID);

            // Calcul de la dette avec intérêts (15%)
            let debtWithInterest = Math.floor(amountToLoan * 1.15);

            account.loan = {
                hasActiveLoan: true,
                principal: amountToLoan,
                remainingDebt: debtWithInterest,
                dueDate: now + (24 * 60 * 60 * 1000 * 3), // Échéance virtuelle sous 3 jours
                lastPenaltyAt: now
            };

            account.bankBalance += amountToLoan;
            // Un emprunt baisse temporairement le score de risque
            account.creditScore = Math.max(300, account.creditScore - 15);

            storage.logTransaction(account, "LOAN", `Emprunt de ${fNum(amountToLoan)} Or avec intérêts.`);
            storage.saveUserBankProfile(senderID, account);

            return api.sendMessage(`✅ **𝖤𝖬𝖯𝖱𝖴𝖭𝖳 𝖠𝖢𝖢𝖮𝖱𝖣𝖤**\n💰 **${fNum(amountToLoan)} 𝖮𝗋** 𝗈𝗇𝗍 é𝗍é 𝗏𝖾𝗋𝗌é𝗌 𝗌𝗎𝗋 𝗏𝗈𝗍𝗋𝖾 𝖼𝗈𝗆𝗉𝗍𝖾 courant.\n⚠️ 𝖬𝗈𝗇𝗍𝖺𝗇𝗍 à 𝗋𝖾𝗆𝖻𝗈𝗎𝗋𝗌𝖾𝗋 : **${fNum(debtWithInterest)} 𝖮𝗋**.`, threadID, messageID);
        }

        if (primary === "repay") {
            if (!account.loan.hasActiveLoan) return api.sendMessage("❌ 𝖵𝗈𝗎𝗌 𝗇'𝖺𝗏𝖾𝗓 𝖺𝗎𝖼𝗎𝗇𝖾 𝖽𝖾𝗍𝗍𝖾 envers 𝗅𝖺 𝖻𝖺𝗇𝗊𝗎𝖾.", threadID, messageID);

            let amountStr = args[1];
            let amountToRepay = amountStr && amountStr.toLowerCase() === "all" ? account.loan.remainingDebt : parseInt(amountStr);

            if (isNaN(amountToRepay) || amountToRepay <= 0) return api.sendMessage("💡 𝖴𝗌𝖺𝗀𝖾 : `𝖻𝖺𝗇𝗄 𝗋𝖾𝗉𝖺𝗒 <𝗆𝗈𝗇𝗍𝖺𝗇𝗍|𝖺??𝗅>`", threadID, messageID);
            if (account.bankBalance < amountToRepay) return api.sendMessage("❌ 𝖥𝗈𝗇𝖽𝗌 𝗂𝗇𝗌𝗎𝖿𝖿𝗂𝗌𝖺𝗇𝗍𝗌 𝗌𝗎𝗋 𝗏𝗈𝗍𝗋𝖾 𝖼𝗈𝗆𝗉𝗍𝖾 𝖻𝖺𝗇𝖼𝖺𝗂𝗋𝖾 𝗉𝗈𝗎𝗋 𝖼𝖾 𝗏𝖾𝗋𝗌𝖾𝗆𝖾𝗇𝗍.", threadID, messageID);

            account.bankBalance -= amountToRepay;
            account.loan.remainingDebt -= amountToRepay;

            if (account.loan.remainingDebt <= 0) {
                account.loan.hasActiveLoan = false;
                account.loan.remainingDebt = 0;
                // Valorisation majeure du score de crédit suite au remboursement total
                account.creditScore = Math.min(850, account.creditScore + 45);
                storage.logTransaction(account, "LOAN_CLOSE", "Remboursement intégral de la dette.");
            } else {
                storage.logTransaction(account, "LOAN_REPAY", `Remboursement partiel : -${fNum(amountToRepay)} Or.`);
            }

            storage.saveUserBankProfile(senderID, account);
            return api.sendMessage(`✅ **𝖵𝖤𝖱𝖲𝖤𝖬𝖤𝖭𝖳 𝖤𝖭𝖱𝖤𝖦𝖨𝖲𝖳𝖱𝖤**\n📉 𝖵𝗈𝗍𝗋𝖾 𝖽𝖾𝗍𝗍𝖾 𝖺 é𝗍é 𝗋é𝖽𝗎𝗂𝗍𝖾. 𝖱𝖾𝗌𝗍𝖾 𝖽û : **${fNum(account.loan.remainingDebt)} 𝖮𝗋**.`, threadID, messageID);
        }

        if (primary === "debt") {
            if (!account.loan.hasActiveLoan) return api.sendMessage("🎉 **𝖵𝗈𝗎𝗌 𝗇'𝖺𝗏𝖾𝗓 𝖺𝗎𝖼𝗎𝗇𝖾 𝖽𝖾𝗍𝗍𝖾 𝖺𝖼𝗍𝗂𝗏𝖾.** 𝖵𝗈𝗍𝗋𝖾 𝗀𝖾𝗌𝗍𝗂𝗈𝗇 𝖾𝗌𝗍 𝖾𝗑𝖼𝖾𝗅𝗅𝖾𝗇𝗍𝖾.", threadID, messageID);
            
            let debtMsg = `💳 **𝖤𝖳𝖠𝖳 𝖣𝖤 𝖵𝖮𝖳𝖱𝖤 𝖢𝖱𝖤𝖣𝖨𝖳**\n\n`;
            debtMsg += `🔹 𝖣𝖾𝗍𝗍𝖾 𝖱𝖾𝗌𝗍𝖺𝗇𝗍𝖾 : **${fNum(account.loan.remainingDebt)} 𝖮𝗋**\n`;
            debtMsg += `⏳ É𝖼𝗁é𝖺𝗇𝖼𝖾 𝗏𝗂𝗋𝗍𝗎𝖾𝗅𝗅𝖾 : ${new Date(account.loan.dueDate).toLocaleDateString("fr-FR")}`;
            return api.sendMessage(debtMsg, threadID, messageID);
        }

        if (primary === "credit") {
            let status = "Médiocre";
            if (account.creditScore > 700) status = "Excellent";
            else if (account.creditScore > 600) status = "Bon";
            else if (account.creditScore > 450) status = "Stable";

            return api.sendMessage(`📊 **𝖢𝖮𝖭𝖥𝖨𝖠𝖭𝖢𝖤 𝖡𝖠𝖭𝖢𝖠𝖨𝖱𝖤**\n\n𝖵𝗈𝗍 r𝗋𝖾 𝗌𝖼𝗈𝗋𝖾 𝖽𝖾 𝖼𝗋é𝖽𝗂𝗍 𝖾𝗌𝗍 𝖽𝖾 : **${account.creditScore} 𝗉𝗍𝗌** [**${status}**]\n*(𝖴𝗇 𝗁𝖺𝗎𝗍 𝗌𝖼𝗈𝗋𝖾 𝗋é𝖽𝗎𝗂𝗍 𝗏𝗈𝗌 𝗍𝖺𝗎𝗑 𝖾𝗍 𝖺𝗎𝗀𝗆𝖾𝗇𝗍𝖾 𝗏𝗈𝗌 𝗉𝗅𝖺𝖿𝗈𝗇𝖽𝗌 𝖽'𝖾𝗆𝗉𝗋𝗎𝗇𝗍𝗌)*`, threadID, messageID);
        }

        // =========================================================================
        // 📆 RECOMPENSES PERIODIQUES (SYNERGIE AVEC L'ECONOMIE)
        // =========================================================================
        if (["daily", "weekly", "monthly"].includes(primary)) {
            let cooldownTime = primary === "daily" ? 24*60*60*1000 : primary === "weekly" ? 7*24*60*60*1000 : 30*24*60*60*1000;
            let stateKey = `${primary}State`;
            let lastClaim = account[stateKey]?.lastClaim || 0;

            if (now - lastClaim < cooldownTime) {
                let timeLeft = cooldownTime - (now - lastClaim);
                let hours = Math.floor(timeLeft / (1000 * 60 * 60));
                return api.sendMessage(`⏳ 𝖢𝗈𝗈𝗅𝖽𝗈𝗐𝗇 𝖺𝖼𝗍𝗂𝖿 ! 𝖱𝖾𝗏𝖾𝗇𝖾𝗓 𝖽𝖺𝗇𝗌 **${hours} 𝗁𝖾𝗎𝗋𝖾(𝗌)** 𝗉𝗈𝗎𝗋 ré𝖼𝗅𝖺𝗆𝖾𝗋 𝗏𝗈𝗍𝗋𝖾 𝗉𝗋𝗂𝗆𝖾 ${primary}.`, threadID, messageID);
            }

            // Calcul du bonus basé sur la fiabilité du score de crédit
            let baseBonus = primary === "daily" ? 15000 : primary === "weekly" ? 90000 : 500000;
            let creditMultiplier = account.creditScore / 500;
            let finalBonus = Math.floor(baseBonus * creditMultiplier);

            account[stateKey].lastClaim = now;
            account.bankBalance += finalBonus;

            storage.logTransaction(account, "INCOME", `Dotation ${primary} obtenue : +${fNum(finalBonus)} Or.`);
            storage.saveUserBankProfile(senderID, account);

            return api.sendMessage(`🎁 **𝖣𝖮𝖳𝖠𝖳𝖨𝖮𝖭 𝖤𝖭𝖢𝖠𝖨𝖲𝖲𝖤𝖤**\n💰 𝖵𝗈𝗍𝗋𝖾 𝗉𝗋𝗂𝗆𝖾 **${primary}** vous 𝖺𝗉𝗉𝗈𝗋𝗍𝖾 **+${fNum(finalBonus)} 𝖮𝗋** 𝖽𝗂𝗋𝖾𝖼𝗍𝖾𝗆𝖾𝗇𝗍 𝖺𝗃𝗈𝗎𝗍é𝗌 à 𝗏𝗈𝗍𝗋𝖾 𝖼𝗈𝗆𝗉𝗍𝖾 bancaire.`, threadID, messageID);
        }

        if (primary === "history") {
            if (!account.history || account.history.length === 0) return api.sendMessage("📭 𝖠𝗎𝖼𝗎𝗇𝖾 𝖺𝖼𝗍𝗂𝗏𝗂𝗍é 𝗋é𝖼𝖾𝗇𝗍𝖾 𝗌𝗎𝗋 𝗏𝗈𝗍𝗋𝖾 𝗋𝖾𝗅è𝗏𝖾 de compte.", threadID, messageID);

            let histMsg = `📜 **𝖱𝖤𝖫𝖤𝖵𝖤 𝖣𝖤 𝖢𝖮𝖬𝖯𝖳𝖤 : ${account.name.toUpperCase()}**\n\n`;
            account.history.forEach((log, index) => {
                let dateStr = new Date(log.timestamp).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
                histMsg += `${index + 1}. [${dateStr}] [${log.type}] ${log.message}\n`;
            });
            return api.sendMessage(histMsg, threadID, messageID);
        }

        // Passage de relais global pour l'implémentation de la Bourse, des Immobilisations et du PvP
        global.bankEngine.account = account;
        // Récupération et synchronisation du marché financier virtuel
        const market = storage.updateMarketPrices();

        // =========================================================================
        // 📈 SIMULATION BOURSIERE AVANCEE (STOCKS & CRYPTOS FLUCTUANTES)
        // =========================================================================
        if (primary === "invest") {
            let invMenu = `╭───────────────────────────────────────╮\n`;
            invMenu += `│ 📈 **𝖢𝖤𝖭𝖳𝖱𝖠𝖫𝖤 𝖣'𝖨𝖭𝖵𝖤𝖲𝖳𝖨𝖲𝖲𝖤𝖬𝖤𝖭𝖳**\n`;
            invMenu += `├───────────────────────────────────────┤\n`;
            invMenu += `│ Accédez aux marchés financiers virtuels :\n`;
            invMenu += `├───────────────────────────────────────┤\n`;
            invMenu += `│ 🔹 \`bank stocks list\` : Actions d'entreprises\n`;
            invMenu += `│ 🔹 \`bank crypto list\` : Marché crypto volatil\n`;
            invMenu += `│ 🔹 \`bank portfolio\`   : Vos actifs actuels\n`;
            invMenu += `╰───────────────────────────────────────╯`;
            return api.sendMessage(invMenu, threadID, messageID);
        }

        if (primary === "stocks" || primary === "crypto") {
            const isStock = primary === "stocks";
            const currentAssetList = isStock ? market.stocks : market.cryptos;

            // Sous-commande : Affichage de la feuille des marchés
            if (secondary === "list") {
                let mMsg = `📊 **𝖬𝖠𝖱𝖢𝖧𝖤 𝖥𝖨𝖢𝖳𝖨𝖥 𝖣𝖤𝖲 ${primary.toUpperCase()}**\n\n`;
                for (let assetId in currentAssetList) {
                    let asset = currentAssetList[assetId];
                    let trendIcon = asset.trend === "UP" ? "📈" : "📉";
                    mMsg += `🔹 **${asset.name}** [\`${asset.id}\`]\n`;
                    mMsg += `   Prix Unitaire : **${fNum(asset.price)} 𝖮𝗋**\n`;
                    mMsg += `   Tendance      : ${trendIcon} ${asset.trend}\n`;
                    if (isStock) mMsg += `   Stabilité     : *${asset.stability}*\n`;
                    mMsg += `────────────────────\n`;
                }
                return api.sendMessage(mMsg, threadID, messageID);
            }

            // Sous-commande : Achat d'Actifs
            if (secondary === "buy") {
                let assetId = args[2] ? args[2].toUpperCase() : null;
                let qty = parseInt(args[3]);

                if (!assetId || !currentAssetList[assetId] || isNaN(qty) || qty <= 0) {
                    return api.sendMessage(`💡 𝖴𝗌𝖺𝗀𝖾 : \`𝖻𝖺𝗇𝗄 ${primary} 𝖻𝗎𝗒 <𝗂𝖽_𝖺𝖼𝗍𝗂𝖿> <𝗊𝗎𝖺𝗇𝗍𝗂𝗍é>\``, threadID, messageID);
                }

                let totalCost = Math.floor(currentAssetList[assetId].price * qty);
                if (account.bankBalance < totalCost) {
                    return api.sendMessage(`❌ 𝖥𝗈𝗇𝖽𝗌 𝖻𝖺𝗇𝖼𝖺𝗂𝗋𝖾𝗌 𝗂𝗇𝗌𝗎𝖿𝖿𝗂𝗌𝖺𝗇𝗍𝗌. Il vous faut **${fNum(totalCost)} 𝖮𝗋** sur votre compte courant.`, threadID, messageID);
                }

                // Initialisation du registre utilisateur si premier achat
                if (!account.portfolio[primary]) account.portfolio[primary] = {};
                if (!account.portfolio[primary][assetId]) account.portfolio[primary][assetId] = { qty: 0, avgPrice: 0 };

                let currentHolding = account.portfolio[primary][assetId];
                
                // Calcul du prix moyen pondéré d'achat (Logique d'investissement réelle)
                let totalUnits = currentHolding.qty + qty;
                currentHolding.avgPrice = Math.floor(((currentHolding.qty * currentHolding.avgPrice) + totalCost) / totalUnits);
                currentHolding.qty = totalUnits;

                account.bankBalance -= totalCost;

                // Succès Premier Investissement
                if (!account.achievements.includes("𝖪𝗋𝖺𝖼𝗄 𝖡𝗈𝗎𝗋𝗌𝗂𝖾𝗋")) account.achievements.push("𝖪𝗋𝖺𝖼𝗄 𝖡𝗈𝗎𝗋𝗌𝗂𝖾𝗋");

                storage.logTransaction(account, "INVEST_BUY", `Achat de ${qty} unités de ${assetId} pour ${fNum(totalCost)} Or.`);
                storage.saveUserBankProfile(senderID, account);

                return api.sendMessage(`✅ **𝖮𝖱𝖣𝖱𝖤 𝖣'𝖠𝖢𝖧𝖠𝖳 𝖤𝖷𝖤𝖢𝖴𝖳𝖤**\nVous possédez maintenant **${currentHolding.qty}** unités de **${assetId}**.\nMontant débité : **-${fNum(totalCost)} 𝖮𝗋**.`, threadID, messageID);
            }

            // Sous-commande : Vente d'Actifs
            if (secondary === "sell") {
                let assetId = args[2] ? args[2].toUpperCase() : null;
                let qty = parseInt(args[3]);

                if (!assetId || !currentAssetList[assetId] || isNaN(qty) || qty <= 0) {
                    return api.sendMessage(`💡 𝖴𝗌𝖺𝗀𝖾 : \`𝖻𝖺𝗇𝗄 ${primary} 𝖻𝗎𝗒 <𝗂𝖽_𝖺𝖼𝗍𝗂𝖿> <𝗊𝗎𝖺𝗇𝗍𝗂𝗍é>\``, threadID, messageID);
                }

                let portfolioRef = account.portfolio[primary]?.[assetId];
                if (!portfolioRef || portfolioRef.qty < qty) {
                    return api.sendMessage(`❌ 𝖵𝗈𝗎𝗌 𝗇𝖾 𝗉𝗈𝗌𝗌é𝖽𝖾𝗓 𝗉𝖺𝗌 𝖺𝗌𝗌𝖾𝗓 𝖽'𝗎𝗇𝗂𝗍é𝗌 de ${assetId} dans votre portefeuille.`, threadID, messageID);
                }

                let payout = Math.floor(currentAssetList[assetId].price * qty);
                
                // Mutation du portefeuille
                portfolioRef.qty -= qty;
                account.bankBalance += payout;

                // Nettoyage de l'objet vide pour optimisation JSON
                if (portfolioRef.qty === 0) delete account.portfolio[primary][assetId];

                storage.logTransaction(account, "INVEST_SELL", `Vente de ${qty} unités de ${assetId} pour +${fNum(payout)} Or.`);
                storage.saveUserBankProfile(senderID, account);

                return api.sendMessage(`✅ **𝖮𝖱𝖣𝖱𝖤 𝖣𝖤 𝖵𝖤𝖭𝖳𝖤 𝖤𝖷𝖤𝖢𝖴𝖳𝖤**\nVous avez vendu **${qty}** unités de **${assetId}** au prix du marché.\nCompte bancaire crédité : **+${fNum(payout)} 𝖮𝗋**.`, threadID, messageID);
            }
        }

        // =========================================================================
        // 💼 AFFICHAGE DU PORTEFEUILLE DE PLACEMENTS
        // =========================================================================
        if (primary === "portfolio") {
            let pMsg = `💼 **𝖯𝖮𝖱𝖳𝖤𝖥𝖤𝖴𝖨𝖫𝖫𝖤 𝖣'𝖠𝖢𝖳𝖨𝖥𝖲 𝖥𝖨𝖢𝖳𝖨𝖥𝖲**\n\n`;
            let totalValue = 0;

            // Analyse de la branche Actions
            pMsg += `📈 **𝖠𝖼𝗍𝗂𝗈𝗇𝗌 𝖡𝗈𝗎𝗋𝗌𝗂è𝗋𝖾𝗌 :**\n`;
            let hasStocks = false;
            if (account.portfolio.stocks) {
                for (let id in account.portfolio.stocks) {
                    let qty = account.portfolio.stocks[id].qty;
                    let currentPrice = market.stocks[id]?.price || 0;
                    let assetVal = qty * currentPrice;
                    totalValue += assetVal;
                    hasStocks = true;
                    pMsg += `  • **${id}** : ${qty} unités (Valeur: ${fNum(assetVal)} Or)\n`;
                }
            }
            if (!hasStocks) pMsg += `  *Aucun titre boursier en votre possession.*\n`;

            // Analyse de la branche Crypto
            pMsg += `\n🪙 **𝖢𝗋𝗒𝗉𝗍𝗈𝗆𝗈𝗇𝗇𝖺𝗂𝖾𝗌 :**\n`;
            let hasCrypto = false;
            if (account.portfolio.crypto) {
                for (let id in account.portfolio.crypto) {
                    let qty = account.portfolio.crypto[id].qty;
                    let currentPrice = market.cryptos[id]?.price || 0;
                    let assetVal = qty * currentPrice;
                    totalValue += assetVal;
                    hasCrypto = true;
                    pMsg += `  • **${id}** : ${qty} unités (Valeur: ${fNum(assetVal)} Or)\n`;
                }
            }
            if (!hasCrypto) pMsg += `  *Aucun crypto-actif en votre possession.*\n`;

            pMsg += `\n📊 Estimation totale du portefeuille : **${fNum(totalValue)} 𝖮𝗋**`;
            return api.sendMessage(pMsg, threadID, messageID);
        }

        // Transmission globale du contexte mis à jour
        global.bankEngine.account = account;
        // =========================================================================
        // 🏢 SECTION 6 : EMPIRE COMMERCIAL (REVENUS PASSIFS)
        // =========================================================================
        const BIZ_PRESETS = {
            "b1": { id: "b1", name: "𝖲𝗍𝖺𝗇𝖽 𝖽𝖾 𝗋𝗎𝖾 𝖿𝗂𝖼𝗍𝗂𝖿", price: 50000, revenue: 800 },
            "b1": { id: "b1", name: "𝖲𝗍𝖺𝗇𝖽 𝖽𝖾 𝗋𝗎𝖾 𝖿𝗂𝖼𝗍𝗂𝖿", price: 50000, revenue: 800 },
            "b2": { id: "b2", name: "𝖢𝖺𝖿é 𝖦𝖺𝗆𝗂𝗇𝗀 𝖱𝖯𝖦", price: 150000, revenue: 2500 },
            "b3": { id: "b3", name: "𝖱𝖾𝗌𝗍𝖺𝗎𝗋𝖺𝗇𝗍 𝟧 é𝗍𝗈𝗂𝗅𝖾𝗌", price: 450000, revenue: 7500 },
            "b4": { id: "b4", name: "𝖲𝗍𝗎𝖽𝗂𝗈 𝖽𝖾 𝖩𝖾𝗎𝗑 𝖵𝗂𝗋𝗍𝗎𝖾𝗅𝗌", price: 1200000, revenue: 22000 },
            "b5": { id: "b5", name: "𝖢𝖺𝗌𝗂𝗇𝗈 𝖧ô𝗍𝖾𝗅 𝖽𝖾 𝖫𝗎𝗑𝖾", price: 3500000, revenue: 65000 },
            "b6": { id: "b6", name: "𝖡𝗈𝗎𝗍𝗂𝗊𝗎𝖾 𝖽𝖾 𝖫𝗎𝗑𝖾", price: 6000000, revenue: 110000 },
            "b7": { id: "b7", name: "𝖢𝖾𝗇𝗍𝗋𝖾 𝖢𝗈𝗆𝗆𝖾𝗋𝖼𝗂𝖺𝗅 𝖱𝗈𝗒𝖺𝗅", price: 9500000, revenue: 180000 },
            "b8": { id: "b8", name: "𝖲𝗍𝗎𝖽𝗂𝗈 𝖽’𝖠𝗇𝗂𝗆𝖺𝗍𝗂𝗈𝗇 𝖯𝗋𝗈", price: 15000000, revenue: 280000 },
            "b9": { id: "b9", name: "𝖧ô𝗍𝖾𝗅 𝖱𝖾𝗌𝗈𝗋𝗍 𝖣𝖾𝗅𝗎𝗑𝖾", price: 23000000, revenue: 420000 },
            "b10": { id: "b10", name: "𝖯𝖺𝗋𝖼 𝖽’𝖠𝗍𝗍𝗋𝖺𝖼𝗍𝗂𝗈𝗇𝗌 𝖱𝖯𝖦", price: 35000000, revenue: 650000 },
            "b11": { id: "b11", name: "𝖢𝗁𝖺î𝗇𝖾 𝖽𝖾 𝖱𝖾𝗌𝗍𝖺𝗎𝗋𝖺𝗇𝗍𝗌", price: 50000000, revenue: 900000 },
            "b12": { id: "b12", name: "𝖳𝗈𝗎𝗋 𝖽𝖾 𝖡𝗎𝗋𝖾𝖺𝗎𝗑 𝖯𝗋𝗂𝗆𝖾", price: 70000000, revenue: 1300000 },
            "b13": { id: "b13", name: "𝖯𝗅𝖺𝗍𝖾𝖿𝗈𝗋𝗆𝖾 𝖲𝗍𝗋𝖾𝖺𝗆𝗂𝗇𝗀 𝖱𝖯𝖦", price: 95000000, revenue: 1800000 },
            "b14": { id: "b14", name: "𝖤𝗆𝗉𝗂𝗋𝖾 𝖬é𝖽𝗂𝖺𝗍𝗂𝗊𝗎𝖾", price: 130000000, revenue: 2500000 },
            "b15": { id: "b15", name: "𝖢𝗈𝗆𝗉𝖺𝗀𝗇𝗂𝖾 𝖠é𝗋𝗂𝖾𝗇𝗇𝖾 𝖯𝗋𝗂𝗏é𝖾", price: 180000000, revenue: 3500000 },
            "b16": { id: "b16", name: "𝖦𝗋𝗈𝗎𝗉𝖾 𝖧ô𝗍𝖾𝗅𝗂𝖾𝗋 𝖨𝗆𝗉é𝗋𝗂𝖺𝗅", price: 250000000, revenue: 4800000 },
            "b17": { id: "b17", name: "𝖢𝗈𝗇𝗀𝗅𝗈𝗆é𝗋𝖺𝗍 𝖳𝖾𝖼𝗁 𝖣𝗂𝗏𝗂𝗇", price: 340000000, revenue: 6500000 },
            "b18": { id: "b18", name: "𝖡𝖺𝗇𝗊𝗎𝖾 𝖢𝖾𝗇𝗍𝗋𝖺𝗅𝖾 𝖯𝗋𝗂𝗏é𝖾", price: 460000000, revenue: 8500000 },
            "b19": { id: "b19", name: "𝖤𝗆𝗉𝗂𝗋𝖾 𝖢𝗈𝗆𝗆𝖾𝗋𝖼𝗂𝖺𝗅 𝖫é𝗀𝖾𝗇𝖽𝖺𝗂𝗋𝖾", price: 620000000, revenue: 11500000 },
            "b20": { id: "b20", name: "𝖬é𝗀𝖺𝖢𝗈𝗋𝗉 𝖴𝗇𝗂𝗏𝖾𝗋𝗌𝖾𝗅𝗅𝖾", price: 850000000, revenue: 15500000 }
        };

        if (primary === "business") {
            if (!secondary || secondary === "list") {
                let bMsg = `🏢 **𝖬𝖠𝖱𝖢𝖧𝖤 𝖣𝖤𝖲 𝖤𝖭𝖳𝖱𝖤𝖯𝖱𝖨𝖲𝖤𝖲 𝖥𝖨𝖢𝖳𝖨𝖵𝖤𝖲**\n\n`;
                for (let id in BIZ_PRESETS) {
                    let biz = BIZ_PRESETS[id];
                    let ownedLevel = account.businesses[id]?.level || 0;
                    bMsg += `🔹 **${biz.name}** [\`${biz.id}\`]\n`;
                    bMsg += `   Coût d'achat : **${fNum(biz.price)} 𝖮𝗋**\n`;
                    bMsg += `   Revenu de base : **+${fNum(biz.revenue)} 𝖮𝗋 /cycle**\n`;
                    bMsg += `   Statut : ${ownedLevel > 0 ? `Possédé (Niveau ${ownedLevel})` : "*Non possédé*"}\n`;
                    bMsg += `────────────────────\n`;
                }
                bMsg += `💡 Commands : \`bank business buy <id>\` | \`bank business upgrade <id>\``;
                return api.sendMessage(bMsg, threadID, messageID);
            }

            if (secondary === "buy") {
                let bizId = args[2]?.toLowerCase();
                if (!bizId || !BIZ_PRESETS[bizId]) return api.sendMessage("❌ 𝖨𝖣 𝖽'𝖾𝗇𝗍𝗋𝖾𝗉𝗋𝗂𝗌𝖾 𝗂𝗇𝗏𝖺𝗅𝗂𝖽𝖾.", threadID, messageID);
                if (account.businesses[bizId]) return api.sendMessage("❌ 𝖵𝗈𝗎𝗌 𝗉𝗈𝗌𝗌é𝖽𝖾𝗓 déjà 𝖼𝖾𝗍𝗍𝖾 𝗂𝗇𝖿𝗋𝖺𝗌𝗍𝗋𝗎𝖼𝗍𝗎𝗋𝖾.", threadID, messageID);

                let cost = BIZ_PRESETS[bizId].price;
                if (account.bankBalance < cost) return api.sendMessage(`❌ 𝖲𝗈𝗅𝖽𝖾 𝗂𝗇𝗌𝗎𝖿𝖿𝗂𝗌𝖺𝗇𝗍 𝖾𝗇 𝖻𝖺𝗇𝗊𝗎𝖾. Il requis **${fNum(cost)} 𝖮𝗋**.`, threadID, messageID);

                account.bankBalance -= cost;
                account.businesses[bizId] = { id: bizId, level: 1, lastCollected: now };

                if (!account.achievements.includes("𝖢𝖺𝗉𝗂𝗍𝖺𝗅𝗂𝗌𝗍𝖾")) account.achievements.push("𝖢𝖺𝗉𝗂𝗍𝖺𝗅𝗂𝗌𝗍𝖾");

                storage.logTransaction(account, "BIZ_BUY", `Achat de l'entreprise : ${BIZ_PRESETS[bizId].name}.`);
                storage.saveUserBankProfile(senderID, account);

                return api.sendMessage(`✅ **𝖤𝖭𝖳𝖱𝖤𝖯𝖱𝖨𝖲𝖤 𝖠𝖢𝖧𝖤𝖳𝖤𝖤**\nVous êtes officiellement propriétaire de : **${BIZ_PRESETS[bizId].name}**.`, threadID, messageID);
            }

            if (secondary === "upgrade") {
                let bizId = args[2]?.toLowerCase();
                if (!bizId || !account.businesses[bizId]) return api.sendMessage("❌ 𝖵𝗈𝗎𝗌 𝗇𝖾 𝗉𝗈𝗌𝗌é𝖽𝖾𝗓 𝗉𝖺𝗌 𝖼𝖾 𝖻𝗎𝗌𝗂𝗇𝖾𝗌𝗌.", threadID, messageID);

                let currentLevel = account.businesses[bizId].level;
                if (currentLevel >= 5) return api.sendMessage("❌ 𝖢𝖾𝗍𝗍𝖾 𝖾𝗇𝗍𝗋𝖾𝗉𝗋𝗂𝗌𝖾 𝖺 𝖺𝗍𝗍𝖾𝗂𝗇𝗍 𝗌𝗈𝗇 𝗇𝗂𝗏𝖾𝖺𝗎 𝗆𝖺𝗑𝗂𝗆𝗎𝗆 (𝟧).", threadID, messageID);

                let upgradeCost = Math.floor(BIZ_PRESETS[bizId].price * 0.6 * currentLevel);
                if (account.bankBalance < upgradeCost) return api.sendMessage(`❌ 𝖥𝗈𝗇𝖽𝗌 𝗂𝗇𝗌𝗎𝖿𝖿𝗂𝗌𝖺𝗇𝗍𝗌 𝖾𝗇 𝖻𝖺𝗇𝗊𝗎𝖾. Amélioration requiert **${fNum(upgradeCost)} 𝖮𝗋**.`, threadID, messageID);

                account.bankBalance -= upgradeCost;
                account.businesses[bizId].level += 1;

                storage.logTransaction(account, "BIZ_UPGRADE", `Mise à niveau de ${BIZ_PRESETS[bizId].name} au niveau ${currentLevel + 1}.`);
                storage.saveUserBankProfile(senderID, account);

                return api.sendMessage(`✅ **𝖡𝖴𝖲𝖨𝖭𝖤𝖲𝖲 𝖠𝖬𝖤𝖫𝖨𝖮𝖱𝖤**\n**${BIZ_PRESETS[bizId].name}** passe au niveau **${currentLevel + 1}**.\nVos bénéfices par cycle augmentent.`, threadID, messageID);
            }

            if (secondary === "collect") {
                let totalCollected = 0;
                let minCooldown = 4 * 60 * 60 * 1000; // Cooldown fictif de 4h

                for (let id in account.businesses) {
                    let biz = account.businesses[id];
                    if (now - biz.lastCollected >= minCooldown) {
                        let cycles = Math.min(6, Math.floor((now - biz.lastCollected) / minCooldown)); // Limite stockage à 6 cycles max
                        totalCollected += BIZ_PRESETS[id].revenue * biz.level * cycles;
                        biz.lastCollected = now;
                    }
                }

                if (totalCollected === 0) return api.sendMessage("⏳ 𝖵𝗈𝗌 𝖾𝗇𝗍𝗋𝖾𝗉𝗋𝗂𝗌𝖾𝗌 𝗇'𝗈𝗇𝗍 𝗉𝖺𝗌 𝖾𝗇𝖼𝗈𝗋𝖾 généré 𝖺𝗌𝗌𝖾𝗓 𝖽𝖾 𝗉𝗋𝗈𝖿𝗂𝗍𝗌. Réessayez 𝗉𝗅𝗎𝗌 𝗍𝖺𝗋𝖽.", threadID, messageID);

                account.bankBalance += totalCollected;
                account.totalEarnedFromBusiness += totalCollected;

                storage.logTransaction(account, "BIZ_COLLECT", `Récolte des profits commerciaux : +${fNum(totalCollected)} Or.`);
                storage.saveUserBankProfile(senderID, account);

                return api.sendMessage(`💸 **𝖱𝖤𝖢𝖮𝖫𝖳𝖤 𝖢𝖮𝖬𝖬𝖤𝖱𝖢𝖨𝖠𝖫𝖤**\nVos infrastructures fictives rapportent **+${fNum(totalCollected)} 𝖮𝗋** sur votre compte courant.`, threadID, messageID);
            }
        }

        // =========================================================================
        // 🏠 SECTION 7 : PARC IMMOBILIER (LOYERS)
        // =========================================================================
        const PROP_PRESETS = {
            "p1": { id: "p1", name: "𝖲𝗍𝗎𝖽𝗂𝗈 É𝗍𝗎𝖽𝗂𝖺𝗇𝗍 𝖱𝖯𝖦", price: 80000, rent: 1500 },
            "p2": { id: "p2", name: "𝖠𝗉𝗉𝖺𝗋𝗍𝖾𝗆𝖾𝗇𝗍 𝖢𝖾𝗇𝗍𝗋𝖺𝗅", price: 220000, rent: 4200 },
            "p3": { id: "p3", name: "𝖵𝗂𝗅𝗅𝖺 𝖺𝗏𝖾𝖼 𝖯𝗂𝗌𝖼𝗂𝗇𝖾", price: 600000, rent: 11000 },
            "p4": { id: "p4", name: "𝖨𝗆𝗆𝖾𝗎𝖻𝗅𝖾 𝖽𝖾 𝖱é𝗌𝗂𝖽𝖾𝗇𝖼𝖾𝗌", price: 1800000, rent: 35000 },
            "p5": { id: "p5", name: "Î𝗅𝖾 𝖯𝗋𝗂𝗏é𝖾 𝖯𝗋𝖾𝗆𝗂𝗎𝗆", price: 6000000, rent: 120000 },
            "p6": { id: "p6", name: "𝖬𝖺𝗂𝗌𝗈𝗇 𝖽𝖾 𝖰𝗎𝖺𝗋𝗍𝗂𝖾𝗋", price: 9500000, rent: 185000 },
            "p7": { id: "p7", name: "𝖯𝖾𝗇𝗍𝗁𝗈𝗎𝗌𝖾 𝖫𝗎𝗑𝖾", price: 14000000, rent: 270000 },
            "p8": { id: "p8", name: "𝖣𝗈𝗆𝖺𝗂𝗇𝖾 𝖥𝖺𝗆𝗂𝗅𝗂𝖺𝗅", price: 20000000, rent: 380000 },
            "p9": { id: "p9", name: "𝖢𝗁â𝗍𝖾𝖺𝗎 𝖱𝗈𝗒𝖺𝗅", price: 28000000, rent: 520000 },
            "p10": { id: "p10", name: "𝖧ô𝗍𝖾𝗅 𝖯𝖺𝗋𝗍𝗂𝖼𝗎𝗅𝗂𝖾𝗋", price: 38000000, rent: 700000 },
            "p11": { id: "p11", name: "𝖱é𝗌𝗂𝖽𝖾𝗇𝖼𝖾 𝖲é𝖼𝗎𝗋𝗂𝗌é𝖾 𝖣𝖾𝗅𝗎𝗑𝖾", price: 52000000, rent: 950000 },
            "p12": { id: "p12", name: "𝖯𝖺𝗅𝖺𝗂𝗌 𝖴𝗋𝖻𝖺𝗂𝗇", price: 70000000, rent: 1300000 },
            "p13": { id: "p13", name: "𝖳𝗈𝗎𝗋 𝖱é𝗌𝗂𝖽𝖾𝗇𝗍𝗂𝖾𝗅𝗅𝖾", price: 95000000, rent: 1750000 },
            "p14": { id: "p14", name: "𝖣𝗈𝗆𝖺𝗂𝗇𝖾 𝖭𝗈𝖻𝗅𝖾", price: 130000000, rent: 2400000 },
            "p15": { id: "p15", name: "𝖢𝗂𝗍é 𝖯𝗋𝗂𝗏é𝖾 𝖱𝖯𝖦", price: 180000000, rent: 3200000 },
            "p16": { id: "p16", name: "𝖱𝖾𝗌𝗈𝗋𝗍 𝖲𝗎𝗉𝗋ê𝗆𝖾", price: 250000000, rent: 4500000 },
            "p17": { id: "p17", name: "𝖤𝗆𝗉𝗂𝗋𝖾 𝖨𝗆𝗆𝗈𝖻𝗂𝗅𝗂𝖾𝗋", price: 340000000, rent: 6000000 },
            "p18": { id: "p18", name: "𝖨̂𝗅𝖾 𝖣𝗈𝗋é𝖾 𝖣𝗎 𝖬𝗂𝗅𝗅𝗂𝖺𝗋𝖽𝖺𝗂𝗋𝖾", price: 460000000, rent: 8200000 },
            "p19": { id: "p19", name: "𝖯𝖺𝗅𝖺𝗂𝗌 𝖨𝗆𝗉é𝗋𝗂𝖺𝗅", price: 620000000, rent: 11000000 },
            "p20": { id: "p20", name: "𝖬é𝗍𝗋𝗈𝗉𝗈𝗅𝖾 𝖯𝗋𝗂𝗏é𝖾 𝖫é𝗀𝖾𝗇𝖽𝖺𝗂𝗋𝖾", price: 850000000, rent: 15000000 }
        };

        if (primary === "property") {
            if (!secondary || secondary === "list") {
                let pList = `🏠 **𝖠𝖦𝖤𝖭𝖢𝖤 𝖨𝖬𝖬𝖮𝖡𝖨𝖫𝖨𝖤𝖱𝖤 𝖵𝖨𝖱𝖳𝖴𝖤𝖫𝖫𝖤**\n\n`;
                for (let id in PROP_PRESETS) {
                    let prop = PROP_PRESETS[id];
                    let qtyOwned = account.properties[id]?.qty || 0;
                    pList += `🔹 **${prop.name}** [\`${prop.id}\`]\n`;
                    pList += `   Prix unitaire : **${fNum(prop.price)} 𝖮𝗋**\n`;
                    pList += `   Loyers générés : **+${fNum(prop.rent)} 𝖮𝗋 /cycle**\n`;
                    pList += `   Quantité en possession : **${qtyOwned}**\n`;
                    pList += `────────────────────\n`;
                }
                pList += `💡 Commands : \`bank property buy <id>\` | \`bank property sell <id>\``;
                return api.sendMessage(pList, threadID, messageID);
            }

            if (secondary === "buy") {
                let propId = args[2]?.toLowerCase();
                if (!propId || !PROP_PRESETS[propId]) return api.sendMessage("❌ 𝖨𝖣 𝗂𝗆𝗆𝗈𝖻𝗂𝗅𝗂𝖾𝗋 𝗂𝗇𝗏𝖺𝗅𝗂𝖽𝖾.", threadID, messageID);

                let cost = PROP_PRESETS[propId].price;
                if (account.bankBalance < cost) return api.sendMessage(`❌ 𝖲𝗈𝗅𝖽𝖾 𝗂𝗇𝗌𝗎𝖿𝖿𝗂𝗌𝖺𝗇𝗍 𝖾𝗇 𝖻𝖺𝗇𝗊𝗎𝖾. Achat requiert **${fNum(cost)} 𝖮𝗋**.`, threadID, messageID);

                account.bankBalance -= cost;

                if (!account.properties[propId]) {
                    account.properties[propId] = { id: propId, qty: 0, lastCollected: now };
                }
                account.properties[propId].qty += 1;

                storage.logTransaction(account, "PROP_BUY", `Acquisition immobilière : ${PROP_PRESETS[propId].name}.`);
                storage.saveUserBankProfile(senderID, account);

                return api.sendMessage(`✅ **𝖠𝖢𝖰𝖴𝖨𝖲𝖨𝖳𝖨𝖮𝖭 𝖱𝖤𝖴𝖲𝖲𝖨𝖤**\nVous ajoutez un(e) **${PROP_PRESETS[propId].name}** à votre patrimoine.`, threadID, messageID);
            }

            if (secondary === "sell") {
                let propId = args[2]?.toLowerCase();
                if (!propId || !account.properties[propId] || account.properties[propId].qty <= 0) {
                    return api.sendMessage("❌ 𝖵𝗈𝗎𝗌 𝗇𝖾 𝗉𝗈𝗌𝗌é𝖽𝖾𝗓 𝖺𝗎𝖼𝗎𝗇 𝖻𝗂𝖾𝗇 correspondant.", threadID, messageID);
                }

                // Revend à 75% du prix neuf (Perte de valeur d'usage)
                let refund = Math.floor(PROP_PRESETS[propId].price * 0.75);

                account.properties[propId].qty -= 1;
                account.bankBalance += refund;

                if (account.properties[propId].qty === 0) delete account.properties[propId];

                storage.logTransaction(account, "PROP_SELL", `Vente d'une propriété : ${PROP_PRESETS[propId].name}.`);
                storage.saveUserBankProfile(senderID, account);

                return api.sendMessage(`✅ **𝖡𝖨𝖤𝖭 𝖵𝖤𝖭𝖣𝖴**\nPropriété cédée au marché immobilier virtuel pour **+${fNum(refund)} 𝖮𝗋** sur votre compte.`, threadID, messageID);
            }
        }

        if (primary === "rent") {
            let totalRent = 0;
            let rentCooldown = 6 * 60 * 60 * 1000; // Cycle de loyer (6 heures)

            for (let id in account.properties) {
                let prop = account.properties[id];
                if (now - prop.lastCollected >= rentCooldown) {
                    let cycles = Math.min(4, Math.floor((now - prop.lastCollected) / rentCooldown)); // Maximum 4 cycles stockés
                    totalRent += PROP_PRESETS[id].rent * prop.qty * cycles;
                    prop.lastCollected = now;
                }
            }

            if (totalRent === 0) return api.sendMessage("⏳ 𝖠𝗎𝖼𝗎𝗇 𝗅𝗈𝗒𝖾𝗋 𝗇'𝖾𝗌𝗍 𝖽𝗂𝗌𝗉𝗈𝗇𝗂𝖻𝗅𝖾 à 𝗅𝖺 𝖼𝗈𝗅𝗅𝖾𝖼𝗍𝖾 𝗉𝗈𝗎𝗋 𝗅𝖾 𝗆𝗈𝗆𝖾𝗇𝗍.", threadID, messageID);

            account.bankBalance += totalRent;
            account.totalEarnedFromRent += totalRent;

            storage.logTransaction(account, "PROP_RENT", `Perception des loyers : +${fNum(totalRent)} Or.`);
            storage.saveUserBankProfile(senderID, account);

            return api.sendMessage(`🏠 **𝖢𝖮𝖫𝖫𝖤𝖢𝖳𝖤 𝖣𝖤𝖲 𝖫𝖮𝖴𝖤𝖱𝖲**\nVotre parc immobilier fictif génère **+${fNum(totalRent)} 𝖮𝗋** de revenus passifs fonciers.`, threadID, messageID);
        }

        // Transmission globale du contexte mis à jour
        global.bankEngine.account = account;
        // =========================================================================
        // 🏴‍☠️ SECTION 8 : "BANK ROB" — MÉCANIQUE PvP ÉCONOMIQUE FICTIVE
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

            if (!targetID) return api.sendMessage("💡 𝖴𝗌𝖺𝗀𝖾 : 𝖬𝖾𝗇𝗍𝗂𝗈𝗇𝗇𝖾𝗓 𝗎𝗇 𝗃𝗈𝗎𝖾𝗎𝗋 𝗈𝗎 𝗋𝖾𝗉𝗈𝗇𝖽𝖾𝗓 à 𝗌𝗈𝗇 𝗆𝖾𝗌𝗌𝖺𝗀𝖾 : `𝖻𝖺𝗇𝗄 𝗋𝗈𝖻 <@𝗎𝗌𝖾rer>`", threadID, messageID);
            if (targetID === senderID) return api.sendMessage("❌ 𝖨𝗆𝗉𝗈𝗌𝗌𝗂𝖻𝗅𝖾 𝖽𝖾 𝗏𝗈𝗎𝗌 𝗏𝗈𝗅𝖾𝗋 𝗏𝗈𝗎𝗌-𝗆ê𝗆𝖾.", threadID, messageID);

            // Cooldown de 12 heures pour l'attaquant
            const robCooldown = 12 * 60 * 60 * 1000;
            let lastRob = account.robberyState?.lastRobAt || 0;
            if (now - lastRob < robCooldown) {
                let hoursLeft = Math.ceil((robCooldown - (now - lastRob)) / (1000 * 60 * 60));
                return api.sendMessage(`⏳ 𝖵𝗈𝗌 𝖼𝗈𝗇𝗍𝖺𝖼𝗍𝗌 𝖽𝖺𝗇𝗌 𝗅'𝗈𝗆𝖻𝗋𝖾 𝗌𝗈𝗇𝗍 𝗈𝖼𝖼𝗎𝗉é𝗌. 𝖱𝖾𝗏𝖾𝗇𝖾𝗓 𝖽𝖺𝗇𝗌 **${hoursLeft} 𝗁𝖾𝗎𝗋𝖾(𝗌)**.`, threadID, messageID);
            }

            // Récupération de la cible
            const targetName = global.data?.allUserData?.[targetID]?.name || `Cible #${targetID.slice(-4)}`;
            let targetCash = global.data && global.data.allUserData?.[targetID] ? (global.data.allUserData[targetID].money || 0) : 0;
            const targetAccount = storage.getUserBankProfile(targetID, targetName);

            // Anti-abus : Vérification des protections et des soldes minimums
            if (now < (targetAccount.robberyState?.shieldUntil || 0)) {
                return api.sendMessage(`🛡️ **𝖠𝖳𝖳𝖠𝖰𝖴𝖤 𝖡𝖫𝖮𝖰𝖴𝖤𝖤**\n**${targetName}** possède un bouclier actif suite à un récent incident fictif.`, threadID, messageID);
            }
            if (targetCash < 5000) {
                return api.sendMessage("❌ **𝖢𝖨𝖡𝖫𝖤 𝖨𝖭𝖳𝖤𝖱𝖤𝖲𝖲𝖠𝖭𝖳𝖤**\n𝖢𝖾𝗍 𝗎𝗍𝗂𝗅𝗂𝗌𝖺𝗍𝖾𝗎𝗋 𝖾𝗌𝗍 𝗋𝗎𝗂𝗇é. Sa fortune en poche est trop basse pour mériter une opération.", threadID, messageID);
            }
            if (walletCash < 2500) {
                return api.sendMessage("❌ 𝖨𝗅 𝗏𝗈𝗎𝗌 𝖿𝖺𝗎𝗍 𝖺𝗎 𝗆𝗈𝗂𝗇𝗌 **𝟤 𝟧𝟢𝟢 𝖮𝗋** 𝖾𝗇 liquide pour financer les frais de l'opération.", threadID, messageID);
            }

            account.robberyState.lastRobAt = now;
            account.robberyState.lastRobTarget = targetID;

            // Détermination des probabilités (Équilibre MMORPG : 45% de réussite)
            let success = Math.random() < 0.45;

            if (success) {
                // Vol d'une fraction aléatoire du Cash de la cible (entre 10% et 25%)
                let stealPercent = 0.10 + (Math.random() * 0.15);
                let stolenAmount = Math.floor(targetCash * stealPercent);

                // Application d'un abattement si la cible possède des réserves dans le Vault
                if (targetAccount.vaultBalance > 1000000) {
                    stolenAmount = Math.floor(stolenAmount * 0.85); // 15% de pertes en moins grâce au coffre
                }

                targetCash -= stolenAmount;
                walletCash += stolenAmount;

                account.robberyState.robSuccess += 1;
                account.totalStolen += stolenAmount;
                targetAccount.totalLostToRob += stolenAmount;
                
                // Activation d'un bouclier temporaire de 2 heures pour la victime
                targetAccount.robberyState.shieldUntil = now + (2 * 60 * 60 * 1000);

                if (account.robberyState.robSuccess >= 5 && !account.achievements.includes("𝖮𝗆𝖻𝗋𝖾 𝖤𝗅𝗎𝗌𝗂𝗏𝖾")) {
                    account.achievements.push("𝖮𝗆𝖻𝗋𝖾 𝖤𝗅𝗎𝗌𝗂𝗏𝖾");
                }

                syncWalletCash(senderID, walletCash);
                syncWalletCash(targetID, targetCash);

                storage.logTransaction(account, "ROB_SUCCESS", `Infiltration réussie chez ${targetName} : +${fNum(stolenAmount)} Or.`);
                storage.logTransaction(targetAccount, "ROB_VICTIM", `Dépouillé par ${account.name} : -${fNum(stolenAmount)} Or. Bouclier activé.`);

                storage.saveUserBankProfile(senderID, account);
                storage.saveUserBankProfile(targetID, targetAccount);

                return api.sendMessage(`🏴‍☠️ **𝖨𝖭𝖥𝖨𝖫𝖳𝖱𝖠𝖳𝖨𝖮𝖭 𝖱𝖤𝖴𝖲𝖲𝖨𝖤**\nVous surprenez les gardes de **${targetName}** et dérobez **+${fNum(stolenAmount)} 𝖮𝗋** dans son portefeuille virtuel.`, threadID, messageID);
            } else {
                // Pénalité financière fixe payée aux forces de sécurité de la cible
                let penalty = 5000;
                walletCash = Math.max(0, walletCash - penalty);
                targetCash += penalty;

                account.robberyState.robFail += 1;
                account.creditScore = Math.max(300, account.creditScore - 30); // L'échec dégrade le score de confiance

                syncWalletCash(senderID, walletCash);
                syncWalletCash(targetID, targetCash);

                storage.logTransaction(account, "ROB_FAIL", `Échec du raid chez ${targetName}. Amende de ${fNum(penalty)} Or.`);
                storage.logTransaction(targetAccount, "ROB_DEFEND", `Les systèmes de sécurité ont intercepté ${account.name}. Prime de +${fNum(penalty)} Or perçue.`);

                storage.saveUserBankProfile(senderID, account);
                storage.saveUserBankProfile(targetID, targetAccount);

                return api.sendMessage(`🚨 **𝖤𝖢𝖧𝖤𝖢 𝖣𝖤 𝖫'𝖮𝖯𝖤𝖱𝖠𝖳𝖨𝖮𝖭**\nLes alarmes se déclenchent ! Vous fuyez en abandonnant une amende de **-${fNum(penalty)} 𝖮𝗋** versée à la victime. Votre indice de crédit chute.`, threadID, messageID);
            }
        }

        // =========================================================================
        // 🏆 SECTION 9 : SUCCÈS, CALCULS DE NETWORTH & CLASSEMENT GLOBAL
        // =========================================================================
        if (primary === "achievements") {
            if (!account.achievements || account.achievements.length === 0) {
                return api.sendMessage("🏅 **𝖲𝖴𝖢𝖢𝖤𝖲 𝖵𝖨𝖱𝖳𝖴𝖤𝖫𝖲**\nVous n'avez pas encore débloqué de distinctions financières.", threadID, messageID);
            }
            let achMsg = `🏅 **𝖳𝖱𝖮𝖯𝖧𝖤𝖤𝖲 𝖤𝖢𝖮𝖭𝖮𝖬𝖨𝖥𝖴𝖤𝖲**\n\n`;
            account.achievements.forEach(ach => achMsg += `  🏆 **${ach}**\n`);
            return api.sendMessage(achMsg, threadID, messageID);
        }

        if (primary === "networth") {
            let bizVal = 0; let propVal = 0; let investVal = 0;
            for (let id in account.businesses) bizVal += (BIZ_PRESETS[id]?.price || 0) * account.businesses[id].level;
            for (let id in account.properties) propVal += (PROP_PRESETS[id]?.price || 0) * account.properties[id].qty;
            if (account.portfolio.stocks) {
                for (let id in account.portfolio.stocks) investVal += account.portfolio.stocks[id].qty * (market.stocks[id]?.price || 0);
            }
            if (account.portfolio.crypto) {
                for (let id in account.portfolio.crypto) investVal += account.portfolio.crypto[id].qty * (market.cryptos[id]?.price || 0);
            }

            let netTotal = walletCash + account.bankBalance + account.vaultBalance + bizVal + propVal + investVal;
            if (account.loan.hasActiveLoan) netTotal -= account.loan.remainingDebt;

            let nwMsg = `💎 **𝖠𝖭𝖠𝖫𝖸𝖲𝖤 𝖯𝖠𝖳𝖱𝖨𝖬𝖮𝖨𝖭𝖨𝖠𝖫𝖤**\n\n`;
            nwMsg += `💵 Liquidités (Poche) : **${fNum(walletCash)}**\n`;
            nwMsg += `💳 Épargne Bancaire   : **${fNum(account.bankBalance)}**\n`;
            nwMsg += `🔐 Réserves Sécurisées : **${fNum(account.vaultBalance)}**\n`;
            nwMsg += `🏭 Parts Commerciales  : **${fNum(bizVal)}**\n`;
            nwMsg += `🏠 Actifs Immobiliers  : **${fNum(propVal)}**\n`;
            nwMsg += `📈 Portefeuille Marché : **${fNum(investVal)}**\n`;
            if (account.loan.hasActiveLoan) nwMsg += `📉 Passifs (Dettes Dûes) : **-${fNum(account.loan.remainingDebt)}**\n`;
            nwMsg += `────────────────────\n`;
            nwMsg += `💎 **𝖵𝖠𝖫𝖤𝖴𝖱 𝖭𝖤𝖳𝖳𝖤 𝖤𝖲𝖳𝖨𝖬𝖤𝖤** : **${fNum(netTotal)} 𝖮𝗋**`;
            return api.sendMessage(nwMsg, threadID, messageID);
        }

        if (primary === "leaderboard") {
            const allProfiles = storage.getUsers();
            let leaderboardData = [];

            for (let id in allProfiles) {
                let prof = allProfiles[id];
                let cash = global.data?.allUserData?.[id]?.money || 0;
                let nw = cash + prof.bankBalance + prof.vaultBalance;
                if (prof.loan?.hasActiveLoan) nw -= prof.loan.remainingDebt;

                leaderboardData.push({ name: prof.name, netWorth: nw });
            }

            leaderboardData.sort((a, b) => b.netWorth - a.netWorth);
            let topEntries = leaderboardData.slice(0, 10);

            let lbMsg = `🏆 **𝖢𝖫𝖠𝖲𝖲𝖤𝖬𝖤𝖭𝖳 𝖣𝖤𝖲 𝖬𝖨𝖫𝖫𝖨𝖮𝖭𝖭𝖠𝖨𝖱𝖤𝖲 (𝖭𝖤𝖳𝖶𝖮𝖱𝖳𝖧)**\n\n`;
            topEntries.forEach((entry, idx) => {
                let medal = idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : "🔹";
                lbMsg += `${medal} #${idx + 1} **${entry.name}** — **${fNum(entry.netWorth)} 𝖮𝗋**\n`;
            });
            return api.sendMessage(lbMsg, threadID, messageID);
        }

        // =========================================================================
        // 📊 SECTION 10 : "BANK STATS" — FALLBACK TEXTE PREMIUM STATISTIQUES
        // =========================================================================
        if (primary === "stats") {
            let bizVal = 0; let propVal = 0;
            let bizCount = 0; let propCount = 0;
            
            for (let id in account.businesses) {
                bizVal += (BIZ_PRESETS[id]?.price || 0) * account.businesses[id].level;
                bizCount += 1;
            }
            for (let id in account.properties) {
                propVal += (PROP_PRESETS[id]?.price || 0) * account.properties[id].qty;
                propCount += account.properties[id].qty;
            }

            let netTotal = walletCash + account.bankBalance + account.vaultBalance + bizVal + propVal;
            if (account.loan.hasActiveLoan) netTotal -= account.loan.remainingDebt;

            let rankTitle = "Novice Financier";
            if (netTotal > 10000000) rankTitle = "Légende de WallStreet";
            else if (netTotal > 2500000) rankTitle = "Magnat de l'Empire";
            else if (netTotal > 500000) rankTitle = "Investisseur Émérite";

            let statsMsg = `╭───────────────────────────────────────╮\n`;
            statsMsg += `│ 📊 **𝖳𝖠𝖡𝖫𝖤𝖠𝖴 𝖣𝖤 𝖡𝖮𝖱𝖣 𝖯𝖱𝖤𝖬𝖨𝖴𝖬**\n`;
            statsMsg += `├───────────────────────────────────────┤\n`;
            statsMsg += `│ 👤 Titulaire  : **${account.name}**\n`;
            statsMsg += `│ 🎖️ Rang Tycoon : [**${rankTitle}**]\n`;
            statsMsg += `├───────────────────────────────────────┤\n`;
            statsMsg += `│ 💵 Wallet     : **${fNum(walletCash)} 𝖮𝗋**\n`;
            statsMsg += `│ 💳 Banque     : **${fNum(account.bankBalance)} 𝖮𝗋**\n`;
            statsMsg += `│ 🔐 Vault      : **${fNum(account.vaultBalance)} 𝖮𝗋**\n`;
            statsMsg += `│ 📉 Crédit     : **${account.creditScore} pts**\n`;
            statsMsg += `├───────────────────────────────────────┤\n`;
            statsMsg += `│ 🏢 Business   : **${bizCount} possédé(s)**\n`;
            statsMsg += `│ 🏠 Immobilier : **${propCount} propriété(s)**\n`;
            statsMsg += `├───────────────────────────────────────┤\n`;
            statsMsg += `│ 🏴‍☠️ Raids Réussis  : **${account.robberyState?.robSuccess || 0}**\n`;
            statsMsg += `│ 💸 Total Volé     : **${fNum(account.totalStolen || 0)} 𝖮𝗋**\n`;
            statsMsg += `├───────────────────────────────────────┤\n`;
            statsMsg += `│ 💎 Fortune Nette : **${fNum(netTotal)} 𝖮𝗋**\n`;
            statsMsg += `╰───────────────────────────────────────╯`;
            return api.sendMessage(statsMsg, threadID, messageID);
        }
    }
};
