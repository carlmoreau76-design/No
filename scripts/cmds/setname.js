async function checkShortCut(nickname, uid, usersData) {
	try {
		/\{userName\}/gi.test(nickname) ? nickname = nickname.replace(/\{userName\}/gi, await usersData.getName(uid)) : null;
		/\{userID\}/gi.test(nickname) ? nickname = nickname.replace(/\{userID\}/gi, uid) : null;
		return nickname;
	}
	catch (e) {
		return nickname;
	}
}

module.exports = {
	config: {
		name: "setname",
		version: "1.6",
		author: "NTKhang × Gemini",
		countDown: 5,
		role: 0,
		description: {
			fr: "Change le surnom des membres (par tag, all, ou en répondant à un message)",
			en: "Change nickname of members (by tag, all, or replying to a message)"
		},
		category: "utility",
		guide: {
			fr: "   {pn} <nouveau nom> : change votre propre surnom\n   {pn} @tag <nouveau nom> : change le surnom des membres tagués\n   {pn} all <nouveau nom> : change le surnom de tout le monde\n   En répondant (reply) au message de quelqu'un :\n   {pn} <nouveau nom> : change son surnom\n   {pn} (vide) : supprime son surnom"
		}
	},

	langs: {
		fr: {
			error: "Une erreur est survenue lors du changement de surnom."
		},
		en: {
			error: "An error has occurred, try turning off the invite link feature in the group and try again later"
		}
	},

	onStart: async function ({ args, message, event, api, usersData, getLang }) {
		const mentions = Object.keys(event.mentions);
		let uids = [];
		let nickname = args.join(" ");

		// 📩 CAS 1 : L'utilisateur répond (reply) au message de quelqu'un
		if (event.type === "message_reply") {
			uids = [event.messageReply.senderID];
			nickname = nickname.trim(); // Le texte restant devient le surnom (vide = suppression)
		}
		// 👥 CAS 2 : Option "all" pour tout le groupe
		else if (args[0] === "all" || mentions.includes(event.threadID)) {
			uids = (await api.getThreadInfo(event.threadID)).participantIDs;
			nickname = args[0] === "all" ? args.slice(1).join(" ") : nickname.replace(event.mentions[event.threadID], "").trim();
		}
		// 🏷️ CAS 3 : Surnom par mention(s) @tag
		else if (mentions.length) {
			uids = mentions;
			const allName = new RegExp(
				Object.values(event.mentions)
					.map(name => name.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&"))
					.join("|")
				, "g"
			);
			nickname = nickname.replace(allName, "").trim();
		}
		// 👤 CAS 4 : Aucun cas ci-dessus, s'applique à soi-même
		else {
			uids = [event.senderID];
			nickname = nickname.trim();
		}

		try {
			const uid = uids.shift();
			// Si nickname est vide, api.changeNickname supprime le surnom sur Messenger
			await api.changeNickname(await checkShortCut(nickname, uid, usersData), event.threadID, uid);
		}
		catch (e) {
			return message.reply(getLang("error"));
		}

		// Traitement du reste des UIDs si plusieurs cibles (ex: mode 'all' ou plusieurs tags)
		for (const uid of uids) {
			try {
				await api.changeNickname(await checkShortCut(nickname, uid, usersData), event.threadID, uid);
			} catch (err) {}
		}
	}
};
