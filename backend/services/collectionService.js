const { supabase } = require("../services/supabaseClient");

const getCollectionsByUser = async (userId) => {
    const { data, error } = await supabase.from("collections").select("*").eq("user_id", userId);

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

module.exports = {
    getCollectionsByUser,
    createCollection,
    updateCollection,
    deleteCollection,
};
