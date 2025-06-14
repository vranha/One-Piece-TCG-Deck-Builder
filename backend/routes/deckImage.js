const express = require("express");
const { createCanvas, loadImage } = require("canvas");
const router = express.Router();

router.post("/deck-image", async (req, res) => {
    const { cards, leaderName } = req.body;

    // Parámetros de layout
    const scale = 2;
    const cardW = 90 * scale,
        cardH = 126 * scale,
        gap = 8 * scale,
        leaderW = 110 * scale,
        leaderH = 154 * scale;
    const cardsPerRow = 4;
    const rows = Math.ceil((cards.length - 1) / cardsPerRow);
    const width = gap + leaderW + gap + (cardW + gap) * cardsPerRow;
    const height = gap + Math.max(leaderH, (cardH + gap) * rows) + 60 * scale;

    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    // Fondo
    ctx.fillStyle = "#2e2e2e";
    ctx.fillRect(0, 0, width, height);

    // --- DESCARGA TODAS LAS IMÁGENES EN PARALELO ---
    let images = [];
    try {
        console.time("descarga");
        images = await Promise.all(cards.map((card) => loadImage(card.image)));
        console.timeEnd("descarga");
        console.time("canvas");
    } catch (err) {
        return res.status(400).json({ error: "Error cargando imágenes" });
    }

    // Leader
    const leaderImg = images[0];
    ctx.drawImage(leaderImg, gap, gap, leaderW, leaderH);

    // Leader name
    ctx.font = "bold 22px";
    ctx.fillStyle = "#a84848";
    ctx.textAlign = "left";
    ctx.fillText(leaderName || "", gap, gap + leaderH + 28);

    // Cartas normales
    for (let i = 1; i < cards.length; i++) {
        const card = cards[i];
        const img = images[i];
        const row = Math.floor((i - 1) / cardsPerRow);
        const col = (i - 1) % cardsPerRow;
        const x = gap + leaderW + gap + col * (cardW + gap);
        const y = gap + row * (cardH + gap);
        ctx.drawImage(img, x, y, cardW, cardH);

        // Cantidad
        ctx.fillStyle = "#a84848";
        ctx.beginPath();
        ctx.arc(x + cardW - 16, y + cardH - 16, 14, 0, 2 * Math.PI);
        ctx.fill();
        ctx.font = "bold 18px";
        ctx.fillStyle = "#fff";
        ctx.textAlign = "center";
        ctx.fillText(card.quantity, x + cardW - 16, y + cardH - 10);
    }

    // Devuelve la imagen como PNG
    res.set("Content-Type", "image/png");
    canvas.pngStream().pipe(res);
    console.timeEnd("canvas");
});

module.exports = router;
