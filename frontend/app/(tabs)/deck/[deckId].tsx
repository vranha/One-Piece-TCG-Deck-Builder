import React, { useEffect, useState } from "react";
import { View, StyleSheet, ActivityIndicator, TouchableOpacity, FlatList, Image, Text } from "react-native";
import { useNavigation, useLocalSearchParams, useRouter } from "expo-router";
import { Colors } from "@/constants/Colors";
import { useTheme } from "@/hooks/ThemeContext";
import useApi from "@/hooks/useApi";
import { ThemedText } from "@/components/ThemedText";
import { MaterialIcons } from "@expo/vector-icons";

interface DeckDetail {
    id: string;
    name: string;
    description: string;
    leaderCardImage: string;
    cards: any[];
}

export default function DeckDetailScreen() {
    const { theme } = useTheme();
    const api = useApi();
    const { deckId } = useLocalSearchParams();
    const [deckDetail, setDeckDetail] = useState<DeckDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const navigation = useNavigation();
    const router = useRouter();

    useEffect(() => {
        const fetchDeckDetail = async () => {
            try {
                const response = await api.get(`/deckById/${deckId}`);
                console.log("AAAA", response.data);
                setDeckDetail(response.data);
            } catch (error: any) {
                console.error("Error fetching deck detail:", error.response?.data || error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchDeckDetail();
    }, [deckId]);

    useEffect(() => {
        navigation.setOptions({
            headerShown: true,
            title: deckDetail?.name,
            headerLeft: () => (
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <MaterialIcons name="arrow-back" size={24} color={Colors[theme].text} />
                </TouchableOpacity>
            ),
        });
    }, [navigation, deckDetail, theme]);

    if (loading) {
        return (
            <View style={[styles.container, { backgroundColor: Colors[theme].background }]}>
                <ActivityIndicator size="large" color={Colors[theme].tint} />
            </View>
        );
    }

    if (!deckDetail) {
        return (
            <View style={[styles.container, { backgroundColor: Colors[theme].background }]}>
                <ThemedText style={{ color: Colors[theme].text }}>No se encontró el mazo.</ThemedText>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: Colors[theme].background }]}>
            <ThemedText style={[styles.title, { color: Colors[theme].text }]}>{deckDetail.name}</ThemedText>
            <ThemedText style={[styles.description, { color: Colors[theme].text }]}>
                {deckDetail.description}
            </ThemedText>
            <View style={styles.containerCards  }>
                           <FlatList
                data={deckDetail.cards}
                keyExtractor={(item) => item.id}
                numColumns={3}
                renderItem={({ item }) => (
                    <View
                        style={[
                            styles.cardContainer,
                            { borderColor: Colors[theme].TabBarBackground },
                            item.is_leader ? { borderColor: Colors[theme].tint, transform: "scale(1.1)"  } : {},
                        ]}
                    >
                        <Image source={{ uri: item.images_small }} style={styles.cardImage} />
                        <View style={[styles.quantityContainer, { backgroundColor: Colors[theme].tint }]}>
                            <Text style={styles.quantityText}>{item.quantity}</Text>
                        </View>
                    </View>
                )}
                contentContainerStyle={[styles.cardList, { backgroundColor: Colors[theme].TabBarBackground }]}
            />
            </View>
 
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 10,
    },
    backButton: {
        marginRight: 12,
        marginLeft: 12,
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        textAlign: "center",
        marginBottom: 10,
    },
    description: {
        fontSize: 16,
        textAlign: "center",
        marginBottom: 20,
    },
    containerCards: {
        alignItems: "center",
        borderRadius: 10,
    },
    cardList: {
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: 5,
        padding: 15,
        borderRadius: 10,
    },
    cardContainer: {
        // flex: 1,
        margin: 5,
        position: "relative",
        borderWidth: 4,
        borderRadius: 5,
        
    },
    cardImage: {
        width: 100,
        height: 140,
        borderRadius: 5,
    },
    quantityContainer: {
        position: "absolute",
        bottom: -8,
        right: -8,
        borderRadius: 50,
        width: 28,
        height: 28,
        justifyContent: "center",
        alignItems: "center",
    },
    quantityText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "bold",
    },
});
