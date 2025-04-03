const fs = require("fs");
const cheerio = require("cheerio");
const dotenv = require("dotenv");
const { createClient } = require("@supabase/supabase-js");

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const html = fs.readFileSync("scripts/cards.html", "utf8");
const $ = cheerio.load(html);

const cards = [];

$("dl.modalCol").each((_, element) => {
    const card = {};

    // ID de la carta
    card.id = $(element).attr("id");

    // Código, rareza y tipo
    const infoText = $(element).find(".infoCol").text().trim().split(" | ");
    card.code = infoText[0] || "";
    card.rarity = infoText[1] || "";
    card.type = infoText[2] || "";

    // Nombre de la carta
    card.name = $(element).find(".cardName").text().trim();

    // Imágenes
    const imgSrc = $(element).find(".frontCol img").attr("data-src") || "";
    card.images_small = imgSrc ? `https://en.onepiece-cardgame.com${imgSrc}` : "";
    card.images_large = card.images_small;

    // Coste, atributo, poder y counter
    card.cost = parseInt($(element).find(".cost").text().replace("Cost", "").trim()) || 0;
    card.power = parseInt($(element).find(".power").text().replace("Power", "").trim()) || 0;
    card.counter = parseInt($(element).find(".counter").text().replace("Counter", "").trim()) || 0;

    // Atributo
    card.attribute_name = $(element).find(".attribute i").text().trim();
    const attributeImg = $(element).find(".attribute img").attr("src") || "";
    card.attribute_image = attributeImg ? `https://en.onepiece-cardgame.com${attributeImg}` : "";

    // Color, familia, habilidad y set
    const colorText = $(element).find(".color").text().replace("Color", "").trim();
    card.color = colorText ? colorText.split("/").map(c => c.trim()) : [];
    card.family = $(element).find(".feature").text().replace("Type", "").trim();
    card.ability = $(element).find(".text").text().replace("Effect", "").trim();
    card.set_name = $(element).find(".getInfo").text().replace("Card Set(s)", "").trim();

    // Trigger (si lo hay)
    card.trigger = "";

    // Notas vacías por ahora
    card.notes = [];

    cards.push(card);
});

// Guardar en un archivo JSON
fs.writeFileSync("cards.json", JSON.stringify(cards, null, 2), "utf8");
console.log(`✅ Se han extraído ${cards.length} cartas y guardado en cards.json.`);

// Subir las cartas a Supabase
async function uploadCardsToSupabase(cards) {
    try {
        for (const card of cards) {
            const { data, error } = await supabase.from("cards").insert([card]);

            if (error) {
                console.error(`Error al insertar la carta con ID ${card.id}:`, error.message);
            } else {
                console.log(`Carta con ID ${card.id} insertada con éxito.`);
            }
        }

        console.log("✅ Todas las cartas han sido subidas a la base de datos.");
    } catch (error) {
        console.error("Error al subir las cartas a la base de datos:", error.message);
    }
}

// Ejecutar la subida
uploadCardsToSupabase(cards);
