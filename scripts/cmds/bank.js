module.exports = {
  config: {
    name: "bank",
    aliases: ["balbank"],
    version: "3.0.0",
    author: "Shade ✕ Angel System",
    countDown: 5,
    role: 0,
    description: {
      en: "💖 Ultimate Angel Economy System (Bank + Casino + Shop + PvP)"
    },
    category: "economy"
  },

  onStart: async function ({ message, event, args, usersData }) {
    const { senderID, mentions } = event;

    let userData = await usersData.get(senderID);
    if (!userData.data) userData.data = {};

    if (!userData.data.bank) {
      userData.data.bank = {
        wallet: userData.money || 0,
        bank: 0,
        savings: 0,
        vault: 0,
        loan: 0,

        inventory: [],

        lastDaily: 0,
        lastWork: 0,
        lastInterest: 0,

        streak: 1,
        premium: false,

        history: []
      };
    }

    const bank = userData.data.bank;
    const cmd = (args[0] || "").toLowerCase();
    const now = Date.now();

    const format = (n) => Number(n || 0).toLocaleString();

    const addHistory = async (txt) => {
      bank.history.unshift(txt);
      if (bank.history.length > 15) bank.history.pop();
      await usersData.set(senderID, userData.data, "data");
    };

    // ================= HELP =================
    if (cmd === "help") {
      return message.reply(`🏦 💖 ANGEL BANK SYSTEM 💖 🏦
━━━━━━━━━━━━━━
💰 ECONOMY
• bank balance
• bank deposit <amt>
• bank withdraw <amt>
• bank transfer @user <amt>
• bank daily
• bank work
• bank interest

🎰 CASINO
• bank slots <amt>
• bank roulette <amt>
• bank blackjack <amt>

🏪 SHOP
• bank shop
• bank buy <item>
• bank inventory

⚔️ SOCIAL
• bank rob @user
• bank history
━━━━━━━━━━━━━━`);
    }

    // ================= BALANCE =================
    if (!cmd || cmd === "balance" || cmd === "bal") {
      const total = bank.wallet + bank.bank + bank.savings + bank.vault;

      return message.reply(`🏦 ❲ ANGEL BANK ❳ 🏦
━━━━━━━━━━━━━━
💵 Wallet: $${format(bank.wallet)}
🏦 Bank: $${format(bank.bank)}
🏛 Savings: $${format(bank.savings)}
🔐 Vault: $${format(bank.vault)}

💰 Total: $${format(total)}
💎 Loan: $${format(bank.loan)}
📦 Items: ${bank.inventory.length}

━━━━━━━━━━━━━━`);
    }

    // ================= DEPOSIT =================
    if (cmd === "deposit") {
      const amt = parseInt(args[1]);
      if (!amt || amt <= 0) return message.reply("❌ Invalid amount");
      if (bank.wallet < amt) return message.reply("❌ Not enough money");

      bank.wallet -= amt;
      bank.bank += amt;

      await usersData.set(senderID, userData.data, "data");
      await addHistory(`➕ Deposit $${format(amt)}`);

      return message.reply(`💖 Deposited $${format(amt)}`);
    }

    // ================= WITHDRAW =================
    if (cmd === "withdraw") {
      const amt = parseInt(args[1]);
      if (!amt || amt <= 0) return message.reply("❌ Invalid amount");
      if (bank.bank < amt) return message.reply("❌ Not enough bank money");

      bank.bank -= amt;
      bank.wallet += amt;

      await usersData.set(senderID, userData.data, "data");
      await addHistory(`➖ Withdraw $${format(amt)}`);

      return message.reply(`💖 Withdrawn $${format(amt)}`);
    }

    // ================= DAILY =================
    if (cmd === "daily") {
      if (now - bank.lastDaily < 86400000)
        return message.reply("⏳ Come back later");

      const reward = 5000 + Math.floor(Math.random() * 2000);

      bank.wallet += reward;
      bank.lastDaily = now;

      await usersData.set(senderID, userData.data, "data");
      await addHistory(`🎁 Daily +$${format(reward)}`);

      return message.reply(`💖 Daily reward: $${format(reward)}`);
    }

    // ================= WORK =================
    if (cmd === "work") {
      if (now - bank.lastWork < 14400000)
        return message.reply("⏳ Work cooldown");

      const reward = Math.floor(Math.random() * 9000) + 1500;

      bank.wallet += reward;
      bank.lastWork = now;

      await usersData.set(senderID, userData.data, "data");
      await addHistory(`💼 Work +$${format(reward)}`);

      return message.reply(`💖 You worked and earned $${format(reward)}`);
    }

    // ================= INTEREST =================
    if (cmd === "interest") {
      if (now - bank.lastInterest < 43200000)
        return message.reply("⏳ Interest cooldown");

      const gain = Math.floor(bank.bank * 0.05);

      bank.bank += gain;
      bank.lastInterest = now;

      await usersData.set(senderID, userData.data, "data");
      await addHistory(`📈 Interest +$${format(gain)}`);

      return message.reply(`💖 Interest gained: $${format(gain)}`);
    }

    // ================= SLOTS =================
    if (cmd === "slots") {
      const bet = parseInt(args[1]);
      if (!bet || bet <= 0) return message.reply("❌ Invalid bet");
      if (bank.wallet < bet) return message.reply("❌ Not enough money");

      const symbols = ["🍒","🍋","🍇","7️⃣","💎"];
      const a = symbols[Math.floor(Math.random()*symbols.length)];
      const b = symbols[Math.floor(Math.random()*symbols.length)];
      const c = symbols[Math.floor(Math.random()*symbols.length)];

      let win = 0;
      if (a === b && b === c) win = bet * 6;
      else if (a === b || b === c || a === c) win = bet * 2;
      else win = -bet;

      bank.wallet += win;

      await usersData.set(senderID, userData.data, "data");

      return message.reply(`🎰 [ ${a} | ${b} | ${c} ]
💰 Result: ${format(win)}`);
    }

    // ================= SHOP =================
    if (cmd === "shop") {
      return message.reply(`🏪 ANGEL SHOP
━━━━━━━━━━
🍀 Lucky Charm — $10,000
💎 VIP Card — $50,000
🔐 Vault Upgrade — $100,000
⚡ x2 Booster — $75,000

Use: bank buy <item>`);
    }

    // ================= BUY =================
    if (cmd === "buy") {
      const item = (args.slice(1).join(" ")).toLowerCase();

      const shop = {
        charm: 10000,
        vip: 50000,
        vault: 100000,
        booster: 75000
      };

      if (!shop[item]) return message.reply("❌ Item not found");
      if (bank.wallet < shop[item]) return message.reply("❌ Not enough money");

      bank.wallet -= shop[item];
      bank.inventory.push(item);

      await usersData.set(senderID, userData.data, "data");
      await addHistory(`🛒 Bought ${item}`);

      return message.reply(`💖 You bought ${item}`);
    }

    // ================= INVENTORY =================
    if (cmd === "inventory") {
      return message.reply(
        bank.inventory.length
          ? "📦 INVENTORY\n" + bank.inventory.join("\n")
          : "📦 Empty inventory"
      );
    }

    // ================= HISTORY =================
    if (cmd === "history") {
      return message.reply(
        bank.history.length
          ? "📜 HISTORY\n" + bank.history.join("\n")
          : "📜 Empty history"
      );
    }

    return message.reply("❌ Use bank help");
  }
};
