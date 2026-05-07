module.exports = {
	config: {
		name: "all",
		version: "2.0",
		author: "Christus ✦ Angel Edit",
		countDown: 10,
		role: 3, // 🔐 admin only
		description: {
			fr: "👼 Tag tous les membres avec style Angel",
			en: "👼 Tag all members with Angel style"
		},
		category: "angel box chat",
		guide: {
			fr: "{pn} [message]"
		}
	},

	onStart: async function ({ message, event, args }) {

		// 🌸 message à envoyer
		let texte = args.join(" ") || "👼🌸 𝑨𝑵𝑮𝑬𝑳 𝑩𝑶𝑻 𝑨𝑳𝑳 ✧";

		const { participantIDs } = event;

		let mentions = [];
		let i = 0;

		// 💖 construction des mentions
		for (const uid of participantIDs) {
			mentions.push({
				tag: texte[i] || "✧",
				id: uid,
				fromIndex: i
			});
			i++;
		}

		// 👼 message final stylé
		const finalMessage =
`👼🌸 𝑨𝑵𝑮𝑬𝑳 𝑩𝑶𝑻 𝑺𝒀𝑺𝑻𝑬𝑴 ✧

💖 Message : ${texte}

✨ Tout le groupe est mentionné avec amour 🌸`;

		message.reply({
			body: finalMessage,
			mentions
		});
	}
};
