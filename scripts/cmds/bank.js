module.exports = {
  config: {
    name: "bank",
    aliases: ["economy", "eco"],
    version: "1.0",
    author: "Shade,
    role: 0,
    category: "economy",
    longDescription: { en: "Complete economy system with banking, investments, gambling and more" },
    guide: { en: "{pn} balance\n{pn} deposit [amount]\n{pn} withdraw [amount]\n{pn} transfer [uid] [amount]\n{pn} daily\n{pn} work\n{pn} invest [amount] [stock|crypto|bond]\n{pn} stocks\n{pn} crypto\n{pn} business [buy|collect]\n{pn} property [buy|sell]\n{pn} gamble [slots|blackjack|roulette [amount]\n{pn} lottery [amount]\n{pn} leaderboard\n{pn} rob [uid]" }
  },

  onStart: async function ({ api, event, args, message, usersData }) {
    const { threadID, senderID } = event;
    const subcommand = args[0]?.toLowerCase();
    const uid = senderID;

    try {
      let userData = await usersData.get(uid);
      if (!userData.bank) {
        userData.bank = { balance: 0, wallet: 1000, loan: 0, creditScore: 500, dailyStreak: 0, lastDaily: 0, investments: [], businesses: [], properties: [], cars: [], luxuryItems: [], vault: 0, premium: false, lastWork: 0, robCooldown: 0 };
        await usersData.set(uid, userData);
      }

      const bank = userData.b;
      const wallet = bank.wallet || 0;
      const balance = bank.balance || 0;

      // Helper functions
      const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
      const formatMoney = (amount) => `$${amount.toLocaleString()}`;
      const getTime = () => Math.floor(Date.now() / 1000);

      // Subcommand router
      switch (subcommand) {
        case "balance":
        case "bal": {
          const response = `🏦 BANK ACCOUNT\n━━━━━━━━━━━━━━\n💰 Wallet: ${formatMoney(wallet)}\n🏦 Bank: ${formatMoney(balance)}\n📊 Net Worth: ${formatMoney(wallet + balance)}\n🛡 Credit Score: ${bank.creditScore}/1000\n💎 Premium: ${bank.premium ? "✅ Active" : "❌ Not Active"}`;
          return message.reply(response);
        }

        case "deposit":
        "dep": {
          const amount = parseInt(args[1]);
          if (!amount || amount <= 0) return message.reply("❌ Please enter a valid amount to deposit.");
          if (amount > wallet) return message.reply(`❌ You only have ${formatMoney(wallet)} in your wallet.`);
          
          bank.wallet -= amount;
          bank.balance += amount;
          await usersData.set(uid, userData);
          return message.reply(`✅ Deposited ${formatMoney(amount)} into your bank.\n💼 Wallet: ${formatMoney(bank.wallet)}\n🏦 Bank: ${formatMoney(bank.balance)}`);
        }

        case "withdraw":
        case "with": {
          const amount = parseInt(args[1]);
          if (!amount || amount <= 0) return message.reply("❌ Please enter a valid amount to withdraw.");
          if (amount > balance) return message.reply(`❌ You only have ${formatMoney(balance)} in your bank.`);
          
          bank.wallet += amount;
          bank.balance -= amount;
          await usersData.set(uid, userData);
          return.reply(`✅ Withdrew ${formatMoney(amount)} from your bank.\n💼 Wallet: ${formatMoney(bank.wallet)}\n🏦 Bank: ${formatMoney(bank.balance)}`);
        }

        case "transfer":
        case "send": {
          const targetID = args[1];
          const amount = parseInt(args[2]);
          if (!targetID || !amount || amount <= 0) return message.reply("❌ Usage: {pn} transfer [uid] [amount]");
          if (amount > wallet) return message.reply(`❌ You only have ${formatMoney(wallet)} in your wallet.`);

          let targetData = await usersData.get(targetID);
          if (!targetData) return message.reply("❌ User not found.");
          if (!targetData.bank) {
            targetData.bank = { balance: 0, wallet: 0, loan: 0, creditScore: 500, dailyStreak: 0, lastDaily: 0, investments: [], businesses: [], properties: cars: [], luxuryItems: [], vault: 0, premium: false, lastWork: 0, robCooldown: 0 };
          }

          bank.wallet -= amount;
          targetData.bank.wallet += amount;
          await usersData.set(uid, userData);
          await usersData.set(targetID, targetData);
          return message.reply(`✅ Transferred ${formatMoney(amount)} to ${targetID}.\n💼 Your Wallet: ${formatMoney(bank.wallet)}`);
        }

        case "daily": {
          const now = getTime();
          if (now - bank.lastDaily < 86400) {
            const remaining = 86400 - (now - bank.lastDaily);
            const hours = Math.floor(remaining / 3600);
            const mins = Math.floor((remaining % 3600) / 60);
            return message.reply(`⏳ Come back in ${hours}h ${mins}m for your daily reward.`);
          }

          const reward = bank.dailyStreak >= 7 ? 5000 : 2000 + (bank.dailyStreak * 500);
          bank.wallet += reward;
          bank.lastDaily = now;
          bank.dailyStreak = bank.dailyStreak >= 7 ? 1 : bank.dailyStreak + 1;
          bank.creditScore = Math.min(1000, bank.creditScore + 5);

          await usersData.set(uid, userData);
          return message.reply(`🎁 DAILY REWARD\n━━━━━━━━━━━━━━\n💰 ${formatMoney(reward)}\n📅 Streak: ${bank.dailyStreak}/7\n💎 Credit Score: ${bank.creditScore}`);
        }

        case "work": {
          const now = getTime();
          if (now - bank.lastWork < 3600) {
            const remaining = 3600 - (now - bank.lastWork);
            const mins = Math.floor(remaining / 60);
            return message.reply(`⏳ You can work again in ${mins} minutes.`);
          }

          const jobs = ["Programmer", "Doctor", "Teacher", "Engineer", "Artist", "Chef", "Pilot", "Writer"];
          const job = jobs[randomInt(0, jobs.length - 1)];
          const earning = randomInt(500, 3000);
          
          bank.wallet += earning;
          bank.lastWork = now;
          bank.creditScore = Math.min(1000, bank.creditScore + 2);
          await usersData.set(uid, userData);
          return message.reply(`💼 WORK\n━━━━━━━━━━━━━━\n📋 Job: ${job}\n💰 Earned: ${formatMoney(earning)}\n💼 Wallet: ${formatMoney(bank.wallet)}`);
        }

        case "invest": {
          const amount = parseInt(args[1]);
          const type = args[2]?.toLowerCase();
          if (!amount || amount <= 0 || !type) return message.reply("❌ Usage: {pn} invest [amount] [stock|crypto|bond]");
          if (amount > wallet) return message.reply(`❌ You only have ${formatMoney(wallet)} in your wallet.`);

          const investments = {
            stock: { name: "Tech Corp", risk: 0.3, return: 1.5 },
            crypto: { name: "BitCoin", risk: 0.7, return: 3.0 },
            bond: { name: "Government Bond", risk: 0.1, return: 1.1 }
          };

          if (!investments[type]) return message.reply("❌ Invalid investment type. Use: stock, crypto, or bond.");

          const invest = investments[type];
          const multiplier = Math.random() < invest.risk ? invest.return : (1 / invest.return);
          const profit = Math.round(amount * (multiplier - 1));
          const finalAmount = amount + profit;

          bank.wallet -= amount;
          bank.investments.push({ type, amount: finalAmount, date: Date.now() });
          bank.creditScore = Math.min(1000, bank.creditScore + 3);
          await usersData.set(uid, userData);

          return message.reply(`📈 INVESTMENT\n━━━━━━━━━━━━━━\n💼 Type: ${invest.name}\n💰 Invested: ${formatMoney(amount)}\n📊 Return: ${profit >= 0 ? "+" : ""}${formatMoney(profit)}\n💵 Total: ${formatMoney(finalAmount)}`);
        }

        case "stocks": {
          if (bank.investments.length === 0) return message.reply("📉 No investments yet. Use {pn} invest to start.");
          
          const total = bank.investments.reduce((sum, inv) => sum + inv.amount, 0);
          const count = bank.investments.length;
          return message.reply(`📊 PORTFOLIO\n━━━━━━━━━━━━━━\n📈 Total Investments: ${count}\n💰 Total Value: ${formatMoney(total)}\n📉 Average: ${formatMoney(total / count)}`);
        }

        case "crypto": {
          const prices = { BTC: 45000, ETH: 3200, SOL: 120, ADA: 0.5, DOT: 8 };
          let msg = "🪙 CRYPTO MARKET\n━━━━━━━━━━━━\n";
          for (const [coin, price] of.entries(prices)) {
            msg += `${coin}: ${formatMoney(price)}\n`;
          }
          return message.reply(msg);
        }

        case "business": {
          const action = args[1]?.toLowerCase();
          if (!action) return message.reply("❌ Usage: {pn} business [buy|collect]");

          if (action === "buy") {
            const businesses = [
              { name: "Coffee Shop", cost: 50000, income: 5000 },
              { name: "Restaurant", cost: 100000, income: 12000 },
              { name: "Tech Startup", cost: 200000, income: 30000 }
            ];

            let msg = "🏪 BUSINESSES\n━━━━━━━━━━━━━━n";
            businesses.forEach((b, i) => {
              msg += `${i + 1}. ${b.name}\n   Cost: ${formatMoney(b.cost)}\n   Income: ${formatMoney(b.income)}/day\n\n`;
            });
            return message.reply(msg);
          }

          if (action === "collect") {
            if (!bank.businesses.length) return message.reply("❌ You don't own any businesses.");
            
            const totalIncome = bank.businesses.reduce((sum, b) => sum + b.income, 0);
            bank.wallet += totalIncome;
            bank.creditScore = Math.min(1000, bank.creditScore + 2);
            await usersData.set(uid, userData);
            return message.reply(`💼 BUSINESS INCOME\n━━━━━━━━━━━━━━\n💰 Collected: ${formatMoney(totalIncome)}\n🏪 Businesses: ${bank.businesses.length}\n💼 Wallet: ${formatMoney(bank.wallet)}`);
          }
          return message.reply("❌ Invalid action. Use: buy or collect");
        }

        case "property":
        case "house": {
          const action = args[1]toLowerCase();
          if (action === "buy") {
            const properties = [
              { name: "Studio Apartment", cost: 100000 },
              { name: "Family House", cost: 250000, rooms: 3 },
              { name: "Luxury Villa", cost: 500000, rooms: 5 }
            ];

            const selected = properties[0];
            if (wallet < selected.cost) return message.reply(`❌ You need ${formatMoney(selected.cost)} to buy a ${selected.name}.`);

            bank.wallet -= selected.cost;
            bank.properties.push({ name: selected.name, cost: selected.cost });
            bank.creditScore = Math.min(1000, bank.creditScore + 10);
            await usersData.set(uid, userData);
            return message.reply(`🏠 PURCHASED\n━━━━━━━━━━━━━━\n🏡 ${selected.name}\n💰 Cost: ${formatMoney(selected.cost)}\n💼 Remaining: ${formatMoney(bank.wallet)}`);
          }

          if (action === "list") {
            if (!bank.properties.length) return message.reply("❌ No properties owned.");
            let msg = "🏠 PROPERTIES\n━━━━━━━━━━━━━━\n";
            bank.properties.forEach((p, i) => {
              msg += `${i + 1}. ${p.name} - ${formatMoney(p.cost)}\n`;
            });
            return message.reply(msg);
          }
          return message.reply("❌ Usage: {pn} property [buy|list]");
        }

        case "gamble":
        case "slots":
        case "blackjack":
        case "roulette": {
          const game = subcommand === "gamble" ? args[1]?.toLowerCase() : subcommand;
          const amount = parseInt(args[2] || args[1]);
          if (!game || !["slots", "blackjack", "roulette"].includes(game)) return message.reply("❌ Usage: {pn} gamble [slots|blackjack|roulette] [amount]");
          if (!amount || amount <= 0) return message.reply("❌ Enter a valid bet amount.");
          if (amount > wallet) return message.reply(`❌ You only have ${formatMoney(wallet)} in your wallet.`);

          let winMultiplier, winMessage;
          switch (game) {
            case "slots": {
              const symbols = ["🍒", "🍋", "🍊", "🍇", "💎"];
              const result = [symbols[randomInt(0, 4)], symbols[randomInt(0, 4)], symbols[randomInt(0, 4)]];
              const isWin = result[0] === result[1] && result[1] === result[2];
              winMultiplier =Win ? 3 : 0;
              winMessage = `🎰 SLOTS\n━━━━━━━━━━━━━━\n${result.join(" | ")}\n${isWin ? "🎉 YOU WIN!" : "❌ You lost :("}`;
              break;
            }
            case "blackjack": {
              const player = randomInt(16, 21);
              const dealer = randomInt(16, 21);
              const is = player > dealer && player <= 21;
              winMultiplier = isWin ? 2 : 0;
              winMessage = `♠️ BLACKJACK\n━━━━━━━━━━━━━━\n👤 You: ${player}\n🤖 Dealer: ${dealer}\n${isWin ? "🎉 YOU WIN!" : "❌ You lost :("}`;
              break;
            }
            case "roulette": {
              const color = args[3]?.toLowerCase();
              if (!["red", "black"].includes(color)) return message.reply("❌ Choose red or black.");
              const result = Math.random() < 0.5 "red" : "black";
              const isWin = result === color;
              winMultiplier = isWin ? 1.9 : 0;
              winMessage = `🎡 ROULETTE\n━━━━━━━━━━━━━━\n🎨 Bet: ${color}\n🎯 Result: ${result}\n${isWin ? "🎉 YOU WIN!" : "❌ You lost :("}`;
              break;
            }
          }

          const winnings = Math.floor(amount * winMultiplier);
          if (winnings > 0) {
            bank.wallet += winnings;
          } else {
            bank.wallet -= amount;
          }
          bankcreditScore = Math.min(1000, bank.creditScore + (winnings > 0 ? 3 : -2));
          await usersData.set(uid, userData);

          return message.reply(`${winMessage}\n💰 Bet: ${formatMoney(amount)}\n💵 Result: ${winnings > 0 ? "+" : ""}${formatMoney(winnings - amount)}\n💼 Wallet: ${formatMoney(bank.wallet)}`);
        }

        case "leaderboard":
        case "lb": {
          const allUsers = await usersData.getAll();
          const sorted = Object.entries(allUsers)
            .map(([id, data]) => ({ id, netWorth: (data.bank?.wallet || 0) + (data.bank?.balance || 0) }))
            .sort((a, b) => b.netWorth - a.netWorth)
            .slice(0, 10);

          let msg = "🏆 LEADERBOARD\n━━━━━━━━━━━━\n";
          sorted.forEach((user, i) => {
            msg += `${i + 1}. ${user.id.slice(0, 8)}... - ${formatMoney(user.netWorth)}\n`;
          });
          return message.reply(msg);
               case "rob": {
          const targetID = args[1];
          if (!targetID) return message.reply("❌ Usage: {pn} rob [uid]");
          if (targetID === uid) return message.reply("❌ You can't rob yourself!");

          const now = getTime();
          (now - bank.robCooldown < 3600) {
            const remaining = 3600 - (now - bank.robCooldown);
            const mins = Math.floor(remaining / 60);
            return message.reply(`⏳ Rob cooldown: ${mins} minutes remaining.`);
          }

          let targetData = await usersData.get(targetID);
          if (!targetData || !targetData.bank return message.reply("❌ Target doesn't have a bank account.");
          if (targetData.bank.wallet < 100) return message.reply("❌ Target has less than $100, not worth robbing.");

          const successRate = 0.4 + (bank.creditScore / 10000);
          const success = Math.random() < successRate;

          if (success) {
            const = Math.floor(targetData.bank.wallet * randomInt(10, 30) / 100);
            targetData.bank.wallet -= stolen;
            bank.wallet += stolen;
            bank.robCooldown = now;
            bank.creditScore = Math.min(1000, bank.creditScore - 20);
            await usersData.set(uid, userData);
            await usersData.set(targetID, targetData);
            return message.reply(`🔫 ROBBERY SUCCESS\n━━━━━━━━━━━━━━\n💰 Stolen: ${formatMoney(stolen)}\n💼 Your Wallet: ${formatMoney(bank.wallet)}\n⚠️ Credit: ${bank.creditScore}`);
          } else {
            const fine = Math.floor(wallet * 0.1);
            bank.wallet = Math.max(0, bank.wallet - fine);
            bank.robCooldown = now;
            bank.creditScore = Math.max(0, bank.creditScore - 50);
            await usersData.set(uid, userData);
            return message.reply(`🚨 ROBBERY FAILED\n━━━━━━━━━━━━━━\n👮 You got caught!\n💰 Fine: ${formatMoney(fine)}\n💼 Remaining: ${formatMoney(bank.wallet)}\n⚠️ Credit Score: ${bank.creditScore          }
        }

        default:
          return message.reply(`❌ Unknown subcommand.\n📋 Available: balance, deposit, withdraw, transfer, daily, work, invest, stocks, crypto, business, property, gamble, leaderboard, rob`);
      }

    } catch (error) {
      console.error(error);
      return message.reply("❌ An error occurred. Please try again later.");
    }
  }
};
