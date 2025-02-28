import React, { useState, useEffect, useRef, useCallback } from "react";
import { View, TextInput, FlatList, Image, StyleSheet, TouchableOpacity, ActivityIndicator, Platform } from "react-native";
import { useNavigation, useRouter } from "expo-router";
import { Colors } from "@/constants/Colors";
import { useTheme } from "@/hooks/ThemeContext";
import useApi from "@/hooks/useApi";
import { ThemedText } from "@/components/ThemedText";
import { MaterialIcons } from "@expo/vector-icons";
import { debounce } from "lodash";

interface Card {
    id: string;
    code: string;
    images_small: string;
    name: string;
}

export default function SearchScreen() {
    const { theme } = useTheme();
    const api = useApi();
    const [searchQuery, setSearchQuery] = useState("");
    const [cards, setCards] = useState<Card[]>([]);
    const [isLarge, setIsLarge] = useState(false);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const onEndReachedCalledDuringMomentum = useRef(false);
    const router = useRouter();
    const navigation = useNavigation();
    const searchInputRef = useRef<TextInput>(null);

    // Método de debounce para manejar la búsqueda
    const debouncedSearch = useCallback(
        debounce(async (query: string) => {
            setLoading(true);
            setPage(1); // Resetear la página para nuevas búsquedas
            setHasMore(true);
            await fetchCards(query, 1);
        }, 300), []
    );

    // Manejamos el campo de búsqueda fuera de useEffect
    const handleSearchChange = (text: string) => {
        setSearchQuery(text);
        debouncedSearch(text);
    };

    useEffect(() => {
        fetchCards(); // Ejecuta la búsqueda al montar el componente
    }, []);

    useEffect(() => {
        // Reseteamos el estado de scroll cuando la búsqueda cambia
        onEndReachedCalledDuringMomentum.current = false;
    }, [searchQuery]);

    useEffect(() => {
        setTimeout(() => {
            searchInputRef.current?.focus(); // Enfocar el input después de un pequeño retraso
        }, 100);
    }, []);

    const fetchCards = async (query = "", page = 1) => {
        if (loading || !hasMore) return;

        setLoading(true);
        try {
            const response = await api.get(`/cards?search=${query}&page=${page}`);

            if (page === 1) {
                setCards(response.data.data);
            } else {
                setCards((prevCards) => [...prevCards, ...response.data.data]);
            }

            setPage(page + 1);
            setHasMore(response.data.data.length > 0);
        } catch (error: any) {
            console.error("Error fetching cards:", error.response?.data || error.message);
        } finally {
            setLoading(false);
        }
    };

    const toggleCardSize = () => {
        setIsLarge((prev) => !prev);
    };

    const handleEndReached = () => {
        if (!onEndReachedCalledDuringMomentum.current && !loading && hasMore) {
            fetchCards(searchQuery, page);
            onEndReachedCalledDuringMomentum.current = true;
        }
    };

    const handleCardPress = (card: Card) => {
        router.push({
            pathname: "/cardDetail",
            params: { cardId: card.id, cardName: card.name },
        });
    };

    useEffect(() => {
        if (Platform.OS === "web") {
            const handleScroll = () => {
                const { scrollHeight, scrollTop, clientHeight } = document.documentElement;
                if (scrollHeight - scrollTop === clientHeight) {
                    handleEndReached();
                }
            };

            window.addEventListener("scroll", handleScroll);
            return () => window.removeEventListener("scroll", handleScroll);
        }
    }, [loading, hasMore, searchQuery, page]);

    return (
        <View style={[styles.container, { backgroundColor: Colors[theme].background }]}>
            {/* Barra de búsqueda */}
            <View style={styles.headerContainer}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <MaterialIcons name="arrow-back" size={24} color={Colors[theme].text} />
                </TouchableOpacity>
                <TextInput
                    ref={searchInputRef}
                    style={[styles.searchBar, { color: Colors[theme].text }]}
                    placeholder="Buscar cartas..."
                    placeholderTextColor={Colors[theme].icon}
                    value={searchQuery}
                    onChangeText={handleSearchChange}
                    autoCorrect={false}
                />
                <TouchableOpacity onPress={toggleCardSize} style={styles.cardSizeToggle}>
                    <MaterialIcons
                        name={isLarge ? "view-module" : "view-list"}
                        size={24}
                        color={Colors[theme].text}
                    />
                </TouchableOpacity>
            </View>

            {/* Lista de cartas */}
            <FlatList
                data={cards}
                keyExtractor={(item: any) => item.id}
                renderItem={({ item }) => (
                    <TouchableOpacity onPress={() => handleCardPress(item)}>
                        <View style={styles.cardContainer}>
                            <ThemedText
                                style={styles.cardCode}
                                darkColor={Colors[theme].text}
                                lightColor={Colors[theme].text}
                            >
                                {item.code}
                            </ThemedText>
                            <Image
                                source={{ uri: item.images_small }}
                                style={[styles.cardImage, isLarge ? styles.largeCard : styles.smallCard]}
                            />
                        </View>
                    </TouchableOpacity>
                )}
                contentContainerStyle={styles.cardList}
                onEndReached={handleEndReached}
                onEndReachedThreshold={0.5}
                onMomentumScrollBegin={() => { onEndReachedCalledDuringMomentum.current = false; }}
                ListFooterComponent={loading ? <ActivityIndicator size="large" color={Colors[theme].text} /> : null}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
    },
    headerContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 16,
        marginTop: 16,   
    },
    searchBar: {
        paddingHorizontal: 8,
        fontSize: 18,
        flex: 1,
    },
    backButton: {
        paddingLeft: 10,
    },
    cardSizeToggle: {
        marginLeft: 10,
    },
    cardList: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-evenly",
    },
    cardContainer: {
        alignItems: "center",
        marginBottom: 8,
    },
    cardCode: {
        marginBottom: 0,
        fontSize: 14,
        fontWeight: "bold",
    },
    cardImage: {
        marginHorizontal: 4,
        borderRadius: 5,
    },
    smallCard: {
        width: 108,
        height: 152,
    },
    largeCard: {
        width: 168,
        height: 239,
    },
});
