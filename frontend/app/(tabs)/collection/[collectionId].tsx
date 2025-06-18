import React, { useEffect, useState, useRef } from "react";
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Modal,
    TextInput,
    Platform,
    Animated,
    Easing,
    ActivityIndicator,
} from "react-native";
import { useRoute, RouteProp } from "@react-navigation/native";
import useApi from "@/hooks/useApi"; // Import the useApi hook
import { supabase } from "@/supabaseClient";
import { Modalize } from "react-native-modalize"; // Import Modalize
import { MaterialIcons } from "@expo/vector-icons"; // Import MaterialIcons
import { useNavigation } from "expo-router"; // Import useNavigation
import { Colors } from "@/constants/Colors"; // Import Colors
import Toast from "react-native-toast-message"; // Import Toast
import { useRouter } from "expo-router"; // Import useRouter
import { useTheme } from "@/hooks/ThemeContext";
import { useTranslation } from "react-i18next";
import { Image as ExpoImage } from "expo-image";
import { ThemedText } from "@/components/ThemedText";
import { ScrollView } from "react-native-gesture-handler";
import TriggerFilter from "@/components/TriggerFilter";
import FilterSlider from "@/components/FilterSlider";
import AbilityAccordion from "@/components/AbilityAccordion";
import AttributeFilters from "@/components/AttributeFilters";
import { LinearGradient } from "expo-linear-gradient";
import { abilityColorMap } from "@/constants/abilityColorMap";
import DropDownPicker from "react-native-dropdown-picker";
import useFormattedSetNames from "@/hooks/useFormattedSetNames";
import { Ionicons } from "@expo/vector-icons";

