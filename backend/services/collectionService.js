const { supabase } = require("../services/supabaseClient");

const getCollectionsByUser = async (userId) => {
    const { data, error } = await supabase
        .from("collections")
        .select(
            `
            id,
            name,
            description,
            is_public,
            type,
            collection_cards (
                card_id
            )
        `
        )
        .eq("user_id", userId);

    if (error) throw error;
    return data;
};

const createCollection = async (collectionData) => {
    const { data, error } = await supabase.from("collections").insert([collectionData]);

    if (error) throw error;
    return data;
};

const updateCollection = async (collectionId, updates) => {
    const { data, error } = await supabase.from("collections").update(updates).eq("id", collectionId);

    if (error) throw error;
    return data;
};

const deleteCollection = async (collectionId) => {
    const { data, error } = await supabase.from("collections").delete().eq("id", collectionId);

    if (error) throw error;
    return data;
};

const getCollectionById = async (collectionId) => {
    const { data, error } = await supabase
        .from("collections")
        .select(
            `
            id,
            name,
            description,
            is_public,
            type,
            collection_cards (
                card_id
            )
        `
        )
        .eq("id", collectionId)
        .single(); // Ensure only one record is fetched

    if (error) {
        console.error("Error fetching collection by ID:", error);
        throw new Error("Failed to fetch collection");
    }

    // Fetch corresponding cards from the "cards" table
    const cardIds = data.collection_cards.map((card) => card.card_id);
    const { data: cards, error: cardsError } = await supabase.from("cards").select("*").in("id", cardIds);

    if (cardsError) {
        console.error("Error fetching cards:", cardsError);
        throw new Error("Failed to fetch cards");
    }

    // Attach the cards to the collection data
    return { ...data, cards };
};

const addCardsToCollection = async (collectionId, cardIds) => {
    const cardEntries = cardIds.map((cardId) => ({
        collection_id: collectionId,
        card_id: cardId,
    }));

    const { data, error } = await supabase.from("collection_cards").insert(cardEntries);

    if (error) {
        console.error("Error adding cards to collection:", error);
        throw new Error("Failed to add cards to collection");
    }

    return data;
};

const updateCardsInCollection = async (collectionId, cardsToAdd, cardsToRemove) => {
    const cardEntriesToAdd = cardsToAdd.map((cardId) => ({
        collection_id: collectionId,
        card_id: cardId,
    }));

    const { error: addError } = await supabase.from("collection_cards").insert(cardEntriesToAdd);
    if (addError) {
        console.error("Error adding cards to collection:", addError);
        throw new Error("Failed to add cards to collection");
    }

    const { error: removeError } = await supabase
        .from("collection_cards")
        .delete()
        .in("card_id", cardsToRemove)
        .eq("collection_id", collectionId);

    if (removeError) {
        console.error("Error removing cards from collection:", removeError);
        throw new Error("Failed to remove cards from collection");
    }
};

module.exports = {
    getCollectionsByUser,
    createCollection,
    updateCollection,
    deleteCollection,
    getCollectionById,
    addCardsToCollection,
    updateCardsInCollection,
};
