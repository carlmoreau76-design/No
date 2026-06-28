const axios = require("axios");

module.exports = {
  config: {
    name: "font",
    aliases: ["fonts", "style"],
    version: "2.0.0 Hori Edition",
    author: "Shade × Gemini",
    countDown: 5,
    role: 0,
    category: "utility",
    shortDescription: "🌸 Convertir du texte en polices stylisées",
    longDescription: "💖 Utilisez /font <id> <texte> ou /font list (80+ styles disponibles)",
    guide: {
      fr: "{pn} list | {pn} 16 Mon Texte"
    }
  },

  onStart: async function ({ message, event, api, threadPrefix }) {
    try {
      const prefix = threadPrefix || "/font";
      const body = event.body || "";
      const args = body.split(" ").slice(1);

      // ❌ SÉCURITÉ : Aucun argument fourni
      if (!args.length) {
        return api.sendMessage(
`✨ 🌸 **[ TERMINAL DE STYLISATION ]** 🌸 ✨
━━━━━━━━━━━━━━━━━━━━━━━━━━
❌ Utilisation invalide !

» 💡 \`${prefix} list\` ⟶ Afficher le catalogue des 80+ polices
» 💖 \`${prefix} [numéro] [texte]\` ⟶ Appliquer un style à votre texte`,
          event.threadID,
          event.messageID
        );
      }

      // 📜 COMMANDE : AFFICHAGE DE LA LISTE DES POLICES (80+ STYLES)
      if (args[0].toLowerCase() === "list") {
        const preview = `✨ 🌸 **[ CATALOGUE DES POLICES HORI ]** 🌸 ✨
━━━━━━━━━━━━━━━━━━━━━━━━━━
1 ⟶ S̆̈h̆̈ă̈d̆̈ĕ̈          2 ⟶ S̷h̷a̷d̷e̷
3 ⟶ 𝗦𝗵𝗮𝗱𝗲          4 ⟶ 𝘚𝘩𝘢𝘥𝑒
5 ⟶ [S][h][a][d][e]  6 ⟶ 𝕾𝖍𝖆𝖉𝖊
7 ⟶ Ｓｈａｄｅ      8 ⟶ ˢʰᵃᵈᵉ
9 ⟶ ǝpɐɥS          10 ⟶ 🅂🄷🄰🄳🄴
11 ⟶ 🆂🅷🅰🆳🅴      12 ⟶ 𝒮𝒽𝒶做𝑒
13 ⟶ Ⓢⓗⓐⓓⓔ      14 ⟶ S⃢ h⃢ a⃢ d⃢ e⃢
15 ⟶ 𝚂𝚑𝚊𝚍𝚎         16 ⟶ 𝐒𝐡𝐚𝐝𝐞
17 ⟶ 𝔖𝔥𝔞𝔡𝔢         18 ⟶ 𝓢𝓱𝓪𝓭𝓮
19 ⟶ 𝙎𝙝𝙖𝙙𝙚         20 ⟶ ꜱʜᴀᴅᴇ
21 ⟶ 𝑺𝒉𝒂𝒅𝒆         22 ⟶ 𝑆handling𝑒
23 ⟶ 𝔰𝔥𝔞𝔡𝔢         24 ⟶ ᥉ꫝꪖᦔꫀ
25 ⟶ ѕнα∂є         26 ⟶ ᏕᏂᏗᎴᏋ
27 ⟶ 丂卄卂ᗪ乇       28 ⟶ SᕼᗩᗪE
29 ⟶ ֆɦǟɖɛ         30 ⟶ 𐌔𐋅𐌀𐌃𐌄
31 ⟶ ƧΉΛDΣ         32 ⟶ mathbb{Shade}
33 ⟶ ֮꯱hׁ֮֮ɑׁ֮ժׁ      34 ⟶ sհαժҽ
35 ⟶ ִ ࣪ ˖ ᨰꫀᥣᥴ᥆ꩇꫀ 36 ⟶ [Style Bulles]
37 ⟶ [Gothique Rare] 38 ⟶ [Petites Majuscules]
39 ⟶ [Souligné Fin]   40 ⟶ [Double Ligne]
41 ⟶ [Italique Serif] 42 ⟶ [Cursif Alternatif]
43 ⟶ [Grec Ancien]    44 ⟶ [Style Étoiles]
45 ⟶ [Barre Centrée]  46 ⟶ [Flèches Bas]
47 ⟶ [Encadré Noir]   48 ⟶ [Rond Sombre]
49 ⟶ [Script Léger]  50 ⟶ [Ninja Style]
51 ⟶ [Monospace Pro]  52 ⟶ [Style Cyber]
53 ⟶ [Effet Miroir]   54 ⟶ [Vaguelettes]
55 ⟶ [Style Asiatique]56 ⟶ [Ligne Haute]
57 ⟶ [Décoratif Rose] 58 ⟶ [Style Graffiti]
59 ⟶ [Slashed text]   60 ⟶ [Vintage Type]
61 à 82 ⟶ [Variations Évoluées & Symboles]
━━━━━━━━━━━━━━━━━━━━━━━━━━
💡 _Sélectionnez un ID entre 1 et 82 pour formater votre texte._`;

        return api.sendMessage(preview, event.threadID, event.messageID);
      }

      const id = args[0];
      const text = args.slice(1).join(" ");

      // ❌ SÉCURITÉ : Pas de texte à convertir après l'ID
      if (!text) {
        return api.sendMessage(
          "✨ 🌸 **[ ERREUR DE PARAMÈTRE ]** 🌸 ✨\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n❌ Veuillez fournir le texte que vous désirez convertir après le numéro de la police.",
          event.threadID,
          event.messageID
        );
      }

      // Requête de conversion vers l'API
      const apiUrl = `https://xsaim8x-xxx-api.onrender.com/api/font?id=${id}&text=${encodeURIComponent(text)}`;
      const response = await axios.get(apiUrl);

      if (response.data && response.data.output) {
        return api.sendMessage(
`✨ 🌸 **[ TEXTE CONVERTI • ID: ${id} ]** 🌸 ✨
━━━━━━━━━━━━━━━━━━━━━━━━━━
${response.data.output}
━━━━━━━━━━━━━━━━━━━━━━━━━━
💡 _Copiez-collez directement le résultat obtenu._`,
          event.threadID,
          event.messageID
        );
      } else {
        return api.sendMessage(
          `✨ 🌸 **[ ALERTE SYSTÈME ]** 🌸 ✨\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n❌ Index de police [ ${id} ] introuvable. Veuillez choisir un identifiant valide compris entre 1 et 82.`,
          event.threadID,
          event.messageID
        );
      }

    } catch (err) {
      console.error(err);
      return api.sendMessage(
        "✨ 🌸 **[ SYNC FLOP / CHAT INTERRUPT ]** 🌸 ✨\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n❌ Une erreur de liaison interne est survenue lors de la conversion.",
        event.threadID,
        event.messageID
      );
    }
  }
};
