const axios = require("axios");
const { getStreamFromURL } = global.utils;

module.exports = {
	config: {
		name: "dhbc",
		version: "1.4 angel kawaii",
		author: "Angel Edit ✨",
		countDown: 5,
		role: 0,
		description: {
			en: "💖 Angel kawaii guess the word game"
		},
		category: "🎮 angel game",
		guide: {
			en: "{pn}"
		},
		envConfig: {
			reward: 1000
		}
	},

	langs: {
		en: {
			reply:
`╭─── ✨ 𝗔𝗡𝗚𝗘𝗟 𝗚𝗔𝗠𝗘 ✨ ───╮
💖 Guess the word from images
╰──────────────────────╯

🧩 █ █ █ █ █ █ █ █

💬 Reply with your answer ↓`,
			
			isSong: "🎶 Angel Hint: this is a song by %1",
			notPlayer: "⛔ You are not the player of this kawaii game~",
			correct:
`╭─── 💖 𝗖𝗢𝗥𝗥𝗘𝗖𝗧 💖 ───╮
🎉 You got it right!
💰 Reward: %1$
╰──────────────────╯`,
			wrong: "💔 Not correct… try again angel~"
		}
	},

	onStart: async function ({ message, event, commandName, getLang }) {
		try {
			const datagame = (await axios.get("https://goatbotserver.onrender.com/api/duoihinhbatchu")).data;
			const { wordcomplete, casi, image1, image2 } = datagame.data;

			message.reply({
				body: getLang("reply", wordcomplete.replace(/\S/g, "█ ")),
				attachment: [
					await getStreamFromURL(image1),
					await getStreamFromURL(image2)
				]
			}, (err, info) => {
				global.GoatBot.onReply.set(info.messageID, {
					commandName,
					messageID: info.messageID,
					author: event.senderID,
					wordcomplete
				});
			});

		} catch (e) {
			message.reply("💔 Angel error: cannot load game right now…");
		}
	},

	onReply: async function ({ message, Reply, event, usersData, envCommands, commandName, getLang }) {
		const { author, wordcomplete, messageID } = Reply;

		if (event.senderID != author)
			return message.reply(getLang("notPlayer"));

		if (formatText(event.body) === formatText(wordcomplete)) {

			global.GoatBot.onReply.delete(messageID);

			await usersData.addMoney(event.senderID, envCommands[commandName].reward);

			return message.reply(getLang("correct", envCommands[commandName].reward));
		}

		return message.reply(getLang("wrong"));
	}
};

function formatText(text) {
	return text
		.normalize("NFD")
		.toLowerCase()
		.replace(/[\u0300-\u036f]/g, "")
		.replace(/[đ|Đ]/g, "d");
}
