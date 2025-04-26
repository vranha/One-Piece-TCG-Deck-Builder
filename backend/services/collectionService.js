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

module.exports = {
    getCollectionsByUser,
    createCollection,
    updateCollection,
    deleteCollection,
    getCollectionById,
};
