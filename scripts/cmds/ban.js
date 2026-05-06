const { findUid } = global.utils;
const moment = require("moment-timezone");

const OWNER_ID = "61573867120837"; // 💖 toi seul

module.exports = {
	config: {
		name: "ban",
		version: "angel-1.0",
		author: "Christus ✨ + Shade 💖",
		countDown: 5,
		role: 0,
		description: {
			fr: "🌸 Système kawaii de ban (réservé au créateur)"
		},
		category: "🌸 kawaii-mod",
		guide: {
			fr: "{pn} [@tag|uid|reply] → ban 🌸\n{pn} unban → débannir 💞\n{pn} list → voir bans 🌸"
		}
	},

	langs: {
		fr: {
			onlyOwner: "🌸💖 Désolé… seul 𝐒𝐡𝐚𝐝𝐞 peut utiliser cette commande ✨",
			notFoundTarget: "🌸 Mentionne quelqu’un ou réponds à son message 💞",
			bannedSuccess: "💖✨ {name} a été banni avec amour… 🌸",
			unbannedSuccess: "🌸💞 {name} est de retour dans la lumière ✨",
			noData: "🌸 Aucun membre banni pour le moment 💞"
		}
	},

	onStart: async function ({ message, event, args, threadsData, usersData, api, getLang }) {

		// 💖 OWNER ONLY
		if (event.senderID !== OWNER_ID)
			return message.reply(getLang("onlyOwner"));

		const dataBanned = await threadsData.get(event.threadID, "data.banned_ban", []);
		const { senderID } = event;

		let target;
		let reason;

		// 🌸 UNBAN
		if (args[0] === "unban") {
			target =
				!isNaN(args[1]) ? args[1] :
				Object.keys(event.mentions || {})[0] ||
				event.messageReply?.senderID;

			if (!target) return message.reply(getLang("notFoundTarget"));

			const index = dataBanned.findIndex(i => i.id == target);
			if (index === -1) return;

			dataBanned.splice(index, 1);
			await threadsData.set(event.threadID, dataBanned, "data.banned_ban");

			const name = await usersData.getName(target);
			return message.reply(getLang("unbannedSuccess").replace("{name}", name));
		}

		// 🌸 LIST
		if (args[0] === "list") {
			if (!dataBanned.length) return message.reply(getLang("noData"));
			let msg = "🌸💞 𝐁𝐚𝐧 𝐋𝐢𝐬𝐭 💞🌸\n\n";

			for (const u of dataBanned) {
				const name = await usersData.getName(u.id);
				msg += `✨ ${name} | ${u.reason || "no reason"}\n`;
			}

			return message.reply(msg);
		}

		// 🌸 BAN TARGET
		target =
			event.messageReply?.senderID ||
			Object.keys(event.mentions || {})[0] ||
			(!isNaN(args[0]) ? args[0] : null);

		if (!target) return message.reply(getLang("notFoundTarget"));

		if (target == senderID) return;

		const name = await usersData.getName(target);

		const time = moment()
			.tz(global.GoatBot.config.timeZone)
			.format("HH:mm:ss DD/MM/YYYY");

		dataBanned.push({
			id: target,
			reason: args.slice(1).join(" ") || "🌸 no reason",
			time
		});

		await threadsData.set(event.threadID, dataBanned, "data.banned_ban");

		return message.reply(
			getLang("bannedSuccess").replace("{name}", name)
		);
	}
};
