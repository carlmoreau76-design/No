const fs = require("fs-extra");

const ALLOWED_UID = "61573867120837"; // 💖 owner only

module.exports = {
	config: {
		name: "getfbstate",
		aliases: ["getstate", "getcookie"],
		version: "2.0 angel ultra safe",
		author: "Shade ✨ Angel Ultra Edit",
		countDown: 5,
		role: 3,
		description: {
			en: "💖 Ultra secure fbstate tool (owner only + confirm + logs)"
		},
		category: "owner",
		guide: {
			en: "{pn} [cookie|string]"
		}
	},

	langs: {
		en: {
			noPerm: "💔✨ Access denied. Angel Ultra mode locked.",
			wait: "💖✨ Preparing secure fbstate...",
			confirm: "🌸💖 Confirm fbstate export?\nReact 👍 to continue",
			cancel: "💔✨ Cancelled by Angel protection system",
			done: "💖✨ Sent securely in private inbox"
		}
	},

	onStart: async function ({ message, api, event, args, getLang }) {

		// 💖 SECURITY CHECK
		if (event.senderID !== ALLOWED_UID) {
			return message.reply(getLang("noPerm"));
		}

		message.reply(getLang("wait"));

		let fbstate;
		let fileName;

		if (["cookie", "cookies", "c"].includes(args[0])) {
			fbstate = JSON.stringify(
				api.getAppState().map(e => ({
					name: e.key,
					value: e.value
				})),
				null,
				2
			);
			fileName = "cookies.json";
		}
		else if (["string", "str", "s"].includes(args[0])) {
			fbstate = api.getAppState()
				.map(e => `${e.key}=${e.value}`)
				.join("; ");
			fileName = "cookiesString.txt";
		}
		else {
			fbstate = JSON.stringify(api.getAppState(), null, 2);
			fileName = "appState.json";
		}

		const pathSave = `${__dirname}/tmp/${fileName}`;
		fs.writeFileSync(pathSave, fbstate);

		// 💖 CONFIRMATION SYSTEM (ULTRA SAFE)
		return message.reply(getLang("confirm"), (err, info) => {

			global.GoatBot.onReaction.set(info.messageID, {
				commandName: "getfbstate",
				author: event.senderID,
				filePath: pathSave
			});
		});
	},

	onReaction: async function ({ api, event, Reaction, message }) {

		if (event.userID !== Reaction.author) return;

		if (event.reaction !== "👍") {
			fs.unlinkSync(Reaction.filePath);
			return message.reply("💔✨ Cancelled safely");
		}

		api.sendMessage({
			body: "🌸💖 Angel Ultra Secure fbstate file",
			attachment: fs.createReadStream(Reaction.filePath)
		}, event.senderID, () => {
			fs.unlinkSync(Reaction.filePath);
		});

		message.reply("💖✨ Sent securely in your inbox");
	}
};
