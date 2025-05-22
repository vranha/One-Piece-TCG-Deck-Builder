import React, { useState, useEffect, useRef } from "react";
import {
    View,
    TextInput,
    FlatList,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    Platform,
    Dimensions,
} from "react-native";
import { useNavigation, useRouter } from "expo-router";
import { Colors } from "@/constants/Colors";
import { useTheme } from "@/hooks/ThemeContext";
import useApi from "@/hooks/useApi";
import { ThemedText } from "@/components/ThemedText";
import { FontAwesome } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Modalize } from "react-native-modalize";
import FilterSlider from "@/components/FilterSlider";
import useFormattedSetNames from "@/hooks/useFormattedSetNames";
import DropDownPicker from "react-native-dropdown-picker";
import { Animated, Easing } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import SearchBar from "@/components/SearchBar";
import ColorFilters from "@/components/ColorFilters";
import RarityFilters from "@/components/RarityFilters";
import TypeFilters from "@/components/TypeFilters";
import AbilityAccordion from "@/components/AbilityAccordion";
import ApplyFiltersButton from "@/components/ApplyFiltersButton";
import DropdownsContainer from "@/components/DropdownsContainer";
import TriggerFilter from "@/components/TriggerFilter";
import CardItem from "@/components/CardItem";
import UserDecksModal from "@/components/UserDecksModal";
import SelectedCardsModal from "@/components/SelectedCardsModal";
import Toast from "react-native-toast-message";
import { supabase } from "@/supabaseClient";
import AddToButton from "@/components/AddToButton";
import useStore from "@/store/useStore";
import { abilityColorMap } from "@/constants/abilityColorMap";
import AttributeFilters from "@/components/AttributeFilters"; // Import the new component

interface Card {
    id: string;
    code: string;
    images_small: string;
    name: string;
    set_name: string;
    type: string;
    rarity: string;
    color: string[];
}

type Deck = {
    id: string;
    name: string;
    leaderCardImage: string;
    deck_cards: { card_id: string; quantity: number }[];
    totalCards: number;
};

const userDecks: Deck[] = []; // Asegúrate de que tiene el tipo correcto

