const moment = require("moment-timezone");

module.exports = {
	config: {
		name: "daily",
		version: "1.3",
		author: "Christus",
		countDown: 5,
		role: 0,
		description: {
			fr: "cadeau quotidien kawaii 💖"
		},
		category: "jeu",
		guide: {
			fr: "{pn} → recevoir ton cadeau 🎁\n{pn} info → voir les récompenses 🌸"
		},
		envConfig: {
			rewardFirstDay: {
				coin: 100,
				exp: 10
			}
		}
	},

	langs: {
		fr: {
			monday: "Lundi 🌸",
			tuesday: "Mardi 💖",
			wednesday: "Mercredi ✨",
			thursday: "Jeudi 🌷",
			friday: "Vendredi 🎀",
			saturday: "Samedi 🌙",
			sunday: "Dimanche 💫",

			alreadyReceived: "💔 Tu as déjà pris ton cadeau aujourd’hui !",
			received: "🎉 Tu reçois %1 coins 💰 et %2 XP ✨"
		}
	},

	onStart: async function ({ args, message, event, envCommands, usersData, commandName, getLang }) {

		const reward = envCommands[commandName].rewardFirstDay;

		// 🌸 INFO
		if (args[0] === "info") {
			let msg = "🌸 𝗥é𝗰𝗼𝗺𝗽𝗲𝗻𝘀𝗲𝘀 𝗤𝘂𝗼𝘁𝗶𝗱𝗶𝗲𝗻𝗻𝗲𝘀 💖\n━━━━━━━━━━━━━━\n";

			for (let i = 1; i < 8; i++) {
				const getCoin = Math.floor(reward.coin * (1 + 20 / 100) ** ((i === 0 ? 7 : i) - 1));
				const getExp = Math.floor(reward.exp * (1 + 20 / 100) ** ((i === 0 ? 7 : i) - 1));

				const day =
					i === 7 ? getLang("sunday") :
					i === 6 ? getLang("saturday") :
					i === 5 ? getLang("friday") :
					i === 4 ? getLang("thursday") :
					i === 3 ? getLang("wednesday") :
					i === 2 ? getLang("tuesday") :
					getLang("monday");

				msg += `💖 ${day} → ${getCoin} 💰 | ${getExp} ✨ XP\n`;
			}

			msg += "━━━━━━━━━━━━━━";
			return message.reply(msg);
		}

		// 📅 DATE
		const dateTime = moment.tz("Asia/Ho_Chi_Minh").format("DD/MM/YYYY");
		const date = new Date();
		const currentDay = date.getDay();
		const { senderID } = event;

		const userData = await usersData.get(senderID);

		if (userData.data.lastTimeGetReward === dateTime)
			return message.reply("💔 Tu as déjà reçu ton cadeau aujourd’hui 🌸");

		const getCoin = Math.floor(reward.coin * (1 + 20 / 100) ** ((currentDay === 0 ? 7 : currentDay) - 1));
		const getExp = Math.floor(reward.exp * (1 + 20 / 100) ** ((currentDay === 0 ? 7 : currentDay) - 1));

		userData.data.lastTimeGetReward = dateTime;

		await usersData.set(senderID, {
			money: userData.money + getCoin,
			exp: userData.exp + getExp,
			data: userData.data
		});

		return message.reply(
			"🌸 𝗗𝗔𝗜𝗟𝗬 𝗥𝗘𝗪𝗔𝗥𝗗 💖\n━━━━━━━━━━━━━━\n" +
			`💰 Coins: ${getCoin}\n✨ XP: ${getExp}\n━━━━━━━━━━━━━━`
		);
	}
};
