import React, { useEffect, useState } from "react";
import { StyleSheet, View, Image, ActivityIndicator, TouchableOpacity, ScrollView, RefreshControl } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/ThemeContext";
import { Colors } from "@/constants/Colors";
import { supabase } from "@/supabaseClient";
import useApi from "@/hooks/useApi";
import NewDeckModal from "@/components/NewDeckModal";
import { Portal } from "react-native-paper";
import DeckCarousel from "@/components/DeckCarousel";
import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";
import useStore from "@/store/useStore";
import FriendCarousel from "@/components/FriendCarousel";
import CollectionCarousel from "@/components/CollectionCarousel";
import { Ionicons } from "@expo/vector-icons"; // Importar iconos
import { useFocusEffect } from "@react-navigation/native"; // Import useFocusEffect
import * as ExpoNotifications from "expo-notifications";
import * as Device from "expo-device";
import IconCards from "@/assets/icons/IconCards.svg";
import IconPeople from "@/assets/icons/IconPeople.svg";

interface Deck {
    id: string;
    name: string;
    deck_colors: { color_id: number }[];
    leaderCardImage: string | null;
}

export default function HomeScreen() {
    const { theme } = useTheme();
    const api = useApi();
    const { t } = useTranslation();
    const [userName, setUserName] = useState("");
    const [avatarUrl, setAvatarUrl] = useState("");
    const [loading, setLoading] = useState(true);
    // Añadir estados de loading individuales
    const [decksLoading, setDecksLoading] = useState(true);
    const [friendsLoading, setFriendsLoading] = useState(true);
    const [collectionsLoading, setCollectionsLoading] = useState(true);
    const [decks, setDecks] = useState<Deck[]>([]);
    const [newDeckModalVisible, setNewDeckModalVisible] = useState(false);
    const [friends, setFriends] = useState([]);
    const [collections, setCollections] = useState([]);
    const [userId, setUserId] = useState<string | null>(null); // Store userId
    const [token, setToken] = useState<string | null>(null); // Store token
    const [refreshing, setRefreshing] = useState(false);
    const router = useRouter();

    const refreshDecks = useStore((state) => state.refreshDecks);
    const setRefreshDecks = useStore((state) => state.setRefreshDecks);
    const refreshFriends = useStore((state) => state.refreshFriends);
    const setRefreshFriends = useStore((state) => state.setRefreshFriends);
    const refreshCollectionsFlag = useStore((state) => state.refreshCollections);
    const setRefreshCollections = useStore((state) => state.setRefreshCollections);

    const handleCreateDeck = (leader: string, name: string, description: string) => {
        // Logic to create a new deck
        useStore.getState().setRefreshDecks(true); // Notificar al DeckCarousel
        console.log("Creating deck:", leader, name, description);
    };

    const fetchDecks = async (userId: string | null, token: string | null) => {
        setDecksLoading(true);
        try {
            const { data } = await api.get(`/decks/${userId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            setDecks([{ id: "new", name: t("create_new_deck"), deck_colors: [], leaderCardImage: null }, ...data.data]);
        } catch (error) {
            console.error("Error fetching decks:", error);
        } finally {
            setDecksLoading(false);
        }
    };

    const fetchFriends = async (userId: string | null, token: string | null) => {
        setFriendsLoading(true);
        try {
            const { data } = await api.get(`/friends/${userId}/accepted`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            setFriends(data);
        } catch (error) {
            console.error("Error fetching friends:", error);
        } finally {
            setFriendsLoading(false);
        }
    };

    const fetchCollections = async (userId: string | null, token: string | null) => {
        setCollectionsLoading(true);
        try {
            const { data } = await api.get(`/collections/${userId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            setCollections(data.data);
        } catch (error) {
            console.error("Error fetching collections:", error);
        } finally {
            setCollectionsLoading(false);
        }
    };

    useEffect(() => {
        // El loading global solo se desactiva cuando todos los datos han sido cargados
        if (!decksLoading && !friendsLoading && !collectionsLoading) {
            setLoading(false);
        } else {
            setLoading(true);
        }
    }, [decksLoading, friendsLoading, collectionsLoading]);

    useEffect(() => {
        async function fetchSession() {
            try {
                const {
                    data: { session },
                } = await supabase.auth.getSession();
                if (session && session.user) {
                    setUserId(session.user.id); // Store userId
                    setToken(session.access_token); // Store token
                } else {
                    console.warn("No active session found.");
                }
            } catch (error) {
                console.error("Error fetching session:", error);
            }
            // Quitar setLoading(false) de aquí
        }

        fetchSession();
    }, []);

    useEffect(() => {
        if (userId && token) {
            async function fetchUserData() {
                try {
                    const { data: user } = await api.get(`/me?id=${userId}`, {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    });
                    setUserName(user.username || user.email); // Use name from API
                    setAvatarUrl(user.avatar_url || "");
                    fetchDecks(userId, token);
                    fetchFriends(userId, token);
                    fetchCollections(userId, token);
                } catch (error) {
                    console.error("Error fetching user data:", error);
                }
            }

            fetchUserData();
        }
    }, [userId, token]);

    useEffect(() => {
        if (refreshDecks && userId && token) {
            async function refresh() {
                fetchDecks(userId, token);
            }

            refresh();
            setRefreshDecks(false);
        }
    }, [refreshDecks, userId, token]);

    useEffect(() => {
        if (refreshFriends && userId && token) {
            async function refresh() {
                fetchFriends(userId, token);
            }

            refresh();
            setRefreshFriends(false);
        }
    }, [refreshFriends, userId, token]);

    useEffect(() => {
        if (refreshCollectionsFlag && userId && token) {
            async function refresh() {
                fetchCollections(userId, token);
            }
            refresh();
            setRefreshCollections(false);
        }
    }, [refreshCollectionsFlag, userId, token]);

    useEffect(() => {
        if (userId && token) {
            fetchCollections(userId, token); // Refresh collections on userId or token change
        }
    }, [userId, token]);

    const refreshCollections = () => {
        if (userId && token) {
            fetchCollections(userId, token); // Refresh collections manually
        }
    };

    useFocusEffect(
        React.useCallback(() => {
            async function refreshData() {
                const {
                    data: { session },
                } = await supabase.auth.getSession();
                if (session && session.user) {
                    fetchDecks(session.user.id, session.access_token); // Refresh decks
                    fetchFriends(session.user.id, session.access_token); // Refresh friends
                    fetchCollections(session.user.id, session.access_token); // <-- Añade esto
                }
            }
            refreshData();
        }, [])
    );

    useEffect(() => {
        const registerForPushNotifications = async () => {
            console.log("Registering for push notifications...");
            try {
                if (!userId) {
                    console.log("Waiting for userId to be available before registering push notifications.");
                    return; // No intentamos registrar hasta que userId esté disponible
                }

                if (Device.isDevice) {
                    const { status: existingStatus } = await ExpoNotifications.getPermissionsAsync();
                    let finalStatus = existingStatus;
                    if (existingStatus !== "granted") {
                        const { status } = await ExpoNotifications.requestPermissionsAsync();
                        finalStatus = status;
                    }
                    if (finalStatus !== "granted") {
                        console.error("Failed to get push token for notifications!");
                        return;
                    }
                    const token = (await ExpoNotifications.getExpoPushTokenAsync()).data;
                    console.log("Push notification token:", token);

                    // Enviar el token al backend para asociarlo con el usuario
                    const response = await api.post("/notifications/register-token", { userId, token });
                    console.log("Push notification token registered successfully:", response.data);
                } else {
                    console.error("Must use physical device for Push Notifications");
                }
            } catch (error) {
                if (error instanceof Error && (error as any).response?.status === 404) {
                    console.error(
                        "Endpoint not found: Ensure the backend route '/notifications/register-token' exists."
                    );
                } else if (error instanceof Error) {
                    console.error("Error registering for push notifications:", error.message);
                } else {
                    console.error("Error registering for push notifications:", error);
                }
            }
        };

        registerForPushNotifications();
    }, [userId]); // Solo se ejecuta cuando userId está disponible

    const handleRefresh = async () => {
        setRefreshing(true);
        if (userId && token) {
            await Promise.all([
                fetchDecks(userId, token),
                fetchFriends(userId, token),
                fetchCollections(userId, token),
            ]);
        }
        setRefreshing(false);
    };

    return (
        <ThemedView style={[styles.container, { backgroundColor: Colors[theme].background }]}>
            {loading ? (
                <View style={styles.loadingWrapper}>
                    <ActivityIndicator size="large" color={Colors[theme].tint} />
                </View>
            ) : (
                <ScrollView
                    contentContainerStyle={styles.scrollContainer}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={handleRefresh}
                            colors={[Colors[theme].tint]}
                            progressBackgroundColor={Colors[theme].backgroundSoft}
                        />
                    }
                >
                    <View
                        style={{
                            width: "100%",
                            alignItems: "center",
                            justifyContent: "center",
                            marginBottom: 20,
                            gap: 20,
                        }}
                    >
                        <View style={{ alignItems: "center", justifyContent: "center" }}>
                            <ThemedText style={[styles.title, { color: Colors[theme].text }]}>
                                {t("welcome")}
                            </ThemedText>
                            <ThemedText
                                key="userName"
                                style={[styles.title, { color: Colors[theme].tint, fontWeight: "bold" }]}
                            >
                                {userName}
                            </ThemedText>
                        </View>
                        {userId && (
                            <TouchableOpacity
                                style={{
                                    flexDirection: "row",
                                    gap: 30,
                                    marginLeft: 15,
                                    alignItems: "center",
                                    backgroundColor: Colors[theme].TabBarBackground,
                                    paddingVertical: 10,
                                    paddingHorizontal: 20,
                                    borderRadius: 10,
                                }}
                                onPress={() => router.push({ pathname: "/(tabs)/user/[userId]", params: { userId } })}
                            >
                                <View style={{ alignItems: "center", justifyContent: "center" }}>
                                    {avatarUrl ? (
                                        <Image source={{ uri: avatarUrl }} style={styles.profileAvatar} />
                                    ) : (
                                        <Ionicons name="person-circle" size={54} color={Colors[theme].tabIconDefault} />
                                    )}
                                    <ThemedText style={[styles.profileLabel, { color: Colors[theme].tint }]}>
                                        {t("profile")}
                                    </ThemedText>
                                </View>
                                <View style={{ alignItems: "flex-start" }}>
                                    <View
                                        style={{ alignItems: "center", justifyContent: "center", flexDirection: "row" }}
                                    >
                                        <ThemedText
                                            style={{ color: Colors[theme].success, fontSize: 16, fontWeight: "bold" }}
                                        >
                                            {t("decks") + ": "}
                                        </ThemedText>
                                        <ThemedText
                                            style={{
                                                color: Colors[theme].tabIconDefault,
                                                fontSize: 16,
                                                fontWeight: "bold",
                                            }}
                                        >
                                            {decks.length - 1} {/* Exclude the "new deck" entry */}
                                        </ThemedText>
                                    </View>
                                    <View
                                        style={{ alignItems: "center", justifyContent: "center", flexDirection: "row" }}
                                    >
                                        <ThemedText
                                            style={{ color: Colors[theme].success, fontSize: 16, fontWeight: "bold" }}
                                        >
                                            {t("friends") + ": "}
                                        </ThemedText>
                                        <ThemedText
                                            style={{
                                                color: Colors[theme].tabIconDefault,
                                                fontSize: 16,
                                                fontWeight: "bold",
                                            }}
                                        >
                                            {friends.length}
                                        </ThemedText>
                                    </View>
                                    <View
                                        style={{ alignItems: "center", justifyContent: "center", flexDirection: "row" }}
                                    >
                                        <ThemedText
                                            style={{ color: Colors[theme].success, fontSize: 16, fontWeight: "bold" }}
                                        >
                                            {t("collections") + ": "}
                                        </ThemedText>
                                        <ThemedText
                                            style={{
                                                color: Colors[theme].tabIconDefault,
                                                fontSize: 16,
                                                fontWeight: "bold",
                                            }}
                                        >
                                            {collections.length}
                                        </ThemedText>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        )}
                    </View>
                    <View style={{ gap: 30, width: "100%" }}>
                        <View>
                            <View
                                style={{
                                    flexDirection: "row",
                                    alignItems: "center",
                                    marginVertical: 12,
                                    marginHorizontal: 20,
                                }}
                            >
                                <View style={{ flex: 1, height: 1, backgroundColor: Colors[theme].tabIconDefault }} />
                                <IconCards
                                    style={{
                                        color: Colors[theme].info,
                                        width: 40,
                                        height: 40,
                                        marginLeft: 20,
                                        marginRight: 20,
                                    }}
                                />
                                <View style={{ flex: 1, height: 1, backgroundColor: Colors[theme].tabIconDefault }} />
                            </View>
                            <DeckCarousel
                                decks={decks}
                                onNewDeckPress={() => setNewDeckModalVisible(true)}
                                onDeckPress={(deckId) =>
                                    router.push({ pathname: `/(tabs)/deck/[deckId]`, params: { deckId: deckId } })
                                }
                            />
                        </View>
                        <View>
                            <View
                                style={{
                                    flexDirection: "row",
                                    alignItems: "center",
                                    marginVertical: 12,
                                    marginHorizontal: 20,
                                }}
                            >
                                <View style={{ flex: 1, height: 1, backgroundColor: Colors[theme].tabIconDefault }} />
                                <IconPeople
                                    style={{
                                        color: Colors[theme].info,
                                        width: 34,
                                        height: 34,
                                        marginLeft: 20,
                                        marginRight: 20,
                                    }}
                                />
                                <View style={{ flex: 1, height: 1, backgroundColor: Colors[theme].tabIconDefault }} />
                            </View>
                            <FriendCarousel
                                friends={friends}
                                onFriendPress={(userId) =>
                                    router.push({ pathname: `/(tabs)/user/[userId]`, params: { userId } })
                                }
                            />
                        </View>
                        <View style={{ marginBottom: 80 }}>
                            <View
                                style={{
                                    flexDirection: "row",
                                    alignItems: "center",
                                    marginVertical: 12,
                                    marginHorizontal: 20,
                                }}
                            >
                                <View style={{ flex: 1, height: 1, backgroundColor: Colors[theme].tabIconDefault }} />
                                <Ionicons
                                    style={{ marginHorizontal: 20 }}
                                    name="albums"
                                    size={34}
                                    color={Colors[theme].info}
                                />
                                <View style={{ flex: 1, height: 1, backgroundColor: Colors[theme].tabIconDefault }} />
                            </View>
                            <CollectionCarousel
                                collections={collections}
                                userId={userId}
                                onCollectionPress={(collectionId) => {
                                    if (collectionId) {
                                        router.push({
                                            pathname: `/(tabs)/collection/[collectionId]`,
                                            params: { collectionId }, // Pass collectionId correctly
                                        });
                                    }
                                    refreshCollections(); // Refresh collections after navigating
                                }}
                            />
                        </View>
                    </View>
                </ScrollView>
            )}
            <Portal>
                <NewDeckModal
                    visible={newDeckModalVisible}
                    onClose={() => setNewDeckModalVisible(false)}
                    onCreate={handleCreateDeck}
                />
            </Portal>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "flex-start",
        alignItems: "center",
    },
    loadingWrapper: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        minHeight: 400, // asegura centrado incluso si el padre no estira
        width: "100%",
    },
    scrollContainer: {
        alignItems: "center",
        paddingBottom: 50,
        marginTop: 30,
    },
    welcomeContainer: {
        alignItems: "center",
        marginBottom: 20,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        marginBottom: 20,
    },
    title: {
        fontSize: 24,
        textAlign: "center",
        marginBottom: 10,
    },
    profileAvatar: {
        width: 54,
        height: 54,
        borderRadius: 27,
        marginBottom: 2,
    },
    profileLabel: {
        fontSize: 18,
        fontWeight: "bold",
        textAlign: "center",
        marginTop: 0,
    },
});
