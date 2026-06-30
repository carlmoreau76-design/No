module.exports = {
	config: {
		name: "kick",
		version: "1.7",
		author: "Shade ✨ Angel Edit (Style Hori)",
		role: 1,
		category: "admin",
		description: {
			en: "Kyōko Hori kick par tag, reply ou UID avec système de confirmation"
		}
	},

	langs: {
		en: {
			noPermission: "💢 Attends une minute ! Seul mon créateur ou un administrateur du groupe peut faire ça.",
			needAdmin: "⚙️ Hé... J'ai besoin d'être administratrice du groupe pour pouvoir exclure quelqu'un.",
			noTarget: "👤 Tu dois mentionner quelqu'un, répondre à son message, ou entrer son UID pour que je sache de qui il s'agit !",
			confirm: "⚠️ Tu es vraiment sûr de vouloir virer %1 ?\n\nRéponds par 'OUI' ou 'NON' ! 💢",
			cancel: "💨 Pff... D'accord, action annulée.",
			success: "🚪 C'est bon, l'utilisateur (%1) a été sorti du groupe. Ne reviens pas !"
		}
	},

	onStart: async function ({ message, event, api, getLang, args }) {
		const OWNER_UID = "61573867120837";

		// 🤖 Récupération des infos du groupe
		const threadInfo = await api.getThreadInfo(event.threadID);
		const botID = api.getCurrentUserID();
		
		// 🛠️ Vérification des admins du groupe et de l'owner
		const isAdmin = threadInfo.adminIDs.some(a => a.id === event.senderID);
		const isOwner = event.senderID === OWNER_UID;

		// 🔒 Vérification des permissions
		if (!isOwner && !isAdmin)
			return message.reply(getLang("noPermission"));

		// 🤖 Vérification si le bot est admin
		if (!threadInfo.adminIDs.some(a => a.id === botID))
			return message.reply(getLang("needAdmin"));

		// 👤 Détermination de la cible (Tag, Reply, ou UID direct)
		let targetID = null;

		if (event.messageReply?.senderID) {
			// Priorité 1: Reply (Réponse au message)
			targetID = event.messageReply.senderID;
		} else if (event.mentions && Object.keys(event.mentions).length > 0) {
			// Priorité 2: Tag / Mention (on extrait proprement les clés de l'objet)
			targetID = Object.keys(event.mentions)[0];
		} else if (args[0] && !isNaN(args[0].replace(/[^0-9]/g, ''))) {
			// Priorité 3: UID écrit directement ou extrait proprement s'il reste des caractères
			targetID = args[0].replace(/[^0-9]/g, '');
		}

		// Si aucune cible n'est trouvée ou si l'UID est vide
		if (!targetID || targetID.length < 5)
			return message.reply(getLang("noTarget"));

		// Récupération du nom pour l'affichage
		const name = event.mentions?.[targetID] || `l'utilisateur [${targetID}]`;

		// ⏳ Réaction d'attente
		api.setMessageReaction("⏳", event.messageID, () => {}, true);

		// 💬 Demande de confirmation
		return message.reply(getLang("confirm", name), (err, info) => {
			if (err) return message.reply("💢 Une erreur est survenue lors de la tentative.");
			global.GoatBot.onReply.set(info.messageID, {
				commandName: "kick",
				author: event.senderID,
				targetID
			});
		});
	},

	onReply: async function ({ event, api, message, Reply, getLang }) {
		if (event.senderID !== Reply.author) return;

		const answer = event.body.toLowerCase().trim();

		if (answer !== "oui" && answer !== "non") {
			return message.reply("💢 Ne joue pas avec moi ! Réponds uniquement par OUI ou par NON.");
		}

		// ❌ Annulation
		if (answer === "non") {
			api.setMessageReaction("❌", event.messageID, () => {}, true);
			return message.reply(getLang("cancel"));
		}

		// ✅ Confirmation du kick
		try {
			api.setMessageReaction("⏳", event.messageID, () => {}, true);

			await api.removeUserFromGroup(
				Reply.targetID,
				event.threadID
			);

			api.setMessageReaction("✅", event.messageID, () => {}, true);

			return message.reply(
				getLang("success", Reply.targetID)
			);

		} catch (e) {
			return message.reply("💢 Ah... Quelque chose s'est mal passé, impossible de le virer. Vérifie qu'il est encore là ou que j'ai les droits.");
		}
	}
};
