import React, { useState, useEffect } from "react";
import { View, StyleSheet, Text, FlatList, TouchableOpacity, Image } from "react-native";
import NotificationsHeader from "@/components/NotificationsHeader";
import { useTheme } from "@/hooks/ThemeContext";
import { Colors } from "@/constants/Colors";
import useApi from "@/hooks/useApi";
import { supabase } from "@/supabaseClient";
import Toast from "react-native-toast-message";
import { useTranslation } from "react-i18next"; // Import translation hook

export default function Notifications() {
    const [activeTab, setActiveTab] = useState<"notifications" | "friendRequests">("notifications");
    interface FriendRequest {
        id: string;
        avatar_url: string;
        username: string;
    }

    const [pendingFriends, setPendingFriends] = useState<FriendRequest[]>([]);
    const [userId, setUserId] = useState<string | null>(null);
    const { theme } = useTheme();
    const api = useApi();
    const { t } = useTranslation(); // Initialize translation hook

    useEffect(() => {
        const fetchUserId = async () => {
            const session = await supabase.auth.getSession();
            setUserId(session?.data?.session?.user?.id || null);
        };

        fetchUserId();
    }, []);

    useEffect(() => {
        const fetchPendingFriends = async () => {
            if (userId) {
                try {
                    const { data } = await api.get(`/friends?status=pending&userId=${userId}&isRecipient=true`);
                    const transformedData = data.map((item: any) => ({
                        id: item.user_id, // Cambia a user_id porque ahora el usuario autenticado es el destinatario
                        username: item.users.username,
                        avatar_url: item.users.avatar_url,
                    }));
                    setPendingFriends(transformedData);
                } catch (error) {
                    console.error(t("error_fetching_friends"), error);
                }
            }
        };

        if (activeTab === "friendRequests") {
            fetchPendingFriends();
        }
    }, [activeTab, userId]);

    const acceptFriendRequest = async (friendId: string) => {
        if (!friendId || !userId) {
            // Verificar que userId también esté definido
            console.error(t("friend_id_or_user_id_undefined")); // Log error para friendId o userId indefinido
            Toast.show({
                type: "error",
                text1: t("error"),
                text2: t("friend_id_or_user_id_undefined"),
            });
            return;
        }
        try {
            await api.put(`/friends/${friendId}/accept`, { userId }); // Enviar userId en el cuerpo de la solicitud
            setPendingFriends((prev) => prev.filter((friend) => friend.id !== friendId));
            Toast.show({
                type: "success",
                text1: t("success"),
                text2: t("friend_request_accepted"),
            });
        } catch (error) {
            console.error(t("error_accepting_friend_request"), error);
            Toast.show({
                type: "error",
                text1: t("error"),
                text2: t("error_accepting_friend_request"),
            });
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: Colors[theme].background }]}>
            {/* Header */}
            <NotificationsHeader activeTab={activeTab} setActiveTab={setActiveTab} />
            {/* Content */}
            <View style={{ flex: 1 }}>
                {activeTab === "notifications" ? (
                    <Text style={{ color: Colors[theme].text }}>{t("all_notifications")}</Text>
                ) : (
                    <FlatList
                        data={pendingFriends}
                        keyExtractor={(item) => item.id}
                        ListEmptyComponent={
                            <View style={{ alignItems: "center", marginTop: 50, gap: 5 }}>
                                <Text style={{ fontSize: 18, fontWeight: "bold", color: Colors[theme].text }}>
                                    {t("no_friend_requests")}
                                </Text>
                                <Text style={{ color: Colors[theme].text }}>{t("crew_complete")}</Text>
                            </View>
                        }
                        renderItem={({ item }) => {
                            console.log("Rendering item:", item); // Debug log to verify item structure
                            return (
                                <View style={[styles.card, { backgroundColor: Colors[theme].TabBarBackground }]}>
                                    <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
                                    <Text style={[styles.username, { color: Colors[theme].text }]}>
                                        {item.username}
                                    </Text>
                                    <TouchableOpacity
                                        style={styles.acceptButton}
                                        onPress={() => acceptFriendRequest(item.id)} // Ensure item.id is passed
                                    >
                                        <Text style={styles.acceptButtonText}>{t("accept")}</Text>
                                    </TouchableOpacity>
                                </View>
                            );
                        }}
                    />
                )}
            </View>
            <Toast />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
    },
    content: {
        flex: 1,
    }, // Removed alignment styles
    card: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 10,
        paddingHorizontal: 15,
        marginVertical: 5,
        borderRadius: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
        width: "100%", // Ensure the card spans the full width
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: 15,
    },
    username: {
        flex: 1,
        fontSize: 16,
        fontWeight: "bold",
    },
    acceptButton: {
        backgroundColor: "#4CAF50",
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 4,
    },
    acceptButtonText: {
        color: "#fff",
        fontWeight: "bold",
    },
});
