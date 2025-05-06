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

const registerPushToken = async (req, res) => {
    const { userId, token } = req.body;

    if (!userId || !token) {
        console.error("User ID or token is missing.");
        return res.status(400).json({ error: "User ID and token are required" });
    }

    try {
        const { error } = await supabase
            .from("push_tokens")
            .upsert({ user_id: userId, token }, { onConflict: "user_id" });

        if (error) {
            console.error("Error saving push token:", error.message);
            return res.status(500).json({ error: "Failed to save push token" });
        }

        res.status(200).json({ message: "Push token registered successfully" });
    } catch (error) {
        console.error("Unexpected error registering push token:", error.message);
        res.status(500).json({ error: "Unexpected error" });
    }
};

const getUserNotifications = async (req, res) => {
    const { userId } = req.params;

    if (!userId) {
        console.error("User ID is missing in the request.");
        return res.status(400).json({ error: "User ID is required" });
    }

    try {
        const notifications = await notificationService.getUserNotifications(userId);
        res.status(200).json(notifications);
    } catch (error) {
        console.error("Error fetching user notifications:", error.message);
        res.status(500).json({ error: "Failed to fetch notifications" });
    }
};

module.exports = {
    checkNotifications,
    registerPushToken,
    getUserNotifications,
};
