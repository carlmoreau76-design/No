const axios = require('axios');
const defaultEmojiTranslate = "🌐✨";

module.exports = {
	config: {
		name: "translate",
		aliases: ["trans", "angeltrans"],
		version: "1.5",
		author: "NTKhang ✨ | Angel Kawaii by Shade 💖",
		countDown: 5,
		role: 0,
		description: {
			en: "🌸 Translate text with Angel kawaii magic",
			vi: "🌸 Dịch văn bản phong cách dễ thương"
		},
		category: "🌸 angel-utility",
		guide: {
			en:
				"🌸 {pn} <text> → translate\n" +
				"💖 {pn} <text> -> <lang>\n" +
				"✨ reply + {pn} → translate message\n" +
				"🌐 reaction mode available",
			vi:
				"🌸 {pn} <text> → dịch\n" +
				"💖 {pn} <text> -> <ngôn ngữ>\n" +
				"✨ reply + {pn} → dịch tin nhắn"
		}
	},

	langs: {
		en: {
			translateTo: "🌸✨ Angel translate from %1 → %2",
			invalidArgument: "💔✨ Invalid command, choose on/off please",
			turnOnTransWhenReaction: `🌸💖 Auto translate ON ✨\nReact "${defaultEmojiTranslate}" to translate message`,
			turnOffTransWhenReaction: "💔 Auto translate OFF",
			inputEmoji: "🌸💫 React to set your magical emoji",
			emojiSet: "💖 Emoji set to %1 ✨"
		}
	},

	onStart: async function ({ message, event, args, threadsData, getLang, commandName }) {

		// 🌸 reaction settings
		if (["-r", "-react", "-reaction"].includes(args[0])) {

			if (args[1] == "set") {
				return message.reply("🌸💫 React to choose your magic emoji ✨", (err, info) =>
					global.GoatBot.onReaction.set(info.messageID, {
						type: "setEmoji",
						commandName,
						messageID: info.messageID,
						authorID: event.senderID
					})
				);
			}

			const isEnable = args[1] == "on" ? true : args[1] == "off" ? false : null;
			if (isEnable == null)
				return message.reply("💔✨ Invalid option");

			await threadsData.set(event.threadID, isEnable, "data.translate.autoTranslateWhenReaction");

			return message.reply(
				isEnable
					? "🌸✨ Auto translate activated 💖"
					: "💔 Angel translate disabled"
			);
		}

		const { body = "" } = event;
		let content;
		let langCodeTrans;
		const langOfThread = await threadsData.get(event.threadID, "data.lang") || global.GoatBot.config.language;

		// 💖 reply mode
		if (event.messageReply) {
			content = event.messageReply.body;

			let lastIndexSeparator = body.lastIndexOf("->");
			if (lastIndexSeparator == -1)
				lastIndexSeparator = body.lastIndexOf("=>");

			if (lastIndexSeparator != -1)
				langCodeTrans = body.slice(lastIndexSeparator + 2);
			else
				langCodeTrans = langOfThread;
		}

		// 🌸 normal mode
		else {
			content = event.body;

			let lastIndexSeparator = content.lastIndexOf("->");
			if (lastIndexSeparator != -1) {
				langCodeTrans = content.slice(lastIndexSeparator + 2);
				content = content.slice(0, lastIndexSeparator);
			} else {
				langCodeTrans = langOfThread;
			}
		}

		if (!content)
			return message.reply("🌸💔 Please enter text to translate");

		translateAndSendMessage(content, langCodeTrans, message, getLang);
	},

	onReaction: async ({ message, Reaction, event, threadsData, getLang }) => {

		const emojiTrans = await threadsData.get(event.threadID, "data.translate.emojiTranslate") || "🌐✨";

		if (event.reaction == emojiTrans) {
			const langCodeTrans = await threadsData.get(event.threadID, "data.lang") || global.GoatBot.config.language;
			const content = Reaction.body;

			Reaction.delete();

			translateAndSendMessage(content, langCodeTrans, message, getLang);
		}
	}
};

// 🌸 translate engine
async function translate(text, langCode) {
	const res = await axios.get(
		`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${langCode}&dt=t&q=${encodeURIComponent(text)}`
	);

	return {
		text: res.data[0].map(i => i[0]).join(''),
		lang: res.data[2]
	};
}

// 💖 send angel message
async function translateAndSendMessage(content, langCodeTrans, message, getLang) {
	const { text, lang } = await translate(content.trim(), langCodeTrans.trim());

	return message.reply(
		`🌸💖 ${text}\n\n✨ ${getLang("translateTo", lang, langCodeTrans)} 💫`
	);
}
