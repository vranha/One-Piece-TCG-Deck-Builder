// Script para generar thumbnails de cartas que no los tengan en Supabase
// Ejecutar: node backend/scripts/generateThumbnails.js

const { supabase } = require("../services/supabaseClient");
const sharp = require("sharp");
// SOLUCIÓN node-fetch ESM:
const fetch = (...args) => import("node-fetch").then((mod) => mod.default(...args));
const path = require("path");
const fs = require("fs/promises");

const BUCKET = "card-thumbnails";
const THUMB_WIDTH = 210; // Más grande que 168
const THUMB_HEIGHT = 299; // Más grande que 239, mantiene proporción

async function getCardsWithoutThumb() {
    const { data, error } = await supabase
        .from("cards")
        .select("id, images_small, images_thumb")
        .or("images_thumb.is.null,images_thumb.eq.")
        .limit(3000);
    if (error) throw error;
    return data;
}

async function downloadImage(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to download image: ${url}`);
    return Buffer.from(await res.arrayBuffer());
}

async function generateThumbnail(buffer) {
    return sharp(buffer).resize(THUMB_WIDTH, THUMB_HEIGHT).jpeg({ quality: 80 }).toBuffer();
}

async function uploadToSupabase(cardId, thumbBuffer) {
    const filePath = `${cardId}.jpg`;
    const { error } = await supabase.storage.from(BUCKET).upload(filePath, thumbBuffer, {
        contentType: "image/jpeg",
        upsert: true,
    });
    if (error) throw error;
    // Get public URL
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(filePath);
    return data.publicUrl;
}

async function updateCardThumb(cardId, thumbUrl) {
    const { error } = await supabase.from("cards").update({ images_thumb: thumbUrl }).eq("id", cardId);
    if (error) throw error;
}

async function main() {
    try {
        const cards = await getCardsWithoutThumb();
        console.log(`Encontradas ${cards.length} cartas sin thumbnail.`);
        let processed = 0;
        let failed = 0;
        for (let i = 0; i < cards.length; i++) {
            const card = cards[i];
            try {
                if (!card.images_small) {
                    console.warn(`Card ${card.id} no tiene images_small, saltando.`);
                    continue;
                }
                console.log(`Procesando card ${card.id} (${i + 1}/${cards.length})...`);
                const imgBuffer = await downloadImage(card.images_small);
                const thumbBuffer = await generateThumbnail(imgBuffer);
                const thumbUrl = await uploadToSupabase(card.id, thumbBuffer);
                await updateCardThumb(card.id, thumbUrl);
                processed++;
                if ((i + 1) % 25 === 0 || i === cards.length - 1) {
                    console.log(`Progreso: ${i + 1}/${cards.length} | Exitosos: ${processed} | Fallidos: ${failed}`);
                }
            } catch (err) {
                failed++;
                console.error(`Error procesando card ${card.id}:`, err.message);
            }
        }
        console.log(`Proceso terminado. Thumbnails generados: ${processed}/${cards.length}. Fallidos: ${failed}`);
    } catch (err) {
        console.error("Error general:", err.message);
    }
}

// Export a function for programmatic use
async function generateThumbnails() {
    try {
        const cards = await getCardsWithoutThumb();
        let processed = 0;
        for (const card of cards) {
            try {
                if (!card.images_small) continue;
                const imgBuffer = await downloadImage(card.images_small);
                const thumbBuffer = await generateThumbnail(imgBuffer);
                const thumbUrl = await uploadToSupabase(card.id, thumbBuffer);
                await updateCardThumb(card.id, thumbUrl);
                processed++;
            } catch (err) {
                // log but continue
            }
        }
        return `Thumbnails generados: ${processed}/${cards.length}`;
    } catch (err) {
        throw err;
    }
}

module.exports = {
    generateThumbnails,
};

if (require.main === module) {
    main();
}
