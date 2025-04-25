import React, { useEffect, useState } from "react";
import { StyleSheet, View, Image, ActivityIndicator, TouchableOpacity } from "react-native";
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

    const handleFriendPress = (friendId: string) => {
        // router.push({ pathname: `/(tabs)/friend/[friendId]`, params: { friendId } });
    };

    if (loading) {
        return (
            <ThemedView style={[styles.container, { backgroundColor: Colors[theme].background }]}>
                <ActivityIndicator size="large" color={Colors[theme].tint} />
            </ThemedView>
        );
    }

    return (
        <ThemedView style={[styles.container, { backgroundColor: Colors[theme].background }]}>
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
                        }}
                    >
                        <View style={{ flex: 1, height: 1, backgroundColor: Colors[theme].tabIconDefault }} />
                        <Ionicons style={{ marginHorizontal: 20 }} name="albums" size={34} color={Colors[theme].info} />
                        <View style={{ flex: 1, height: 1, backgroundColor: Colors[theme].tabIconDefault }} />
                    </View>
                    <DeckCarousel
                        decks={decks}
                        onNewDeckPress={() => setNewDeckModalVisible(true)}
                        onDeckPress={(deckId) =>
                            router.push({ pathname: `/(tabs)/deck/[deckId]`, params: { deckId: deckId }  })
                        }
                    />
                </View>
                <View>
                    <View
                        style={{
                            flexDirection: "row",
                            alignItems: "center",
                            marginVertical: 12,
                        }}
                    >
                        <View style={{ flex: 1, height: 1, backgroundColor: Colors[theme].tabIconDefault }} />
                        <Ionicons style={{ marginHorizontal: 20 }} name="people" size={34} color={Colors[theme].info} />
                        <View style={{ flex: 1, height: 1, backgroundColor: Colors[theme].tabIconDefault }} />
                    </View>
                    <FriendCarousel
                        friends={friends}
                        onFriendPress={(userId) =>
                            router.push({ pathname: `/(tabs)/user/[userId]`, params: { userId } })
                        }
                    />
                </View>
            </View>

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
        padding: 16,
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
    carouselHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 10,
        // paddingHorizontal: 16,
        marginBottom: 5,
    },
    carouselTitle: {
        fontSize: 20, // Increased font size
        fontWeight: "600", // Adjusted font weight for better readability
        marginLeft: 4, // Increased spacing between the icon and text
        letterSpacing: 1, // Added letter spacing for a cleaner look
    },
});
