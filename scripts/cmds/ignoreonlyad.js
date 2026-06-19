const OWNER_UID = "61573867120837";
const ignoreList = global.GoatBot.config.adminOnly.ignoreCommand;
const fs = require("fs-extra");

module.exports = {
	config: {
		name: "ignoreonlyad",
		aliases: ["ignoreadonly", "ignoreonlyadmin", "ign"],
		version: "✨ 2.0 angel kawaii",
		author: "Shade ✨ Angel Edit",
		countDown: 5,
		role: 0,
		shortDescription: "🌸 Autoriser des commandes en adminOnly",
		category: "security",
		description: {
			en: "Manage commands that bypass adminOnly mode 💫"
		},
		guide: {
			en:
				"🌸 {pn} add <command>\n" +
				"❌ {pn} del <command>\n" +
				"📜 {pn} list"
		}
	},

	langs: {
		en: {
			denied: "❌✨ Access denied... only owner can use this 💔",
			missingAdd: "🌸✨ Please enter a command to add 💔",
			missingDel: "💔✨ Please enter a command to remove",
			notFound: "❌✨ Command \"%1\" not found",
			already: "💖✨ \"%1\" is already in the angel ignore list",
			added: "🌸✨ Command \"%1\" is now FREE from adminOnly 💖",
			notIn: "💔✨ \"%1\" is not in the list",
			removed: "🧹✨ Command \"%1\" removed from angel list 💖",
			list: "🌸✨ IGNORE LIST (adminOnly bypass):\n\n%1"
		}
	},

	onStart: async function ({ args, message, getLang, event, api }) {

		// 💖 UID CHECK (OWNER ONLY)
		if (event.senderID !== OWNER_UID) {
			return message.reply(getLang("denied"));
		}

		try {
			const action = args[0];

			// 🌸 ADD
			if (action === "add") {
				api.setMessageReaction("⏳", event.messageID);

				if (!args[1])
					return message.reply(getLang("missingAdd"));

				const cmd = args[1].toLowerCase();
				const command = global.GoatBot.commands.get(cmd);

				if (!command)
					return message.reply(getLang("notFound", cmd));

				if (ignoreList.includes(cmd))
					return message.reply(getLang("already", cmd));

				ignoreList.push(cmd);
				fs.writeFileSync(global.client.dirConfig, JSON.stringify(global.GoatBot.config, null, 2));

				api.setMessageReaction("✅", event.messageID);
				return message.reply(getLang("added", cmd));
			}

			// 🧹 DELETE
			if (action === "del" || action === "remove" || action === "rm") {
				api.setMessageReaction("⏳", event.messageID);

				if (!args[1])
					return message.reply(getLang("missingDel"));

				const cmd = args[1].toLowerCase();
				const command = global.GoatBot.commands.get(cmd);

				if (!command)
					return message.reply(getLang("notFound", cmd));

				if (!ignoreList.includes(cmd))
					return message.reply(getLang("notIn", cmd));

				ignoreList.splice(ignoreList.indexOf(cmd), 1);
				fs.writeFileSync(global.client.dirConfig, JSON.stringify(global.GoatBot.config, null, 2));

				api.setMessageReaction("✅", event.messageID);
				return message.reply(getLang("removed", cmd));
			}

			// 📜 LIST
			if (action === "list") {
				if (!ignoreList.length)
					return message.reply("🌸✨ Empty angel list 💔");

				return message.reply(
					getLang("list", ignoreList.map(e => "✨ " + e).join("\n"))
				);
			}

			return message.SyntaxError();

		} catch (e) {
			console.error(e);
			return message.reply("💔✨ An error occurred in angel system...");
		}
	}
};
