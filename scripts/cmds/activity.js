async function generateDashboard(data, message, usersData) {
  const WIDTH = 1080, HEIGHT = 1500;
  const canvas = createCanvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext("2d");

  // 🌸 ANGEL BACKGROUND
  if (wallpaper && fs.existsSync(wallpaper)) {
    const bgImg = await loadImage(wallpaper);
    ctx.drawImage(bgImg, 0, 0, WIDTH, HEIGHT);

    ctx.fillStyle = "rgba(255, 182, 255, 0.15)";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
  } else {
    const bg = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    bg.addColorStop(0, "#1a0033");
    bg.addColorStop(0.5, "#ffb6ff");
    bg.addColorStop(1, "#ffe6f7");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
  }

  // 👼 TITLE
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 70px Arial";
  ctx.textAlign = "center";
  ctx.fillText("✧ ANGEL DASHBOARD ✧", WIDTH / 2, 90);

  ctx.font = "bold 40px Arial";
  ctx.fillStyle = "#ffccff";
  ctx.fillText(`𓋜 ${data.name} 𓋜`, WIDTH / 2, 150);

  // 👤 AVATAR
  let img;
  try {
    const avatarUrl = await usersData.getAvatarUrl(data.uid);
    const buffer = await axios.get(avatarUrl, { responseType: "arraybuffer" });
    img = await loadImage(Buffer.from(buffer.data));
  } catch {
    img = await loadImage(path.join(__dirname, "default_avatar.png"));
  }

  ctx.save();
  ctx.beginPath();
  ctx.arc(WIDTH / 2, 260, 90, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(img, WIDTH / 2 - 90, 170, 180, 180);
  ctx.restore();

  // 💖 CARDS ANGEL STYLE
  const cards = [
    { label: "Total Messages", value: formatNumber(data.totalMessages) },
    { label: "Average Daily", value: Math.floor(data.totalMessages / 30) },
    { label: "Peak Activity", value: data.peak },
    { label: "Role", value: "Angel Member ✨" }
  ];

  let x = 80;
  for (let c of cards) {
    ctx.fillStyle = "rgba(255,255,255,0.1)";
    ctx.fillRect(x, 360, 220, 120);

    ctx.strokeStyle = "#ffb6ff";
    ctx.lineWidth = 3;
    ctx.strokeRect(x, 360, 220, 120);

    ctx.fillStyle = "#ffffff";
    ctx.font = "22px Arial";
    ctx.fillText("✦ " + c.label, x + 110, 405);

    ctx.font = "bold 32px Arial";
    ctx.fillStyle = "#ffccff";
    ctx.fillText(String(c.value), x + 110, 455);

    x += 260;
  }

  // 📊 30 DAY TREND
  ctx.font = "bold 32px Arial";
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.fillText("✧ 30-DAY ANGEL ACTIVITY ✧", WIDTH / 2, 540);

  const gX = 120, gY = 580, gW = WIDTH - 240, gH = 250;
  const maxVal = Math.max(...data.trend30);
  const barW = gW / 30 - 4;

  for (let i = 0; i < 30; i++) {
    let h = (data.trend30[i] / maxVal) * gH;
    let y = gY + (gH - h);

    ctx.fillStyle = "#ff99ff";
    ctx.shadowColor = "#ffffff";
    ctx.shadowBlur = 15;
    ctx.globalAlpha = 0.85;

    ctx.fillRect(gX + i * (barW + 4), y, barW, h);
  }

  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;

  // 🌙 24H HEATMAP
  ctx.font = "bold 32px Arial";
  ctx.fillStyle = "#fff";
  ctx.fillText("✧ 24H ANGEL FLOW ✧", WIDTH / 2, 900);

  const hX = 100, hY = 940, maxH = Math.max(...data.hours24);

  for (let i = 0; i < 24; i++) {
    const intensity = data.hours24[i] / maxH;
    ctx.fillStyle = `rgba(255, 182, 255, ${0.3 + intensity * 0.7})`;
    ctx.fillRect(hX + i * 36, hY, 32, 32);
  }

  // 💎 PIE CHART ANGEL
  ctx.font = "bold 32px Arial";
  ctx.fillStyle = "#fff";
  ctx.fillText("✧ MESSAGE ENERGY ✧", WIDTH / 2, 1100);

  const total = Object.values(data.breakdown).reduce((a, b) => a + b, 0);
  const colors = ["#ffb6ff", "#ffd1ff", "#caa6ff", "#ffffff"];
  const labels = ["Text", "Reactions", "Media", "GIFs"];
  const values = Object.values(data.breakdown);

  let angle = -Math.PI / 2;
  let cx = 300, cy = 1250, r = 120;

  for (let i = 0; i < values.length; i++) {
    const slice = (values[i] / total) * Math.PI * 2;

    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, angle, angle + slice);
    ctx.closePath();

    ctx.fillStyle = colors[i];
    ctx.shadowColor = "#fff";
    ctx.shadowBlur = 15;
    ctx.fill();

    angle += slice;
  }

  ctx.shadowBlur = 0;

  // 📌 LEGEND
  let lx = 500, ly = 1180;
  ctx.font = "22px Arial";
  ctx.textAlign = "left";

  for (let i = 0; i < labels.length; i++) {
    ctx.fillStyle = colors[i];
    ctx.fillRect(lx, ly + i * 40, 28, 28);

    ctx.fillStyle = "white";
    ctx.fillText(`${labels[i]}: ${values[i]}`, lx + 40, ly + 22 + i * 40);
  }

  // ✨ FINAL GLOW
  ctx.fillStyle = "rgba(255,255,255,0.05)";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // 💾 SAVE
  const tmp = path.join(__dirname, "tmp");
  if (!fs.existsSync(tmp)) fs.mkdirSync(tmp);

  const file = path.join(tmp, `angel_dashboard_${data.uid}.png`);
  const out = fs.createWriteStream(file);

  canvas.createPNGStream().pipe(out);

  out.on("finish", () => {
    message.reply({
      body: "👼 ✧ ANGEL DASHBOARD GENERATED ✧",
      attachment: fs.createReadStream(file)
    }, () => fs.unlinkSync(file));
  });
}
