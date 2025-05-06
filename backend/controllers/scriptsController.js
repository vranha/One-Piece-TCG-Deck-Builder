const scriptsService = require("../services/scriptsService");

const importCardsFromHtml = async (req, res) => {
    const { html } = req.body;

    if (!html) {
        return res.status(400).json({ error: "HTML content is required" });
    }

    try {
        const result = await scriptsService.processHtmlAndInsertCards(html);
        res.status(200).json({ message: `${result} cards imported successfully.` });
    } catch (error) {
        console.error("Error processing HTML:", error.message);
        res.status(500).json({ error: "Failed to process HTML and import cards." });
    }
};

module.exports = {
    importCardsFromHtml,
};