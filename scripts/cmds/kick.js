module.exports = {
	config: {
		name: "kick",
		version: "1.3",
		author: "Shade",
		countDown: 5,
		role: 2,
		description: {
			en: "Angel removes a member softly (owner only)"
		},
		category: "box chat"
	},

	langs: {
		en: {
			onlyOwner: "🌸 Sorry… only my creator can use this command.",
			needAdmin: "🌸 I need admin permission to do that…",
			noTarget: "🌸 I need someone to gently remove…",
			success: "🌸 User softly removed… 💫"
		}
	},

	onStart: async function ({ message, event, api, args, threadsData, getLang }) {
		const OWNER_UID = "61573867120837";

		// 🌸 OWNER ONLY
		if (event.senderID !== OWNER_UID) {
			return message.reply(getLang("onlyOwner"));
		}

		// 🌸 CHECK BOT ADMIN
		const threadInfo = await api.getThreadInfo(event.threadID);
		const botID = api.getCurrentUserID();

		if (!threadInfo.adminIDs.some(a => a.id === botID)) {
			return message.reply(getLang("needAdmin"));
		}

		let targetID;

		// reply mode
		if (event.messageReply) {
			targetID = event.messageReply.senderID;
		}

		// mention mode
		if (Object.keys(event.mentions || {}).length > 0) {
			targetID = Object.keys(event.mentions)[0];
		}

		if (!targetID) {
			return message.reply(getLang("noTarget"));
		}

		try {
			await api.removeUserFromGroup(targetID, event.threadID);

			return message.reply(
				`🌸 𝗔𝗻𝗴𝗲𝗹 𝗞𝗶𝗰𝗸 🌸\n━━━━━━━━━━\nL’utilisateur a été retiré doucement du chat 💫\nBonne continuation…`
			);

		} catch (err) {
			return message.reply("🌸 Oups… impossible de retirer cette personne.");
		}
	}
};
