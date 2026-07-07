const moment = require("moment-timezone");

module.exports = {
  config: {
    name: "daily",
    version: "2.1.0",
    author: "Christus + Shade edit × Gemini",
    countDown: 5,
    role: 0,
    description: "Récompense quotidienne avec système de streak, banque et bonus RNG",
    category: "economy"
  },

  langs: {
    fr: {
      already: "❌ Vous avez déjà réclamé votre récompense quotidienne pour aujourd'hui.",
      jackpot: "💎 **[JACKPOT]** Une chance inouïe vient de multiplier vos gains !"
    }
  },

  onStart: async function ({ message, event, usersData, getLang }) {
    const { senderID } = event;
    const TIMEZONE = "Europe/Paris"; // Ajustable selon ta zone préférée
    const dateTime = moment.tz(TIMEZONE).format("DD/MM/YYYY");

    try {
      // Récupération sécurisée du profil utilisateur
      let user = await usersData.get(senderID);
      if (!user) user = {};
      if (!user.data) user.data = {};
      if (user.money === undefined) user.money = 0;
      if (user.exp === undefined) user.exp = 0;

      // Initialisation du sous-objet daily si inexistant
      if (!user.data.daily) {
        user.data.daily = {
          last: null,
          streak: 0
        };
      }

      // Initialisation du sous-objet bank si inexistant
      if (!user.data.bank) {
        user.data.bank = {
          wallet: 0,
          balance: 0,
          cardNumber: null,
          transactions: [],
          loan: 0
        };
      }

      // Vérification anti-spam journalier
      if (user.data.daily.last === dateTime) {
        return message.reply(getLang("already"));
      }

      // 🔥 SYSTÈME DE SÉRIE (STREAK)
      const yesterday = moment.tz(TIMEZONE).subtract(1, "days").format("DD/MM/YYYY");
      if (user.data.daily.last === yesterday) {
        user.data.daily.streak += 1;
      } else {
        user.data.daily.streak = 1;
      }

      // 📈 CALCUL DES RÉCOMPENSES DE BASE
      const baseCoin = 100;
      const baseExp = 10;
      const multiplier = 1 + (user.data.daily.streak * 0.2);
      
      let coin = Math.floor(baseCoin * multiplier);
      let exp = Math.floor(baseExp * multiplier);
      let bonusText = "Aucun";

      // 🎰 SYSTÈME DE BONUS ALÉATOIRES (RNG)
      const rand = Math.random();
      if (rand < 0.05) {
        coin *= 5;
        bonusText = "💎 JACKPOT x5";
        message.reply(getLang("jackpot"));
      } else if (rand < 0.15) {
        coin *= 2;
        bonusText = "🔥 Double Bonus";
      } else if (rand < 0.25) {
        exp *= 2;
        bonusText = "✨ Boost d'XP";
      }

      // 💣 FACTEUR DE RISQUE (Petite malchance)
      if (Math.random() < 0.03) {
        coin = Math.floor(coin * 0.5);
        bonusText = "💣 Malus de Malchance (-50%)";
      }

      // Mettre à jour les valeurs de l'utilisateur
      user.money += coin;
      user.exp += exp;

      // Liaison avec le module bancaire interne
      user.data.bank.wallet = user.money;
      user.data.daily.last = dateTime;

      // Sauvegarde définitive des données modifiées
      await usersData.set(senderID, {
        money: user.money,
        exp: user.exp,
        data: user.data
      });

      // Envoi du rapport final (Style épuré et Pro)
      let msg = `╭─ 🪐 𝗗𝗔𝗜𝗟𝗬 𝗥𝗘𝗪𝗔𝗥𝗗 ────────╮\n`;
      msg += `│ 💰 Argent : +${coin.toLocaleString()} coins\n`;
      msg += `│ ✨ Expérience : +${exp.toLocaleString()} XP\n`;
      msg += `│ 🔥 Série actuelle : ${user.data.daily.streak} jour(s)\n`;
      msg += `│ 🎁 Bonus appliqué : ${bonusText}\n`;
      msg += `├─ 🏦 𝗦𝗜𝗧𝗨𝗔𝗧𝗜𝗢𝗡 𝗕𝗔𝗡𝗖𝗔𝗜𝗥𝗘 ────┤\n`;
      msg += `│ 💵 Solde Portefeuille : $${user.money.toLocaleString()}\n`;
      msg += `╰────────────────────────────╯`;

      return message.reply(msg);

    } catch (err) {
      console.error("Erreur commande daily :", err);
      return message.reply("❌ Une erreur est survenue lors de l'attribution de votre récompense.");
    }
  }
};
