const INTEREST_RATE = 0.03; // 3% par jour (modifiable)

module.exports = {
  config: {
    name: "interest",
    version: "1.0",
    author: "Shade",
    countDown: 10,
    role: 0,
    description: "💎 Collect or view bank interest",
    category: "economy"
  },

  onStart: async function ({ message, event, usersData }) {
    const { senderID } = event;

    const user = await usersData.get(senderID);

    if (!user.data?.bank?.cardNumber) {
      return message.reply("❌ You need a bank account first. Use !bank register");
    }

    if (!user.data.bank.lastInterest) {
      user.data.bank.lastInterest = 0;
    }

    const now = Date.now();
    const lastClaim = user.data.bank.lastInterest;

    const oneDay = 24 * 60 * 60 * 1000;

    if (now - lastClaim < oneDay) {
      return message.reply("⏳ You already collected your interest today. Come back later 💎");
    }

    const balance = user.data.bank.balance;

    if (balance <= 0) {
      return message.reply("🏦 Your bank balance is empty, no interest generated.");
    }

    const interest = Math.floor(balance * INTEREST_RATE);

    user.data.bank.balance += interest;
    user.data.bank.lastInterest = now;

    await usersData.set(senderID, {
      money: user.money,
      data: user.data
    });

    return message.reply(
      `💎 𝗜𝗡𝗧𝗘𝗥𝗘𝗦𝗧 𝗖𝗢𝗟𝗟𝗘𝗖𝗧𝗘𝗗 💖\n━━━━━━━━━━━━━━\n` +
      `🏦 Bank Balance: $${balance.toLocaleString()}\n` +
      `📈 Interest Rate: ${(INTEREST_RATE * 100)}%\n` +
      `💰 Earned: $${interest.toLocaleString()}\n` +
      `━━━━━━━━━━━━━━\n` +
      `✨ Your wealth is growing passively`
    );
  }
};
