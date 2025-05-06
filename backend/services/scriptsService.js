const cheerio = require("cheerio");
const { supabase } = require("../services/supabaseClient");
const { sendPushNotification, sendPushNotificationsToAll } = require("./notificationService"); // Import the notification service and the new function

const processHtmlAndInsertCards = async (html) => {
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

    // Fetch all push tokens
    const { data: users, error: usersError } = await supabase.from("push_tokens").select("token");
    if (usersError) {
        console.error("Error fetching push tokens:", usersError.message);
    } else {
        const tokens = users.map((user) => user.token).filter(Boolean); // Extract valid tokens
        const title = "Database Updated";
        const body = "New cards have arrived .";
        await sendPushNotificationsToAll(tokens, title, body); // Use the new function
    }

    return cards.length;
};

module.exports = {
    processHtmlAndInsertCards,
};
