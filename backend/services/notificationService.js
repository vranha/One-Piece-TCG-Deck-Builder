const { supabase } = require("../services/supabaseClient");
const axios = require("axios");

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

const sendPushNotification = async (token, title, body) => {
    if (!token) {
        console.error("Push token is missing.");
        return;
    }

    try {
        await axios.post("https://exp.host/--/api/v2/push/send", {
            to: token,
            title,
            body,
        });
    } catch (error) {
        console.error("Error sending push notification:", error.response?.data || error.message);
    }
};

const sendPushNotificationsToAll = async (messages) => {
    if (!messages || messages.length === 0) {
        console.error("No messages provided.");
        return;
    }

    try {
        await axios.post("https://exp.host/--/api/v2/push/send", messages);
    } catch (error) {
        console.error("Error sending push notifications:", error.response?.data || error.message);
    }
};

const notifyFriendRequest = async (receiverId, senderId) => {
    try {
        // Fetch the sender's username using senderId
        const { data: senderData, error: senderError } = await supabase
            .from("users")
            .select("username")
            .eq("id", senderId)
            .single();

        if (senderError || !senderData?.username) {
            console.error("Error fetching sender's username:", senderError?.message || "No username found");
            return;
        }

        // Fetch the receiver's lang using receiverId
        const { data: receiverData, error: receiverError } = await supabase
            .from("users")
            .select("lang")
            .eq("id", receiverId)
            .single();

        if (receiverError) {
            console.error("Error fetching receiver's lang:", receiverError?.message || "No lang found");
            return;
        }

        const lang = receiverData?.lang || "en"; // Default to English if lang is not set

        // Localized messages
        const titles = {
            en: "New Nakama Request",
            es: "Nueva Solicitud de Nakama",
            fr: "Nouvelle Demande de Nakama",
        };

        const bodies = {
            en: `${senderData.username} wants to join your crew!`,
            es: `¡${senderData.username} quiere unirse a tu tripulación!`,
            fr: `${senderData.username} veut rejoindre ton équipage !`,
        };

        const title = titles[lang] || titles.en;
        const body = bodies[lang] || bodies.en;

        // Fetch the receiver's push token
        const { data: tokenData, error: tokenError } = await supabase
            .from("push_tokens")
            .select("token")
            .eq("user_id", receiverId)
            .single();

        if (tokenError || !tokenData?.token) {
            console.error("Error fetching push token:", tokenError?.message || "No token found");
            return;
        }

        // Send the push notification with the localized message
        // await sendPushNotification(tokenData.token, title, body);

        // Insert a record into the notifications table
        const { error: insertError } = await supabase.from("notifications").insert([
            {
                user_id: receiverId,
                type: "friend_request",
                is_read: false,
                created_at: new Date().toISOString(),
                title,
                body,
            },
        ]);

        if (insertError) {
            console.error("Error inserting notification record:", insertError.message);
        }
    } catch (error) {
        console.error("Error notifying friend request:", error.message);
    }
};
const getUserNotifications = async (userId) => {
    try {
        // 1. Notificaciones específicas del usuario
        const { data: userData, error: userError } = await supabase
            .from("notifications")
            .select("*")
            .eq("user_id", userId);

        if (userError) throw new Error(`Error fetching user notifications: ${userError.message}`);

        // 2. Notificaciones globales (user_id = null)
        const { data: globalData, error: globalError } = await supabase
            .from("notifications")
            .select("*")
            .is("user_id", null);

        if (globalError) throw new Error(`Error fetching global notifications: ${globalError.message}`);

        // 3. Fusionar y ordenar por fecha
        console.log("User notifications:", userData);
        console.log("Global notifications:", globalData);
        const allNotifications = [...userData, ...globalData].sort(
            (a, b) => new Date(b.created_at) - new Date(a.created_at)
        );

        return allNotifications;
    } catch (error) {
        console.error("Error fetching notifications:", error.message);
        throw error;
    }
};

module.exports = {
    hasPendingNotifications,
    notifyFriendRequest,
    getUserNotifications,
    sendPushNotificationsToAll, // Export the new function
};
