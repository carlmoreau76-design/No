const { createCanvas, loadImage } = require("canvas");  
const fs = require("fs");  
const path = require("path");  
  
module.exports.config = {  
  name: "balance",  
  aliases: ["bal", "$", "cash"],
  version: "1.1.0",  
  hasPermssion: 0,  
  credits: "Meta AI",  
  description: "Balance style carte bancaire",  
  commandCategory: "economy",  
  usages: "/bal",  
  cooldowns: 2  
};  
  
module.exports.run = async function({ api, event, Currencies, Users }) {  
  const { threadID, messageID, senderID } = event;  
  const userData = await Currencies.getData(senderID);  
  const money = userData.money || 0;  
  const name = await Users.getNameUser(senderID);  
  
  const allData = await Currencies.getAll();  
  const sorted = allData.sort((a, b) => b.money - a.money);  
  const rank = sorted.findIndex(u => u.userID === senderID) + 1;  
  const total = sorted.length;  
  
  const width = 850, height = 540;  
  const canvas = createCanvas(width, height);  
  const ctx = canvas.getContext("2d");  
  
  // Fond bleu nuit  
  ctx.fillStyle = "#0b0e14";  
  ctx.fillRect(0, 0, width, height);  
  
  // Carte bancaire  
  ctx.fillStyle = "#1a1e27";  
  ctx.roundRect(100, 140, 650, 400, 24);  
  ctx.fill();  
  
  // Bordure subtile  
  ctx.strokeStyle = "#2d313b";  
  ctx.lineWidth = 2;  
  ctx.stroke();  
  
  // Puce carte en haut gauche  
  ctx.fillStyle = "#d4af37";  
  ctx.roundRect(160, 190, 80, 60, 8);  
  ctx.fill();  
  
  // Lignes puce  
  ctx.strokeStyle = "#b8932e";  
  ctx.lineWidth = 1;  
  ctx.beginPath();  
  ctx.moveTo(160, 210); ctx.lineTo(240, 210);  
  ctx.moveTo(160, 230); ctx.lineTo(240, 230);  
  ctx.stroke();  
  
  // Montant masqué style carte  
  ctx.fillStyle = "#e5e7eb";  
  ctx.font = "bold 48px Arial";  
  ctx.fillText("•••• •••• ••••", 160, 310);  
  ctx.font = "bold 56px Arial";  
  ctx.fillText(`${money.toLocaleString()} $`, 160, 370);  
  
  // Nom en bas  
  ctx.fillStyle = "#9ca3af";  
  ctx.font = "24px Arial";  
  ctx.fillText(name.toUpperCase(), 160, 450);  
  
  // Rank badge en bas droite  
  ctx.fillStyle = rank <= 3 ? "#f5c542" : "#22c55e";  
  ctx.roundRect(560, 410, 140, 40, 12);  
  ctx.fill();  
  ctx.fillStyle = "#0b0e14";  
  ctx.font = "bold 22px Arial";  
  ctx.fillText(`RANK #${rank}`, 590, 435);  
  
  // Goat logo top droite  
  ctx.font = "bold 42px Arial";  
  ctx.fillText("💳", 660, 200);  
  
  // Avatar petit rond  
  const avatar = await loadImage(`https://graph.facebook.com/${senderID}/picture?width=256&height=256&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`);  
  ctx.save();  
  ctx.beginPath();  
  ctx.arc(700, 320, 35, 0, Math.PI * 2);  
  ctx.clip();  
  ctx.drawImage(avatar, 665, 285, 70, 70);  
  ctx.restore();  
  
  const pathSave = path.join(__dirname, `cache/bal_${senderID}.png`);  
  if (!fs.existsSync(path.join(__dirname, "cache"))) fs.mkdirSync(path.join(__dirname, "cache"), { recursive: true });  
    
  fs.writeFileSync(pathSave, canvas.toBuffer("image/png"));  
  return api.sendMessage({attachment: fs.createReadStream(pathSave)}, threadID, () => fs.unlinkSync(pathSave), messageID);  
}  
