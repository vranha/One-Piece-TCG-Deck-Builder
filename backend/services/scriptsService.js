const cheerio = require("cheerio");
const { supabase } = require("../services/supabaseClient");
const { sendPushNotificationsToAll } = require("./notificationService"); // Import the notification service and the new function

const processHtmlAndInsertCards = async (html, expansion) => {
    const $ = cheerio.load(html);
    const cards = [];

    $("dl.modalCol").each((_, element) => {
        const card = {};

        card.id = $(element).attr("id");
        const infoText = $(element).find(".infoCol").text().trim().split(" | ");
        card.code = infoText[0] || "";
        card.rarity = infoText[1] || "";
        card.type = infoText[2] || "";
        card.name = $(element).find(".cardName").text().trim();
        const imgSrc = $(element).find(".frontCol img").attr("data-src") || "";
        const cleanImgSrc = imgSrc.replace(/^(\.\.\/)+/, "/"); // quita ../ al inicio
        card.images_small = cleanImgSrc ? `https://en.onepiece-cardgame.com${cleanImgSrc}` : "";
        card.images_large = card.images_small;
        card.cost = parseInt($(element).find(".cost").text().replace("Cost", "").trim()) || 0;
        card.power = parseInt($(element).find(".power").text().replace("Power", "").trim()) || 0;
        card.counter = parseInt($(element).find(".counter").text().replace("Counter", "").trim()) || 0;
        card.attribute_name = $(element).find(".attribute i").text().trim();
        const attributeImg = $(element).find(".attribute img").attr("src") || "";
        card.attribute_image = attributeImg ? `https://en.onepiece-cardgame.com${attributeImg}` : "";
        const colorText = $(element).find(".color").text().replace("Color", "").trim();
        card.color = colorText ? colorText.split("/").map((c) => c.trim()) : [];
        card.family = $(element).find(".feature").text().replace("Type", "").trim();
        card.ability = $(element).find(".text").text().replace("Effect", "").trim();
        card.set_name = $(element).find(".getInfo").text().replace("Card Set(s)", "").trim();
        card.trigger = "";
        card.notes = [];

        cards.push(card);
    });

    for (let i = 0; i < cards.length; i++) {
        const card = cards[i];
        const { error } = await supabase.from("cards").insert([card]);

        if (error) {
            console.error(`Error inserting card with ID ${card.id}:`, error.message);
        } else {
            console.log(`Card with ID ${card.id} inserted successfully.`);
            // Insert progress into the `import_progress` table
            await supabase.from("import_progress").insert([{ current: i + 1, total: cards.length, card_id: card.id }]);
        }
    }

    // Fetch all push tokens and their associated user IDs
    const { data: tokensData, error: tokensError } = await supabase.from("push_tokens").select("token, user_id");
    if (tokensError) {
        console.error("Error fetching push tokens:", tokensError.message);
        return cards.length;
    }

    // Extract unique user IDs from the tokens data
    const userIds = [...new Set(tokensData.map((tokenData) => tokenData.user_id))];

    // Fetch languages for all user IDs
    const { data: usersData, error: usersError } = await supabase.from("users").select("id, lang").in("id", userIds);

    if (usersError) {
        console.error("Error fetching user languages:", usersError.message);
        return cards.length;
    }

    // Localized messages
    const titles = {
        en: "DATABASE UPDATED, NAKAMA",
        es: "BASE DE DATOS ACTUALIZADA, NAKAMA",
        fr: "BASE DE DONNÉES MISE À JOUR, NAKAMA",
    };

    const bodies = {
        en: `${expansion} arrived, hurry up!`,
        es: `¡${expansion} ha llegado, date prisa!`,
        fr: `${expansion} est arrivé, dépêche-toi !`,
    };

    // Map user languages and prepare messages
    const messages = tokensData.map(({ token, user_id }) => {
        const userLang = usersData.find((user) => user.id === user_id)?.lang || "en"; // Default to English
        return {
            to: token,
            title: titles[userLang] || titles.en,
            body: bodies[userLang] || bodies.en,
        };
    });

    try {
        // Send localized push notifications
        await sendPushNotificationsToAll(messages); // Pass the array of messages
    } catch (error) {
        console.error("Error sending localized push notifications:", error.message);
    }

    // Notificación global para todos los usuarios (localizada)
    try {
        // Usamos el idioma más común (por ejemplo, inglés) para el título y body global,
        // pero podrías insertar una notificación por cada idioma si lo prefieres.
        await supabase.from("notifications").insert([
            {
                user_id: null,
                type: "new_set",
                title: expansion, // Puedes cambiar a "es" o "fr" si prefieres otro idioma por defecto
                body: expansion,
                is_read: false,
                created_at: new Date().toISOString(),
            },
        ]);
    } catch (error) {
        console.error("Error insertando notificación global:", error.message);
    }

    return cards.length;
};

module.exports = {
    processHtmlAndInsertCards,
};
