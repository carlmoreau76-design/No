/**
 * @author System
 * @title Advanced Banking System
 * @name bank
 * @class bank
 * @version 2.0.0
 * @description A comprehensive, self-contained advanced banking & economy system using usersData.
 * @usage bank [help/balance/deposit/withdraw/transfer/daily/work/loan/repay/history/leaderboard/rob/invest/business/property/luxury/achievements/rep/insurance]
 */

module.exports = {
    config: {
        name: "bank",
        version: "2.0.0",
        author: "Shade",
        countDown: 5,
        role: 0,
        description: "Comprehensive modular banking and financial ecosystem",
        category: "economy",
        guide: {
            en: "{p}bank help - Display all available financial commands"
        }
    },

    onStart: async function ({ api, event, args, usersData }) {
        const { threadID, messageID, senderID } = event;
        const subCommand = args[0]?.toLowerCase();

        // Helper function to safely initialize and fetch full user data structure
        async function getUserProfile(id) {
            let userData = await usersData.get(id);
            if (!userData) userData = {};
            if (!userData.data) userData.data = {};
            
            // Core Economy Defaults
            if (userData.money === undefined) userData.money = 500; // Starter Wallet
            if (userData.data.bank === undefined) userData.data.bank = { balance: 0 };
            
            // Advanced Systems Defaults
            if (userData.data.bank.loan === undefined) userData.data.bank.loan = { principal: 0, interestRate: 0.15 };
            if (userData.data.bank.creditScore === undefined) userData.data.bank.creditScore = 600;
            if (userData.data.bank.history === undefined) userData.data.bank.history = [];
            if (userData.data.bank.insurance === undefined) userData.data.bank.insurance = false;
            if (userData.data.bank.vaultLevel === undefined) userData.data.bank.vaultLevel = 1;
            
            // Cooldowns
            if (userData.data.cooldowns === undefined) userData.data.cooldowns = { daily: 0, work: 0, rob: 0 };
            
            // Investments, Businesses, Properties, Assets
            if (userData.data.investments === undefined) userData.data.investments = { stocks: 0, crypto: 0, bonds: 0 };
            if (userData.data.businesses === undefined) userData.data.businesses = [];
            if (userData.data.properties === undefined) userData.data.properties = [];
            if (userData.data.luxury === undefined) userData.data.luxury = [];
            
            // Stats
            if (userData.data.reputation === undefined) userData.data.reputation = 0;
            if (userData.data.achievements === undefined) userData.data.achievements = [];

            return userData;
        }

        // Process passive yields across all components to update dynamic accounts before actions
        async function tickPassiveIncome(userData) {
            const now = Date.now();
            if (!userData.data.lastPassiveTick) {
                userData.data.lastPassiveTick = now;
                return userData;
            }
            const hoursElapsed = (now - userData.data.lastPassiveTick) / 3600000;
            if (hoursElapsed >= 1) {
                let totalYield = 0;
                // Business Yields
                if (userData.data.businesses.length > 0) {
                    userData.data.businesses.forEach(b => { totalYield += b.yieldPerHour * Math.floor(hoursElapsed); });
                }
                // Property Yields
                if (userData.data.properties.length > 0) {
                    userData.data.properties.forEach(p => { totalYield += p.rentPerHour * Math.floor(hoursElapsed); });
                }
                if (totalYield > 0) {
                    userData.data.bank.balance += totalYield;
                    userData.data.bank.history.push({ type: "Passive Income", amount: totalYield, time: new Date().toISOString() });
                }
                // Compound Interest on Loans
                if (userData.data.bank.loan.principal > 0) {
                    const interestCharged = Math.floor(userData.data.bank.loan.principal * (userData.data.bank.loan.interestRate / 24) * Math.floor(hoursElapsed));
                    userData.data.bank.loan.principal += interestCharged;
                }
                userData.data.lastPassiveTick = now - ((now - userData.data.lastPassiveTick) % 3600000);
            }
            return userData;
        }

        try {
            let senderProfile = await getUserProfile(senderID);
            senderProfile = await tickPassiveIncome(senderProfile);

            // Help Index Menu
            if (!subCommand || subCommand === "help") {
                const helpText = 
                    "🏦 【 ADVANCED BANKING & ECONOMY SYSTEM 】 🏦\n\n" +
                    "💰 ━ ECONOMY CORE\n" +
                    " ├ balance : Check cash, bank accounts, credit scores\n" +
                    " ├ deposit <amt/all> : Secure cash into your bank vault\n" +
                    " ├ withdraw <amt/all> : Liquidate funds to wallet asset\n" +
                    " ├ transfer <@tag> <amt> : Wire funds securely to another user\n" +
                    " ├ daily : Claim your basic daily universal basic income\n" +
                    " └ work : Execute specialized shifts for immediate capital\n\n" +
                    "🏦 ━ BANKING SERVICES\n" +
                    " ├ loan <amt> : Apply for capital backing based on credit worthiness\n" +
                    " ├ repay <amt/all> : Liquidate structural debt obligations\n" +
                    " ├ history : Audit your account's detailed transactions\n" +
                    " ├ insurance : Buy protection against heist risk (Cost: $5,000)\n" +
                    " └ leaderboard : Compare regional monetary asset listings\n\n" +
                    "📊 ━ TRADING & ENTERPRISE\n" +
                    " ├ rob <@tag> : Execute high-risk expropriation on targets\n" +
                    " ├ invest [stocks/crypto/bonds] <amt> : Capital market vehicles\n" +
                    " ├ business [buy/list] : Acquire passive enterprise streams\n" +
                    " ├ property [buy/list] : Real estate commercial operations\n" +
                    " └ luxury [buy/list] : High-end tangible items & assets\n\n" +
                    "🧠 ━ METRICS & ACHIEVEMENTS\n" +
                    " ├ achievements : View earned historic operational badges\n" +
                    " └ rep <@tag> : Endorse peer networks to increment reputation\n\n" +
                    "💡 Use commands precisely, parameters are strict.";
                return api.sendMessage(helpText, threadID, messageID);
            }

            switch (subCommand) {
                case "balance": {
                    const balanceMsg = 
                        "💳 【 FINANCIAL BALANCE SHEET 】 💳\n" +
                        `👤 Holder: ${global.data.userName.get(senderID) || "Account Holder"}\n` +
                        `💵 Wallet Liquid Cash: $${senderProfile.money.toLocaleString()}\n` +
                        `🏛️ Secure Bank Holding: $${senderProfile.data.bank.balance.toLocaleString()}\n` +
                        `📉 Active Debt Liability: $${senderProfile.data.bank.loan.principal.toLocaleString()}\n` +
                        `📈 Credit Evaluation Score: ${senderProfile.data.bank.creditScore} pts\n` +
                        `🛡️ Account Insurance: ${senderProfile.data.bank.insurance ? "ACTIVE ✅" : "INACTIVE ❌"}\n` +
                        `🌟 Social Reputation Index: ${senderProfile.data.reputation} REP`;
                    return api.sendMessage(balanceMsg, threadID, messageID);
                }

                case "deposit": {
                    const amountInput = args[1];
                    if (!amountInput) return api.sendMessage("❌ Provide numerical amount or 'all'.", threadID, messageID);
                    let amt = amountInput.toLowerCase() === "all" ? senderProfile.money : parseInt(amountInput);
                    if (isNaN(amt) || amt <= 0) return api.sendMessage("❌ Invalid processing amount designated.", threadID, messageID);
                    if (senderProfile.money < amt) return api.sendMessage("❌ Insufficient liquid wallet funds available.", threadID, messageID);

                    senderProfile.money -= amt;
                    senderProfile.data.bank.balance += amt;
                    senderProfile.data.bank.history.push({ type: "Deposit", amount: amt, time: new Date().toISOString() });
                    await usersData.set(senderID, senderProfile);

                    return api.sendMessage(`✅ Securely deposited $${amt.toLocaleString()} into your vault account.`, threadID, messageID);
                }

                case "withdraw": {
                    const amountInput = args[1];
                    if (!amountInput) return api.sendMessage("❌ Provide numerical amount or 'all'.", threadID, messageID);
                    let amt = amountInput.toLowerCase() === "all" ? senderProfile.data.bank.balance : parseInt(amountInput);
                    if (isNaN(amt) || amt <= 0) return api.sendMessage("❌ Invalid processing amount designated.", threadID, messageID);
                    if (senderProfile.data.bank.balance < amt) return api.sendMessage("❌ Bank ledger reflects insufficient funds.", threadID, messageID);

                    senderProfile.data.bank.balance -= amt;
                    senderProfile.money += amt;
                    senderProfile.data.bank.history.push({ type: "Withdrawal", amount: amt, time: new Date().toISOString() });
                    await usersData.set(senderID, senderProfile);

                    return api.sendMessage(`✅ Liquidation approved. $${amt.toLocaleString()} extracted to wallet.`, threadID, messageID);
                 }

                    case "transfer": {
                    const targetID = Object.keys(event.mentions)[0];
                    const amountInput = args[2] || args[1]; 
                    if (!targetID) return api.sendMessage("❌ Specify the recipient account via @tag.", threadID, messageID);
                    let amt = parseInt(amountInput);
                    if (isNaN(amt) || amt <= 0) return api.sendMessage("❌ Define valid positive balance for transfer architecture.", threadID, messageID);
                    if (senderProfile.money < amt) return api.sendMessage("❌ Operational wallet liquidity failure for transaction.", threadID, messageID);

                    let targetProfile = await getUserProfile(targetID);
                    senderProfile.money -= amt;
                    targetProfile.money += amt;

                    senderProfile.data.bank.history.push({ type: "Wire Sent", amount: amt, time: new Date().toISOString() });
                    targetProfile.data.bank.history.push({ type: "Wire Received", amount: amt, time: new Date().toISOString() });

                    await usersData.set(senderID, senderProfile);
                    await usersData.set(targetID, targetProfile);

                    return api.sendMessage(`✅ Wire transfer processing complete. $${amt.toLocaleString()} safely shifted to target node.`, threadID, messageID);
                }

                case "daily": {
                    const cooldown = 86400000; // 24 hours
                    if (Date.now() - senderProfile.data.cooldowns.daily < cooldown) {
                        const remaining = cooldown - (Date.now() - senderProfile.data.cooldowns.daily);
                        const hrs = Math.floor(remaining / 3600000);
                        const mins = Math.floor((remaining % 3600000) / 60000);
                        return api.sendMessage(`⏳ Allocation locked. Return in ${hrs}h ${mins}m.`, threadID, messageID);
                    }

                    const dailyReward = 2500;
                    senderProfile.money += dailyReward;
                    senderProfile.data.cooldowns.daily = Date.now();
                    
                    if (!senderProfile.data.achievements.includes("First Step")) {
                        senderProfile.data.achievements.push("First Step");
                    }
                    
                    await usersData.set(senderID, senderProfile);
                    return api.sendMessage(`💰 Universal Basic Allocation added. Liquidated +$${dailyReward} to wallet context.`, threadID, messageID);
                }

                case "work": {
                    const cooldown = 1800000; // 30 mins
                    if (Date.now() - senderProfile.data.cooldowns.work < cooldown) {
                        const remaining = cooldown - (Date.now() - senderProfile.data.cooldowns.work);
                        return api.sendMessage(`⏳ Shift lock in place. Active cooling down: ${Math.floor(remaining / 60000)}m remaining.`, threadID, messageID);
                    }

                    const jobs = [
                        { name: "Quantum Software Consultant", pay: [800, 1500] },
                        { name: "High-Frequency Algorithm Trader", pay: [1200, 2200] },
                        { name: "Deep Sea Extraction Engineer", pay: [600, 1100] },
                        { name: "Cybersecurity Asset Red-Teamer", pay: [900, 1700] }
                    ];
                    const chosen = jobs[Math.floor(Math.random() * jobs.length)];
                    const gain = Math.floor(Math.random() * (chosen.pay[1] - chosen.pay[0] + 1)) + chosen.pay[0];

                    senderProfile.money += gain;
                    senderProfile.data.cooldowns.work = Date.now();
                    await usersData.set(senderID, senderProfile);

                    return api.sendMessage(`🛠️ Job Deployment: Worked as a **${chosen.name}**.\n💵 Retainer Earned: +$${gain.toLocaleString()}`, threadID, messageID);
                }

                case "loan": {
                    const amt = parseInt(args[1]);
                    if (isNaN(amt) || amt <= 0) return api.sendMessage("❌ Declare precise funding requirements.", threadID, messageID);
                    if (senderProfile.data.bank.loan.principal > 0) return api.sendMessage("❌ Existing credit line defaults. Clear outstanding debt balances first.", threadID, messageID);

                    // Credit Score checks maximum allowed loan
                    const maxLoan = Math.floor(senderProfile.data.bank.creditScore * 50);
                    if (amt > maxLoan) return api.sendMessage(`❌ Credit Rating insufficient for request. Cap threshold at: $${maxLoan.toLocaleString()}`, threadID, messageID);

                    senderProfile.data.bank.loan.principal = amt;
                    senderProfile.data.bank.balance += amt;
                    senderProfile.data.bank.history.push({ type: "Loan Disbursed", amount: amt, time: new Date().toISOString() });
                    await usersData.set(senderID, senderProfile);

                    return api.sendMessage(`🏦 Credit assessment complete. Approved funding parameters.\n💰 $${amt.toLocaleString()} loaded into central bank accounts. Current active debt accumulation applies.`, threadID, messageID);
                }

                    case "repay": {
                    const amountInput = args[1];
                    if (!amountInput) return api.sendMessage("❌ Specify settlement capital size or 'all'.", threadID, messageID);
                    if (senderProfile.data.bank.loan.principal <= 0) return api.sendMessage("❌ Balance sheet displays zero debt obligations.", threadID, messageID);

                    let amt = amountInput.toLowerCase() === "all" ? senderProfile.money : parseInt(amountInput);
                    if (isNaN(amt) || amt <= 0) return api.sendMessage("❌ Outlining proper structural calculations required.", threadID, messageID);
                    if (senderProfile.money < amt) return api.sendMessage("❌ Liquidity restriction. Wallet funds insufficient for repayment schema.", threadID, messageID);

                    if (amt > senderProfile.data.bank.loan.principal) {
                        amt = senderProfile.data.bank.loan.principal;
                    }

                    senderProfile.money -= amt;
                    senderProfile.data.bank.loan.principal -= amt;
                    senderProfile.data.bank.history.push({ type: "Debt Repayment", amount: amt, time: new Date().toISOString() });

                    if (senderProfile.data.bank.loan.principal === 0) {
                        senderProfile.data.bank.creditScore = Math.min(850, senderProfile.data.bank.creditScore + 45); // Boost credit on full pay
                    }

                    await usersData.set(senderID, senderProfile);
                    return api.sendMessage(`✅ Loan transaction successful. Remitted $${amt.toLocaleString()}. Total Liability Remaining: $${senderProfile.data.bank.loan.principal.toLocaleString()}`, threadID, messageID);
                }

                case "history": {
                    const historicalData = senderProfile.data.bank.history;
                    if (historicalData.length === 0) return api.sendMessage("📭 Bank audit log reflects empty operational history.", threadID, messageID);
                    const trace = historicalData.slice(-5).map(h => `• [${h.time.split("T")[0]}] ${h.type}: $${h.amount.toLocaleString()}`).join("\n");
                    return api.sendMessage(`📋 【 RECENT GENERAL TRANSACTIONS LEDGER 】 📋\n\n${trace}`, threadID, messageID);
                }

                case "insurance": {
                    if (senderProfile.data.bank.insurance) return api.sendMessage("🛡️ Asset portfolio already possesses modern insurance indemnity.", threadID, messageID);
                    if (senderProfile.money < 5000) return api.sendMessage("❌ Underwriting premiums require $5,000 cash assets.", threadID, messageID);

                    senderProfile.money -= 5000;
                    senderProfile.data.bank.insurance = true;
                    await usersData.set(senderID, senderProfile);
                    return api.sendMessage("🛡️ Underwriting finalized. Protection parameters activated. Coverage shield against heists initialized.", threadID, messageID);
                }

                case "leaderboard": {
                    const absoluteRegistry = await usersData.getAll();
                    let systemArr = [];

                    for (const entry of absoluteRegistry) {
                        if (!entry || !entry.id) continue;
                        let wealth = entry.money || 0;
                        if (entry.data && entry.data.bank && entry.data.bank.balance) {
                            wealth += entry.data.bank.balance;
                        }
                        const name = global.data.userName.get(entry.id) || `User-${entry.id.substring(0,4)}`;
                        systemArr.push({ name, totalWealth: wealth });
                    }

                    systemArr.sort((x, y) => y.totalWealth - x.totalWealth);
                    const leaderboardSlice = systemArr.slice(0, 10);
                    let boardText = "📊 【 CENTRAL ECONOMIC WEALTH RANKS 】 📊\n\n";
                    leaderboardSlice.forEach((user, idx) => {
                        boardText += `${idx + 1}. ${user.name} ━ $${user.totalWealth.toLocaleString()}\n`;
                    });
                    return api.sendMessage(boardText, threadID, messageID);
                }

                    case "rob": {
                    const targetID = Object.keys(event.mentions)[0];
                    if (!targetID) return api.sendMessage("❌ Declare asset target via @tag marker.", threadID, messageID);
                    if (targetID === senderID) return api.sendMessage("❌ Paradox error. Self-expropriation invalid.", threadID, messageID);

                    const cooldown = 3600000; // 1 hr
                    if (Date.now() - senderProfile.data.cooldowns.rob < cooldown) {
                        return api.sendMessage("⏳ Security patterns watching. Cooldown vectors active.", threadID, messageID);
                    }

                    let targetProfile = await getUserProfile(targetID);
                    if (targetProfile.money < 500) return api.sendMessage("❌ Target profiles carry insignificant wallet structures to warrant exposure.", threadID, messageID);

                    senderProfile.data.cooldowns.rob = Date.now();

                    if (targetProfile.data.bank.insurance) {
                        targetProfile.data.bank.insurance = false; // Breach burns insurance coverage
                        await usersData.set(targetID, targetProfile);
                        await usersData.set(senderID, senderProfile);
                        return api.sendMessage("🚨 Expropriation aborted! Target's defensive insurance net deflected attack vectors completely.", threadID, messageID);
                    }

                    const logicChance = Math.random();
                    if (logicChance > 0.45) { // 45% Success vector
                        const lootPercent = Math.random() * (0.40 - 0.15) + 0.15;
                        const seizedAsset = Math.floor(targetProfile.money * lootPercent);

                        targetProfile.money -= seizedAsset;
                        senderProfile.money += seizedAsset;
                        senderProfile.data.bank.creditScore = Math.max(300, senderProfile.data.bank.creditScore - 30);

                        await usersData.set(senderID, senderProfile);
                        await usersData.set(targetID, targetProfile);
                        return api.sendMessage(`🥷 Operation successful. Intercepted $${seizedAsset.toLocaleString()} from target profile context.`, threadID, messageID);
                    } else {
                        const penalty = Math.floor(senderProfile.money * 0.20);
                        senderProfile.money -= penalty;
                        senderProfile.data.bank.creditScore = Math.max(300, senderProfile.data.bank.creditScore - 50);

                        await usersData.set(senderID, senderProfile);
                        return api.sendMessage(`🚨 Operation failure. Caught by regulatory assets. Fined $${penalty.toLocaleString()} and credit score penalized.`, threadID, messageID);
                    }
                }

                case "invest": {
                    const type = args[1]?.toLowerCase();
                    const amt = parseInt(args[2]);

                    if (!["stocks", "crypto", "bonds"].includes(type) || isNaN(amt) || amt <= 0) {
                        return api.sendMessage("❌ Formatting Error. Correct structural execution: `bank invest [stocks/crypto/bonds] <amount>`", threadID, messageID);
                    }
                    if (senderProfile.money < amt) return api.sendMessage("❌ Processing fail. Wallet structures lacking depth.", threadID, messageID);

                    // Multipliers depending on variance architecture
                    let yieldRate = 0;
                    if (type === "stocks") yieldRate = Math.random() * (0.35 - (-0.20)) + (-0.20); // High spread
                    if (type === "crypto") yieldRate = Math.random() * (0.80 - (-0.50)) + (-0.50); // Extreme spread
                    if (type === "bonds") yieldRate = Math.random() * (0.08 - 0.02) + 0.02;     // Secure returns

                    const computationResult = Math.floor(amt * (1 + yieldRate));
                    const delta = computationResult - amt;

                    senderProfile.money -= amt;
                    senderProfile.money += computationResult;

                    senderProfile.data.bank.history.push({ type: `Investment: ${type}`, amount: delta, time: new Date().toISOString() });
                    await usersData.set(senderID, senderProfile);

                    if (delta >= 0) {
                        return api.sendMessage(`📈 Position liquidated. Market indicators shifted upward.\n💵 Result: +$${delta.toLocaleString()} asset gains.`, threadID, messageID);
                    } else {
                        return api.sendMessage(`📉 Position liquidated. Market indicators correction materialized.\n💵 Result: -$${Math.abs(delta).toLocaleString()} asset depreciation.`, threadID, messageID);
                    }
                }

                case "business": {
                    const operationalMode = args[1]?.toLowerCase();
                    const options = [
                        { identity: "Logistics Hub", price: 25000, yields: 450 },
                        { identity: "AI Matrix Architecture", price: 100000, yields: 2100 }
                    ];

                    if (operationalMode === "list") {
                        let roster = "🏢 【 MARKET ENTERPRISE OPTIONS 】 🏢\n\n";
                        options.forEach((opt, idx) => {
                            roster += `${idx + 1}. **${opt.identity}**\n   💰 Setup Cost: $${opt.price.toLocaleString()} | 📊 Yield: $${opt.yields}/hr\n`;
                        });
                        return api.sendMessage(roster, threadID, messageID);
                    }

                    if (operationalMode === "buy") {
                        const targetIndex = parseInt(args[2]) - 1;
                        if (isNaN(targetIndex) || !options[targetIndex]) return api.sendMessage("❌ Designate index allocation map ID.", threadID, messageID);
                        const selection = options[targetIndex];

                        if (senderProfile.money < selection.price) return api.sendMessage("❌ Under-capitalized for selected venture acquisition.", threadID, messageID);

                        senderProfile.money -= selection.price;
                        senderProfile.data.businesses.push({ identity: selection.identity, yieldPerHour: selection.yields, purchased: Date.now() });
                        await usersData.set(senderID, senderProfile);

                        return api.sendMessage(`🏢 Asset Transfer executed. You now operate **${selection.identity}**. Yield pipelines are actively running.`, threadID, messageID);
                    }
                    return api.sendMessage("❌ Direct syntax structure mapping: `bank business [list/buy]`", threadID, messageID);
                }
