import React, { useEffect, useState } from "react";
import { StyleSheet, View, Image, ActivityIndicator, TouchableOpacity, ScrollView } from "react-native";
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
    const [decks, setDecks] = useState<Deck[]>([]);
    const [newDeckModalVisible, setNewDeckModalVisible] = useState(false);
    const [friends, setFriends] = useState([]);
    const [collections, setCollections] = useState([]); // Add state for collections
    const router = useRouter();

    const refreshDecks = useStore((state) => state.refreshDecks);
    const setRefreshDecks = useStore((state) => state.setRefreshDecks);
    const refreshFriends = useStore((state) => state.refreshFriends);
    const setRefreshFriends = useStore((state) => state.setRefreshFriends);

    const handleCreateDeck = (leader: string, name: string, description: string) => {
        // Logic to create a new deck
        useStore.getState().setRefreshDecks(true); // Notificar al DeckCarousel
        console.log("Creating deck:", leader, name, description);
    };

    const fetchDecks = async (userId: string, token: string) => {
        try {
            const { data } = await api.get(`/decks/${userId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            setDecks([{ id: "new", name: t("create_new_deck"), deck_colors: [], leaderCardImage: null }, ...data.data]);
        } catch (error) {
            console.error("Error fetching decks:", error);
        }
    };

    const fetchFriends = async (userId: string, token: string) => {
        try {
            const { data } = await api.get(`/friends/${userId}/accepted`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            setFriends(data);
        } catch (error) {
            console.error("Error fetching friends:", error);
        }
    };

    const fetchCollections = async (userId: string, token: string) => {
        try {
            const { data } = await api.get(`/collections/${userId}`, {
                // Pass userId in the URL
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            setCollections(data.data);
        } catch (error) {
            console.error("Error fetching collections:", error);
        }
    };

    useEffect(() => {
        async function fetchUser() {
            try {
                const {
                    data: { session },
                } = await supabase.auth.getSession();
                if (session && session.user) {
                    try {
                        const { data: user } = await api.get(`/me?id=${session.user.id}`, {
                            headers: {
                                Authorization: `Bearer ${session.access_token}`,
                            },
                        }); // Fetch user info
                        setUserName(user.username || session.user.email); // Use name from API
                        fetchDecks(session.user.id, session.access_token);
                        fetchFriends(session.user.id, session.access_token); // Fetch friends
                        fetchCollections(session.user.id, session.access_token); // Fetch collections
                    } catch (apiError) {
                        console.error("Error fetching user info from /me:", apiError);
                    }
                } else {
                    console.warn("No active session found.");
                }
            } catch (sessionError) {
                console.error("Error fetching session:", sessionError);
            } finally {
                setLoading(false); // Ensure loading is set to false
            }
        }

        fetchUser();
    }, []);

    useEffect(() => {
        if (refreshDecks) {
            async function refresh() {
                const {
                    data: { session },
                } = await supabase.auth.getSession();
                if (session && session.user) {
                    fetchDecks(session.user.id, session.access_token); // Reuse fetchDecks
                }
            }

            refresh();
            setRefreshDecks(false); // Reset the state
        }
    }, [refreshDecks]); // Observe changes in refreshDecks

    useEffect(() => {
        if (refreshFriends) {
            async function refresh() {
                const {
                    data: { session },
                } = await supabase.auth.getSession();
                if (session && session.user) {
                    fetchFriends(session.user.id, session.access_token); // Reuse fetchFriends
                }
            }

            refresh();
            setRefreshFriends(false); // Reset the state
        }
    }, [refreshFriends]); // Observe changes in refreshFriends

    useFocusEffect(
        React.useCallback(() => {
            async function refreshData() {
                const {
                    data: { session },
                } = await supabase.auth.getSession();
                if (session && session.user) {
                    fetchDecks(session.user.id, session.access_token); // Refresh decks
                    fetchFriends(session.user.id, session.access_token); // Refresh friends
                }
            }
            console.log("Refreshing data...");
            refreshData();
        }, [])
    );

    return (
        <ThemedView style={[styles.container, { backgroundColor: Colors[theme].background }]}>
            {loading ? (
                <ActivityIndicator size="large" color={Colors[theme].tint} />
            ) : (
                <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
                    <View style={styles.welcomeContainer}>
                        {avatarUrl ? <Image source={{ uri: avatarUrl }} style={styles.avatar} /> : null}
                        <ThemedText type="title" style={[styles.title, { color: Colors[theme].text }]}>
                            {t("welcome", { name: userName })}
                        </ThemedText>
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
                                <Ionicons
                                    style={{ marginHorizontal: 20 }}
                                    name="albums"
                                    size={34}
                                    color={Colors[theme].info}
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
                                <Ionicons
                                    style={{ marginHorizontal: 20 }}
                                    name="people"
                                    size={34}
                                    color={Colors[theme].info}
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
                                    name="folder"
                                    size={34}
                                    color={Colors[theme].info}
                                />
                                <View style={{ flex: 1, height: 1, backgroundColor: Colors[theme].tabIconDefault }} />
                            </View>
                            <CollectionCarousel 
                            collections={collections} 
                            onCollectionPress={(collectionId) =>
                                    router.push({ pathname: `/(tabs)/collection/[collectionId]`, params: { collectionId } })
                                } />
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
    scrollContainer: {
        alignItems: "center",
        paddingBottom: 20,
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
});
