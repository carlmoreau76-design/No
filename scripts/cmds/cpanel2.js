const os = require("os");
const moment = require("moment-timezone");
const { createCanvas } = require("canvas");
const GIFEncoder = require("gifencoder");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "cpanel2",
    version: "5.0.1 Hori Pro",
    author: "Christus × Shade × Gemini",
    description: "🌸 Interface de diagnostic système dynamique style Hori HUD.",
    usage: "cpanel2",
    category: "system",
    role: 0
  },

  onStart: async function ({ api, event }) {
    try {
      if (!event?.threadID) return;

      const width = 1000;
      const height = 650;

      const encoder = new GIFEncoder(width, height);
      const cacheDir = path.join(__dirname, "..", "cache");
      await fs.ensureDir(cacheDir);

      const fileName = `hori_cpanel_${Date.now()}.gif`;
      const filePath = path.join(cacheDir, fileName);

      const stream = fs.createWriteStream(filePath);
      encoder.createReadStream().pipe(stream);

      encoder.start();
      encoder.setRepeat(0);
      encoder.setDelay(80);
      encoder.setQuality(10);

      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext("2d");

      const formatUptime = (sec) => {
        const d = Math.floor(sec / 86400);
        const h = Math.floor((sec % 86400) / 3600);
        const m = Math.floor((sec % 3600) / 60);
        return `${d}j ${h}h ${m}m`;
      };

      const totalMem = os.totalmem() / 1024 / 1024 / 1024;
      const freeMem = os.freemem() / 1024 / 1024 / 1024;
      const usedMem = totalMem - freeMem;
      const ramPercentage = (usedMem / totalMem * 100).toFixed(1);

      const stats = [
        { label: "UPTIME CORE", value: formatUptime(process.uptime()), bar: false },
        { label: "CPU THREADS", value: `${os.cpus().length} Cores`, bar: false },
        { label: "NODE RUNTIME", value: process.version, bar: false },
        { label: "RAM OCCUPATION", value: `${ramPercentage}%`, bar: true, ratio: usedMem / totalMem },
        { label: "HOST OPERATIONAL", value: formatUptime(os.uptime()), bar: false },
        { label: "PLATFORM ARCH", value: `${os.platform()} (${os.arch()})`, bar: false },
        { label: "SERVER LOAD", value: `${(os.loadavg()?.[0] || 0).toFixed(2)}`, bar: true, ratio: Math.min((os.loadavg()?.[0] || 0) / 4, 1) },
        { label: "HARDWARE STORAGE", value: `${usedMem.toFixed(1)} / ${totalMem.toFixed(1)} GB`, bar: false }
      ];

      const cardW = 430;
      const cardH = 95;
      const startX = 50;
      const startY = 140;
      const gapX = 40;
      const gapY = 25;

      for (let frame = 0; frame < 15; frame++) {
        const bgGrad = ctx.createLinearGradient(0, 0, width, height);
        bgGrad.addColorStop(0, "#1f030c");
        bgGrad.addColorStop(0.5, "#0b0518");
        bgGrad.addColorStop(1, "#03020c");
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, width, height);

        ctx.strokeStyle = "rgba(244, 63, 94, 0.04)";
        ctx.lineWidth = 1;
        for (let x = 0; x < width; x += 50) {
          ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
        }
        for (let y = 0; y < height; y += 50) {
          ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
        }

        ctx.strokeStyle = "#22d3ee";
        ctx.lineWidth = 2;
        ctx.strokeRect(25, 25, width - 50, height - 50);

        ctx.strokeStyle = "#f43f5e";
        ctx.lineWidth = 1;
        ctx.strokeRect(30, 30, width - 60, height - 60);

        const titleGrad = ctx.createLinearGradient(50, 0, 450, 0);
        titleGrad.addColorStop(0, "#ffffff");
        titleGrad.addColorStop(1, "#f43f5e");
        ctx.fillStyle = titleGrad;
        ctx.font = "bold 26px Arial";
        ctx.textAlign = "left";
        ctx.fillText("🌸 HORI INTERNAL SYSTEM TERMINAL", 50, 75);

        ctx.font = "14px Courier New";
        ctx.fillStyle = "#99f6e4";
        ctx.textAlign = "right";
        ctx.fillText(
          moment().tz("Europe/Paris").format("DD/MM/YYYY HH:mm:ss"),
          width - 50,
          72
        );

        for (let i = 0; i < stats.length; i++) {
          const col = i % 2;
          const row = Math.floor(i / 2);
          const x = startX + col * (cardW + gapX);
          const y = startY + row * (cardH + gapY);

          ctx.fillStyle = "rgba(255, 255, 255, 0.04)";
          ctx.beginPath();
          if (ctx.roundRect) {
            ctx.roundRect(x, y, cardW, cardH, [0, 12, 12, 12]);
          } else {
            ctx.rect(x, y, cardW, cardH);
          }
          ctx.fill();

          ctx.strokeStyle = i % 2 === 0 ? "rgba(244, 63, 94, 0.4)" : "rgba(34, 211, 238, 0.4)";
          ctx.lineWidth = 1.5;
          ctx.stroke();

          ctx.textAlign = "left";
          ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
          ctx.font = "bold 12px Courier New";
          ctx.fillText(`// ${stats[i].label}`, x + 20, y + 28);

          ctx.fillStyle = "#ffffff";
          ctx.font = "bold 19px Arial";
          ctx.fillText(stats[i].value, x + 20, y + 56);

          if (stats[i].bar) {
            const barW = 160;
            const barH = 5;
            const barX = x + cardW - barW - 20;
            const barY = y + 46;

            ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
            ctx.fillRect(barX, barY, barW, barH);

            const animRatio = Math.max(0, Math.min(1, stats[i].ratio + Math.sin(frame / 2 + i) * 0.02));
            ctx.fillStyle = i % 2 === 0 ? "#f43f5e" : "#22d3ee";
            ctx.fillRect(barX, barY, barW * animRatio, barH);
          }
        }

        ctx.textAlign = "center";
        ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
        ctx.font = "bold 11px Arial";
        ctx.fillText("DIAGNOSTIC ARCHITECTURE • HORI PROTOCOL ONLINE", width / 2, height - 42);

        const scanY = 35 + ((frame / 14) * (height - 70));
        const scanGrad = ctx.createLinearGradient(0, scanY - 4, 0, scanY + 4);
        scanGrad.addColorStop(0, "rgba(34, 211, 238, 0)");
        scanGrad.addColorStop(0.5, "rgba(34, 211, 238, 0.18)");
        scanGrad.addColorStop(1, "rgba(34, 211, 238, 0)");
        ctx.fillStyle = scanGrad;
        ctx.fillRect(32, scanY - 4, width - 64, 8);

        encoder.addFrame(ctx);
      }

      encoder.finish();

      stream.on("finish", () => {
        api.sendMessage(
          {
            body: "✨ 🌸 **[ TERMINAL DE CONTRÔLE ]** 🌸 ✨\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n📊 **Analyse matérielle :** Complétée avec succès\n⚙️ **Index de statut :** Serveur opérationnel\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n💡 _Le flux vidéo ci-dessous affiche les processus réactifs en temps réel._",
            attachment: fs.createReadStream(filePath)
          },
          event.threadID,
          () => {
            try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch (e) {}
          }
        );
      });

    } catch (err) {
      console.error(err);
      api.sendMessage("✨ 🌸 **[ CRITICAL FLOP / INTERRUPTION ]** 🌸 ✨\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n❌ Échec critique lors de l'initialisation du tableau de bord.", event.threadID);
    }
  }
};
