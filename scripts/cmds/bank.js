module.exports = {
  config: {
    name: "bank",
    aliases: ["economy", "eco"],
    version: "2.0.0",
    author: "Shade",
    role: 0,
    category: "economy",
    longDescription: {
      en: "Complete economy system with banking, investments, gambling and more"
    },
    guide: {
      en: "{pn} balance\n{pn} work\n{pn} daily\n{pn} deposit [amount]\n{pn} withdraw [amount]\n{pn} transfer [uid] [amount]\n{pn} invest [amount] [stock|crypto|bond]\n{pn} stocks\n{pn} crypto\n{pn} business [buy|collect]\n{pn} property [buy|list]\n{pn} gamble [slots|blackjack|roulette] [amount]\n{pn} leaderboard\n{pn} rob [uid]"
    }
  },

  onStart: async function ({ api, event, args, message, usersData }) {
    const { senderID } = event;
    const cmd = args[0]?.toLowerCase();

    const now = () => Math.floor(Date.now() / 1000);
    const format = (n) => `$${Number(n || 0).toLocaleString()}`;
    const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

    let userData = await usersData.get(senderID);

    if (!userData.bank) {
      userData.bank = {
        wallet: 1000,
        balance: 0,
        creditScore: 500,
        lastDaily: 0,
        lastWork: 0,
        robCooldown: 0,
        investments: [],
        businesses: [],
        properties: []
      };
      await usersData.set(senderID, userData);
    }

    const bank = userData.bank;

    // ================= BALANCE =================
    if (!cmd || cmd === "balance" || cmd === "bal") {
      return message.reply(
        `🏦 BANK ACCOUNT\n━━━━━━━━━━━━━━\n💼 Wallet: ${format(bank.wallet)}\n🏦 Bank: ${format(bank.balance)}\n📊 Net: ${format(bank.wallet + bank.balance)}\n💳 Credit: ${bank.creditScore}`
      );
    }

    // ================= DAILY =================
    if (cmd === "daily") {
      if (now() - bank.lastDaily < 86400) {
        const left = 86400 - (now() - bank.lastDaily);
        return message.reply(`⏳ Come back in ${Math.floor(left / 3600)}h`);
      }

      const reward = rand(1000, 3000);
      bank.wallet += reward;
      bank.lastDaily = now();

      await usersData.set(senderID, userData);
      return message.reply(`🎁 Daily +${format(reward)}`);
    }

    // ================= WORK =================
    if (cmd === "work") {
      const jobs = ["Dev", "Doctor", "Chef", "Pilot", "Artist"];
      const job = jobs[rand(0, jobs.length - 1)];
      const earn = rand(500, 3000);

      bank.wallet += earn;
      bank.lastWork = now();

      await usersData.set(senderID, userData);
      return message.reply(`💼 ${job}\n💰 +${format(earn)}`);
    }

    // ================= DEPOSIT =================
    if (cmd === "deposit" || cmd === "dep") {
      const amount = parseInt(args[1]);
      if (!amount || amount <= 0) return message.reply("❌ amount invalid");
      if (amount > bank.wallet) return message.reply("❌ not enough wallet");

      bank.wallet -= amount;
      bank.balance += amount;

      await usersData.set(senderID, userData);
      return message.reply(`🏦 Deposited ${format(amount)}`);
    }

    // ================= WITHDRAW =================
    if (cmd === "withdraw" || cmd === "with") {
      const amount = parseInt(args[1]);
      if (!amount || amount <= 0) return message.reply("❌ amount invalid");
      if (amount > bank.balance) return message.reply("❌ not enough bank");

      bank.balance -= amount;
      bank.wallet += amount;

      await usersData.set(senderID, userData);
      return message.reply(`💸 Withdrew ${format(amount)}`);
    }

    // ================= TRANSFER =================
    if (cmd === "transfer" || cmd === "send") {
      const targetID = args[1];
      const amount = parseInt(args[2]);

      if (!targetID || !amount) return message.reply("❌ transfer [uid] [amount]");
      if (amount > bank.wallet) return message.reply("❌ not enough money");

      let target = await usersData.get(targetID);
      if (!target) return message.reply("❌ user not found");

      if (!target.bank) {
        target.bank = {
          wallet: 1000,
          balance: 0,
          creditScore: 500,
          investments: [],
          businesses: [],
          properties: []
        };
      }

      bank.wallet -= amount;
      target.bank.wallet += amount;

      await usersData.set(senderID, userData);
      await usersData.set(targetID, target);

      return message.reply(`💸 Sent ${format(amount)} → ${targetID}`);
    }

    // ================= INVEST =================
    if (cmd === "invest") {
      const amount = parseInt(args[1]);
      const type = args[2]?.toLowerCase();

      if (!amount || !type) return message.reply("❌ invest [amount] [stock|crypto|bond]");
      if (amount > bank.wallet) return message.reply("❌ not enough wallet");

      const data = {
        stock: { risk: 0.4, mult: 1.8 },
        crypto: { risk: 0.7, mult: 3 },
        bond: { risk: 0.1, mult: 1.2 }
      };

      if (!data[type]) return message.reply("❌ invalid type");

      const d = data[type];
      const win = Math.random() < d.risk;
      const result = win ? amount * d.mult : amount * 0.5;

      bank.wallet -= amount;
      bank.investments.push({ type, result });

      await usersData.set(senderID, userData);

      return message.reply(`📈 ${type}\n💰 result: ${format(result)}`);
    }

    // ================= STOCKS =================
    if (cmd === "stocks") {
      const total = bank.investments.reduce((a, b) => a + b.result, 0);
      return message.reply(`📊 Investments: ${bank.investments.length}\n💰 Total: ${format(total)}`);
    }

    // ================= CRYPTO =================
    if (cmd === "crypto") {
      const coins = { BTC: 45000, ETH: 3000, SOL: 120 };

      let msg = "🪙 CRYPTO\n━━━━━━━━━━\n";
      for (const c in coins) {
        msg += `${c}: ${format(coins[c])}\n`;
      }

      return message.reply(msg);
    }

    // ================= BUSINESS =================
    if (cmd === "business") {
      const action = args[1];

      if (action === "buy") {
        return message.reply("🏪 buy system coming...");
      }

      if (action === "collect") {
        const income = bank.businesses.length * 5000;
        bank.wallet += income;

        await usersData.set(senderID, userData);
        return message.reply(`💼 +${format(income)}`);
      }
    }

    // 👉 PARTIE 2 CONTINUE ICI
  }
};
