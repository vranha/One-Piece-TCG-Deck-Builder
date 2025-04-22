const { supabase } = require("../services/supabaseClient");

const hasPendingNotifications = async (userId) => {
    try {
        console.log("Checking pending notifications for userId:", userId); // Log userId
        const { data, error } = await supabase
            .from("friends")
            .select("id")
            .eq("friend_id", userId)
            .eq("status", "pending");

        if (error) {
            console.error("Error fetching pending notifications:", error.message);
            throw error;
        }

        console.log("Pending notifications data:", data); // Log fetched data
        return data.length > 0; // Return true if there are pending requests
    } catch (error) {
        console.error("Unexpected error in hasPendingNotifications:", error.message);
        throw error;
    }
};

module.exports = {
    hasPendingNotifications,
};
