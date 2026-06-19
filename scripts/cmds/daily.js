const moment = require("moment-timezone");

module.exports = {
	config: {
		name: "daily",
		version: "2.0",
		author: "Christus + Shade edit",
		countDown: 5,
		role: 0,
		description: "Daily reward + bank system + streak + RNG",
		category: "economy"
	},

	langs: {
		fr: {
			already: "💔 Tu as déjà pris ton daily aujourd’hui !",
			reward: "🎉 Daily Reward\n━━━━━━━━━━━━━━\n💰 +%1 coins\n✨ +%2 XP\n🔥 Streak: x%3\n🎁 Bonus: %4\n━━━━━━━━━━━━━━",
			streakReset: "💔 Ton streak a été reset...",
			jackpot: "💎 JACKPOT ! Tu as gagné un énorme bonus !!"
		}
	},

	onStart: async function ({ message, event, usersData, getLang }) {
		const { senderID } = event;
		const dateTime = moment.tz("Asia/Ho_Chi_Minh").format("DD/MM/YYYY");

		const user = await usersData.get(senderID);

		if (!user.data.daily) {
			user.data.daily = {
				last: null,
				streak: 0
			};
		}

		if (user.data.daily.last === dateTime)
			return message.reply(getLang("already"));

		// 🔥 STREAK SYSTEM
		const yesterday = moment.tz("Asia/Ho_Chi_Minh").subtract(1, "days").format("DD/MM/YYYY");

		if (user.data.daily.last === yesterday) {
			user.data.daily.streak += 1;
		} else {
			user.data.daily.streak = 1;
		}

		// 📈 BASE REWARD
		const baseCoin = 100;
		const baseExp = 10;

		const multiplier = 1 + (user.data.daily.streak * 0.2);

		let coin = Math.floor(baseCoin * multiplier);
		let exp = Math.floor(baseExp * multiplier);

		// 🎰 RANDOM BONUS
		let bonusText = "Aucun";
		const rand = Math.random();

		if (rand < 0.05) {
			coin *= 5;
			bonusText = "💎 JACKPOT x5";
			message.reply(getLang("jackpot"));
		} else if (rand < 0.15) {
			coin *= 2;
			bonusText = "🔥 x2 Bonus";
		} else if (rand < 0.25) {
			exp *= 2;
			bonusText = "✨ XP Boost";
		}

		// 💣 SMALL RISK (rare loss)
		if (Math.random() < 0.03) {
			coin = Math.floor(coin * 0.5);
			bonusText = "💣 Malchance (-50%)";
		}

		// 🏦 BANK LINK
		if (!user.data.bank) {
			user.data.bank = {
				wallet: 0,
				balance: 0,
				cardNumber: null,
				transactions: [],
				loan: 0
			};
		}

		user.money += coin;
		user.exp += exp;

		user.data.bank.wallet += coin;

		user.data.daily.last = dateTime;

		await usersData.set(senderID, {
			money: user.money,
			exp: user.exp,
			data: user.data
		});

		return message.reply(
			`💖 DAILY SYSTEM PRO\n━━━━━━━━━━━━━━\n` +
			`💰 +${coin} coins\n✨ +${exp} XP\n🔥 Streak: x${user.data.daily.streak}\n🎁 Bonus: ${bonusText}\n🏦 Bank Wallet +${coin}\n━━━━━━━━━━━━━━`
		);
	}
};
