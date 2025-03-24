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
    const router = useRouter();

    useEffect(() => {
        async function fetchUser() {
            const {
                data: { session },
            } = await supabase.auth.getSession();
            if (session && session.user) {
                const name =
                    session.user.user_metadata.full_name || session.user.user_metadata.name || session.user.email;
                setUserName(name);
                fetchDecks(session.user.id, session.access_token);
            }
            setLoading(false);
        }

        async function fetchDecks(userId: string, token: string) {
            try {
                const { data } = await api.get(`/decks/${userId}`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                setDecks([
                    { id: "new", name: t("create_new_deck"), deck_colors: [], leaderCardImage: null },
                    ...data.data,
                ]);
            } catch (error) {
                console.error("Error fetching decks:", error);
            }
        }

        fetchUser();
    }, []);

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
            <DeckCarousel
                decks={decks}
                onNewDeckPress={() => setNewDeckModalVisible(true)}
                onDeckPress={(deckId) => router.push({pathname: `/(tabs)/deck/[deckId]`, params: { deckId: deckId }})}
            />
            <Portal>
                <NewDeckModal
                    visible={newDeckModalVisible}
                    onClose={() => setNewDeckModalVisible(false)}
                    onCreate={(leader, name, description) => {
                        // Aquí puedes manejar la creación del nuevo mazo
                        console.log("Nuevo mazo creado:", leader, name, description);
                    }}
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
});
