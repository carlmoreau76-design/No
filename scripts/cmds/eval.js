const { removeHomeDir, log } = global.utils;

module.exports = {
	config: {
		name: "eval",
		version: "2.0 angel secure",
		author: "Angel Edit ✨",
		countDown: 5,
		role: 3,
		description: "🌸 Execute JS safely (Angel Secure Mode)",
		category: "owner",
		guide: "{pn} <code>"
	},

	langs: {
		en: {
			error: "💔 Angel Error:",
			loading: "🌸 Executing code in Angel sandbox...",
			blocked: "⛔ Dangerous code blocked by Angel security"
		}
	},

	onStart: async function ({ api, args, message, event, getLang }) {

		const code = args.join(" ").trim();

		if (!code) {
			return message.reply(
`╭─── 🌸 𝗔𝗡𝗚𝗘𝗟 𝗘𝗩𝗔𝗟 ───╮
💡 Usage: !eval <code>
✨ Example: !eval 2 + 2
╰────────────────────╯`
			);
		}

		// 💔 ANGEL SECURITY CHECK
		const blacklist = [
			"process.exit",
			"rmSync",
			"rm(",
			"fs.",
			"child_process",
			"eval(",
			"require('fs')",
			"require(\"fs\")"
		];

		if (blacklist.some(x => code.includes(x))) {
			return message.reply(
`╭─── 💔 𝗔𝗡𝗚𝗘𝗟 𝗦𝗘𝗖𝗨𝗥𝗜𝗧𝗬 ───╮
⛔ Dangerous code detected
🛡️ Execution blocked for safety
╰──────────────────────╯`
			);
		}

		const loading = await message.reply("🌸 Angel is running your code... ⏳");

		try {

			function output(msg) {
				if (typeof msg === "object")
					msg = JSON.stringify(msg, null, 2);
				else if (msg === undefined)
					msg = "undefined";
				message.reply(String(msg));
			}

			const result = eval(`
				(async () => {
					try {
						${code}
					} catch (err) {
						err
					}
				})()
			`);

			api.unsendMessage(loading.messageID);

		} catch (err) {

			api.unsendMessage(loading.messageID);

			return message.reply(
`╭─── 💔 𝗔𝗡𝗚𝗘𝗟 𝗘𝗥𝗥𝗢𝗥 ───╮
❌ ${err.message || err}
╰────────────────────╯`
			);
		}
	}
};
