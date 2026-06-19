const OWNER_ID = "61573867120837";
const { getStreamFromURL, uploadImgbb } = global.utils;

module.exports = {
	config: {
		name: "antichangeinfobox",
		aliases: ["anti"],
		version: "Angel PRO 3.0",
		author: "Shade ✧ Angel System",
		countDown: 5,
		role: 0,
		description: "👼🌸 FULL Angel protection (OWNER ONLY)",
		category: "security"
	},

	langs: {
		fr: {
			noPermission: "🌸 ✧ Tu n’as pas accès à l’Angel System 💔",
			saved: "💖 ✧ ANGEL SAVE ACTIVÉ : %1",
			restored: "👼 ✧ ANGEL RESTORE ACTIVÉ",
			missing: "⚠️ ✧ Donnée introuvable"
		}
	},

	onStart: async function ({ message, event, args, threadsData, getLang }) {

		// 🔐 ONLY YOU
		if (event.senderID !== OWNER_ID)
			return message.reply(getLang("noPermission"));

		if (!["on", "off"].includes(args[1]))
			return message.SyntaxError();

		const threadID = event.threadID;
		const data = await threadsData.get(threadID, "data.antiChangeInfoBox", {});

		const save = async (key, value) => {
			if (args[1] === "off") delete data[key];
			else data[key] = value;

			await threadsData.set(threadID, data, "data.antiChangeInfoBox");
		};

		switch (args[0]) {

			// 🖼️ AVATAR
			case "avt":
			case "avatar":
			case "image": {
				const { imageSrc } = await threadsData.get(threadID);
				if (!imageSrc) return message.reply(getLang("missing"));

				const img = await uploadImgbb(imageSrc);
				await save("avatar", img.image.url);

				return message.reply("👼💖 ANGEL AVATAR PROTECT ON");
			}

			// 📝 NAME
			case "name": {
				const { threadName } = await threadsData.get(threadID);
				await save("name", threadName);

				return message.reply("👼💖 ANGEL NAME PROTECT ON");
			}

			// 👤 NICKNAME
			case "nickname": {
				const { members } = await threadsData.get(threadID);

				const nick = {};
				for (const m of members) {
					nick[m.userID] = m.nickname;
				}

				await save("nickname", nick);

				return message.reply("👼💖 ANGEL NICKNAME PROTECT ON");
			}

			// 🎨 THEME
			case "theme": {
				const { threadThemeID } = await threadsData.get(threadID);
				await save("theme", threadThemeID);

				return message.reply("👼💖 ANGEL THEME PROTECT ON");
			}

			// 😀 EMOJI
			case "emoji": {
				const { emoji } = await threadsData.get(threadID);
				await save("emoji", emoji);

				return message.reply("👼💖 ANGEL EMOJI PROTECT ON");
			}

			default:
				return message.SyntaxError();
		}
	},

	onEvent: async function ({ message, event, threadsData, api, role }) {

		// 🔐 ADMIN BYPASS SAFE
		if (role >= 1) return;

		const { threadID, logMessageType, logMessageData, author } = event;
		const data = await threadsData.get(threadID, "data.antiChangeInfoBox", {});

		switch (logMessageType) {

			// 🖼️ AVATAR RESTORE
			case "log:thread-image": {
				if (!data.avatar) return;

				if (api.getCurrentUserID() !== author) {
					message.reply("👼💖 ANGEL RESTORE AVATAR");
					api.changeGroupImage(await getStreamFromURL(data.avatar), threadID);
				}
				break;
			}

			// 📝 NAME RESTORE
			case "log:thread-name": {
				if (!data.name) return;

				if (api.getCurrentUserID() !== author) {
					message.reply("👼💖 ANGEL RESTORE NAME");
					api.setTitle(data.name, threadID);
				}
				break;
			}

			// 👤 NICKNAME RESTORE
			case "log:user-nickname": {
				if (!data.nickname) return;

				const { participant_id } = logMessageData;

				if (api.getCurrentUserID() !== author) {
					api.changeNickname(
						data.nickname[participant_id],
						threadID,
						participant_id
					);
				}
				break;
			}

			// 🎨 THEME RESTORE
			case "log:thread-color": {
				if (!data.theme) return;

				if (api.getCurrentUserID() !== author) {
					api.changeThreadColor(data.theme, threadID);
				}
				break;
			}

			// 😀 EMOJI RESTORE
			case "log:thread-icon": {
				if (!data.emoji) return;

				if (api.getCurrentUserID() !== author) {
					api.changeThreadEmoji(data.emoji, threadID);
				}
				break;
			}
		}
	}
};
