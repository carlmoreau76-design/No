const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");
const cheerio = require("cheerio");

const ALLOWED_UID = "61573867120837"; // 💖 seul toi peux utiliser

function getDomain(url) {
	const regex = /^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:/\n]+)/im;
	const match = url.match(regex);
	return match ? match[1] : null;
}

module.exports = {
	config: {
		name: "settings",
		version: "1.9 angel kawaii",
		author: "NTKhang | Angel Edit ✨",
		countDown: 5,
		role: 3,
		description: {
			vi: "Quản lý các tệp lệnh event của bạn",
			en: "Manage your event command files"
		},
		category: "owner",
		guide: {
			en:
				"{pn} load <file>\n" +
				"{pn} loadall\n" +
				"{pn} unload <file>\n" +
				"{pn} install <url> <file.js>"
		}
	},

	onStart: async function (context) {
		const {
			args, message, api, event,
			threadModel, userModel, dashBoardModel,
			globalModel, threadsData, usersData,
			dashBoardData, globalData,
			commandName, getLang
		} = context;

		// 💖 ONLY YOU
		if (event.senderID !== ALLOWED_UID) {
			return message.reply("💔✨ Access denied.\nOnly Angel owner can use this command.");
		}

		const { configCommands } = global.GoatBot;
		const { log, loadScripts } = global.utils;

		function fail(err) {
			return message.reply(`💔✨ Error:\n${err}`);
		}

		try {

			/* ================= LOAD ================= */
			if (args[0] == "load" && args[1]) {
				const info = loadScripts(
					"events",
					args[1],
					log,
					configCommands,
					api,
					threadModel,
					userModel,
					dashBoardModel,
					globalModel,
					threadsData,
					usersData,
					dashBoardData,
					globalData
				);

				return message.reply(
					info.status == "success"
						? `💖✨ Loaded: ${info.name}`
						: fail(info.error?.message || "unknown error")
				);
			}

			/* ================= LOAD ALL ================= */
			else if (args[0]?.toLowerCase() == "loadall") {
				const files = fs.readdirSync(path.join(__dirname, "..", "events"))
					.filter(f => f.endsWith(".js"))
					.map(f => f.replace(".js", ""));

				let ok = 0;

				for (const file of files) {
					const info = loadScripts(
						"events",
						file,
						log,
						configCommands,
						api,
						threadModel,
						userModel,
						dashBoardModel,
						globalModel,
						threadsData,
						usersData,
						dashBoardData,
						globalData
					);

					if (info.status === "success") ok++;
				}

				return message.reply(`💖✨ Reload complete!\n✅ Success: ${ok}`);
			}

			/* ================= UNLOAD ================= */
			else if (args[0] == "unload") {
				const info = global.utils.unloadScripts(
					"events",
					args[1],
					configCommands
				);

				return message.reply(
					info.status == "success"
						? `💖✨ Unloaded: ${info.name}`
						: fail(info.error?.message)
				);
			}

			/* ================= INSTALL 💖 NEW ================= */
			else if (args[0] == "install") {
				const url = args[1];
				const fileName = args[2];

				if (!url || !fileName) {
					return message.reply("💔✨ Usage: event install <url> <file.js>");
				}

				let rawCode;

				try {
					if (url.startsWith("http")) {
						const res = await axios.get(url);
						rawCode = res.data;
					} else {
						return message.reply("💔✨ Invalid URL");
					}

					const filePath = path.join(__dirname, "..", "events", fileName);

					fs.writeFileSync(filePath, rawCode);

					const info = loadScripts(
						"events",
						fileName.replace(".js", ""),
						log,
						configCommands,
						api,
						threadModel,
						userModel,
						dashBoardModel,
						globalModel,
						threadsData,
						usersData,
						dashBoardData,
						globalData
					);

					return message.reply(
						info.status == "success"
							? `💖✨ Installed & loaded: ${fileName}`
							: fail(info.error?.message)
					);

				} catch (e) {
					return fail(e.message);
				}
			}

			else {
				return message.SyntaxError();
			}

		} catch (e) {
			return fail(e.message);
		}
	}
};
