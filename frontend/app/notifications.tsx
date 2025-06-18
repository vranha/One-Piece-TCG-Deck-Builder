import React, { useState, useEffect } from "react";
import { View, StyleSheet, Text, FlatList, TouchableOpacity, Image } from "react-native";
import NotificationsHeader from "@/components/NotificationsHeader";
import { useTheme } from "@/hooks/ThemeContext";
import { Colors } from "@/constants/Colors";
import useApi from "@/hooks/useApi";
import { supabase } from "@/supabaseClient";
import Toast from "react-native-toast-message";
import { useTranslation } from "react-i18next"; // Import translation hook
import { useRouter } from "expo-router"; // Import useRouter
import useStore from "@/store/useStore"; // Import useStore
import * as ExpoNotifications from "expo-notifications"; // Renombrar el import para evitar conflictos
import * as Device from "expo-device";

export default function NotificationsScreen() {
    // Renombrar el componente
    const [activeTab, setActiveTab] = useState<"notifications" | "friendRequests">("notifications");
    interface FriendRequest {
        id: string;
        avatar_url: string;
        username: string;
    }

    const [pendingFriends, setPendingFriends] = useState<FriendRequest[]>([]);
    const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
    const [userId, setUserId] = useState<string | null>(null);
    const { theme } = useTheme();
    const api = useApi();
    const { t } = useTranslation(); // Initialize translation hook
    const router = useRouter(); // Initialize router
    const setRefreshFriends = useStore((state) => state.setRefreshFriends); // Access setRefreshFriends
    const [notifications, setNotifications] = useState([]);

    useEffect(() => {
        const fetchUserId = async () => {
            try {
                const session = await supabase.auth.getSession();
                const userId = session?.data?.session?.user?.id;

                if (!userId) {
                    console.error("User ID is undefined in the session.");
                    return;
                }

                setUserId(userId);
            } catch (error) {
                console.error("Error fetching user ID from session:", error);
            }
        };

        fetchUserId();
    }, []);

    useEffect(() => {
        const fetchFriends = async () => {
            if (!userId) {
                console.log("Cannot fetch friends: userId is undefined.");
                return;
            }

            try {
                const { data } = await api.get(`/friends`, { params: { userId } });
                const pending = data
                    .filter((item: any) => item.status === "pending" && !item.isSender) // Pending requests where the user is the recipient
                    .map((item: any) => ({
                        id: item.id,
                        username: item.username,
                        avatar_url: item.avatar_url,
                    }));
                const sent = data
                    .filter((item: any) => item.status === "pending" && item.isSender) // Pending requests sent by the user
                    .map((item: any) => ({
                        id: item.id,
                        username: item.username,
                        avatar_url: item.avatar_url,
                    }));
                setPendingFriends(pending);
                setSentRequests(sent);
                console.log(pending, sent); // Debug log to verify data structure
            } catch (error) {
                console.error(t("error_fetching_friends"), error);
            }
        };

        if (activeTab === "friendRequests") {
            fetchFriends();
        }
    }, [activeTab, userId]);

    useEffect(() => {
        const fetchNotifications = async () => {
            if (!userId) {
                console.log("Cannot fetch notifications: userId is undefined.");
                return;
            }

            try {
                const { data } = await api.get(`/userNotifications/${userId}`);
                setNotifications(data);
            } catch (error) {
                console.error("Error fetching notifications:", error);
            }
        };

        if (activeTab === "notifications") {
            fetchNotifications();
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
            setRefreshFriends(true); // Notify FriendCarousel to refresh
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
            <NotificationsHeader activeTab={activeTab} setActiveTab={setActiveTab} />
            <View style={{ flex: 1, marginTop: 20, paddingHorizontal: 10 }}>
                {activeTab === "notifications" ? (
                    <FlatList
                        data={
                            notifications as {
                                id: string;
                                title: string;
                                body: string;
                                created_at: string;
                                type: string;
                            }[]
                        }
                        keyExtractor={(item) => item.id}
                        ListEmptyComponent={
                            <View style={{ alignItems: "center", marginTop: 50, gap: 5 }}>
                                <Text style={{ fontSize: 18, fontWeight: "bold", color: Colors[theme].text }}>
                                    {t("all_notifications")}
                                </Text>
                            </View>
                        }
                        contentContainerStyle={{ paddingHorizontal: 10, paddingBottom: 20 }} // Add padding to the bottom of the list
                        renderItem={({
                            item,
                        }: {
                            item: { id: string; title: string; body: string; created_at: string; type: string };
                        }) => {
                            let backgroundColor;
                            switch (item.type) {
                                case "friend_request":
                                    backgroundColor = Colors[theme].success;
                                    break;
                                case "updated_database":
                                    backgroundColor = Colors[theme].info;
                                    break;
                                case "message":
                                    backgroundColor = Colors[theme].tint;
                                    break;
                                case "new_set":
                                    backgroundColor = Colors[theme].info;
                                    break;
                                default:
                                    backgroundColor = Colors[theme].TabBarBackground;
                            }
                            let titleColor;
                            switch (item.type) {
                                case "friend_request":
                                    titleColor = Colors[theme].success;
                                    break;
                                case "updated_database":
                                    titleColor = Colors[theme].info;
                                    break;
                                case "message":
                                    titleColor = Colors[theme].tint;
                                    break;
                                case "new_set":
                                    titleColor = Colors[theme].info;
                                    break;
                                default:
                                    titleColor = Colors[theme].text;
                            }
                            // Cambios aquí para el type "new_set"
                            const notificationTitle =
                                item.type === "new_set"
                                    ? t("title_notification_set", { title: item.title })
                                    : item.title;
                            const notificationBody =
                                item.type === "new_set" ? t("body_notification_set", { body: item.body }) : item.body;

                            return (
                                <View
                                    style={[
                                        styles.notificationCard,
                                        { backgroundColor: Colors[theme].TabBarBackground },
                                    ]}
                                >
                                    <Text style={[styles.username, { color: titleColor }]}>{notificationTitle}</Text>
                                    <Text style={{ color: Colors[theme].text }}>{notificationBody}</Text>
                                    <Text
                                        style={{
                                            color: Colors[theme].disabled,
                                            fontSize: 12,
                                            alignSelf: "flex-end",
                                            marginTop: 8,
                                        }}
                                    >
                                        {new Date(item.created_at).toLocaleDateString(undefined, {
                                            year: "numeric",
                                            month: "2-digit",
                                            day: "2-digit",
                                        })}
                                    </Text>
                                </View>
                            );
                        }}
                    />
                ) : (
                    <FlatList
                        data={[
                            { type: "header", title: t("received_friend_requests"), count: pendingFriends.length },
                            ...pendingFriends.map((item) => ({ ...item, type: "received" })),
                            { type: "header", title: t("sent_friend_requests"), count: sentRequests.length },
                            ...sentRequests.map((item) => ({ ...item, type: "sent" })),
                        ]}
                        keyExtractor={(item, index) => ("id" in item && item.id ? item.id : `header-${index}`)}
                        ListEmptyComponent={
                            <View style={{ alignItems: "center", marginTop: 50, gap: 5 }}>
                                <Text style={{ fontSize: 18, fontWeight: "bold", color: Colors[theme].text }}>
                                    {t("no_friend_requests")}
                                </Text>
                                <Text style={{ color: Colors[theme].text }}>{t("crew_complete")}</Text>
                            </View>
                        }
                        renderItem={({ item }) => {
                            if (item.type === "header") {
                                return (
                                    <>
                                        <Text
                                            style={[
                                                styles.sectionTitle,
                                                { color: Colors[theme].text, textAlign: "center" },
                                            ]}
                                        >
                                            {"title" in item ? item.title : ""}{" "}
                                            {"count" in item && (
                                                <Text style={{ color: Colors[theme].tint }}>({item.count})</Text>
                                            )}
                                        </Text>
                                        {"count" in item && item.count === 0 && (
                                            <Text
                                                style={{
                                                    color: Colors[theme].disabled,
                                                    textAlign: "center",
                                                    marginBottom: 10,
                                                }}
                                            >
                                                {item.title === t("received_friend_requests")
                                                    ? t("no_received_requests")
                                                    : t("no_sent_requests")}
                                            </Text>
                                        )}
                                    </>
                                );
                            }
                            return (
                                <TouchableOpacity
                                    onPress={() => {
                                        if ("id" in item) {
                                            router.push({
                                                pathname: `/(tabs)/user/[userId]`,
                                                params: { userId: item.id },
                                            });
                                        }
                                    }}
                                >
                                    <View style={[styles.card, { backgroundColor: Colors[theme].TabBarBackground }]}>
                                        {"avatar_url" in item && (
                                            <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
                                        )}
                                        {"username" in item && (
                                            <Text style={[styles.username, { color: Colors[theme].text }]}>
                                                {item.username}
                                            </Text>
                                        )}
                                        {item.type === "received" ? (
                                            <TouchableOpacity
                                                style={styles.acceptButton}
                                                onPress={() => {
                                                    if ("id" in item) {
                                                        acceptFriendRequest(item.id);
                                                    }
                                                }}
                                            >
                                                <Text style={styles.acceptButtonText}>{t("accept")}</Text>
                                            </TouchableOpacity>
                                        ) : (
                                            <Text style={[styles.pendingText, { color: Colors[theme].disabled }]}>
                                                {t("pending")}
                                            </Text>
                                        )}
                                    </View>
                                </TouchableOpacity>
                            );
                        }}
                    />
                )}
            </View>
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
    notificationCard: {
        flexDirection: "column",
        justifyContent: "space-between",
        alignSelf: "flex-start", // Ensure the card only takes the space it needs
        paddingVertical: 10,
        paddingHorizontal: 25,
        marginVertical: 5,
        borderRadius: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
        gap: 5,
        width: "100%", // ✅ O también puedes usar alignSelf: "stretch"
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
    sectionTitle: {
        fontSize: 18,
        fontWeight: "bold",
        marginTop: 30,
        marginBottom: 10,
    },
    pendingText: {
        fontSize: 14,
        fontWeight: "bold",
    },
});
