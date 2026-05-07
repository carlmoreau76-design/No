const { createCanvas, loadImage } = require("canvas");
const fs = require("fs-extra");
const path = require("path");

/* =========================
   🎀 CONFIG COMMAND
========================= */
exports.config = {
    name: "maze",
    author: "Shade ✨",
    role: 0,
    countDown: 40,
    description: "🧩 Kawaii maze adventure 💖",
    version: "2.0.0",
    guide: "{pn} [1-10] ou easy | medium | hard",
    category: "game",
};

/* =========================
   🌸 MAZE GENERATOR
========================= */
function generateMazeImage(difficulty = 10, grid = null, cols = null, highlightPath = null, wrongPath = null, currentPosition = null, progressPath = null) {

    difficulty = Math.max(1, Math.min(difficulty, 15));

    const base = 10;
    const size = Math.floor(base + difficulty * 0.4);
    const cellSize = 30;

    let rows;

    if (!grid) {
        cols = size;
        rows = size;
        grid = [];
        const stack = [];

        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                grid.push({
                    x,
                    y,
                    walls: { top: true, right: true, bottom: true, left: true },
                    visited: false
                });
            }
        }

        function index(x, y) {
            if (x < 0 || y < 0 || x >= cols || y >= rows) return -1;
            return x + y * cols;
        }

        function getNeighbors(cell) {
            const { x, y } = cell;
            const n = [];

            const top = grid[index(x, y - 1)];
            const right = grid[index(x + 1, y)];
            const bottom = grid[index(x, y + 1)];
            const left = grid[index(x - 1, y)];

            if (top && !top.visited) n.push(top);
            if (right && !right.visited) n.push(right);
            if (bottom && !bottom.visited) n.push(bottom);
            if (left && !left.visited) n.push(left);

            return n;
        }

        function removeWalls(a, b) {
            const dx = a.x - b.x;
            const dy = a.y - b.y;

            if (dx === 1) { a.walls.left = false; b.walls.right = false; }
            else if (dx === -1) { a.walls.right = false; b.walls.left = false; }

            if (dy === 1) { a.walls.top = false; b.walls.bottom = false; }
            else if (dy === -1) { a.walls.bottom = false; b.walls.top = false; }
        }

        let current = grid[0];
        current.visited = true;

        while (true) {
            const neighbors = getNeighbors(current);

            if (neighbors.length) {
                stack.push(current);
                const next = neighbors[Math.floor(Math.random() * neighbors.length)];
                removeWalls(current, next);
                next.visited = true;
                current = next;
            } else if (stack.length) {
                current = stack.pop();
            } else break;
        }
    } else {
        rows = grid.length / cols;
    }

    const width = cols * cellSize;
    const height = rows * cellSize;

    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    /* 💖 KAWAII BACKGROUND */
    ctx.fillStyle = "#fff7fb";
    ctx.fillRect(0, 0, width, height);

    const start = grid[0];
    const end = grid[grid.length - 1];

    function index(x, y) {
        if (x < 0 || y < 0 || x >= cols || y >= rows) return -1;
        return x + y * cols;
    }

    /* =========================
       🎨 PATH COLORS
    ========================= */
    function drawPath(path, color) {
        if (!path || path.length < 2) return;

        ctx.strokeStyle = color;
        ctx.lineWidth = 6;
        ctx.lineCap = "round";
        ctx.beginPath();

        for (let i = 0; i < path.length; i++) {
            const c = path[i];
            const cx = c.x * cellSize + cellSize / 2;
            const cy = c.y * cellSize + cellSize / 2;

            if (i === 0) ctx.moveTo(cx, cy);
            else ctx.lineTo(cx, cy);
        }
        ctx.stroke();
    }

    drawPath(progressPath, "rgba(255,182,193,0.8)"); // pink kawaii
    drawPath(highlightPath, "rgba(144,238,144,0.8)"); // green cute
    drawPath(wrongPath, "rgba(255,105,180,0.7)"); // red pink

    /* =========================
       🧱 GRID
    ========================= */
    ctx.strokeStyle = "#ffb6c1";
    ctx.lineWidth = 2;

    grid.forEach(cell => {
        const x = cell.x * cellSize;
        const y = cell.y * cellSize;
        const w = cell.walls;

        if (w.top) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + cellSize, y); ctx.stroke(); }
        if (w.right) { ctx.beginPath(); ctx.moveTo(x + cellSize, y); ctx.lineTo(x + cellSize, y + cellSize); ctx.stroke(); }
        if (w.bottom) { ctx.beginPath(); ctx.moveTo(x, y + cellSize); ctx.lineTo(x + cellSize, y + cellSize); ctx.stroke(); }
        if (w.left) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + cellSize); ctx.stroke(); }
    });

    /* =========================
       💙 START / END KAWAII
    ========================= */
    ctx.font = `${Math.floor(cellSize * 0.7)}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.fillStyle = "#8ecae6";
    ctx.fillRect(start.x * cellSize, start.y * cellSize, cellSize, cellSize);
    ctx.fillStyle = "#000";
    ctx.fillText("🐰", start.x * cellSize + cellSize / 2, start.y * cellSize + cellSize / 2);

    ctx.fillStyle = "#ffafcc";
    ctx.fillRect(end.x * cellSize, end.y * cellSize, cellSize, cellSize);
    ctx.fillStyle = "#000";
    ctx.fillText("🌸", end.x * cellSize + cellSize / 2, end.y * cellSize + cellSize / 2);

    return {
        image: canvas.createPNGStream(),
        grid,
        cols
    };
}

/* =========================
   🎮 COMMAND START
========================= */
exports.onStart = async ({ args, message, event }) => {

    let difficulty = 8;

    if (args[0] === "easy") difficulty = 4;
    else if (args[0] === "medium") difficulty = 8;
    else if (args[0] === "hard") difficulty = 13;
    else if (!isNaN(args[0])) difficulty = parseInt(args[0]);

    const data = generateMazeImage(difficulty);

    const file = path.join(__dirname, "maze_kawaii.png");
    const stream = fs.createWriteStream(file);

    data.image.pipe(stream);
    await new Promise(res => stream.on("finish", res));

    const msg = await message.reply({
        body: `🎀 𝑲𝒂𝒘𝒂𝒊𝒊 𝑴𝒂𝒛𝒆 🎀

🌸 Résous le labyrinthe magique !
🐰 Départ → 🌸 Arrivée

💗 Envoie : ⬆️⬇️⬅️➡️ ou u r d l`,
        attachment: fs.createReadStream(file)
    });

    fs.unlinkSync(file);

    global.GoatBot.onReply.set(msg.messageID, {
        author: event.senderID,
        grid: data.grid,
        cols: data.cols,
        progress: ""
    });
};

/* =========================
   💬 ON REPLY
========================= */
exports.onReply = async ({ event, Reply, message }) => {
    if (event.senderID !== Reply.author) return;

    await message.reply("💖 Mode kawaii actif mais logique de réponse à brancher ici ✨");
};
