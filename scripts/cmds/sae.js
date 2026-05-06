const axios = require("axios");
const fs = require("fs");

const MEMORY_FILE = "./sae_memory.json";
const OWNER_ID = "61573867120837";

let memory = {};
if (fs.existsSync(MEMORY_FILE)) {
	memory = JSON.parse(fs.readFileSync(MEMORY_FILE, "utf8"));
}

function saveMemory() {
	fs.writeFileSync(MEMORY_FILE, JSON.stringify(memory, null, 2));
}

// ✨ police italique
function italic(text) {
	const normal = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
	const it = "𝘢𝘣𝘤𝘥𝘦𝘧𝘨𝘩𝘪𝘫𝘬𝘭𝘮𝘯𝘰𝘱𝘲𝘳𝘴𝘵𝘶𝘷𝘸𝘹𝘺𝘻𝘈𝘉𝘊𝘋𝘌𝘍𝘎𝘏𝘐𝘑𝘒𝘓𝘔𝘕𝘖𝘗𝘘𝘙𝘚𝘛𝘜𝘝𝘞𝘟𝘠𝘡";

	return text.split("").map(c => {
		const i = normal.indexOf(c);
		return i !== -1 ? it[i] : c;
	}).join("");
}

function frame(msg) {
	return `╔═══ 🌑 SAE AI ═══╗\n${msg}\n╚══════════════╝`;
}

async function callSae(prompt) {
	try {
		const res = await axios.get(
			`https://api.itsrose.rest/chatgpt?text=${encodeURIComponent(prompt)}`
		);
		return res.data.result || "Tch… vide.";
	} catch {
		return "…erreur.";
	}
}

function buildPrompt(uid, name, msg) {
	if (!memory[uid]) memory[uid] = [];

	memory[uid].push({ name, msg });
	if (memory[uid].length > 40) memory[uid].shift();
	saveMemory();

	const history = memory[uid]
		.map(m => `${m.name}: ${m.msg}`)
		.join("\n");

	return `
Tu es SAE AI ❄️
Inspiré de Sae Itoshi : froid, intelligent, supérieur.

Utilisateur : ${name} (${uid})

Conversation :
${history}

Utilisateur :
${msg}

Réponds :
- court
- froid
- intelligent
- pas trop émotionnel
`;
}

module.exports = {
	config: {
		name: "sae",
		version: "2.0",
		author: "Shade",
		role: 0,
		category: "ai"
	},

	onStart: async function ({ event, args, message, api }) {
		const text = args.join(" ");
		if (!text) return message.reply("Tch… parle.");

		const uid = event.senderID;
		const name = (await api.getUserInfo(uid))[uid]?.name || "user";

		let prompt = buildPrompt(uid, name, text);
		let reply = await callSae(prompt);

		// 💙 SPECIAL OWNER (TOI = GOAT)
		if (uid === OWNER_ID) {
			reply = `…Shade.\nTu es le GOAT.\n${reply}\nJe t’écoute.`;
		} else {
			reply = "Tch… " + reply;
		}

		// ✨ style italique
		reply = italic(reply);

		memory[uid].push({ name: "SAE", msg: reply });
		saveMemory();

		return message.reply(frame(reply));
	},

	onChat: async function ({ event, message, api }) {
		if (!event.body) return;

		const match = event.body.match(/^sae\s+(.*)/i);
		if (!match) return;

		const text = match[1];
		const uid = event.senderID;
		const name = (await api.getUserInfo(uid))[uid]?.name || "user";

		let prompt = buildPrompt(uid, name, text);
		let reply = await callSae(prompt);

		if (uid === OWNER_ID) {
			reply = `…Shade.\nTu es le GOAT.\n${reply}\nJe t’écoute.`;
		} else {
			reply = "Tch… " + reply;
		}

		reply = italic(reply);

		memory[uid].push({ name: "SAE", msg: reply });
		saveMemory();

		return message.reply(frame(reply));
	}
};
