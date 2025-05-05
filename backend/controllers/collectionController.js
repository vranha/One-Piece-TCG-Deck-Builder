const collectionService = require("../services/collectionService");

const getUserCollections = async (req, res) => {
    try {
        const { userId } = req.params; // Extract userId from request parameters
        const collections = await collectionService.getCollectionsByUser(userId);
        res.status(200).json({ data: collections }); // Wrap response in a "data" object
    } catch (error) {
        console.error("Error fetching collections:", error);
        res.status(500).json({ error: "Failed to fetch collections" });
    }
};

const createCollection = async (req, res) => {
    try {
        const { userId } = req.params; // Extract userId from route parameters
        const collectionData = {
            ...req.body,
            user_id: userId, // Set user_id from the route
            is_public: true, // Set is_public to TRUE
        };

        console.log("Creating collection with data:", collectionData); // Log the data being sent to the service

        await collectionService.createCollection(collectionData); // No need to handle returned data

        res.status(201).json({ message: "Collection created successfully" }); // Return success message
    } catch (error) {
        console.error("Error creating collection:", error);
        res.status(500).json({ error: "Failed to create collection" });
    }
};

const updateCollection = async (req, res) => {
    try {
        const { collectionId } = req.params;
        const updates = req.body;
        const updatedCollection = await collectionService.updateCollection(collectionId, updates);
        res.status(200).json(updatedCollection);
    } catch (error) {
        console.error("Error updating collection:", error);
        res.status(500).json({ error: "Failed to update collection" });
    }
};

const deleteCollection = async (req, res) => {
    try {
        const { collectionId } = req.params;
        await collectionService.deleteCollection(collectionId);
        res.status(200).json({ message: "Collection deleted successfully" });
    } catch (error) {
        console.error("Error deleting collection:", error);
        res.status(500).json({ error: "Failed to delete collection" });
    }
};

const getCollectionById = async (req, res) => {
    try {
        const { collectionId } = req.params;
        const collection = await collectionService.getCollectionById(collectionId);
        res.status(200).json({ data: collection }); // Wrap the response in a "data" object
    } catch (error) {
        console.error("Error fetching collection by ID:", error);
        res.status(500).json({ error: "Failed to fetch collection" });
    }
};

const addCardsToCollection = async (req, res) => {
    try {
        const { collectionId } = req.params;
        const { cardIds } = req.body;

        if (!Array.isArray(cardIds) || cardIds.length === 0) {
            return res.status(400).json({ error: "Invalid card IDs array" });
        }

        await collectionService.addCardsToCollection(collectionId, cardIds);
        res.status(200).json({ message: "Cards added to collection successfully" });
    } catch (error) {
        console.error("Error adding cards to collection:", error);
        res.status(500).json({ error: "Failed to add cards to collection" });
    }
};

const updateCardsInCollection = async (req, res) => {
    try {
        const { collectionId } = req.params;
        const { cardsToAdd, cardsToRemove } = req.body;

        if (!Array.isArray(cardsToAdd) || !Array.isArray(cardsToRemove)) {
            return res.status(400).json({ error: "Invalid card IDs array" });
        }

        await collectionService.updateCardsInCollection(collectionId, cardsToAdd, cardsToRemove);
        res.status(200).json({ message: "Collection updated successfully" });
    } catch (error) {
        console.error("Error updating cards in collection:", error);
        res.status(500).json({ error: "Failed to update collection" });
    }
};

module.exports = {
    getUserCollections,
    createCollection,
    updateCollection,
    deleteCollection,
    getCollectionById,
    addCardsToCollection,
    updateCardsInCollection,
};
