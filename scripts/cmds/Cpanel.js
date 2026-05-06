const os = require("os");
const moment = require("moment-timezone");
const { createCanvas } = require("canvas");
const GIFEncoder = require("gifencoder");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "cpanel",
    version: "5.2",
    author: "Christus × Shade",
    description: "🌸 Angel kawaii control panel dashboard",
    usage: "cpanel",
    category: "system",
    role: 0
  },

  onStart: async function ({ api, event }) {
    try {
      const width = 1000, height = 700;

      const encoder = new GIFEncoder(width, height);
      const fileName = `angel_panel_${Date.now()}.gif`;
      const filePath = path.join(__dirname, fileName);

      const stream = fs.createWriteStream(filePath);
      encoder.createReadStream().pipe(stream);

      encoder.start();
      encoder.setRepeat(0);
      encoder.setDelay(160);
      encoder.setQuality(10);

      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext("2d");

      const formatUptime = (sec) => {
        const d = Math.floor(sec / 86400);
        const h = Math.floor((sec % 86400) / 3600);
        const m = Math.floor((sec % 3600) / 60);
        return `${d}j ${h}h ${m}m`;
      };

      const getStats = () => {
        const uptime = os.uptime();
        const total = os.totalmem() / 1024 / 1024 / 1024;
        const free = os.freemem() / 1024 / 1024 / 1024;
        const used = total - free;

        return [
          ["💗 BOT ANGEL UPTIME", formatUptime(process.uptime())],
          ["🌷 CPU CORES", os.cpus().length.toString()],
          ["🪽 NODE VERSION", process.version],
          ["💖 RAM USAGE", (used / total * 100).toFixed(1) + "%"],
          ["🌸 SYSTEM UPTIME", formatUptime(uptime)],
          ["✨ CPU LOAD", os.loadavg()[0].toFixed(2)],
          ["💎 TOTAL RAM", total.toFixed(1) + " GB"]
        ];
      };

      // 🌸 pastel angel palette
      const colors = ["#ffd6f5", "#c7f0ff", "#fff2a8", "#d7d2ff", "#ffb3c6", "#b8fff0"];

      const drawHex = (x, y, r, label, value, color) => {
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const angle = Math.PI / 3 * i;
          const x_i = x + r * Math.cos(angle);
          const y_i = y + r * Math.sin(angle);
          i === 0 ? ctx.moveTo(x_i, y_i) : ctx.lineTo(x_i, y_i);
        }
        ctx.closePath();

        ctx.strokeStyle = color;
        ctx.shadowColor = "#ffb6e6";
        ctx.shadowBlur = 25;
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.shadowBlur = 0;
        ctx.textAlign = "center";

        ctx.fillStyle = "#444";
        ctx.font = "16px Arial";
        ctx.fillText(label, x, y - 10);

        ctx.fillStyle = "#000";
        ctx.font = "bold 20px Arial";
        ctx.fillText(value, x, y + 20);
      };

      const cx = width / 2;
      const cy = height / 2;
      const spacing = 180;

      const positions = [
        [cx, cy - spacing],
        [cx + spacing, cy - spacing / 2],
        [cx + spacing, cy + spacing / 2],
        [cx, cy + spacing],
        [cx - spacing, cy + spacing / 2],
        [cx - spacing, cy - spacing / 2],
        [cx, cy]
      ];

      for (let frame = 0; frame < 30; frame++) {
        const stats = getStats();

        ctx.clearRect(0, 0, width, height);

        // 🌸 soft angel background
        const gradient = ctx.createLinearGradient(0, 0, width, height);
        gradient.addColorStop(0, "#fff0f6");
        gradient.addColorStop(1, "#f0f8ff");

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        // 🌸 title
        ctx.fillStyle = "#ff7eb9";
        ctx.font = "bold 36px Arial";
        ctx.textAlign = "center";
        ctx.shadowColor = "#ffb6e6";
        ctx.shadowBlur = 20;
        ctx.fillText("🌸 ANGEL CONTROL PANEL 🌸", width / 2, 70);
        ctx.shadowBlur = 0;

        // 🌸 time
        ctx.fillStyle = "#555";
        ctx.font = "16px Arial";
        ctx.textAlign = "right";
        ctx.fillText(
          "🌸 " + moment().tz("Africa/Abidjan").format("DD/MM/YYYY HH:mm:ss"),
          width - 30,
          40
        );

        ctx.textAlign = "left";
        ctx.fillText(`🪽 OS : ${os.platform()} (x64)`, 30, 40);

        // 🌸 hex stats
        for (let i = 0; i < stats.length; i++) {
          const color = colors[(frame + i) % colors.length];
          drawHex(positions[i][0], positions[i][1], 90, stats[i][0], stats[i][1], color);
        }

        encoder.addFrame(ctx);
      }

      encoder.finish();

      stream.on("finish", () => {
        api.sendMessage({
          body: "🌸 Voici ton Angel Control Panel 💗",
          attachment: fs.createReadStream(filePath)
        }, event.threadID, () => fs.unlinkSync(filePath));
      });

    } catch (err) {
      console.error(err);
      api.sendMessage("❌ Erreur du panneau angel 💔", event.threadID);
    }
  }
};
