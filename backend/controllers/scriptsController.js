const scriptsService = require("../services/scriptsService");
const runGenerateThumbnails = require("../scripts/generateThumbnails");

const importCardsFromHtml = async (req, res) => {
    const { html, expansion } = req.body; // Extract expansion

    if (!html || !expansion) {
        return res.status(400).json({ error: "HTML content and expansion are required" });
    }

    try {
        const result = await scriptsService.processHtmlAndInsertCards(html, expansion); // Pass expansion
        res.status(200).json({ message: `${result} cards imported successfully.` });
    } catch (error) {
        console.error("Error processing HTML:", error.message);
        res.status(500).json({ error: "Failed to process HTML and import cards." });
    }
};

const generateThumbnails = async (req, res) => {
    try {
        const result = await runGenerateThumbnails.generateThumbnails();
        res.status(200).json({ message: result });
    } catch (error) {
        console.error("Error generating thumbnails:", error.message);
        res.status(500).json({ error: "Failed to generate thumbnails." });
    }
};

module.exports = {
    importCardsFromHtml,
    generateThumbnails,
};
