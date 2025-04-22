const notificationService = require("../services/notificationService");
const { supabase } = require("../services/supabaseClient");

const checkNotifications = async (req, res) => {
    let userId = req.query.userId; // Extract userId from query parameters
    console.log("Received request to check notifications for userId:", userId); // Log userId

    if (!userId) {
        // Extract userId from the Authorization header
        const authHeader = req.headers.authorization;
        console.log("Authorization header:", authHeader); // Log the Authorization header

        if (authHeader && authHeader.startsWith("Bearer ")) {
            const token = authHeader.split(" ")[1];
            console.log("Extracted token:", token); // Log the extracted token

            const { data: session, error } = await supabase.auth.getUser(token);

            if (error || !session?.user?.id) {
                console.error("Failed to extract user ID from token:", error?.message || "No user found");
                return res.status(401).json({ error: "Unauthorized" });
            }

            userId = session.user.id;
        }
    }

    if (!userId) {
        console.error("User ID is missing in the request.");
        return res.status(400).json({ error: "User ID is required" });
    }

    try {
        const hasNotifications = await notificationService.hasPendingNotifications(userId);
        res.status(200).json({ hasNotifications });
    } catch (error) {
        console.error("Error checking notifications:", error.message);
        res.status(500).json({ error: "Failed to check notifications" });
    }
};

module.exports = {
    checkNotifications,
};