export default function SearchScreen() {
    const { theme } = useTheme();
    const api = useApi();
    const [cards, setCards] = useState<Card[]>([]);
    const [cardSizeOption, setCardSizeOption] = useState(0); // 0: small, 1: large, 2: detailed
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isBaseRoute, setIsBaseRoute] = useState(true);
    const onEndReachedCalledDuringMomentum = useRef(false);
    const router = useRouter();
    const navigation = useNavigation();
    const searchInputRef = useRef<TextInput>(null);
    const { t } = useTranslation();
    const modalizeRef = useRef<Modalize>(null);
    const scrollViewRef = useRef<ScrollView>(null);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const userDecksModalRef = useRef<Modalize>(null);
    const [userDecks, setUserDecks] = useState<Deck[]>([]);
    const [userId, setUserId] = useState<string | null>(null);
    const [setNames, setSetNames] = useState<string[]>([]); // Add this line to define setNames
    const [families, setFamilies] = useState<string[]>([]); // Add this line to define families
    const [attributes, setAttributes] = useState<{ attribute_name: string; attribute_image: string }[]>([]);

    DropDownPicker.setListMode("MODAL");

    const formattedSetNames = useFormattedSetNames(setNames);

    const {
        selectedCards,
        setSelectedCards,
        selectedColors,
        setSelectedColors,
        selectedSet,
        setSelectedSet,
        selectedFamily,
        setSelectedFamily,
        selectedTypes,
        setSelectedTypes,
        selectedRarities,
        setSelectedRarities,
        triggerFilter,
        setTriggerFilter,
        abilityFilters,
        setAbilityFilters,
        costRange,
        setCostRange,
        powerRange,
        setPowerRange,
        counterRange,
        setCounterRange,
        updateCardQuantity,
        searchQuery,
        setSearchQuery,
        selectedAttributes,
        setSelectedAttributes,
    } = useStore();
    const [isSelectionEnabled, setIsSelectionEnabled] = useState(selectedCards.length > 0); // State for selection mode

    const decreaseCardQuantity = (cardId: string, color: string, name: string) => {
        updateCardQuantity(cardId, -1, color, name);
    };

    const increaseCardQuantity = (cardId: string, color: string, name: string) => {
        updateCardQuantity(cardId, 1, color, name);
    };

    const handleAddSelectedCards = () => {
        console.log("Selected", selectedCards);
        setIsModalVisible(true);
    };

    useEffect(() => {
        async function fetchUser() {
            const {
                data: { session },
            } = await supabase.auth.getSession();
            if (session && session.user) {
                setUserId(session.user.id);
            }
        }

        fetchUser();
    }, []);

    const fetchUserDecks = async () => {
        if (!userId || selectedCards.length === 0) return;
        try {
            const response = await api.get(`/decks/${userId}`);
            const allDecks = response.data.data;

            const colorNameToId = { red: 1, blue: 2, green: 3, yellow: 4, purple: 5, black: 6 };
            const selectedColors = new Set(selectedCards.map((card) => card.color.toLowerCase()));
            const selectedColorIds = Array.from(selectedColors).map(
                (color) => colorNameToId[color as keyof typeof colorNameToId]
            );

            const filteredDecks = allDecks.filter((deck: { deck_colors: { color_id: number }[] }) =>
                deck.deck_colors.some((color) => selectedColorIds.includes(color.color_id))
            );
            setUserDecks(filteredDecks);
        } catch (error: any) {
            console.error("Error fetching user decks:", error.response?.data || error.message);
        }
    };

    const toggleSelectionMode = () => {
        setIsSelectionEnabled((prev) => !prev);
    };

    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchQuery); // Estado para el debounce

    // Implementa el debounce
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearchQuery(searchQuery); // Actualiza el valor después del retraso
        }, 300); // 300ms de retraso (puedes ajustarlo)

        return () => {
            clearTimeout(handler); // Limpia el timeout si el usuario sigue escribiendo
        };
    }, [searchQuery]);

    // Usa debouncedSearchQuery para las búsquedas
    useEffect(() => {
        fetchCards(debouncedSearchQuery, 1); // Llama a fetchCards solo cuando debouncedSearchQuery cambia
    }, [debouncedSearchQuery]);

    // Modifica handleSearchChange para que solo actualice searchQuery
    const handleSearchChange = (text: string) => {
        setSearchQuery(text); // Actualiza el estado de búsqueda
        setPage(1); // Reinicia la paginación
        setHasMore(true); // Permite cargar más resultados
    };

    useEffect(() => {
        fetchCards();
    }, []);

    useEffect(() => {
        fetchCards(searchQuery, 1);
    }, []); // Dependencia vacía para que solo se ejecute al montar

    useEffect(() => {
        onEndReachedCalledDuringMomentum.current = false;
    }, [searchQuery]);

    useEffect(() => {
        if (!initialLoading) {
            fetchCards(searchQuery, 1);
        }
    }, [cardSizeOption]);

    const fetchCards = async (query = "", page = 1) => {
        if (loading || !hasMore) return;

        setLoading(true);
        try {
            let colorQuery = selectedColors.length > 0 ? `&color=${selectedColors.join(",")}` : "";
            let attributeQuery = selectedAttributes.length > 0 ? `&attribute_name=${selectedAttributes.join(",")}` : "";

            const response = await api.get(`/cards?search=${query}&page=${page}${colorQuery}${attributeQuery}`);

            if (page === 1) {
                setCards(response.data.data.map((card: Card) => ({ ...card, color: card.color || "unknown" })));
                setInitialLoading(false);
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

    useEffect(() => {
        const fetchSetNames = async () => {
            try {
                const response = await api.get("/set_names");
                setSetNames(response.data);
            } catch (err) {
                console.error("Error fetching set names:", err);
            }
        };

        const fetchFamilies = async () => {
            try {
                const response = await api.get("/families");
                setFamilies(response.data);
            } catch (err) {
                console.error("Error fetching families:", err);
            }
        };
        const fetchAttributes = async () => {
            try {
                const response = await api.get("/attributes");
                console.log("Attributes:", response.data);
                setAttributes(response.data);
            } catch (err) {
                console.error("Error fetching attributes:", err);
            }
        };

        fetchAttributes();
        fetchSetNames();
        fetchFamilies();
    }, []);

    const toggleCardSize = () => {
        setCardSizeOption((prevOption) => (prevOption + 1) % 3);
    };

    const handleEndReached = () => {
        if (!onEndReachedCalledDuringMomentum.current && !loading && hasMore) {
            fetchCards(searchQuery, page);
            onEndReachedCalledDuringMomentum.current = true;
        }
    };

    const handleCardPress = (card: Card) => {
        router.push({
            pathname: "/(tabs)/[cardId]",
            params: { cardId: card.id, cardName: card.name },
        });
    };

    const handleTypeSelect = (type: string) => {
        setSelectedTypes(
            selectedTypes.includes(type) ? selectedTypes.filter((t) => t !== type) : [...selectedTypes, type]
        );
    };

    const handleRaritySelect = (rarity: string) => {
        setSelectedRarities(
            selectedRarities.includes(rarity)
                ? selectedRarities.filter((r) => r !== rarity)
                : [...selectedRarities, rarity]
        );
    };

    const handleTriggerFilterToggle = () => {
        setTriggerFilter(!triggerFilter);
    };

    const handleAbilityFilterToggle = (ability: string | null) => {
        setAbilityFilters(
            ability === null
                ? [] // Clear all abilities if null is passed
                : abilityFilters.includes(ability)
                ? abilityFilters.filter((a) => a !== ability)
                : [...abilityFilters, ability]
        );
    };

    const [isAbilityAccordionOpen, setIsAbilityAccordionOpen] = useState(false);
    const abilityAccordionHeight = useRef(new Animated.Value(0)).current;
    // const scrollViewRef = useRef<ScrollView>(null); // Asegúrate de definir la referencia

    const toggleAbilityAccordion = () => {
        const newValue = !isAbilityAccordionOpen;
        setIsAbilityAccordionOpen(newValue);

        Animated.timing(abilityAccordionHeight, {
            toValue: newValue ? 350 : 0,
            duration: 300,
            easing: Easing.linear,
            useNativeDriver: false, // Animamos altura, así que debe ser false
        }).start(() => {
            if (newValue) {
                scrollViewRef.current?.scrollToEnd({ animated: true });
            }
        });
    };

    const capitalizeFirstLetter = (string: string) => {
        return string.charAt(0).toUpperCase() + string.slice(1);
    };

    useEffect(() => {
        if (!initialLoading) {
            setPage(1);
            setHasMore(true);
            fetchCards(searchQuery, 1);
        }
    }, [selectedColors]);

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

    const openFilterModal = () => {
        modalizeRef.current?.open();
    };

    const applyFilters = () => {
        modalizeRef.current?.close();
        setPage(1);
        setHasMore(true);
        fetchCards(searchQuery, 1);
    };

    const closeModal = () => {
        setIsModalVisible(false);
    };

    const openUserDecksModal = async () => {
        const uniqueColors = new Set(selectedCards.map((card) => card.color.toLowerCase()));
        if (uniqueColors.size > 2) {
            closeModal(); // Close the modal first
            setTimeout(() => {
                Toast.show({
                    type: "error",
                    text1: "No se pueden seleccionar más de 2 colores.",
                });
            }, 300); // Add a slight delay to ensure the modal is fully closed
            return;
        }
        await fetchUserDecks(); // Fetch user decks before opening the modal
        closeModal();
        userDecksModalRef.current?.open();
    };

    const handleAddCardToDeck = async (deckId: string, totalQuantity: number, deckName: string) => {
        try {
            // Filtramos las cartas asegurándonos de que no superen el límite de 4 copias por carta
            const adjustedCards = selectedCards
                .map(({ cardId, quantity }) => {
                    // Buscar si la carta ya está en el deck
                    const existingCard = userDecks
                        .find((deck) => deck.id === deckId)
                        ?.deck_cards.find((card) => card.card_id === cardId);

                    const alreadyInDeck = existingCard ? existingCard.quantity : 0;
                    const maxAddable = Math.min(quantity, 4 - alreadyInDeck); // No superar las 4 copias

                    console.log("Cantidad seleccionada:", quantity);
                    console.log("Cantidad en el mazo:", alreadyInDeck);
                    console.log("Cantidad máxima a añadir:", maxAddable);

                    return {
                        cardId,
                        quantity: maxAddable > 0 ? maxAddable : 0, // Evitar valores negativos
                    };
                })
                .filter((card) => card.quantity > 0); // Excluir cartas con cantidad 0

            if (adjustedCards.length === 0) {
                Toast.show({
                    type: "error",
                    text1: "No se pueden añadir más cartas, ya alcanzaste el límite.",
                });
                return;
            }

            const response = await api.post("/decks/cards/multiple", {
                deckId,
                cards: adjustedCards,
            });

            if (response.status === 200 || response.status === 201) {
                // Mostrar un mensaje de éxito
                Toast.show({
                    type: "success",
                    text1: `Se añadieron ${totalQuantity} cartas al mazo "${deckName}".`,
                });
                userDecksModalRef.current?.close();
                setSelectedCards([]); // Limpiar selección después de añadir
            }
        } catch (error: any) {
            console.error("Error adding cards to deck:", error.response?.data || error.message);
            Toast.show({
                type: "error",
                text1: "Error al añadir cartas al mazo.",
            });
        }
    };

    const [filtersCleared, setFiltersCleared] = useState(false);

    const clearAllFilters = () => {
        setSearchQuery("");
        setSelectedColors([]);
        setSelectedSet(null);
        setSelectedFamily(null);
        setSelectedTypes([]);
        setSelectedAttributes([]);
        setSelectedRarities([]);
        setTriggerFilter(false);
        setAbilityFilters([]);
        setCostRange([0, 10]);
        setPowerRange([0, 13000]);
        setCounterRange([0, 2000]);
        setPage(1);
        setHasMore(true);

        setFiltersCleared(true);
    };

    useEffect(() => {
        if (filtersCleared) {
            fetchCards("", 1);
            setFiltersCleared(false);
        }
    }, [filtersCleared]);

    const screenHeight = Dimensions.get("window").height;

    const [cargando, setCargando] = useState(true);

    return (
        <View style={[styles.container, { backgroundColor: Colors[theme].background }]}>
            <SearchBar
                onSearchChange={handleSearchChange}
                onClearFilters={clearAllFilters}
                onOpenFilterModal={openFilterModal}
                onToggleCardSize={toggleCardSize}
                isBaseRoute={isBaseRoute}
                cardSizeOption={cardSizeOption}
                isSelectionEnabled={isSelectionEnabled}
                toggleSelectionMode={toggleSelectionMode}
            />
            {isSelectionEnabled && (
                <View style={styles.selectionButtonsContainer}>
                    <AddToButton
                        isDisabled={selectedCards.length === 0}
                        onPress={handleAddSelectedCards}
                        text={t("add_to")}
                        theme={theme}
                    />
                    <TouchableOpacity
                        style={[styles.resetButton, { backgroundColor: Colors[theme].tint }]}
                        onPress={() => setSelectedCards([])}
                    >
                        <ThemedText style={[styles.resetButtonText, { color: Colors[theme].background }]}>
                            ({selectedCards.reduce((sum, card) => sum + card.quantity, 0)}) {t("erase")}
                        </ThemedText>
                    </TouchableOpacity>
                </View>
            )}
            <ColorFilters />

            {initialLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={Colors[theme].text} />
                </View>
            ) : (
                <FlatList
                    data={cards}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <CardItem
                            item={item}
                            handleCardPress={handleCardPress}
                            cardSizeOption={cardSizeOption}
                            styles={styles}
                            Colors={Colors}
                            theme={theme}
                            loading={loading}
                            isSelectionEnabled={isSelectionEnabled}
                            selectedQuantity={selectedCards.find((card) => card.cardId === item.id)?.quantity || 0}
                            updateCardQuantity={(cardId, change) =>
                                updateCardQuantity(cardId, change, item.color[0], item.name)
                            }
                        />
                    )}
                    contentContainerStyle={[
                        styles.cardList,
                        { paddingBottom: hasMore ? 0 : 20, minHeight: screenHeight },
                    ]}
                    onEndReached={handleEndReached}
                    onEndReachedThreshold={0.5}
                    onMomentumScrollBegin={() => {
                        onEndReachedCalledDuringMomentum.current = false;
                        if (!loading && hasMore) {
                            handleEndReached();
                        }
                    }}
                />
            )}
            {!hasMore && !loading && (
                <View style={styles.noMoreCardsContainer}>
                    <FontAwesome name="exclamation-circle" size={24} color={Colors[theme].icon} />
                    <ThemedText style={styles.noMoreCardsText}>No more cards</ThemedText>
                </View>
            )}

            {(loading && !initialLoading) && (
                <View style={styles.absoluteLoader}>
                    <ActivityIndicator size="large" color={Colors[theme].text} />
                </View>
            )}

            {/* Modal de filtros */}
            <Modalize ref={modalizeRef} adjustToContentHeight>
                <ScrollView ref={scrollViewRef}>
                    <View style={[styles.modalContent, { backgroundColor: Colors[theme].backgroundSoft }]}>
                        <DropdownsContainer formattedSetNames={formattedSetNames} families={families} />
                        <TriggerFilter triggerFilter={triggerFilter} onToggle={handleTriggerFilterToggle} />
                        <View style={[styles.separator, { backgroundColor: Colors[theme].tabIconDefault }]} />
                        <ThemedText style={styles.label}>
                            {t("rarity")}{" "}
                            <ThemedText style={{ color: Colors[theme].icon }}>
                                ({selectedRarities.length ? selectedRarities.length : t("all_f")})
                            </ThemedText>
                        </ThemedText>
                        <RarityFilters selectedRarities={selectedRarities} onRaritySelect={handleRaritySelect} />
                        <View style={[styles.separator, { backgroundColor: Colors[theme].tabIconDefault }]} />
                        <ThemedText style={styles.label}>
                            {t("type")}{" "}
                            <ThemedText style={{ color: Colors[theme].icon }}>
                                ({selectedTypes.length ? selectedTypes.length : t("all_m")})
                            </ThemedText>
                        </ThemedText>
                        <TypeFilters selectedTypes={selectedTypes} onTypeSelect={handleTypeSelect} />
                        <View style={[styles.separator, { backgroundColor: Colors[theme].tabIconDefault }]} />
                        <FilterSlider
                            label="Cost"
                            range={costRange}
                            min={0}
                            max={10}
                            step={1}
                            onValuesChangeFinish={(values) => setCostRange(values as [number, number])}
                        />
                        {/* Separator */}
                        <View style={[styles.separator, { backgroundColor: Colors[theme].tabIconDefault }]} />
                        <FilterSlider
                            label="Power"
                            range={powerRange}
                            min={0}
                            max={13000}
                            step={1000}
                            onValuesChangeFinish={(values) => setPowerRange(values as [number, number])}
                        />
                        {/* Separator */}
                        <View style={[styles.separator, { backgroundColor: Colors[theme].tabIconDefault }]} />
                        <FilterSlider
                            label="Counter"
                            range={counterRange}
                            min={0}
                            max={2000}
                            step={1000}
                            onValuesChangeFinish={(values) => setCounterRange(values as [number, number])}
                        />
                        <AbilityAccordion
                            isAbilityAccordionOpen={isAbilityAccordionOpen}
                            toggleAbilityAccordion={toggleAbilityAccordion}
                            abilityAccordionHeight={abilityAccordionHeight}
                            abilityFilters={abilityFilters}
                            handleAbilityFilterToggle={handleAbilityFilterToggle}
                            abilityColorMap={abilityColorMap}
                        />
                        <AttributeFilters
                            theme={theme}
                            attributes={attributes}
                            selectedAttributes={selectedAttributes}
                            onAttributeSelect={(attribute) =>
                                setSelectedAttributes(
                                    attribute === null
                                        ? [] // Clear all attributes if null is passed
                                        : selectedAttributes.includes(attribute)
                                        ? selectedAttributes.filter((a) => a !== attribute)
                                        : [...selectedAttributes, attribute]
                                )
                            }
                        />
                        <View style={[styles.separator, { backgroundColor: Colors[theme].tabIconDefault }]} />
                        <ApplyFiltersButton onPress={applyFilters} label={t("filter")} />
                    </View>
                </ScrollView>
            </Modalize>

            <SelectedCardsModal
                isVisible={isModalVisible}
                onClose={closeModal}
                selectedCards={selectedCards}
                theme={theme}
                decreaseCardQuantity={decreaseCardQuantity}
                increaseCardQuantity={increaseCardQuantity}
                openUserDecksModal={openUserDecksModal}
            />

            <UserDecksModal
                modalizeRef={userDecksModalRef}
                userDecks={userDecks}
                cards={selectedCards.map(({ cardId, quantity }) => ({ cardId, quantity }))}
                handleAddCardToDeck={handleAddCardToDeck}
            />
            <Toast />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
    },
    cardList: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-evenly",
    },
    cardContainer: {
        alignItems: "center",
        marginBottom: 8,
        overflow: "hidden",
    },
    cardCode: {
        marginBottom: 0,
        fontSize: 14,
        fontWeight: "bold",
    },
    cardType: {
        fontSize: 14,
        fontWeight: "bold",
        marginBottom: -5,
    },
    cardSet: {
        fontSize: 12,
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
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    absoluteLoader: {
        position: "absolute",
        bottom: 20,
        left: 0,
        right: 0,
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        elevation: 10,
        height: 50,
    },
    detailedCardContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%",
        padding: 12,
        borderRadius: 12,
        marginBottom: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 5,
    },

    cardDetails: {
        flex: 1,
        paddingHorizontal: 16,
        height: "100%",
        justifyContent: "space-around",
    },

    cardRarityContainer: {
        position: "absolute",
        right: -5,
        top: -5,
        width: 40,
        height: 40,
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 20,
        color: "#FFFFFF",
    },

    cardRarity: {
        fontSize: 18,
        fontWeight: "bold",
    },

    cardHeader: {},

    cardFooter: {},

    cardName: {
        fontSize: 20,
        fontWeight: "bold",
        overflow: "hidden",
        textOverflow: "ellipsis",
        width: "90%",
    },
    modalContent: {
        padding: 20,
        justifyContent: "center",
        alignItems: "center",
    },
    filterLabel: {
        fontSize: 16,
        fontWeight: "600",
        marginTop: 5,
        marginBottom: 10,
    },
    applyButton: {
        marginTop: 20,
        paddingHorizontal: 22,
        paddingVertical: 10,
        borderRadius: 8,
        alignItems: "center",
    },
    applyButtonText: {
        color: "#fff",
        fontWeight: "bold",
        fontSize: 16,
    },
    separator: {
        height: 1,
        width: "100%",
        marginVertical: 10,
    },
    noMoreCardsOverlay: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        alignItems: "center",
        justifyContent: "center",
    },
    noMoreCardsContainer: {
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 20,
    },
    noMoreCardsText: {
        marginTop: 10,
        fontSize: 16,
        color: Colors.light.icon,
    },
    label: {
        fontSize: 16,
        fontWeight: "600",
        marginBottom: 10,
    },
    quantityControls: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        padding: 8,
        backgroundColor: "#000000a2",
        position: "absolute",
        bottom: 8,
        borderBottomEndRadius: 5,
        borderBottomStartRadius: 5,
    },
    quantityText: {
        marginHorizontal: 8,
        fontSize: 16,
        fontWeight: "bold",
    },
    addButton: {
        marginHorizontal: 16,
        marginBottom: 10,
        paddingVertical: 12,
        backgroundColor: Colors.light.highlight,
        borderRadius: 8,
        alignItems: "center",
    },
    addButtonText: {
        color: Colors.light.text,
        fontSize: 18,
        fontWeight: "bold",
    },
    modalOverlay: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0, 0, 0, 0.712)",
    },
    modalContainer: {
        width: "90%",
        borderRadius: 10,
        padding: 20,
        alignItems: "center",
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 20,
        textAlign: "center",
    },
    scrollContainer: {
        maxHeight: 400,
        width: "100%",
    },
    scrollView: {
        width: "100%",
    },
    tableContainer: {
        width: "85%",
        marginTop: 10,
    },
    tableHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: Colors.light.icon,
    },
    tableHeaderText: {
        fontSize: 16,
        fontWeight: "bold",
        flex: 1,
        textAlign: "center",
    },
    tableRow: {
        flexDirection: "row",
        justifyContent: "space-around",
        paddingVertical: 8,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: Colors.light.icon,
    },
    tableCell: {
        fontSize: 14,
        flex: 1,
        textAlign: "left",
    },
    colorIndicator: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        alignSelf: "center",
    },
    closeButton: {
        marginTop: 20,
        paddingVertical: 10,
        paddingHorizontal: 20,
        backgroundColor: Colors.light.highlight,
        borderRadius: 8,
        alignSelf: "center",
    },
    closeButtonText: {
        color: Colors.light.text,
        fontSize: 16,
        fontWeight: "bold",
    },
    buttonContainer: {
        flexDirection: "row",
        justifyContent: "space-around",
        marginTop: 20,
        gap: 10,
    },
    actionButton: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
    },
    actionButtonText: {
        color: Colors.light.text,
        fontSize: 16,
        fontWeight: "bold",
    },
    actionButtonsContainer: {
        position: "absolute",
        top: "50%",
        right: "-20%",
        transform: [{ translateY: "-20%" }],
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
    },
    iconButton: {
        width: 24,
        height: 24,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
    },
    selectionButtonsContainer: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 10,
    },
    resetButton: {
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8,
        alignItems: "center",
        justifyContent: "center",
    },
    resetButtonText: {
        fontSize: 16,
        fontWeight: "bold",
    },
});
