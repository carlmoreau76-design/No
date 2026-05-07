const { findUid } = global.utils;
const regExCheckURL = /^(http|https):\/\/[^ "]+$/;

module.exports = {
	config: {
		name: "uid",
		version: "1.3",
		author: "NTKhang ✨ | Angel Kawaii by Shade 💖",
		countDown: 5,
		role: 0,
		description: {
			en: "🌸 View Facebook UID with Angel kawaii style",
			vi: "🌸 Xem UID Facebook với phong cách dễ thương"
		},
		category: "🌸 angel-info",
		guide: {
			en:
				"🌸 {pn} → your UID\n" +
				"💖 {pn} @tag → UID of tagged user\n" +
				"✨ {pn} <profile link> → UID from link\n" +
				"💌 reply + {pn} → UID of user",
			vi:
				"🌸 {pn} → UID của bạn\n" +
				"💖 {pn} @tag → UID người được tag\n" +
				"✨ {pn} <link> → UID từ link\n" +
				"💌 reply + {pn} → UID người dùng"
		}
	},

	langs: {
		en: {
			syntaxError: "🌸💔 Please tag someone, reply, or leave blank to see your UID!"
		},
		vi: {
			syntaxError: "🌸💔 Vui lòng tag, reply hoặc để trống!"
		}
	},

	onStart: async function ({ message, event, args, getLang }) {

		// 💖 reply mode
		if (event.messageReply)
			return message.reply(`🌸✨ UID Angel: ${event.messageReply.senderID}`);

		// 💖 self UID
		if (!args[0])
			return message.reply(`🌸💖 Ton UID magique est : ${event.senderID}`);

		// 💖 link mode
		if (args[0].match(regExCheckURL)) {
			let msg = "🌸💫 Angel UID Scanner 💫🌸\n\n";

			for (const link of args) {
				try {
					const uid = await findUid(link);
					msg += `✨ ${link}\n💖 UID → ${uid}\n\n`;
				} catch (e) {
					msg += `💔 ${link}\n❌ erreur\n\n`;
				}
			}

			return message.reply(msg + "🌸 fini avec amour 💖");
		}

		// 💖 mention mode
		let msg = "🌸💎 Angel UID Result 💎🌸\n\n";
		const { mentions } = event;

		for (const id in mentions) {
			msg += `💖 ${mentions[id].replace("@", "")}\n✨ UID → ${id}\n\n`;
		}

		return message.reply(msg || getLang("syntaxError"));
	}
};
