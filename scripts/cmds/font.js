const axios = require("axios");

module.exports = {
config: {
name: "font",
aliases: ["fonts", "style"],
version: "1.1",
author: "Shade ✨ Angel Edition",
countDown: 5,
role: 0,
category: "utility",
shortDescription: "🌸 Convertir du texte en polices kawaii stylées",
longDescription: "💖 Utilisez /font <id> <texte> ou /font list",
guide: "{pn} list | {pn} 16 Shade"
},

onStart: async function ({ message, event, api, threadPrefix }) {
try {
const prefix = threadPrefix || "/font";
const body = event.body || "";
const args = body.split(" ").slice(1);

  if (!args.length) {
    return api.sendMessage(

`🌸💔 Utilisation invalide !

✨ ${prefix} list → Voir les polices
💖 ${prefix} [numéro] [texte] → Styliser un texte`,
event.threadID,
event.messageID
);
}

  if (args[0].toLowerCase() === "list") {
    const preview = `🌸✨ 𝐀𝐍𝐆𝐄𝐋 𝐅𝐎𝐍𝐓 𝐒𝐓𝐘𝐋𝐄𝐒 ✨🌸

━━━━━━━━━━━━━━━━━━━━☆
1 ⟶ S̆̈h̆̈ă̈d̆̈ĕ̈
2 ⟶ S̷h̷a̷d̷e̷
3 ⟶ 𝗦𝗵𝗮𝗱𝗲
4 ⟶ 𝘚𝘩𝘢𝘥𝘦
5 ⟶ [S][h][a][d][e]
6 ⟶ 𝕾𝖍𝖆𝖉𝖊
7 ⟶ Ｓｈａｄｅ
8 ⟶ ˢʰᵃᵈᵉ
9 ⟶ ǝpɐɥS
10 ⟶ 🅂🄷🄰🄳🄴
11 ⟶ 🆂🅷🅰🅳🅴
12 ⟶ 𝒮𝒽𝒶𝒹𝑒
13 ⟶ Ⓢⓗⓐⓓⓔ
14 ⟶   S⃢      h⃢      a⃢      d⃢      e⃢    
15 ⟶ 𝚂𝚑𝚊𝚍𝚎
16 ⟶ 𝐒𝐡𝐚𝐝𝐞
17 ⟶ 𝔖𝔥𝔞𝔡𝔢
18 ⟶ 𝓢𝓱𝓪𝓭𝓮
19 ⟶ 𝙎𝙝𝙖𝙙𝙚
20 ⟶ ꜱʜᴀᴅᴇ
21 ⟶ 𝑺𝒉𝒂𝒅𝒆
22 ⟶ 𝑆ℎ𝑎𝑑𝑒
23 ⟶ 𝔰𝔥𝔞𝔡𝔢
24 ⟶ ᥉ꫝꪖᦔꫀ
25 ⟶ ѕнα∂є
26 ⟶ ᏕᏂᏗᎴᏋ
27 ⟶ 丂卄卂ᗪ乇
28 ⟶ SᕼᗩᗪE
29 ⟶ ֆɦǟɖɛ
30 ⟶ 𐌔𐋅𐌀𐌃𐌄
31 ⟶ ƧΉΛDΣ
32 ⟶ 𝕊𝕙𝕒𝕕𝕖
33 ⟶ ׅ꯱hׁׅ֮ɑׁׅժׁׅ݊ꫀׁׅܻ݊
34 ⟶ sհαժҽ
35 ⟶ ִ ࣪ ˖ ࣪ ᨰꫀᥣᥴ᥆ꩇꫀ  ᰔ ִ ׄ
━━━━━━━━━━━━━━━━━━━━━☆`;

    return api.sendMessage(preview, event.threadID, event.messageID);
  }

  const id = args[0];
  const text = args.slice(1).join(" ");

  if (!text)
    return api.sendMessage(
      "🌸💔 Veuillez fournir un texte à convertir !",
      event.threadID,
      event.messageID
    );

  const apiUrl = `https://xsaim8x-xxx-api.onrender.com/api/font?id=${id}&text=${encodeURIComponent(text)}`;
  const response = await axios.get(apiUrl);

  if (response.data.output) {
    return api.sendMessage(
      `💖✨ Voici votre texte stylisé :\n\n${response.data.output}`,
      event.threadID,
      event.messageID
    );
  } else {
    return api.sendMessage(
      `🌸💔 Police ${id} introuvable !`,
      event.threadID,
      event.messageID
    );
  }

} catch (err) {
  console.error(err);
  return api.sendMessage(
    "💖✨ Une petite erreur Angel est survenue, réessayez plus tard 🌸",
    event.threadID,
    event.messageID
  );
}

}
};
