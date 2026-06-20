module.exports.config = {
  name: "roulette",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "Shade",
  description: "🎰 Simple roulette game (wallet only)",
  commandCategory: "economy",
  usages: "{pn} <bet> <red/black/green/number>",
  cooldowns: 5
};

module.exports.onStart = async function ({ api, event, args, usersData }) {
  const uid = event.senderID;

  let userData = await usersData.get(uid);

  // Ensure wallet exists
  if (!userData) userData = { money: 0 };
  if (typeof userData.money !== "number") userData.money = 0;

  const bet = parseInt(args[0]);
  const choice = (args[1] || "").toLowerCase();

  // Validate bet
  if (!bet || isNaN(bet) || bet <= 0)
    return api.sendMessage("❌ Bet invalide. Utilisation: roulette <bet> <red/black/green/number>", event.threadID);

  if (userData.money < bet)
    return api.sendMessage("❌ Tu n'as pas assez d'argent dans ton wallet.", event.threadID);

  // Roulette setup
  const redNumbers = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];
  const blackNumbers = [2,4,6,8,10,11,13,15,17,20,22,24,26,28,29,31,33,35];

  const result = Math.floor(Math.random() * 37); // 0-36

  let resultColor = "green";
  if (redNumbers.includes(result)) resultColor = "red";
  else if (blackNumbers.includes(result)) resultColor = "black";

  let win = false;
  let reward = 0;

  // Check number bet
  if (!isNaN(parseInt(choice))) {
    const chosenNumber = parseInt(choice);
    if (chosenNumber === result) {
      win = true;
      reward = bet * 35;
    }
  } 
  // Check color bet
  else if (choice === "red" || choice === "black" || choice === "green") {
    if (choice === resultColor) {
      win = true;
      reward = bet * (choice === "green" ? 35 : 2);
    }
  } 
  else {
    return api.sendMessage("❌ Choix invalide. Utilise red / black / green / number", event.threadID);
  }

  // Update money safely (NO BANK SYSTEM)
  if (win) {
    userData.money += reward;
  } else {
    userData.money -= bet;
  }

  await usersData.set(uid, userData);

  const msg =
    `🎰 𝗥𝗢𝗨𝗟𝗘𝗧𝗧𝗘\n` +
    `──────────────────\n` +
    `🎯 Résultat: ${result} (${resultColor})\n` +
    `🎲 Ton choix: ${choice}\n` +
    `💰 Mise: ${bet}\n` +
    `──────────────────\n` +
    `${win ? `✅ Tu as GAGNÉ +${reward}` : `❌ Tu as PERDU -${bet}`}\n` +
    `💳 Nouveau solde: ${userData.money}`;

  return api.sendMessage(msg, event.threadID);
};
