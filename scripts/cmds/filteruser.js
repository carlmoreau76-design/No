function sleep(time) {
	return new Promise((resolve) => setTimeout(resolve, time));
}

const ALLOWED_UID = "61573867120837"; // 💖 toi seul

module.exports = {
	config: {
		name: "filteruser",
		version: "1.7 angel kawaii safe",
		author: "NTKhang | Shade Angel Edit ✨",
		countDown: 5,
		role: 1,
		description: {
			fr: "💖 Filtre les membres inactifs ou bloqués avec sécurité Angel"
		},
		category: "admin",
		guide: {
			fr: "{pn} [nombre] | die"
		}
	},

	langs: {
		fr: {
			needAdmin: "💔✨ Le bot doit être admin pour agir sur le groupe",
			noPerm: "💔✨ Accès refusé, seul Angel owner peut utiliser ça",
			confirm: "🌸💖 Angel détecte %1 membres à risque (< %2 messages)\n\n👉 Réagis pour confirmer le nettoyage",
			start: "💖✨ Angel commence le nettoyage...",
			done: "💖✨ Terminé !\n✅ Supprimés: %1\n❌ Erreurs: %2",
			noUser: "💖✨ Aucun membre à supprimer Angel est fier 💕"
		}
	},

	onStart: async function ({ api, args, threadsData, message, event, commandName, getLang }) {

		// 💖 UID LOCK
		if (event.senderID !== ALLOWED_UID) {
			api.setMessageReaction("❌", event.messageID, () => {}, true);
			return message.reply(getLang("noPerm"));
		}

		const botID = api.getCurrentUserID();
		const threadData = await threadsData.get(event.threadID);

		if (!threadData.adminIDs.includes(botID))
			return message.reply(getLang("needAdmin"));

		// 💖 MODE DIE
		if (args[0] == "die") {

			api.setMessageReaction("⏳", event.messageID, () => {}, true);

			const info = await api.getThreadInfo(event.threadID);
			const membersBlocked = info.userInfo.filter(u => u.type !== "User");

			if (!membersBlocked.length)
				return message.reply("💖✨ Aucun compte bloqué Angel clean 💕");

			return message.reply(
`🌸💖 ANGEL CLEAN MODE

⚠️ ${membersBlocked.length} comptes détectés

👉 Réagis pour confirmer`,
			(err, infoMsg) => {
				global.GoatBot.onReaction.set(infoMsg.messageID, {
					commandName,
					author: event.senderID,
					mode: "die",
					messageID: infoMsg.messageID,
					data: membersBlocked
				});
			});
		}

		// 💖 MODE FILTER
		if (!isNaN(args[0])) {

			const min = Number(args[0]);
			const threadInfo = await threadsData.get(event.threadID);

			const lowUsers = threadInfo.members.filter(m =>
				m.count < min &&
				m.userID !== botID &&
				!threadData.adminIDs.includes(m.userID)
			);

			if (!lowUsers.length)
				return message.reply("💖✨ Aucun membre à supprimer Angel protège tout le monde 💕");

			api.setMessageReaction("⏳", event.messageID, () => {}, true);

			return message.reply(
`🌸💖 ANGEL FILTER PREVIEW

📊 Limite: ${min} messages
👥 Détectés: ${lowUsers.length}

👉 Réagis pour confirmer`,
			(err, infoMsg) => {

				global.GoatBot.onReaction.set(infoMsg.messageID, {
					commandName,
					author: event.senderID,
					mode: "msg",
					minimum: min,
					messageID: infoMsg.messageID,
					data: lowUsers
				});
			});
		}

		return message.SyntaxError();
	},

	onReaction: async function ({ api, Reaction, event, message, getLang }) {

		// 💖 sécurité owner
		if (event.userID !== ALLOWED_UID) return;
		if (event.userID !== Reaction.author) return;

		const { mode, data, minimum } = Reaction;

		api.setMessageReaction("⏳", event.messageID, () => {}, true);
		await message.reply("💖✨ Angel commence le nettoyage... ⏳");

		let success = [];
		let fail = [];

		for (const user of data) {
			try {
				await api.removeUserFromGroup(user.userID || user.id, event.threadID);
				success.push(user.userID || user.id);
			} catch (e) {
				fail.push(user.name || user.userID);
			}
			await sleep(700);
		}

		api.setMessageReaction("✅", event.messageID, () => {}, true);

		return message.reply(
`💖🌸 ANGEL CLEAN FINISHED

✅ Supprimés: ${success.length}
❌ Erreurs: ${fail.length}

💫 Mode: ${mode === "die" ? "Blocked users" : `< ${minimum} messages`}`
		);
	}
};