const CollectionDetails = () => {
    const route = useRoute<RouteProp<{ params: { collectionId: string } }, "params">>();
    const { collectionId } = route.params;
    const api = useApi(); // Initialize the API instance
    const navigation = useNavigation();
    const router = useRouter();
    const modalizeRef = useRef<Modalize>(null); // Ref for Modalize
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false); // State for edit mode
    const [editedName, setEditedName] = useState(""); // State for edited name
    const [editedDescription, setEditedDescription] = useState(""); // State for edited description
    const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false); // State for delete modal visibility
    const { theme } = useTheme() as { theme: "light" | "dark" };
    const [triggerFilter, setTriggerFilter] = useState<boolean>(false); // State for selected trigger filter
    const [abilityFilters, setAbilityFilters] = useState<string[]>([]); // State for selected abilities
    const [selectedAttributes, setSelectedAttributes] = useState<string[]>([]); // State for selected attributes
    const [costRange, setCostRange] = useState<[number, number]>([0, 10]); // State for cost filter
    const [powerRange, setPowerRange] = useState<[number, number]>([0, 13000]); // State for power filter
    const [counterRange, setCounterRange] = useState<[number, number]>([0, 2000]); // State for counter filter
    const [filtersVisible, setFiltersVisible] = useState(false);
    const [selectedTypes, setSelectedTypes] = useState(["CHARACTER", "EVENT", "STAGE", "LEADER"]);
    const [attributes, setAttributes] = useState<{ attribute_name: string; attribute_image: string }[]>([]);
    const { t } = useTranslation();

    interface Collection {
        name: string;
        type: string;
        description: string;
        collection_cards: { card_id: string }[];
        cards: {
            id: string;
            code: string;
            name: string;
            color: string[];
            rarity: string;
            images_small: string;
            images_thumb: string;
            type: string;
            set_name: string;
        }[];
    }

    const [collection, setCollection] = useState<Collection | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState(""); // State for search query
    const [filteredCards, setFilteredCards] = useState<Collection["cards"]>([]); // State for filtered cards
    const [cardSizeOption, setCardSizeOption] = useState(0); // 0: small, 1: large, 2: detailed
    const [visibleCardsCount, setVisibleCardsCount] = useState(18); // Number of cards to display initially
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1); // Total number of pages
    const [hasMoreCards, setHasMoreCards] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const itemsPerPage = 18; // Número de elementos por página

    const getCardDimensions = () => {
        switch (cardSizeOption) {
            case 0:
                return { height: 137, imageStyle: styles.smallCard };
            case 1:
                return { height: 191, imageStyle: styles.largeCard };
            case 2:
                return { height: 137, imageStyle: styles.smallCard };
            default:
                return { height: 137, imageStyle: styles.smallCard };
        }
    };

    const getQuantityControlsStyle = () => {
        switch (cardSizeOption) {
            case 0: // Small card
                return { bottom: 0, padding: 8 };
            case 1: // Large card
                return { bottom: 2, paddingHorizontal: 38 };
            case 2: // Detailed card
                return { bottom: 0, padding: 3, left: 10 };
            default:
                return { bottom: 4, padding: 4 };
        }
    };

    const toggleCardSize = () => {
        setCardSizeOption((prevOption) => {
            const newOption = (prevOption + 1) % 3;
            setVisibleCardsCount(18); // Reset visible cards count
            fetchFilteredCards(1); // Reload cards from the first page
            return newOption;
        });
    };

    const toggleFilterVisibility = () => {
        setFiltersVisible(!filtersVisible);
    };

    useEffect(() => {
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
    }, []);

    const { height, imageStyle } = getCardDimensions();

    const fetchCollection = async () => {
        try {
            const { data: session, error } = await supabase.auth.getSession();
            if (error || !session?.session?.access_token) {
                throw new Error("No se pudo obtener el token de sesión");
            }

            const token = session.session.access_token;

            const response = await api.get(`/collection/${collectionId}`, {
                headers: {
                    Authorization: `Bearer ${token}`, // Usar el token obtenido dinámicamente
                },
            });
            console.log("Collection response:", response.data); // Debugging line
            setCollection(response.data.data);
        } catch (error) {
            console.error("Error fetching collection:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCollection();
    }, [collectionId]);

    const handleOpenModal = () => {
        setIsModalOpen(true);
        modalizeRef.current?.open();
        if (filteredCards.length === 0) {
            fetchFilteredCards(1); // Fetch cards only when the modal is opened
        }
    };

    useEffect(() => {
        navigation.setOptions({
            headerShown: true,
            headerLeft: () => (
                <TouchableOpacity
                    onPress={() => {
                        router.back();
                        modalizeRef.current?.close();
                    }}
                    style={{ marginLeft: 12 }}
                >
                    <MaterialIcons name="arrow-back" size={24} color={Colors[theme].text} />
                </TouchableOpacity>
            ),
            headerTitle: () => null,
            headerRight: () => (
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <TouchableOpacity
                        onPress={handleOpenModal}
                        disabled={isModalOpen} // Disable button when Modalize is open
                        style={{
                            backgroundColor: isModalOpen ? Colors[theme].disabled : Colors[theme].success,
                            paddingVertical: 5,
                            paddingHorizontal: 10,
                            borderRadius: 5,
                            marginRight: 10,
                        }}
                    >
                        <Text style={{ color: Colors[theme].background, fontWeight: "bold" }}>
                            {isModalOpen ? t("close_to_make_changes") : t("cards")}
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={{
                            backgroundColor: Colors[theme].highlight,
                            paddingVertical: 5,
                            paddingHorizontal: 5,
                            borderRadius: 5,
                            marginRight: 10,
                        }}
                        onPress={() => setIsEditing(!isEditing)}
                    >
                        <MaterialIcons name="edit" size={24} color={Colors[theme].background} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => setIsDeleteModalVisible(true)}
                        style={{
                            backgroundColor: Colors[theme].error,
                            paddingVertical: 5,
                            paddingHorizontal: 5,
                            borderRadius: 5,
                        }}
                    >
                        <MaterialIcons name="delete" size={24} color={Colors[theme].background} />
                    </TouchableOpacity>
                </View>
            ),
        });
    }, [isEditing, isModalOpen]);

    const toggleTypeSelection = (type: string) => {
        if (selectedTypes.includes(type)) {
            setSelectedTypes(selectedTypes.filter((t) => t !== type));
        } else {
            setSelectedTypes([...selectedTypes, type]);
        }
    };

    const handleDeleteCollection = async () => {
        try {
            await api.delete(`/collections/${collectionId}`);
            Toast.show({
                type: "success",
                text1: "Collection deleted",
                text2: "The collection has been successfully deleted.",
                position: "bottom",
            });
            router.replace("/"); // Navigate back to the main screen
        } catch (error) {
            console.error("Error deleting collection:", error);
            Toast.show({
                type: "error",
                text1: "Error",
                text2: "Failed to delete the collection.",
                position: "bottom",
            });
        }
    };

    const handleEditCollection = async () => {
        try {
            const updatedName = editedName.trim(); // Ensure no leading/trailing spaces
            const updatedDescription = editedDescription.trim(); // Ensure no leading/trailing spaces

            await api.put(`/collection/${collectionId}`, {
                name: updatedName,
                description: updatedDescription,
            });

            setCollection((prev) => ({
                ...prev!,
                name: updatedName,
                description: updatedDescription,
            }));

            setIsEditing(!isEditing); // Close edit mode

            Toast.show({
                type: "success",
                text1: t("collection_updated"),
                text2: t("collection_updated_successfully"),
                position: "bottom",
            });
        } catch (error) {
            console.error("Error editing collection:", error);
            Toast.show({
                type: "error",
                text1: "Error",
                text2: t("failed_to_update_collection"),
                position: "bottom",
            });
        }
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
            // if (newValue) {
            //     scrollViewRef.current?.scrollToEnd({ animated: true });
            // }
        });
    };

    const [isAtTop, setIsAtTop] = useState(true); // Estado para saber si estás en la parte superior

    const handleScroll = (event: any) => {
        const offsetY = event.nativeEvent.contentOffset.y;
        setIsAtTop(offsetY <= 0); // Si el desplazamiento es 0 o menor, estás en la parte superior
    };

    const [selectedCards, setSelectedCards] = useState<string[]>([]); // State for selected card IDs

    const handleCardClick = (cardId: string) => {
        console.log("Card clicked:", cardId);
        setSelectedCards(
            (prevSelectedCards) =>
                prevSelectedCards.includes(cardId)
                    ? prevSelectedCards.filter((id) => id !== cardId) // Remove if already selected
                    : [...prevSelectedCards, cardId] // Add if not selected
        );
    };

    const handleAddOrRemoveCardsFromCollection = async () => {
        try {
            const cardsToAdd = selectedCards.filter((cardId) => !collection?.cards.some((c) => c.id === cardId));
            const cardsToRemove = collection?.cards.filter((c) => !selectedCards.includes(c.id)).map((c) => c.id);

            await api.put(`/collection/${collectionId}/update-cards`, {
                cardsToAdd,
                cardsToRemove,
            });

            Toast.show({
                type: "success",
                text1: "Collection updated",
                text2: "The collection has been successfully updated.",
                position: "bottom",
            });

            setSelectedCards([]); // Clear the selected cards after updating
        } catch (error) {
            console.error("Error updating collection:", error);
            Toast.show({
                type: "error",
                text1: "Error",
                text2: "Failed to update the collection.",
                position: "bottom",
            });
        }
    };

    const transformSliderValue = (value: number | null | undefined, defaultValue: string) => {
        if (value === 0 || value == null) {
            return defaultValue; // Transform 0 or null to the default value for the API
        }
        return value.toString();
    };

    const handleTriggerFilterToggle = () => {
        setTriggerFilter((prev) => !prev);
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

    const [setNames, setSetNames] = useState<string[]>([]);
    const [families, setFamilies] = useState<string[]>([]);
    const [selectedSetName, setSelectedSetName] = useState<string | undefined>(undefined);
    const [selectedFamily, setSelectedFamily] = useState<string | undefined>(undefined);
    const [openSetNameDropdown, setOpenSetNameDropdown] = useState(false);
    const [openFamilyDropdown, setOpenFamilyDropdown] = useState(false);

    const formattedSetNames = useFormattedSetNames(setNames);

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

        fetchSetNames();
        fetchFamilies();
    }, []);

    const fetchFilteredCards = async (page: number) => {
        try {
            setIsLoadingMore(true); // Activa el indicador de carga
            const triggerQuery = triggerFilter ? `&trigger=true` : "";
            const attributeQuery =
                selectedAttributes.length > 0 ? `&attribute_name=${selectedAttributes.join(",")}` : "";
            const abilityQuery = abilityFilters.length > 0 ? `&ability=${abilityFilters.join(",")}` : "";
            const costQuery = `&cost_gte=${transformSliderValue(costRange[0], "null")}&cost_lte=${transformSliderValue(
                costRange[1],
                "null"
            )}`;
            const powerQuery = `&power_gte=${powerRange[0]}&power_lte=${powerRange[1]}`;
            const counterQuery = `&counter_gte=${transformSliderValue(
                counterRange[0],
                ""
            )}&counter_lte=${transformSliderValue(counterRange[1], "")}`;
            const typeQuery = selectedTypes.length > 0 ? `&type=${selectedTypes.join(",")}` : "";
            const setNameQuery = selectedSetName ? `&set_name=${selectedSetName}` : "";
            const familyQuery = selectedFamily ? `&family=${selectedFamily}` : "";
            const uniqueCodesQuery = "&uniqueCodes=false";

            const response = await api.get(
                `/cards?search=${searchQuery}${triggerQuery}${attributeQuery}${abilityQuery}${costQuery}${powerQuery}${counterQuery}${typeQuery}${setNameQuery}${familyQuery}${uniqueCodesQuery}&page=${page}&limit=${itemsPerPage}`
            );

            const { data: cards, pagination } = response.data;

            setFilteredCards(cards);
            setCurrentPage(pagination.page); // Actualiza la página actual desde la API
            setTotalPages(pagination.totalPages); // Actualiza el total de páginas desde la API
            setHasMoreCards(pagination.page < pagination.totalPages); // Verifica si hay más páginas
        } catch (error) {
            console.error("Error fetching filtered cards:", error);
        } finally {
            setIsLoadingMore(false); // Desactiva el indicador de carga
        }
    };

    useEffect(() => {
        fetchFilteredCards(1);
    }, [
        searchQuery,
        triggerFilter,
        selectedAttributes,
        abilityFilters,
        costRange,
        powerRange,
        counterRange,
        selectedTypes,
        selectedSetName,
        selectedFamily,
    ]);

    useEffect(() => {
        if (collection) {
            setEditedName(collection.name);
            setEditedDescription(collection.description || "");
            setSelectedCards(collection.collection_cards.map((c) => c.card_id)); // Initialize selectedCards with collection cards
        }
    }, [collection]);

    const [isImageModalVisible, setIsImageModalVisible] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    const handleCardPress = (image: string) => {
        setSelectedImage(image);
        setIsImageModalVisible(true);
    };

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                <ActivityIndicator size="large" color={Colors[theme].info} />
            </View>
        );
    }

    if (!collection) {
        return (
            <View style={styles.container}>
                <Text>Collection not found</Text>
            </View>
        );
    }

    const renderCardItem = ({
        item,
    }: {
        item: {
            code: string;
            name: string;
            color: string[];
            rarity: string;
            images_small: string;
            images_thumb: string;
        };
    }) => (
        <TouchableOpacity onPress={() => handleCardPress(item.images_small)}>
            <View style={[styles.cardContainer, { backgroundColor: Colors[theme].backgroundSoft }]}>
                <View style={styles.cardDetails}>
                    <Text style={[styles.cardCode, { color: Colors[theme].text }]}>{item.code}</Text>
                    <Text style={[styles.cardName, { color: Colors[theme].textSoft }]}>
                        {item.name.length > 25 ? `${item.name.slice(0, 25)}...` : item.name}
                    </Text>
                </View>
                <Text style={[styles.cardRarity, { color: Colors[theme].tint }]}>{item.rarity}</Text>
                <View style={styles.cardColors}>
                    {item.color.map((color, index) => (
                        <View key={index} style={[styles.colorCircle, { backgroundColor: color.toLowerCase() }]} />
                    ))}
                </View>
            </View>
        </TouchableOpacity>
    );

    const PaginationControls = () => {
        const renderPageButtons = () => {
            const buttons = [];
            const maxPreviousPages = 2; // Número de páginas anteriores visibles
            const maxNextPages = 2; // Número de páginas posteriores visibles

            // Botón para ir a la primera página (solo si no aparece ya en las páginas anteriores)
            if (currentPage > maxPreviousPages + 1) {
                buttons.push(
                    <TouchableOpacity
                        key="first"
                        style={[styles.pageButton, { backgroundColor: Colors[theme].TabBarBackground }]}
                        onPress={() => fetchFilteredCards(1)}
                    >
                        <Text style={[styles.pageButtonText, { color: Colors[theme].tabIconDefault }]}>1</Text>
                    </TouchableOpacity>
                );
            }

            // Espacio entre el botón de la primera página y las páginas anteriores
            if (currentPage > maxPreviousPages + 1) {
                buttons.push(
                    <Text key="first-gap" style={[styles.pageButtonText, { color: Colors[theme].tabIconDefault }]}>
                        ...
                    </Text>
                );
            }

            // Botones para las dos páginas anteriores
            for (let i = Math.max(1, currentPage - maxPreviousPages); i < currentPage; i++) {
                buttons.push(
                    <TouchableOpacity
                        key={i}
                        style={[styles.pageButton, { backgroundColor: Colors[theme].TabBarBackground }]}
                        onPress={() => fetchFilteredCards(i)}
                    >
                        <Text style={[styles.pageButtonText, { color: Colors[theme].tabIconDefault }]}>{i}</Text>
                    </TouchableOpacity>
                );
            }

            // Botón para la página actual
            buttons.push(
                <TouchableOpacity
                    key={currentPage}
                    style={[styles.pageButton, { backgroundColor: Colors[theme].tint }]}
                    onPress={() => fetchFilteredCards(currentPage)}
                >
                    <Text style={[styles.pageButtonText, { color: Colors[theme].background }]}>{currentPage}</Text>
                </TouchableOpacity>
            );

            // Botones para las dos páginas posteriores
            for (let i = currentPage + 1; i <= Math.min(totalPages, currentPage + maxNextPages); i++) {
                buttons.push(
                    <TouchableOpacity
                        key={i}
                        style={[styles.pageButton, { backgroundColor: Colors[theme].TabBarBackground }]}
                        onPress={() => fetchFilteredCards(i)}
                    >
                        <Text style={[styles.pageButtonText, { color: Colors[theme].tabIconDefault }]}>{i}</Text>
                    </TouchableOpacity>
                );
            }

            // Espacio entre el botón de la última página y las páginas posteriores
            if (currentPage < totalPages - maxNextPages) {
                buttons.push(
                    <Text key="last-gap" style={[styles.pageButtonText, { color: Colors[theme].tabIconDefault }]}>
                        ...
                    </Text>
                );
            }

            // Botón para ir a la última página (solo si no aparece ya en las páginas posteriores)
            if (currentPage < totalPages - maxNextPages) {
                buttons.push(
                    <TouchableOpacity
                        key="last"
                        style={[styles.pageButton, { backgroundColor: Colors[theme].TabBarBackground }]}
                        onPress={() => fetchFilteredCards(totalPages)}
                    >
                        <Text style={[styles.pageButtonText, { color: Colors[theme].tabIconDefault }]}>
                            {totalPages}
                        </Text>
                    </TouchableOpacity>
                );
            }

            return buttons;
        };

        return (
            <View style={[styles.pagination, { marginBottom: Platform.OS === "web" ? 150 : 100 }]}>
                <Ionicons
                    name="chevron-back"
                    size={24}
                    color={currentPage === 1 ? Colors[theme].disabled : Colors[theme].tint}
                    onPress={() => {
                        if (currentPage > 1) fetchFilteredCards(currentPage - 1);
                    }}
                    style={[styles.paginationIcon, currentPage === 1 && styles.disabledIcon]}
                />
                <View style={styles.pageNumbersContainerCentered}>{renderPageButtons()}</View>
                <Ionicons
                    name="chevron-forward"
                    size={24}
                    color={currentPage === totalPages ? Colors[theme].disabled : Colors[theme].tint}
                    onPress={() => {
                        if (currentPage < totalPages) fetchFilteredCards(currentPage + 1);
                    }}
                    style={[styles.paginationIcon, currentPage === totalPages && styles.disabledIcon]}
                />
            </View>
        );
    };

    return (
        <>
            <View style={[styles.container, { backgroundColor: Colors[theme].background }]}>
                {isEditing ? (
                    <View style={styles.editContainer}>
                        <TextInput
                            style={[
                                styles.editInput,
                                { color: Colors[theme].text, backgroundColor: Colors[theme].TabBarBackground },
                            ]}
                            value={editedName}
                            onChangeText={setEditedName}
                            numberOfLines={1}
                        />
                        <TextInput
                            style={[
                                styles.editTextarea,
                                { color: Colors[theme].text, backgroundColor: Colors[theme].TabBarBackground },
                            ]}
                            value={editedDescription}
                            onChangeText={setEditedDescription}
                            multiline
                        />
                        <TouchableOpacity
                            style={[styles.tickButton, { backgroundColor: Colors[theme].success }]}
                            onPress={handleEditCollection}
                        >
                            <MaterialIcons name="check" size={24} color={Colors[theme].background} />
                        </TouchableOpacity>
                    </View>
                ) : (
                    <>
                        <View style={styles.collectionHeader}>
                            <Ionicons
                                name={collection.type === "collection" ? "bookmark" : "heart"}
                                size={24}
                                color={collection.type === "collection" ? Colors[theme].info : Colors[theme].success}
                            />
                            <Text style={[styles.title, { color: Colors[theme].text }]}>{collection.name}</Text>
                        </View>
                        <Text style={[styles.description, { color: Colors[theme].tabIconDefault }]}>
                            {collection.description}
                        </Text>
                    </>
                )}
                {isLoadingMore ? (
                    <View style={styles.loadingContainer}>
                        <Text style={[styles.loadingText, { color: Colors[theme].text }]}>Loading...</Text>
                    </View>
                ) : (
                    <FlatList
                        data={collection.cards}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item }) =>
                            renderCardItem({
                                item: {
                                    code: item.code,
                                    name: item.name,
                                    color: item.color,
                                    rarity: item.rarity,
                                    images_small: item.images_small,
                                    images_thumb: item.images_thumb,
                                },
                            })
                        }
                        contentContainerStyle={{ gap: 15, padding: 20 }}
                    />
                )}
            </View>
            <Modalize
                ref={modalizeRef}
                closeSnapPointStraightEnabled={false}
                avoidKeyboardLikeIOS={true}
                keyboardAvoidingBehavior={Platform.OS === "ios" ? undefined : "height"}
                modalStyle={{ backgroundColor: Colors[theme].backgroundSoft }}
                velocity={8000}
                threshold={200}
                dragToss={0.01}
                disableScrollIfPossible={true}
                onBackButtonPress={() => isAtTop}
                onOverlayPress={() => isAtTop}
                onClose={async () => {
                    console.log("Modalize onClose triggered");
                    setSearchQuery("");
                    setIsModalOpen(false);

                    const currentCollectionCards = collection.collection_cards.map((c) => c.card_id);
                    const hasChanges =
                        selectedCards.some((cardId) => !currentCollectionCards.includes(cardId)) ||
                        currentCollectionCards.some((cardId) => !selectedCards.includes(cardId));

                    if (hasChanges) {
                        console.log("Changes detected, updating collection...");
                        await handleAddOrRemoveCardsFromCollection(); // Update the collection
                    }

                    await fetchCollection(); // Fetch the updated collection
                }}
                HeaderComponent={
                    <View style={styles.containerModalize}>
                        <View style={styles.searchContainer}>
                            <TextInput
                                style={[
                                    styles.searchInput,
                                    { borderColor: Colors[theme].TabBarBackground, color: Colors[theme].text },
                                ]}
                                placeholder="Search cards"
                                placeholderTextColor={Colors[theme].disabled}
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                            />
                            <TouchableOpacity onPress={toggleFilterVisibility} style={styles.viewModeButton}>
                                <MaterialIcons
                                    name="filter-list"
                                    size={24}
                                    color={filtersVisible ? Colors[theme].info : Colors[theme].text}
                                />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={toggleCardSize} style={styles.viewModeButton} delayPressIn={0}>
                                <MaterialIcons
                                    name={
                                        cardSizeOption === 0
                                            ? "view-module"
                                            : cardSizeOption === 1
                                            ? "view-agenda"
                                            : "view-list"
                                    }
                                    size={24}
                                    color={Colors[theme].text}
                                />
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={{ maxHeight: 500 }} persistentScrollbar={true}>
                            {filtersVisible && (
                                <>
                                    <View style={styles.dropdownContainer}>
                                        <View style={styles.pickerContainer}>
                                            <ThemedText style={[styles.pickerLabel, { color: Colors[theme].text }]}>
                                                Set
                                            </ThemedText>
                                            <DropDownPicker
                                                items={[
                                                    { label: t("all_sets"), value: undefined },
                                                    ...formattedSetNames.map(({ original, formatted }) => ({
                                                        label: formatted,
                                                        value: original,
                                                    })),
                                                ]}
                                                value={selectedSetName ?? null}
                                                setValue={setSelectedSetName}
                                                open={openSetNameDropdown}
                                                setOpen={setOpenSetNameDropdown}
                                                style={[
                                                    styles.picker,
                                                    {
                                                        backgroundColor: Colors[theme].TabBarBackground,
                                                        borderColor: Colors[theme].info,
                                                    },
                                                ]}
                                                labelStyle={{ color: Colors[theme].text }}
                                                placeholder={t("select_set")}
                                                placeholderStyle={{ color: Colors[theme].tabIconDefault }}
                                                searchable={true}
                                                searchPlaceholder={t("search_set")}
                                            />
                                        </View>
                                        <View style={styles.pickerContainer}>
                                            <ThemedText style={[styles.pickerLabel, { color: Colors[theme].text }]}>
                                                {t("family")}
                                            </ThemedText>
                                            <DropDownPicker
                                                items={[
                                                    { label: t("all_families"), value: undefined },
                                                    ...families.sort().map((family) => ({
                                                        label: family,
                                                        value: family,
                                                    })),
                                                ]}
                                                value={selectedFamily ?? null}
                                                setValue={setSelectedFamily}
                                                open={openFamilyDropdown}
                                                setOpen={setOpenFamilyDropdown}
                                                style={[
                                                    styles.picker,
                                                    {
                                                        backgroundColor: Colors[theme].TabBarBackground,
                                                        borderColor: Colors[theme].info,
                                                    },
                                                ]}
                                                labelStyle={{ color: Colors[theme].text }}
                                                placeholder={t("select_family")}
                                                placeholderStyle={{ color: Colors[theme].tabIconDefault }}
                                                searchable={true}
                                                searchPlaceholder={t("search_family")}
                                            />
                                        </View>
                                    </View>
                                    <ThemedText
                                        type="subtitle"
                                        style={{
                                            textAlign: "center",
                                            marginBottom: 5,
                                        }}
                                    >
                                        {t("type")}
                                    </ThemedText>
                                    <View style={styles.filtersContainer}>
                                        {["CHARACTER", "EVENT", "STAGE", "LEADER"].map((type) => (
                                            <TouchableOpacity
                                                key={type}
                                                style={[
                                                    styles.typeButton,
                                                    selectedTypes.includes(type)
                                                        ? {
                                                              backgroundColor: Colors[theme].icon,
                                                          }
                                                        : {
                                                              backgroundColor: Colors[theme].disabled,
                                                          },
                                                ]}
                                                onPress={() => toggleTypeSelection(type)}
                                            >
                                                <ThemedText
                                                    style={[
                                                        styles.typeButtonText,
                                                        {
                                                            color: Colors[theme].background,
                                                        },
                                                    ]}
                                                >
                                                    {type}
                                                </ThemedText>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </>
                            )}
                            {filtersVisible && (
                                <>
                                    <ThemedText
                                        type="subtitle"
                                        style={{
                                            textAlign: "center",
                                            marginBottom: 5,
                                        }}
                                    >
                                        {" "}
                                        {t("family")}
                                    </ThemedText>
                                    {/* <ScrollView
                                        horizontal
                                        showsHorizontalScrollIndicator={false}
                                        contentContainerStyle={{
                                            paddingHorizontal: 10,
                                            paddingBottom: 10,
                                            alignItems: "center",
                                            justifyContent: "center",
                                            width: "100%",
                                        }}
                                        style={{ maxHeight: 50 }}
                                    >
                                        {Array.from(
                                            new Set([
                                                ...leaderCardFamilies,
                                                mostRepresentedFamily ?? mostRepresentedFamily,
                                            ])
                                        ).map((family) => (
                                            <TouchableOpacity
                                                key={family}
                                                style={[
                                                    styles.typeButton,
                                                    selectedFamilies.includes(family)
                                                        ? {
                                                                backgroundColor: Colors[theme].icon,
                                                            }
                                                        : {
                                                                backgroundColor: Colors[theme].disabled,
                                                            },
                                                ]}
                                                onPress={() => toggleFamilySelection(family)}
                                            >
                                                <ThemedText
                                                    style={[
                                                        styles.typeButtonText,
                                                        {
                                                            color: Colors[theme].background,
                                                        },
                                                    ]}
                                                >
                                                    {family}
                                                </ThemedText>
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>  */}
                                    <TriggerFilter triggerFilter={triggerFilter} onToggle={handleTriggerFilterToggle} />
                                </>
                            )}
                            {filtersVisible && (
                                <View style={{ marginTop: 10 }}>
                                    <FilterSlider
                                        label="Cost"
                                        min={0}
                                        max={10}
                                        step={1}
                                        onValuesChangeFinish={(values) => setCostRange(values as [number, number])}
                                        range={costRange}
                                    />
                                    <FilterSlider
                                        label="Power"
                                        min={0}
                                        max={13000}
                                        step={1000}
                                        onValuesChangeFinish={(values) => setPowerRange(values as [number, number])}
                                        range={powerRange}
                                    />
                                    <FilterSlider
                                        label="Counter"
                                        min={0}
                                        max={2000}
                                        step={1000}
                                        onValuesChangeFinish={(values) => setCounterRange(values as [number, number])}
                                        range={counterRange}
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
                                </View>
                            )}
                        </ScrollView>
                        <LinearGradient
                            colors={["transparent", "rgba(0,0,0,0.1)"]}
                            style={{
                                position: "absolute",
                                bottom: 0,
                                left: 0,
                                right: 0,
                                height: 20,
                            }}
                        />
                    </View>
                }
                childrenStyle={{
                    padding: 10,
                    // cualquier otro estilo específico para la FlatList
                }}
                FooterComponent={<PaginationControls />}
                flatListProps={{
                    data: filteredCards,
                    keyExtractor: (item) => item.id,
                    renderItem: ({ item: card }) => (
                        <CardItem
                            card={card}
                            height={height}
                            cardSizeOption={cardSizeOption}
                            imageStyle={imageStyle}
                            theme={theme}
                            styles={styles}
                            handleCardClick={handleCardClick}
                            selectedCards={selectedCards} // Pass selectedCards to CardItem
                            collectionCards={collection.collection_cards.map((c) => c.card_id)} // Pass existing collection cards
                        />
                    ),
                    contentContainerStyle: [styles.cardList],
                    keyboardShouldPersistTaps: "handled",
                    showsVerticalScrollIndicator: true,
                    nestedScrollEnabled: true,
                    // Elimina el comportamiento de avanzar automáticamente al final de la página
                    onEndReached: null,
                    onEndReachedThreshold: null,
                    onScroll: handleScroll, // Detecta el desplazamiento
                    scrollEventThrottle: 16, // Optimiza el rendimiento del scroll
                }}
            />
            <Modal
                visible={isDeleteModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setIsDeleteModalVisible(false)}
            >
                <TouchableOpacity
                    style={{
                        flex: 1,
                        justifyContent: "center",
                        alignItems: "center",
                        backgroundColor: "rgba(0, 0, 0, 0.5)",
                    }}
                    activeOpacity={1}
                    onPressOut={() => setIsDeleteModalVisible(false)}
                >
                    <View
                        style={{
                            width: "80%",
                            borderRadius: 10,
                            padding: 20,
                            backgroundColor: Colors[theme].backgroundSoft,
                            alignItems: "center",
                        }}
                    >
                        <Text style={{ fontSize: 18, marginBottom: 10, textAlign: "center" }}>
                            Are you sure you want to delete this collection?
                        </Text>
                        <View style={{ flexDirection: "row", justifyContent: "space-between", width: "100%" }}>
                            <TouchableOpacity
                                style={{
                                    flex: 1,
                                    marginHorizontal: 5,
                                    paddingVertical: 10,
                                    borderRadius: 5,
                                    alignItems: "center",
                                    backgroundColor: Colors[theme].error,
                                }}
                                onPress={() => setIsDeleteModalVisible(false)}
                            >
                                <Text style={{ color: Colors[theme].text }}>No</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={{
                                    flex: 1,
                                    marginHorizontal: 5,
                                    paddingVertical: 10,
                                    borderRadius: 5,
                                    alignItems: "center",
                                    backgroundColor: Colors[theme].success,
                                }}
                                onPress={() => {
                                    handleDeleteCollection();
                                    setIsDeleteModalVisible(false);
                                }}
                            >
                                <Text style={{ color: Colors[theme].text }}>Yes</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </TouchableOpacity>
            </Modal>
            <Modal
                visible={isImageModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setIsImageModalVisible(false)}
            >
                <TouchableOpacity
                    style={{
                        flex: 1,
                        justifyContent: "center",
                        alignItems: "center",
                        backgroundColor: "rgba(0, 0, 0, 0.5)",
                    }}
                    activeOpacity={1}
                    onPressOut={() => setIsImageModalVisible(false)}
                >
                    <View
                        style={{
                            width: "80%",
                            borderRadius: 10,
                            padding: 20,
                            backgroundColor: Colors[theme].backgroundSoft,
                            alignItems: "center",
                        }}
                    >
                        {selectedImage && (
                            <ExpoImage
                                source={{ uri: selectedImage }}
                                style={{ width: 200, height: 300, marginBottom: 20 }}
                                contentFit="contain"
                            />
                        )}
                        <TouchableOpacity
                            style={{
                                paddingVertical: 10,
                                paddingHorizontal: 20,
                                borderRadius: 5,
                                backgroundColor: Colors[theme].info,
                            }}
                            onPress={() => setIsImageModalVisible(false)}
                        >
                            <Text style={{ color: Colors[theme].background, fontWeight: "bold" }}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>
        </>
    );
};

const CardItem = ({
    card,
    height,
    cardSizeOption,
    imageStyle,
    theme,
    styles,
    handleCardClick,
    selectedCards, // Pass selectedCards as a prop
}: {
    card: {
        id: string;
        code: string;
        rarity: string;
        set_name: string;
        type: string;
        images_small: string;
        images_thumb: string;
        name: string;
    };
    height: number;
    cardSizeOption: number;
    imageStyle: object;
    theme: "light" | "dark";
    styles: any;
    handleCardClick: (id: string) => void;
    selectedCards: string[]; // Add selectedCards type
    collectionCards: string[]; // Add collectionCards type
}) => {
    const [imageLoaded, setImageLoaded] = useState(false);
    const isSelected = selectedCards.includes(card.id); // Check if the card is selected

    return (
        <TouchableOpacity onPress={() => handleCardClick(card.id)} key={card.id}>
            <View
                style={[
                    styles.cardContainerSearch,
                    { height },
                    cardSizeOption === 2 && [
                        styles.detailedCardContainer,
                        {
                            backgroundColor: Colors[theme].TabBarBackground,
                        },
                    ],
                    isSelected && { borderWidth: 4, borderRadius: 10, borderColor: Colors[theme].success }, // Highlight selected card
                ]}
            >
                <View style={{ position: "relative" }}>
                    <ExpoImage
                        source={{ uri: card.images_thumb }}
                        placeholder={require("@/assets/images/card_placeholder.webp")}
                        style={[styles.cardImage, imageStyle]}
                        contentFit="contain"
                        cachePolicy="memory-disk"
                        onLoadEnd={() => setImageLoaded(true)}
                    />
                    {!imageLoaded && (
                        <View
                            style={{
                                position: "absolute",
                                bottom: 5,
                                left: 0,
                                right: 0,
                                justifyContent: "flex-end",
                                alignItems: "center",
                                paddingHorizontal: 8,
                            }}
                        >
                            <Text
                                style={{
                                    color: Colors[theme].tabIconDefault,
                                    fontWeight: "bold",
                                    fontSize: 14,
                                    textAlign: "center",
                                }}
                            >
                                {card.code}
                            </Text>
                        </View>
                    )}
                </View>

                {cardSizeOption === 2 && (
                    <View style={styles.cardDetailsModalize}>
                        <View
                            style={[
                                styles.cardRarityContainer,
                                {
                                    backgroundColor: Colors[theme].background,
                                },
                            ]}
                        >
                            <ThemedText
                                style={[
                                    styles.cardRarity,
                                    {
                                        color: Colors[theme].icon,
                                    },
                                ]}
                            >
                                {card.rarity}
                            </ThemedText>
                        </View>
                        <View style={styles.cardHeader}>
                            <ThemedText style={styles.cardName} numberOfLines={1} ellipsizeMode="tail">
                                {card.name}
                            </ThemedText>
                            <ThemedText style={styles.cardCode}>{card.code}</ThemedText>
                        </View>
                        <View style={styles.cardFooter}>
                            <ThemedText
                                style={[
                                    styles.cardType,
                                    {
                                        color: Colors[theme].tabIconDefault,
                                    },
                                ]}
                                numberOfLines={1}
                            >
                                {card.type}
                            </ThemedText>
                            <ThemedText
                                style={[
                                    styles.cardSet,
                                    {
                                        color: Colors[theme].tabIconDefault,
                                    },
                                ]}
                                numberOfLines={1}
                            >
                                {card.set_name}
                            </ThemedText>
                        </View>
                    </View>
                )}
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        paddingBottom: 100,
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        textAlign: "center", // Center the title theme color for text
    },
    description: {
        fontSize: 16,
        marginBottom: 16,
        textAlign: "center", // Center the descriptionse theme color for soft text
    },
    cardContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        padding: 15,
        borderRadius: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 }, // Slightly deeper shadow
        shadowOpacity: 0.15, // Increase shadow opacity
        shadowRadius: 6, // Increase shadow radius
        elevation: 3, // Enhance elevation for Android
    },
    cardDetails: {
        flex: 1,
    },
    cardDetailsModalize: {
        flex: 1,
        paddingHorizontal: 16,
        height: "100%",
        justifyContent: "space-around",
    },
    cardCode: {
        fontSize: 14,
        fontWeight: "bold",
    },
    cardName: {
        fontSize: 12,
    },
    cardColors: {
        flexDirection: "row",
        marginHorizontal: 10,
    },
    colorCircle: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginHorizontal: 2,
    },
    cardRarity: {
        fontSize: 12,
        fontWeight: "bold",
    },
    editContainer: {
        width: "100%",
        paddingHorizontal: 10,
        alignItems: "center",
        paddingTop: 20,
    },
    editInput: {
        fontSize: 24,
        fontWeight: "bold",
        textAlign: "center",
        marginBottom: 20,
        borderWidth: 1,
        borderColor: "#ccc",
        paddingVertical: 8,
        paddingHorizontal: 10,
        width: "90%",
        maxWidth: 500,
        borderRadius: 5,
    },
    editTextarea: {
        fontSize: 16,
        textAlignVertical: "top", // Key for multiline
        marginBottom: 20,
        borderWidth: 1,
        borderColor: "#ccc",
        padding: 10,
        borderRadius: 5,
        width: "90%",
        maxWidth: 500,
        height: 120,
    },
    tickButton: {
        position: "absolute",
        bottom: 10,
        right: 10,
        padding: 10,
        borderRadius: 5,
        justifyContent: "center",
        alignItems: "center",
    },
    modalizeContainer: {
        padding: 16,
    },
    typeButton: {
        paddingVertical: 5,
        paddingHorizontal: 10,
        borderRadius: 5,
        marginHorizontal: 5,
    },
    typeButtonText: {
        fontWeight: "bold",
    },
    searchInput: {
        flex: 1,
        height: 40,
        borderWidth: 1,
        paddingHorizontal: 8,
        borderRadius: 4,
    },
    viewModeButton: {
        marginLeft: 10,
    },
    smallCard: {
        width: 97,
        height: 137,
    },
    largeCard: {
        width: 134,
        height: 191,
    },
    cardContainerModalize: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        padding: 10,
        marginVertical: 5,
        borderRadius: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    cardNameModalize: {
        fontSize: 16,
        fontWeight: "bold",
    },
    cardCodeModalize: {
        fontSize: 14,
    },
    cardImage: {
        width: 100,
        height: 140,
        borderRadius: 5,
    },
    cardContainerSearch: {
        alignItems: "center",
        overflow: "hidden",
        marginBottom: 15,
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
    cardImageSearch: {
        marginHorizontal: 4,
        borderRadius: 5,
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

    cardHeader: {},

    cardFooter: {},

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

    filtersContainer: {
        flexDirection: "row",
        justifyContent: "center",
        marginBottom: 10,
    },

    searchContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 10,
    },
    containerModalize: {
        paddingTop: 15,
        paddingHorizontal: 10,
        // marginBottom: 65,
        display: "flex",
    },
    cardList: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-evenly",
    },
    dropdownContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 10,
    },
    pickerContainer: {
        flex: 1,
        marginHorizontal: 5,
    },
    pickerLabel: {
        fontSize: 16,
        fontWeight: "bold",
        marginBottom: 5,
        textAlign: "center",
    },
    picker: {
        height: 50,
        borderWidth: 2,
        borderRadius: 8,
    },
    pagination: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 5,
    },
    paginationIcon: {
        padding: 10,
    },
    disabledIcon: {
        opacity: 0.5,
    },
    pageNumbersContainerCentered: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 5,
    },
    pageButton: {
        borderRadius: 20,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        height: 34,
        width: 34,
        alignItems: "center",
        justifyContent: "center",
    },
    pageButtonText: {
        fontSize: 14,
        fontWeight: "bold",
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    loadingText: {
        fontSize: 18,
        fontWeight: "bold",
    },
    collectionHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        marginVertical: 20,
    },
});

export default CollectionDetails;
