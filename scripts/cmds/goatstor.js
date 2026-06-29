const axios = require("axios");

const GoatStor = "https://goatstore.vercel.app";

// 🌸 Application du filtre de texte stylisé
function font(text) {
  const map = {
    a:"𝘢",b:"𝘣",c:"𝘤",d:"𝘥",e:"𝘦",f:"𝘧",g:"𝘨",h:"𝘩",i:"𝘪",
    j:"𝘫",k:"𝘬",l:"𝘭",m:"𝘮",n:"𝘯",o:"𝘰",p:"𝘱",q:"𝘲",r:"𝘳",
    s:"𝘴",t:"𝘵",u:"𝘶",v:"𝘷",w:"𝘸",x:"𝘹",y:"𝘺",z:"𝘻"
  };
  return text.split("").map(c => map[c.toLowerCase()] || c).join("");
}

module.exports = {
  config: {
    name: "goatstor",
    aliases: ["gs", "market"],
    version: "2.0.0 Hori Pro",
    role: 0,
    author: "ArYAN × Shade × Gemini",
    shortDescription: {
      en: "Marketplace de commandes pour l'écosystème GoatBot"
    },
    category: "utility",
    cooldowns: 2,
  },

  onStart: async ({ api, event, args, message }) => {
    const send = (txt) => message.reply(txt);

    try {
      if (!args[0]) {
        return send(
`✨ 🌸 **[ MARKETPLACE GOATSTOR ]** 🌸 ✨
━━━━━━━━━━━━━━━━━━━━━━━━━━
💡 **Commandes disponibles :**

» 📦 \`goatstor show [id]\` ⟶ Inspecter un module spécifié
» 📄 \`goatstor page [num]\` ⟶ Parcourir le catalogue
» 🔍 \`goatstor search [nom]\` ⟶ Rechercher un script
» 🔥 \`goatstor trending\` ⟶ Afficher les modules populaires
» 💝 \`goatstor like [id]\` ⟶ Attribuer une mention j'aime`
        );
      }

      const cmd = args[0].toLowerCase();

      switch (cmd) {

        // 📦 SHOW (Détails d'un item)
        case "show": {
          const id = parseInt(args[1]);
          if (isNaN(id)) {
            return send("✨ 🌸 **[ ALERTE MARKET ]** 🌸 ✨\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n❌ Veuillez fournir un identifiant numérique valide.");
          }

          const response = await axios.get(`${GoatStor}/api/item/${id}`);
          const item = response.data;

          if (!item || !item.itemName) {
            return send("✨ 🌸 **[ COMPOSANT INTROUVABLE ]** 🌸 ✨\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n❌ Aucun module ne correspond à cet identifiant dans la base de données.");
          }

          return send(
`✨ 🌸 **[ MODULE : ${item.itemName.toUpperCase()} ]** 🌸 ✨
━━━━━━━━━━━━━━━━━━━━━━━━━━
🆔 **Identifiant :** ${item.itemID}
⚙️ **Type d'architecture :** ${item.type || "Non défini"}
📝 **Description :** ${item.description || "Aucune description fournie."}
👑 **Développeur :** ${item.authorName || "Anonyme"}

📊 **Statistiques globales :**
👀 Vues : ${item.views || 0}  |  💝 Likes : ${item.likes || 0}
━━━━━━━━━━━━━━━━━━━━━━━━━━
🔗 **Code source brut (Raw) :**
${GoatStor}/raw/${item.rawID}`
          );
        }

        // 📄 PAGE (Navigation)
        case "page": {
          const page = parseInt(args[1]) || 1;
          const response = await axios.get(`${GoatStor}/api/items?page=${page}&limit=5`);
          const items = response.data?.items || [];

          if (items.length === 0) {
            return send(`✨ 🌸 **[ FIN DE CATALOGUE ]** 🌸 ✨\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n❌ Aucun module disponible à la page ${page}.`);
          }

          const list = items.map((it, i) =>
`🌸 ${i + 1}. **${it.itemName}**
🔹 ID : ${it.itemID}  •  💝 ${it.likes || 0} likes  •  👀 ${it.views || 0} vues`
          ).join("\n\n");

          return send(
`✨ 🌸 **[ INDEX GOATSTOR • PAGE ${page} ]** 🌸 ✨
━━━━━━━━━━━━━━━━━━━━━━━━━━
${font(list)}
━━━━━━━━━━━━━━━━━━━━━━━━━━
💡 _Utilisez "goatstor show [id]" pour récupérer le code d'un script._`
          );
        }

        // 🔍 SEARCH (Recherche textuelle)
        case "search": {
          const q = args.slice(1).join(" ");
          if (!q) {
            return send("✨ 🌸 **[ INDEX MANQUANT ]** 🌸 ✨\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n❌ Veuillez spécifier les mots-clés ou le nom du module à rechercher.");
          }

          const response = await axios.get(`${GoatStor}/api/items?search=${encodeURIComponent(q)}`);
          const items = response.data?.items || [];

          if (items.length === 0) {
            return send(`✨ 🌸 **[ RECHERCHE INFRUCTUEUSE ]** 🌸 ✨\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n❌ Aucun résultat trouvé pour la requête : "${q}".`);
          }

          const list = items.slice(0, 5).map((it, i) =>
`🌸 ${i + 1}. **${it.itemName}**
🔹 ID de liaison : ${it.itemID}  [ 💝 Likes : ${it.likes || 0} ]`
          ).join("\n\n");

          return send(
`✨ 🌸 **[ RÉSULTATS RECHERCHE : "${q.toUpperCase()}" ]** 🌸 ✨
━━━━━━━━━━━━━━━━━━━━━━━━━━
${font(list)}`
          );
        }

        // 🔥 TRENDING (Populaires)
        case "trending": {
          const response = await axios.get(`${GoatStor}/api/trending`);
          const data = response.data || [];

          if (data.length === 0) {
            return send("✨ 🌸 **[ SYNCHRONISATION IMPOSSIBLE ]** 🌸 ✨\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n❌ Aucune donnée de tendance n'est actuellement disponible.");
          }

          const list = data.slice(0, 5).map((it, i) =>
`🔥 ${i + 1}. **${it.itemName}**
🔹 ID : ${it.itemID}  [ 💝 ${it.likes || 0}  |  👀 ${it.views || 0} ]`
          ).join("\n\n");

          return send(
`✨ 🌸 **[ MODULES LES PLUS VOGUES ]** 🌸 ✨
━━━━━━━━━━━━━━━━━━━━━━━━━━
${font(list)}`
          );
        }

        // 💝 LIKE (Aimer un item)
        case "like": {
          const id = parseInt(args[1]);
          if (isNaN(id)) {
            return send("✨ 🌸 **[ ID INVALIDATED ]** 🌸 ✨\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n❌ Indiquez l'ID numérique du module pour lui attribuer un vote.");
          }

          const response = await axios.post(`${GoatStor}/api/items/${id}/like`);
          
          return send(
`✨ 🌸 **[ TRANSACTION MISE À JOUR ]** 🌸 ✨
━━━━━━━━━━━━━━━━━━━━━━━━━━
💝 Votre mention j'aime a été enregistrée avec succès.
📈 **Nouveau score d'approbation :** ${response.data?.likes || "Mis à jour"} likes.`
          );
        }

        default:
          return send("✨ 🌸 **[ PROTOCOLE INCONNU ]** 🌸 ✨\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n❌ Option invalide. Tapez la commande sans argument pour voir le guide.");
      }

    } catch (e) {
      console.error("GoatStor core crash:", e.message);
      return send("✨ 🌸 **[ DISRUPT SYSTEM / ERREUR ]** 🌸 ✨\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n💔 Le serveur de dépôt distant est instable ou injoignable pour le moment.");
    }
  }
};
