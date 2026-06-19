module.exports = {
  config: {
    name: "roulette",
    version: "1.0",
    author: "Shade",
    countDown: 10,
    role: 0,
    description: "🎰 Casino roulette system",
    category: "economy",
    guide: {
      en: "{pn} <bet> <red/black/green/number>"
    }
  },

  onStart: async function ({ message, event, args, usersData }) {
    const { senderID } = event;

    const bet = parseInt(args[0]);
    const choice = (args[1] || "").toLowerCase();

    if (isNaN(bet) || bet <= 0) {
      return message.reply("❌ Invalid bet amount!");
    }

    const user = await usersData.get(senderID);

    if (user.money < bet) {
      return message.reply(`❌ You don't have enough money.`);
    }

    const rouletteNumbers = Array.from({ length: 37 }, (_, i) => i); // 0-36

    const redNumbers = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];
    const blackNumbers = [2,4,6,8,10,11,13,15,17,20,22,24,26,28,29,31,33,35];

    const result = rouletteNumbers[Math.floor(Math.random() * rouletteNumbers.length)];

    let color = "green";
    if (redNumbers.includes(result)) color = "red";
    if (blackNumbers.includes(result)) color = "black";

    let winnings = 0;
    let status = "";

    // 🎯 NUMBER BET (x35)
    if (!isNaN(parseInt(choice)) && parseInt(choice) === result) {
      winnings = bet * 35;
      status = "💥 PERFECT NUMBER HIT!";
    }

    // 🔴 RED / ⚫ BLACK BET (x2)
    else if (choice === color) {
      winnings = bet * 2;
      status = "🔥 COLOR WIN!";
    }

    // ❌ LOSS
    else {
      winnings = -bet;
      status = "💸 YOU LOST!";
    }

    const newBalance = user.money + winnings;

    await usersData.set(senderID, {
      money: newBalance
    });

    return message.reply(
      `🎰 𝗥𝗢𝗨𝗟𝗘𝗧𝗧𝗘 💎\n━━━━━━━━━━━━━━\n` +
      `🎯 Number: ${result}\n` +
      `🎨 Color: ${color.toUpperCase()}\n\n` +
      `📊 Choice: ${choice}\n` +
      `💰 Bet: $${bet}\n\n` +
      `✨ ${status}\n` +
      `💵 Result: ${winnings >= 0 ? "+" : ""}$${winnings}\n` +
      `🏦 New Balance: $${newBalance}\n` +
      `━━━━━━━━━━━━━━`
    );
  }
};
