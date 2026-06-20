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
        author: "System",
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
