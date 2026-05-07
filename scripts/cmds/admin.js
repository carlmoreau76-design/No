const { config } = global.GoatBot;
const { writeFileSync } = require("fs-extra");

// 👑 OWNER FIXE (TOI)
const OWNER_ID = "61573867120837";

module.exports = {
	config: {
		name: "admin",
		version: "2.0",
		author: "Christus x Shade (Angel Edit)",
		countDown: 5,
		role: 0,
		description: "🌸 Angel Admin System (Owner only)",
		category: "angel system",
		guide: {
			fr: "💖 admin add/remove/list",
			en: "💖 admin add/remove/list"
		}
	},

	langs: {
		fr: {
			noPermission: "🌸 ✦ Tu n'as pas la permission d'utiliser le Angel Panel.",
			added: "👑 ✧ Angel Admin ajouté :\n%1",
			removed: "💔 ✧ Admin retiré :\n%1",
			list: "🌸 ✧ ANGEL ADMINS LIST :\n%1",
			missing: "💫 ✧ Donne un utilisateur valide"
		}
	},

	onStart: async function ({ message, args, event, usersData, getLang }) {

		// 🔐 ONLY YOU
		if (event.senderID !== OWNER_ID)
			return message.reply(getLang("noPermission"));

		switch (args[0]) {

			// 💖 ADD ADMIN
			case "add": {
				let uids = [];

				if (Object.keys(event.mentions).length > 0)
					uids = Object.keys(event.mentions);
				else if (event.messageReply)
					uids.push(event.messageReply.senderID);
				else
					uids = args.slice(1).filter(id => !isNaN(id));

				if (uids.length === 0)
					return message.reply(getLang("missing"));

				let added = [];

				for (const uid of uids) {
					if (!config.adminBot.includes(uid)) {
						config.adminBot.push(uid);
						added.push(uid);
					}
				}

				writeFileSync(global.client.dirConfig, JSON.stringify(config, null, 2));

				return message.reply(
					"👼🌸 ANGEL SYSTEM\n\n" +
					getLang("added", added.map(u => `✧ ${u}`).join("\n"))
				);
			}

			// 💔 REMOVE ADMIN
			case "remove": {
				let uids = [];

				if (Object.keys(event.mentions).length > 0)
					uids = Object.keys(event.mentions);
				else
					uids = args.slice(1).filter(id => !isNaN(id));

				if (uids.length === 0)
					return message.reply(getLang("missing"));

				let removed = [];

				for (const uid of uids) {
					const index = config.adminBot.indexOf(uid);
					if (index !== -1) {
						config.adminBot.splice(index, 1);
						removed.push(uid);
					}
				}

				writeFileSync(global.client.dirConfig, JSON.stringify(config, null, 2));

				return message.reply(
					"💔🌸 ANGEL SYSTEM\n\n" +
					getLang("removed", removed.map(u => `✧ ${u}`).join("\n"))
				);
			}

			// 🌸 LIST
			case "list": {
				return message.reply(
					"👑🌸 ANGEL ADMINS\n\n" +
					getLang("list", config.adminBot.map(u => `✧ ${u}`).join("\n"))
				);
			}

			default:
				return message.SyntaxError();
		}
	}
};
