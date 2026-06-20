/**
 * @author Shade & AI
 * @title Système d'Intérêts Bancaires Dynamiques
 * @name interest
 * @class interest
 * @version 2.0.0
 * @description Récupère les intérêts passifs générés par ton compte en banque avec des bonus boursiers.
 * @usage interest
 */

module.exports = {
  config: {
    name: "interest",
    version: "2.0.0",
    author: "Shade & AI",
    countDown: 10,
    role: 0,
    description: "💎 Collect or view bank interest with dynamic market changes",
    category: "economy"
  },

  onStart: async function ({ message, event, usersData }) {
    const { senderID } = event;

    // Récupération et structuration des données de l'utilisateur
    let user = await usersData.get(senderID);
    if (!user) user = {};
    if (!user.data) user.data = {};
    if (user.money === undefined) user.money = 0;

    // Vérification de l'existence d'un compte bancaire de base
    if (!user.data.bank) {
      return message.reply("❌ Tu n'as pas encore de compte bancaire enregistré. Utilise d'abord les fonctions de la banque centrale !");
    }

    if (!user.data.bank.lastInterest) {
      user.data.bank.lastInterest = 0;
    }

    const now = Date.now();
    const lastClaim = user.data.bank.lastInterest;
    const oneDay = 24 * 60 * 60 * 1000; // Cooldown de 24h

    // Gestion du temps d'attente restant
    if (now - lastClaim < oneDay) {
      const timeLeft = oneDay - (now - lastClaim);
      const hours = Math.floor(timeLeft / (60 * 60 * 1000));
      const minutes = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000));
      return message.reply(`⏳ Calme-toi, l'argent ne pousse pas si vite ! Reviens dans **${hours}h et ${minutes}m** pour le prochain relevé. 💎`);
    }

    const balance = user.data.bank.balance || 0;

    if (balance <= 0) {
      return message.reply("🏦 Ta crypto-valise et ton compte en banque sont à sec ! Dépose un peu d'argent pour générer des intérêts passifs.");
    }

    // 📈 FLUCUATION DU TAUX D'INTÉRÊT (Système de marché vivant)
    // Taux de base à 3% auquel on ajoute ou retire une variation aléatoire entre -1.5% et +2.5%
    const marketShift = (Math.random() * 4 - 1.5) / 100;
    const currentRate = Math.max(0.01, 0.03 + marketShift); // Minimum 1% de taux garanti

    let interest = Math.floor(balance * currentRate);

    // 🎰 ÉVÉNEMENTS FINANCIERS DE LA BANQUE (FUN RNG)
    let eventText = "Rien à signaler, l'économie mondiale est stable. 📉";
    const randEvent = Math.random();

    if (randEvent < 0.12) {
      // 🔥 BONUS : Le directeur est de bonne humeur
      const bonusCrypto = Math.floor(interest * 0.3);
      interest += bonusCrypto;
      eventText = `🔥 **Le Directeur régale !** La banque a fait des profits records sur le Bitcoin, tu prends un bonus de +$${bonusCrypto.toLocaleString()} !`;
    } else if (randEvent < 0.22) {
      // 💣 MALUS : Frais cachés stupides
      const tax = 25;
      interest = Math.max(0, interest - tax);
      eventText = `💣 **Frais de dossier !** La banque te retient -$${tax} pour l'abonnement mensuel aux capsules de café du personnel...`;
    } else if (balance > 100000 && randEvent < 0.40) {
      // 👑 Statut VIP pour les gros portefeuilles
      const vipBonus = 500;
      interest += vipBonus;
      eventText = `👑 **Avantage Fortune VIP !** Grâce à tes gros dépôts, le courtier t'accorde une prime d'investisseur d'élite de +$${vipBonus} !`;
    }

    // Application des calculs sur le compte en banque
    user.data.bank.balance += interest;
    user.data.bank.lastInterest = now;

    // Sauvegarde propre sans écraser le reste des variables (exp, pseudo, etc.)
    await usersData.set(senderID, {
      money: user.money,
      exp: user.exp || 0,
      data: user.data
    });

    return message.reply(
      `💎 𝗜𝗡𝗧𝗘𝗥𝗘𝗦𝗧 𝗖𝗢𝗟𝗟𝗘𝗖𝗧𝗘𝗗 💖\n━━━━━━━━━━━━━━\n` +
      `🏛️ **Capital placé :** $${balance.toLocaleString()}\n` +
      `📈 **Taux du jour :** ${(currentRate * 100).toFixed(2)}%\n` +
      `💰 **Gain d'intérêt :** +$${interest.toLocaleString()}\n` +
      `━━━━━━━━━━━━━━\n` +
      `📢 **Marché :** ${eventText}\n\n` +
      `🏦 **Nouveau solde en banque :** $${user.data.bank.balance.toLocaleString()}`
    );
  }
};
