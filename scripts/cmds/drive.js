const axios = require("axios");

const apiUrl = "http://65.109.80.126:20409/aryan/drive";

module.exports = {
	config: {
		name: "drive",
		version: "0.0.4 angel kawaii react",
		author: "Angel Edit ✨",
		countDown: 5,
		role: 2,
		description: "💖 Upload vidéo vers Google Drive (Angel version)",
		category: "💾 angel utility",
		guide: "Reply média ou utilise : {pn} <lien>"
	},

	onStart: async function ({ message, event, args, api }) {

		const mediaUrl =
			event?.messageReply?.attachments?.[0]?.url || args[0];

		if (!mediaUrl) {
			return message.reply(
`╭─── 💔 𝗔𝗡𝗚𝗘𝗟 𝗗𝗥𝗜𝗩𝗘 ───╮
⚠️ Please send a valid video link
or reply to a media message
╰────────────────────╯`
			);
		}

		// ⏳ reaction loading sur message user
		api.setMessageReaction("⏳", event.messageID, () => {}, true);

		try {

			const response = await axios.get(
				`${apiUrl}?url=${encodeURIComponent(mediaUrl)}`,
				{ timeout: 15000 }
			);

			const data = response.data || {};
			const driveLink = data.driveLink || data.driveLIink;

			if (driveLink) {

				// 💾 success reaction
				api.setMessageReaction("💾", event.messageID, () => {}, true);

				return message.reply(
`╭─── 💖 𝗨𝗣𝗟𝗢𝗔𝗗 𝗦𝗨𝗖𝗖𝗘𝗦𝗦 ───╮
✨ File uploaded successfully
💾 Google Drive ready
🔗 ${driveLink}
╰──────────────────────╯`
				);
			}

			// ❌ fail reaction
			api.setMessageReaction("❌", event.messageID, () => {}, true);

			return message.reply(
`╭─── 💔 𝗔𝗡𝗚𝗘𝗟 𝗘𝗥𝗥𝗢𝗥 ───╮
❌ Upload failed
💬 ${data.error || "Unknown error"}
╰────────────────────╯`
			);

		} catch (err) {

			console.log(err.message);

			// ❌ error reaction
			api.setMessageReaction("❌", event.messageID, () => {}, true);

			return message.reply(
`╭─── 💔 𝗖𝗥𝗜𝗧𝗜𝗖𝗔𝗟 𝗘𝗥𝗥𝗢𝗥 ───╮
❌ Server error or timeout
💬 Try again later angel~
╰──────────────────────╯`
			);
		}
	}
};
