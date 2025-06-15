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

    // --- Cargar el logo de la app ---
    const path = require("path");
    let logoImg;
    try {
        // Usa el logo original de alta resolución
        logoImg = await loadImage(path.join(__dirname, "../OPLAB-logo.png"));
    } catch (e) {
        logoImg = null;
    }

    // --- Ajustes para cartas más grandes y menos gap ---
    const newScale = 4; // Escala más baja para que la imagen sea más pequeña y los textos más grandes
    const newCardsPerRow = 5;
    const newGap = 5 * newScale; // gap más pequeño
    const newCardW = 90 * newScale; // cartas más grandes
    const newCardH = 126 * newScale;
    const newLeaderW = 110 * newScale;
    const newLeaderH = 70 * newScale; // un poco más alto para el recorte
    const logoW = 54 * newScale;
    const logoH = 54 * newScale;
    const newRows = 4; // Forzar 4 filas
    // Calcula el ancho para que las 5 cartas y los gaps ocupen todo el ancho con padding
    const cardsWidth = (newCardW + newGap) * newCardsPerRow - newGap;
    const contentWidth = Math.max(cardsWidth, newLeaderW + logoW + newGap);
    const newWidth = newGap * 2 + contentWidth;
    // Calcula la altura para 4 filas de cartas + leader + más espacio arriba (más alto)
    const extraTopSpace = 60 * newScale; // Espacio extra arriba para el líder y posibles elementos
    const newHeight = extraTopSpace + newLeaderH + newGap + (newCardH + newGap) * newRows + newGap * 2;
    // No cuadrada, más vertical
    const squareCanvas = createCanvas(newWidth, newHeight);
    const squareCtx = squareCanvas.getContext("2d");
    squareCtx.fillStyle = "#232323";
    squareCtx.fillRect(0, 0, newWidth, newHeight);
    // Centrar el contenido horizontalmente
    const offsetX = (newWidth - contentWidth) / 2;
    // Subir el leader más arriba en el header y separarlo más de las cartas
    const leaderY = extraTopSpace * 0.15; // Más cerca del borde superior
    const offsetY = extraTopSpace;

    // Mejorar la calidad de escalado de imágenes
    squareCtx.imageSmoothingEnabled = true;
    squareCtx.imageSmoothingQuality = "high";

    // Leader (recortada: solo la franja central, sin achatar)
    const leaderImg = images[0];
    // Recorte asimétrico: 12% arriba y 25% abajo
    const cropMarginTop = leaderImg.height * 0.12;
    const cropMarginBottom = leaderImg.height * 0.25;
    const cropY = cropMarginTop;
    const cropH = leaderImg.height - cropMarginTop - cropMarginBottom;
    // Mantén la relación de aspecto original del leader
    // --- Cambia a imagen cuadrada ---
    const displayW = newLeaderW;
    const displayH = newLeaderW; // Cuadrada
    // Logo y leader alineados a la izquierda de la imagen general, con margen izquierdo y derecho para el logo
    const logoMarginLeft = newGap * 2.5; // margen extra a la izquierda
    const logoMarginRight = newGap * 1.5; // margen extra a la derecha del logo
    const headerBlockX = logoMarginLeft;
    // Logo a la izquierda
    if (logoImg) {
        // Si el logo es más grande que el área de destino, escálalo hacia abajo para mayor nitidez
        // Dibuja el logo usando drawImage con reducción de tamaño
        squareCtx.drawImage(
            logoImg,
            0,
            0,
            logoImg.width,
            logoImg.height, // origen completo
            headerBlockX,
            leaderY + (displayH - logoH) / 2,
            logoW,
            logoH // destino reducido
        );
    }
    // Leader a la derecha del logo, con bordes redondeados
    squareCtx.save();
    squareCtx.beginPath();
    // Bordes redondeados para el leader (cuadrado)
    const radius = 24;
    const x = headerBlockX + logoW + logoMarginRight;
    const y = leaderY;
    const w = displayW;
    const h = displayH;
    squareCtx.moveTo(x + radius, y);
    squareCtx.lineTo(x + w - radius, y);
    squareCtx.quadraticCurveTo(x + w, y, x + w, y + radius);
    squareCtx.lineTo(x + w, y + h - radius);
    squareCtx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
    squareCtx.lineTo(x + radius, y + h);
    squareCtx.quadraticCurveTo(x, y + h, x, y + h - radius);
    squareCtx.lineTo(x, y + radius);
    squareCtx.quadraticCurveTo(x, y, x + radius, y);
    squareCtx.closePath();
    squareCtx.clip();
    // Ajusta el recorte para que la imagen se centre en el cuadrado
    const cropWidth = Math.min(leaderImg.width, cropH); // usa el menor para cuadrar
    const cropX = (leaderImg.width - cropWidth) / 2;
    squareCtx.drawImage(leaderImg, cropX, cropY, cropWidth, cropH, x, y, w, h);
    squareCtx.restore();
    // Dibuja un borde alrededor del leader cuadrado
    squareCtx.save();
    squareCtx.beginPath();
    squareCtx.moveTo(x + radius, y);
    squareCtx.lineTo(x + w - radius, y);
    squareCtx.quadraticCurveTo(x + w, y, x + w, y + radius);
    squareCtx.lineTo(x + w, y + h - radius);
    squareCtx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
    squareCtx.lineTo(x + radius, y + h);
    squareCtx.quadraticCurveTo(x, y + h, x, y + h - radius);
    squareCtx.lineTo(x, y + radius);
    squareCtx.quadraticCurveTo(x, y, x + radius, y);
    squareCtx.closePath();
    squareCtx.lineWidth = 8;
    squareCtx.strokeStyle = "#FFFFFF"; // dorado claro
    squareCtx.shadowColor = "#000";
    squareCtx.shadowBlur = 8;
    squareCtx.stroke();
    squareCtx.restore();

    // Cartas normales
    for (let i = 1; i < cards.length; i++) {
        const card = cards[i];
        const img = images[i];
        const row = Math.floor((i - 1) / newCardsPerRow);
        const col = (i - 1) % newCardsPerRow;
        const x = offsetX + col * (newCardW + newGap);
        const y = offsetY + newLeaderH + newGap + row * (newCardH + newGap);
        // Dibuja la carta usando drawImage con reducción si la imagen es más grande
        squareCtx.drawImage(
            img,
            0,
            0,
            img.width,
            img.height, // origen completo (alta resolución)
            x,
            y,
            newCardW,
            newCardH // destino reducido
        );
        // Cantidad (círculo elegante)
        squareCtx.save();
        squareCtx.beginPath();
        squareCtx.arc(x + newCardW - 28, y + newCardH - 28, 32, 0, 2 * Math.PI); // círculo más grande
        squareCtx.closePath();
        squareCtx.fillStyle = "#FFFFFF"; // dorado suave
        squareCtx.fill();
        squareCtx.shadowBlur = 0;
        // Aumenta el tamaño de fuente y baja el número
        squareCtx.font = "bold 54px sans-serif"; // número más grande
        squareCtx.fillStyle = "#2D2D2D";
        squareCtx.textAlign = "center";
        squareCtx.textBaseline = "middle";
        squareCtx.fillText(card.quantity, x + newCardW - 28, y + newCardH - 24); // más abajo
        squareCtx.restore();
    }
    // Escribe el nombre de la app centrado respecto al logo
    const pFontSize = (54 * newScale) / 4;
    const oFontSize = pFontSize * 0.65;
    const logoCenterX = headerBlockX + logoW / 2;
    // Medir anchos de cada parte
    squareCtx.font = `bold ${oFontSize}px sans-serif`;
    const oWidth = squareCtx.measureText("O").width;
    squareCtx.font = `bold ${pFontSize}px sans-serif`;
    const pWidth = squareCtx.measureText("P").width;
    const labWidth = squareCtx.measureText("lab").width;
    const totalTextWidth = Math.max(oWidth, pWidth) + labWidth; // la O va encima, pero cuenta para centrar
    const textX = logoCenterX - (pWidth + labWidth) / 2 + (8 * newScale) / 4; // desplazamos un poco a la derecha
    const textY = leaderY + (displayH - logoH) / 2 - pFontSize - 24;
    // Dibuja la "O" azul, un poco a la izquierda y más abajo en Y
    const oXOffset = textX - (22 * newScale) / 4;
    const oYOffset = textY - (pFontSize - oFontSize) + (24 * newScale) / 4;
    squareCtx.font = `bold ${oFontSize}px sans-serif`;
    squareCtx.textBaseline = "top";
    squareCtx.textAlign = "left";
    squareCtx.fillStyle = "#4DB3FF";
    squareCtx.fillText("O", oXOffset, oYOffset);
    // Dibuja la "P" marrón
    squareCtx.font = `bold ${pFontSize}px sans-serif`;
    squareCtx.fillStyle = "#A05A5A";
    squareCtx.fillText("P", textX, textY);
    // Dibuja "lab" naranja claro
    squareCtx.fillStyle = "#F7C58A";
    squareCtx.fillText("lab", textX + pWidth, textY);

    // --- Estadísticas para mostrar a la derecha del líder ---
    // Excluye el líder
    const nonLeaderCards = cards.slice(1);
    // Av.Cost
    const totalCost = nonLeaderCards.reduce((sum, c) => sum + (c.cost ? Number(c.cost) : 0) * (c.quantity ?? 1), 0);
    const totalCards = nonLeaderCards.reduce((sum, c) => sum + (c.quantity ?? 1), 0);
    const averageCost = totalCards > 0 ? totalCost / totalCards : 0;
    // Av.Power
    const totalPower = nonLeaderCards.reduce((sum, c) => sum + (c.power ? Number(c.power) : 0) * (c.quantity ?? 1), 0);
    const averagePower = totalCards > 0 ? totalPower / totalCards : 0;
    // Familia más representada
    const familyCount = {};
    nonLeaderCards.forEach((c) => {
        if (c.family) {
            familyCount[c.family] = (familyCount[c.family] || 0) + (c.quantity ?? 1);
        }
    });
    let topFamily = null,
        topFamilyCount = 0;
    Object.entries(familyCount).forEach(([fam, count]) => {
        if (count > topFamilyCount) {
            topFamily = fam;
            topFamilyCount = count;
        }
    });
    const topFamilyPercent = totalCards > 0 ? (topFamilyCount / totalCards) * 100 : 0;

    // --- Dibuja los stats a la derecha del líder ---
    // Ajusta posición y tamaño para que no invadan las cartas
    const statsX = x + w + newGap * 4.2; // más a la derecha
    const statsY = y + 8 * newScale; // igual
    const statsLineH = (28 * newScale) / 2.5; // menos alto, menos gap
    const statsValueFont = `bold ${(26 * newScale) / 2.5}px sans-serif`;
    const statsLabelFont = `bold ${(24 * newScale) / 2.5}px sans-serif`;
    // Av.Cost: Cost
    squareCtx.font = statsLabelFont;
    squareCtx.fillStyle = "#4DB3FF";
    squareCtx.textAlign = "left";
    squareCtx.fillText("Av.Cost:", statsX, statsY);
    squareCtx.font = statsValueFont;
    squareCtx.fillStyle = "#fff";
    squareCtx.fillText(averageCost.toFixed(1), statsX + (220 * newScale) / 4, statsY);
    // Av.Power: Power
    squareCtx.font = statsLabelFont;
    squareCtx.fillStyle = "#4DB3FF";
    squareCtx.fillText("Av.Power:", statsX, statsY + statsLineH * 1.1);
    squareCtx.font = statsValueFont;
    squareCtx.fillStyle = "#fff";
    squareCtx.fillText(averagePower.toFixed(1), statsX + (220 * newScale) / 4, statsY + statsLineH * 1.1);
    // Top Family: Familia (%)
    squareCtx.font = statsLabelFont;
    squareCtx.fillStyle = "#4DB3FF";
    squareCtx.fillText("Archetype:", statsX, statsY + statsLineH * 2.2);
    squareCtx.font = statsValueFont;
    squareCtx.fillStyle = "#fff";
    if (topFamily) {
        squareCtx.fillText(
            `${topFamily} (${topFamilyPercent.toFixed(1)}%)`,
            statsX + (220 * newScale) / 4,
            statsY + statsLineH * 2.2
        );
    } else {
        squareCtx.fillText("-", statsX + (220 * newScale) / 4, statsY + statsLineH * 2.2);
    }

    // --- Gráfico de distribución de counters debajo de las estadísticas ---
    const counterDistribution = req.body.counterDistribution || [];
    const blockers = req.body.blockers ?? 0;
    const plus5kCards = req.body.plus5kCards ?? 0;
    const events = req.body.events ?? 0;
    if (counterDistribution.length > 0) {
        // Configuración del gráfico (más grande y más separado de las estadísticas)
        const chartX = statsX;
        const chartY = statsY + statsLineH * 3.2 + (38 * newScale) / 4; // más separación
        const chartW = (650 * newScale) / 4; // aún más ancho
        const chartH = (220 * newScale) / 4; // aún más alto
        const barGap = (24 * newScale) / 4; // más separación entre barras
        const barCount = counterDistribution.length;
        const barW = (chartW - barGap * (barCount - 1)) / barCount;
        const maxVal = Math.max(...counterDistribution, 1);
        // Ejes
        squareCtx.save();
        squareCtx.strokeStyle = "#a84848";
        squareCtx.lineWidth = 2;
        squareCtx.beginPath();
        squareCtx.moveTo(chartX, chartY + chartH);
        squareCtx.lineTo(chartX + chartW, chartY + chartH);
        squareCtx.stroke();
        // Barras
        for (let i = 0; i < barCount; i++) {
            const val = counterDistribution[i];
            const barH = (val / maxVal) * (chartH - 18);
            const bx = chartX + i * (barW + barGap);
            const by = chartY + chartH - barH;
            squareCtx.fillStyle = "#a84848";
            squareCtx.fillRect(bx, by, barW, barH);
            // Etiquetas debajo
            let barLabel = i === barCount - 1 ? "Event" : i === 0 ? "0" : `${i}k`;
            squareCtx.font = `bold ${(26 * newScale) / 4}px sans-serif`;
            squareCtx.fillStyle = "#fff";
            squareCtx.textAlign = "center";
            // Acerca la etiqueta al gráfico (reduce el offset Y)
            squareCtx.fillText(barLabel, bx + barW / 2, chartY + chartH + (10 * newScale) / 4);
            // Número encima de la barra
            squareCtx.font = `bold ${(38 * newScale) / 4}px sans-serif`; // más grande
            squareCtx.fillStyle = "#fff";
            squareCtx.textAlign = "center";
            squareCtx.fillText(val, bx + barW / 2, by - (8 * newScale) / 4); // más arriba
        }
        // Título
        squareCtx.font = `bold ${(32 * newScale) / 4}px sans-serif`;
        squareCtx.fillStyle = "#4DB3FF";
        squareCtx.textAlign = "left";
        squareCtx.fillText("Counters:", chartX, chartY - (24 * newScale) / 4);
        squareCtx.restore();

        // --- Stats extra a la derecha del gráfico ---
        const extraStatsX = chartX + chartW + (60 * newScale) / 4; // menos a la derecha
        let extraStatsY = chartY + (24 * newScale) / 4;
        const extraStatsLineH = (80 * newScale) / 4; // más separación
        const boxW = (170 * newScale) / 4; // más ancho para centrar ambos
        const boxH = (70 * newScale) / 4;
        const boxRadius = (22 * newScale) / 4;
        const labelFont = `bold ${(32 * newScale) / 4}px sans-serif`;
        const valueFont = `bold ${(44 * newScale) / 4}px sans-serif`;
        const labelColor = "#81C784";
        const valueColor = "#fff";
        const boxBg = "#121212";
        const boxShadow = "#81C784";
        // Helper para dibujar cada estadística: rectángulo alrededor del label, valor alineado a la derecha
        function drawStatBox(label, value, x, y, maxLabelBoxW) {
            // Medir label
            squareCtx.font = labelFont;
            const labelWidth = squareCtx.measureText(label).width;
            const labelPadX = (20 * newScale) / 4; // padding horizontal más pequeño
            const labelPadY = (18 * newScale) / 4;
            const boxWLabel = maxLabelBoxW ?? labelWidth + labelPadX * 2;
            const boxHLabel = boxH;
            // Cuadro alrededor del label
            squareCtx.save();
            squareCtx.beginPath();
            squareCtx.moveTo(x, y);
            squareCtx.arcTo(x + boxWLabel, y, x + boxWLabel, y + boxHLabel, boxRadius);
            squareCtx.arcTo(x + boxWLabel, y + boxHLabel, x, y + boxHLabel, boxRadius);
            squareCtx.arcTo(x, y + boxHLabel, x, y, boxRadius);
            squareCtx.arcTo(x, y, x + boxWLabel, y, boxRadius);
            squareCtx.closePath();
            squareCtx.fillStyle = boxBg;
            squareCtx.shadowColor = boxShadow;
            squareCtx.shadowBlur = 0; // Sin sombra para el label
            squareCtx.fill();
            squareCtx.shadowBlur = 0;
            // Dibuja label centrado en el rectángulo
            squareCtx.font = labelFont;
            squareCtx.fillStyle = labelColor;
            squareCtx.textAlign = "center";
            squareCtx.textBaseline = "middle";
            squareCtx.fillText(label, x + boxWLabel / 2, y + boxHLabel / 2);
            squareCtx.restore();
            // Dibuja valor alineado a la derecha del cuadro, bien alineado con los otros
            squareCtx.font = valueFont;
            squareCtx.fillStyle = valueColor;
            squareCtx.textAlign = "left";
            squareCtx.textBaseline = "middle";
            const valueX = x + boxWLabel + (24 * newScale) / 4; // margen más pequeño a la derecha
            squareCtx.fillText(String(value), valueX, y + boxHLabel / 2);
        }
        // Calcular el ancho máximo de los rectángulos de label para alinear todos los valores
        const labelBoxWidths = ["Blockers", "+5k Power", "Events"].map((label) => {
            squareCtx.font = labelFont;
            return squareCtx.measureText(label).width + (32 * newScale) / 2;
        });
        const maxLabelBoxW = Math.max(...labelBoxWidths);
        drawStatBox("Blockers", blockers, extraStatsX, extraStatsY, maxLabelBoxW);
        extraStatsY += extraStatsLineH;
        drawStatBox(">5k Power", plus5kCards, extraStatsX, extraStatsY, maxLabelBoxW);
        extraStatsY += extraStatsLineH;
        drawStatBox("Events", events, extraStatsX, extraStatsY, maxLabelBoxW);
        extraStatsY += extraStatsLineH;
    }

    // Devuelve la imagen como PNG
    res.set("Content-Type", "image/png");
    squareCanvas.pngStream().pipe(res);
    console.timeEnd("canvas");
    return;
});

module.exports = router;
