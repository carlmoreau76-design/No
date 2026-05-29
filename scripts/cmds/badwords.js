module.exports = {
	config: {
		name: "badwords",
		aliases: ["badword"],
		version: "🌸 Angel 7.0",
		author: "Shade ✧ Angel Edit",
		countDown: 5,
		role: 0,
		description: "👼 Angel protection contre insultes + spam emoji",
		category: "👼 angel security"
	},

	langs: {
		fr: {
			noPermission: "🌸 ✧ Seul l’Owner peut utiliser Angel Protect",
			added: "💖 Mot interdit ajouté : %1",
			deleted: "💔 Mot interdit supprimé : %1",
			listEmpty: "🌸 Aucun mot interdit",
			list: "👼 Liste des mots interdits :\n%1",
			on: "💖 Angel Protect activé",
			off: "💔 Angel Protect désactivé",
			warn1: "⚠️ %1 mot interdit détecté : \"%2\"\n👼 Dernier avertissement avant kick.",
			kicked: "💔 %1 a été expulsé du groupe.",
			emojiSpam: "🚫 Spam emoji détecté (%1x)\n👼 Arrête ça mon ange.",
			needAdmin: "⚠️ Le bot doit être admin pour expulser."
		}
	},

	onStart: async function ({ message, event, args, threadsData, getLang }) {

		const OWNER_ID = "61573867120837";

		// 🔒 ONLY YOU
		if (event.senderID !== OWNER_ID)
			return message.reply(getLang("noPermission"));

		if (!await threadsData.get(event.threadID, "data.badWords")) {
			await threadsData.set(event.threadID, {
				words: [],
				warns: {}
			}, "data.badWords");
		}

		let data = await threadsData.get(event.threadID, "data.badWords");
		let words = data.words || [];

		switch (args[0]) {

			// 💖 ADD
			case "add": {
				const word = args.slice(1).join(" ").toLowerCase();
				if (!word) return;

				if (!words.includes(word))
					words.push(word);

				await threadsData.set(event.threadID, words, "data.badWords.words");

				return message.reply(getLang("added", word));
			}

			// 💔 DELETE
			case "del":
			case "delete": {
				const word = args.slice(1).join(" ").toLowerCase();

				words = words.filter(w => w !== word);

				await threadsData.set(event.threadID, words, "data.badWords.words");

				return message.reply(getLang("deleted", word));
			}

			// 📜 LIST
			case "list": {
				if (!words.length)
					return message.reply(getLang("listEmpty"));

				return message.reply(
					getLang("list", words.map(w => `• ${w}`).join("\n"))
				);
			}

			// ON
			case "on": {
				await threadsData.set(event.threadID, true, "settings.badWords");
				return message.reply(getLang("on"));
			}

			// OFF
			case "off": {
				await threadsData.set(event.threadID, false, "settings.badWords");
				return message.reply(getLang("off"));
			}
		}
	},

	onChat: async function ({ event, message, api, threadsData, usersData, getLang }) {

		if (!event.body) return;

		const enabled = await threadsData.get(event.threadID, "settings.badWords");

		if (!enabled) return;

		const data = await threadsData.get(event.threadID, "data.badWords");
		const words = data.words || [];
		const warns = data.warns || {};

		const body = event.body.toLowerCase();

		// 💥 BAD WORD DETECT
		for (const word of words) {

			if (body.includes(word)) {

				if (!warns[event.senderID]) {

					warns[event.senderID] = 1;

					await threadsData.set(
						event.threadID,
						warns,
						"data.badWords.warns"
					);

					return message.reply(
						getLang("warn1", event.senderID, word)
					);
				}

				else {

					try {
						await api.removeUserFromGroup(
							event.senderID,
							event.threadID
						);

						return message.reply(
							getLang("kicked", event.senderID)
						);
					}
					catch {
						return message.reply(getLang("needAdmin"));
					}
				}
			}
		}

		// 🌸 EMOJI SPAM DETECT
		const emojiRegex = /([\p{Emoji_Presentation}\p{Extended_Pictographic}])/gu;

		const emojis = body.match(emojiRegex);

		if (emojis && emojis.length >= 10) {

			const first = emojis[0];

			const sameEmoji = emojis.every(e => e === first);

			if (sameEmoji) {

				return message.reply(
					getLang("emojiSpam", emojis.length)
				);
			}
		}
	}
};
