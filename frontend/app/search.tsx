import React, { useState, useEffect, useRef, useCallback } from "react";
import {
    View,
    TextInput,
    FlatList,
    Image,
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
import { MaterialIcons, FontAwesome } from "@expo/vector-icons";
import { debounce } from "lodash";
import { useTranslation } from "react-i18next";
import useColorCombination from "@/hooks/useColorCombination";
import { Modalize } from "react-native-modalize";
import MultiSlider from "@ptomasroos/react-native-multi-slider";
import FilterSlider from "@/components/FilterSlider";
import { Portal } from "react-native-paper";
import { Picker } from "@react-native-picker/picker";
import useFormattedSetNames from "@/hooks/useFormattedSetNames";
import DropDownPicker from "react-native-dropdown-picker";
import { Animated, Easing } from "react-native";
import { ScrollView } from "react-native-gesture-handler";

interface Card {
    id: string;
    code: string;
    images_small: string;
    name: string;
    set_name: string;
    type: string;
    rarity: string;
}

const abilityColorMap: { [key: string]: string } = {
    "[Blocker]": "#d67e1a", // Ejemplo de color para Blocker
    "[Activate: Main]": "#2677A7",
    "[On Play]": "#2677A7",
    "[Rush]": "#d67e1a",
    "[Main]": "#2677A7",
    "[Once Per Turn]": "#e6006b",
    "[When Attacking]": "#2677A7",
    "[Opponent's Turn]": "#2677A7",
    "[On K.O.]": "#2677A7",
    "[Your Turn]": "#196b9b",
    "[On Your Opponent's Attack]": "#186a99",
    "[Counter]": "#BC0110",
};

export default function SearchScreen() {
    const { theme } = useTheme();
    const api = useApi();
    const [searchQuery, setSearchQuery] = useState("");
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
    const { getColorCombination } = useColorCombination();
    const [selectedColors, setSelectedColors] = useState<string[]>([]);
    const modalizeRef = useRef<Modalize>(null);
    const [costRange, setCostRange] = useState<[number, number]>([0, 10]);
    const [powerRange, setPowerRange] = useState<[number, number]>([0, 13000]);
    const [counterRange, setCounterRange] = useState<[number, number]>([0, 2000]);
    const [setNames, setSetNames] = useState<string[]>([]);
    const [families, setFamilies] = useState<string[]>([]);
    const [selectedSet, setSelectedSet] = useState<string | null>(null);
    const [selectedFamily, setSelectedFamily] = useState<string | null>(null);
    const [openSet, setOpenSet] = useState(false);
    const [openFamily, setOpenFamily] = useState(false);
    const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
    const [selectedRarities, setSelectedRarities] = useState<string[]>([]);
    const [triggerFilter, setTriggerFilter] = useState(false);
    const [abilityFilters, setAbilityFilters] = useState<string[]>([]);
    const [isAbilityAccordionOpen, setIsAbilityAccordionOpen] = useState(false);
    const abilityAccordionHeight = useRef(new Animated.Value(0)).current;
    const scrollViewRef = useRef<ScrollView>(null);

    DropDownPicker.setListMode("MODAL");

    const formattedSetNames = useFormattedSetNames(setNames);

    // Método de debounce para manejar la búsqueda
    const debouncedSearch = useCallback(
        debounce(async (query: string) => {
            setLoading(true);
            setPage(1); // Resetear la página para nuevas búsquedas
            setHasMore(true);
            await fetchCards(query, 1);
        }, 300),
        []
    );

    // Manejamos el campo de búsqueda fuera de useEffect
    const handleSearchChange = (text: string) => {
        setSearchQuery(text);
        setPage(1);
        setHasMore(true);
        fetchCards(text, 1);
    };

    useEffect(() => {
        fetchCards(); // Ejecuta la búsqueda al montar el componente
    }, []);

    useEffect(() => {
        // Reseteamos el estado de scroll cuando la búsqueda cambia
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
            let colorQuery = "";
            if (selectedColors.length === 1) {
                colorQuery = `&color=${selectedColors[0]}`;
            } else if (selectedColors.length === 2) {
                const colorCombination = getColorCombination(selectedColors);
                colorQuery = `&color=${colorCombination}`;
            }

            const transformCounterValue = (value: number) => (value === 0 ? "-" : value.toString());

            const setNameQuery = selectedSet ? `&set_name=${encodeURIComponent(selectedSet)}` : "";
            const setFamilyQuery = selectedFamily ? `&family=${encodeURIComponent(selectedFamily)}` : "";
            const typeQuery = selectedTypes.length > 0 ? `&type=${selectedTypes.join(",")}` : "";
            const rarityQuery = selectedRarities.length > 0 ? `&rarity=${selectedRarities.join(",")}` : "";
            const triggerQuery = triggerFilter ? `&trigger=true` : "";
            const abilityQuery = abilityFilters.length > 0 ? `&ability=${abilityFilters.join(",")}` : "";

            const response = await api.get(
                `/cards?search=${query}&page=${page}${colorQuery}${setNameQuery}${setFamilyQuery}${typeQuery}${rarityQuery}${triggerQuery}${abilityQuery}&cost_gte=${
                    costRange[0]
                }&cost_lte=${costRange[1]}&power_gte=${powerRange[0]}&power_lte=${
                    powerRange[1]
                }&counter_gte=${transformCounterValue(counterRange[0])}&counter_lte=${transformCounterValue(
                    counterRange[1]
                )}`
            );

            if (page === 1) {
                setCards(response.data.data);
                setInitialLoading(false);
            } else {
                setCards((prevCards) => [...prevCards, ...response.data.data]);
            }

            setPage(page + 1);
            setHasMore(response.data.data.length > 0);

            const isBase =
                !query &&
                !colorQuery &&
                !setNameQuery &&
                !setFamilyQuery &&
                !typeQuery &&
                !rarityQuery &&
                !triggerQuery &&
                !abilityQuery &&
                costRange[0] === 0 &&
                costRange[1] === 10 &&
                powerRange[0] === 0 &&
                powerRange[1] === 13000 &&
                counterRange[0] === 0 &&
                counterRange[1] === 2000;
            setIsBaseRoute(isBase);
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

    const handleColorSelect = (color: string) => {
        setSelectedColors((prevColors) => {
            if (prevColors.includes(color)) {
                return prevColors.filter((c) => c !== color);
            } else if (prevColors.length < 2) {
                return [...prevColors, color];
            }
            return prevColors;
        });
    };

    const handleTypeSelect = (type: string) => {
        setSelectedTypes((prevTypes) => {
            if (prevTypes.includes(type)) {
                return prevTypes.filter((t) => t !== type);
            } else {
                return [...prevTypes, type];
            }
        });
    };

    const handleRaritySelect = (rarity: string) => {
        setSelectedRarities((prevRarities) => {
            if (prevRarities.includes(rarity)) {
                return prevRarities.filter((r) => r !== rarity);
            } else {
                return [...prevRarities, rarity];
            }
        });
    };

    const handleTriggerFilterToggle = () => {
        setTriggerFilter((prev) => !prev);
    };

    const handleAbilityFilterToggle = (ability: string) => {
        setAbilityFilters((prevFilters) => {
            if (prevFilters.includes(ability)) {
                return prevFilters.filter((a) => a !== ability);
            } else {
                return [...prevFilters, ability];
            }
        });
    };
    const toggleAbilityAccordion = () => {
        const newValue = !isAbilityAccordionOpen;
        setIsAbilityAccordionOpen(newValue);

        Animated.timing(abilityAccordionHeight, {
            toValue: newValue ? 300 : 0, // Ajusta la altura al abrir/cerrar
            duration: 300,
            easing: Easing.linear,
            useNativeDriver: false,
        }).start(() => {
            if (newValue) {
                // Desplazar la pantalla hacia abajo cuando se abre el acordeón
                scrollViewRef.current?.scrollToEnd({ animated: true });
            }
        });
    };

    const capitalizeFirstLetter = (string: string) => {
        return string.charAt(0).toUpperCase() + string.slice(1);
    };

    useEffect(() => {
        if (!initialLoading) {
            setPage(1); // Resetear la página para nuevas búsquedas
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

    const [filtersCleared, setFiltersCleared] = useState(false);

    const clearAllFilters = () => {
        setSearchQuery("");
        setSelectedColors([]);
        setSelectedSet(null);
        setSelectedFamily(null);
        setSelectedTypes([]);
        setSelectedRarities([]);
        setTriggerFilter(false);
        setAbilityFilters([]);
        setCostRange([0, 10]);
        setPowerRange([0, 13000]);
        setCounterRange([0, 2000]);
        setPage(1);
        setHasMore(true);

        // Indicar que se han limpiado los filtros
        setFiltersCleared(true);
    };

    // Ejecutar fetchCards cuando filtersCleared sea true
    useEffect(() => {
        if (filtersCleared) {
            fetchCards("", 1);
            setFiltersCleared(false); // Resetear el estado después de la ejecución
        }
    }, [filtersCleared]);

    const screenHeight = Dimensions.get("window").height;

    return (
        <View style={[styles.container, { backgroundColor: Colors[theme].background }]}>
            {/* Barra de búsqueda */}
            <View style={styles.headerContainer}>
                <TouchableOpacity onPress={() => router.push("/")} style={styles.backButton}>
                    <MaterialIcons name="arrow-back" size={24} color={Colors[theme].text} />
                </TouchableOpacity>
                <TextInput
                    ref={searchInputRef}
                    style={[styles.searchBar, { color: Colors[theme].text }]}
                    placeholder={t("search_cards")}
                    placeholderTextColor={Colors[theme].icon}
                    value={searchQuery}
                    onChangeText={handleSearchChange}
                    autoCorrect={false}
                />

                {!isBaseRoute && (
                    <TouchableOpacity onPress={clearAllFilters}>
                        <MaterialIcons name="close" size={24} color={Colors[theme].close} />
                    </TouchableOpacity>
                )}

                <TouchableOpacity onPress={openFilterModal} style={styles.filterButton}>
                    <MaterialIcons name="filter-list" size={24} color={Colors[theme].highlight} />
                </TouchableOpacity>
                <TouchableOpacity onPress={toggleCardSize} style={styles.cardSizeToggle}>
                    <MaterialIcons
                        name={cardSizeOption === 0 ? "view-module" : cardSizeOption === 1 ? "view-agenda" : "view-list"}
                        size={24}
                        color={Colors[theme].text}
                    />
                </TouchableOpacity>
            </View>

            {/* Filtros de colores */}
            <View style={styles.colorFilters}>
                {["blue", "red", "green", "yellow", "purple", "black"].map((color) => (
                    <TouchableOpacity
                        key={color}
                        style={[
                            styles.colorCircleContainer,
                            { borderColor: Colors[theme].icon },
                            selectedColors.includes(capitalizeFirstLetter(color))
                                ? [styles.selectedColorCircle, { borderColor: Colors[theme].text }]
                                : "",
                        ]}
                        onPress={() => handleColorSelect(capitalizeFirstLetter(color))}
                    >
                        <View style={[styles.colorCircle, { backgroundColor: color }]} />
                    </TouchableOpacity>
                ))}
            </View>

            {initialLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={Colors[theme].text} />
                </View>
            ) : (
                <FlatList
                    data={cards}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <TouchableOpacity onPress={() => handleCardPress(item)}>
                            <View
                                style={[
                                    styles.cardContainer,
                                    cardSizeOption === 2 && [
                                        styles.detailedCardContainer,
                                        { backgroundColor: Colors[theme].TabBarBackground },
                                    ],
                                ]}
                            >
                                <Image
                                    source={{ uri: item.images_small }}
                                    style={[
                                        styles.cardImage,
                                        cardSizeOption === 0
                                            ? styles.smallCard
                                            : cardSizeOption === 1
                                            ? styles.largeCard
                                            : styles.smallCard,
                                    ]}
                                />
                                {cardSizeOption === 2 && (
                                    <View style={styles.cardDetails}>
                                        <View style={[styles.cardRarityContainer, { backgroundColor: Colors[theme].background}]}>
                                            <ThemedText style={[styles.cardRarity, { color: Colors[theme].icon }]}>
                                                {item.rarity}
                                            </ThemedText>
                                        </View>
                                        <View style={styles.cardHeader}>
                                            <ThemedText style={styles.cardName} numberOfLines={1} ellipsizeMode="tail">
                                                {item.name}
                                            </ThemedText>
                                            <ThemedText style={styles.cardCode}>{item.code}</ThemedText>
                                        </View>
                                        <View style={styles.cardFooter}>
                                            <ThemedText style={[styles.cardType, { color: Colors[theme].icon }]}>
                                                {item.type}
                                            </ThemedText>
                                            <ThemedText style={[styles.cardSet, { color: Colors[theme].icon }]}>
                                                {item.set_name}
                                            </ThemedText>
                                        </View>
                                    </View>
                                )}
                            </View>
                        </TouchableOpacity>
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

            {/* Indicador de carga flotante */}
            {loading && (
                <View style={styles.absoluteLoader}>
                    <ActivityIndicator size="large" color={Colors[theme].text} />
                </View>
            )}

            {/* Modal de filtros */}
            <Modalize ref={modalizeRef} adjustToContentHeight>
                <ScrollView ref={scrollViewRef}>
                    <View style={[styles.modalContent, { backgroundColor: Colors[theme].TabBarBackground }]}>
                        <View style={styles.dropdownsContainer}>
                            <View style={styles.pickerContainer}>
                                <ThemedText style={[styles.pickerLabel, { color: Colors[theme].text }]}>Set</ThemedText>
                                <DropDownPicker
                                    items={[
                                        { label: t("all_sets"), value: undefined },
                                        ...formattedSetNames.map(({ original, formatted }) => ({
                                            label: formatted,
                                            value: original,
                                        })),
                                    ]}
                                    value={selectedSet}
                                    setValue={setSelectedSet}
                                    onChangeValue={(value) => setSelectedSet(value)}
                                    style={[styles.picker, { backgroundColor: Colors[theme].background }]}
                                    labelStyle={{ color: Colors[theme].text }}
                                    selectedItemLabelStyle={{ fontWeight: "bold" }}
                                    placeholder={t("select_set")}
                                    placeholderStyle={{ color: Colors[theme].text }}
                                    searchable={true}
                                    searchPlaceholder={t("search_set")}
                                    multiple={false}
                                    open={openSet}
                                    setOpen={setOpenSet}
                                    modalProps={{
                                        animationType: "slide",
                                    }}
                                    modalContentContainerStyle={{
                                        padding: 10,
                                        shadowColor: Colors[theme].background,
                                    }}
                                />
                            </View>
                            <View style={styles.pickerContainer}>
                                <ThemedText style={[styles.pickerLabel, { color: Colors[theme].text }]}>
                                    {t("family")}
                                </ThemedText>
                                <DropDownPicker
                                    items={[
                                        { label: t("all_families"), value: undefined },
                                        ...families.map((family) => ({
                                            label: family,
                                            value: family,
                                        })),
                                    ]}
                                    value={selectedFamily}
                                    setValue={setSelectedFamily}
                                    onChangeValue={(value) => setSelectedFamily(value)}
                                    style={[styles.picker, { backgroundColor: Colors[theme].background }]}
                                    labelStyle={{ color: Colors[theme].text }}
                                    selectedItemLabelStyle={{ fontWeight: "bold" }}
                                    placeholder={t("select_family")}
                                    placeholderStyle={{ color: Colors[theme].text }}
                                    searchable={true}
                                    searchPlaceholder={t("search_family")}
                                    multiple={false}
                                    open={openFamily}
                                    setOpen={setOpenFamily}
                                    modalProps={{
                                        animationType: "slide",
                                    }}
                                    modalContentContainerStyle={{
                                        padding: 10,
                                        shadowColor: Colors[theme].background,
                                    }}
                                />
                            </View>
                        </View>

                        <View style={styles.triggerFilterContainer}>
                            <TouchableOpacity
                                style={[
                                    styles.triggerButton,
                                    {
                                        backgroundColor: triggerFilter
                                            ? Colors[theme].triggerActive
                                            : Colors[theme].triggerInactive,
                                    },
                                ]}
                                onPress={handleTriggerFilterToggle}
                            >
                                <ThemedText
                                    style={[
                                        styles.triggerButtonText,
                                        {
                                            color: triggerFilter
                                                ? Colors[theme].triggerActiveText
                                                : Colors[theme].triggerInactiveText,
                                        },
                                    ]}
                                >
                                    Trigger
                                </ThemedText>
                            </TouchableOpacity>
                        </View>
                        <View style={[styles.separator, { backgroundColor: Colors[theme].icon }]} />
                        <ThemedText style={styles.label}>
                            {t("rarity")}{" "}
                            <ThemedText style={{ color: Colors[theme].icon }}>
                                ({selectedRarities.length ? selectedRarities.length : t("all_f")})
                            </ThemedText>
                        </ThemedText>
                        <View style={styles.rarityFilters}>
                            {["C", "UC", "R", "SR", "L", "P", "SEC", "TR"].map((rarity) => (
                                <TouchableOpacity
                                    key={rarity}
                                    style={[
                                        styles.rarityButton,
                                        selectedRarities.includes(rarity)
                                            ? { backgroundColor: Colors[theme].icon }
                                            : { backgroundColor: Colors[theme].disabled },
                                    ]}
                                    onPress={() => handleRaritySelect(rarity)}
                                >
                                    <ThemedText style={[styles.rarityButtonText, { color: Colors[theme].background }]}>
                                        {rarity}
                                    </ThemedText>
                                </TouchableOpacity>
                            ))}
                        </View>
                        <View style={[styles.separator, { backgroundColor: Colors[theme].icon }]} />
                        <ThemedText style={styles.label}>
                            {t("type")}{" "}
                            <ThemedText style={{ color: Colors[theme].icon }}>
                                ({selectedTypes.length ? selectedTypes.length : t("all_m")})
                            </ThemedText>
                        </ThemedText>
                        <View style={styles.typeFilters}>
                            {["LEADER", "CHARACTER", "EVENT", "STAGE"].map((type) => (
                                <TouchableOpacity
                                    key={type}
                                    style={[
                                        styles.typeButton,
                                        selectedTypes.includes(type)
                                            ? { backgroundColor: Colors[theme].icon }
                                            : { backgroundColor: Colors[theme].disabled },
                                    ]}
                                    onPress={() => handleTypeSelect(type)}
                                >
                                    <ThemedText style={[styles.typeButtonText, { color: Colors[theme].background }]}>
                                        {type}
                                    </ThemedText>
                                </TouchableOpacity>
                            ))}
                        </View>
                        <View style={[styles.separator, { backgroundColor: Colors[theme].icon }]} />
                        <FilterSlider
                            label="Cost"
                            range={costRange}
                            min={0}
                            max={10}
                            step={1}
                            onValuesChangeFinish={(values) => setCostRange(values as [number, number])}
                        />
                        {/* Separator */}
                        <View style={[styles.separator, { backgroundColor: Colors[theme].icon }]} />
                        <FilterSlider
                            label="Power"
                            range={powerRange}
                            min={0}
                            max={13000}
                            step={1000}
                            onValuesChangeFinish={(values) => setPowerRange(values as [number, number])}
                        />
                        {/* Separator */}
                        <View style={[styles.separator, { backgroundColor: Colors[theme].icon }]} />
                        <FilterSlider
                            label="Counter"
                            range={counterRange}
                            min={0}
                            max={2000}
                            step={1000}
                            onValuesChangeFinish={(values) => setCounterRange(values as [number, number])}
                        />
                        <TouchableOpacity
                            onPress={toggleAbilityAccordion}
                            style={[styles.accordionHeader, { backgroundColor: Colors[theme].background }]}
                        >
                            <View style={styles.abilityHeader}>
                                <ThemedText style={[styles.accordionHeaderText, { color: Colors[theme].text }]}>
                                    Ability
                                </ThemedText>
                                <MaterialIcons
                                    name={isAbilityAccordionOpen ? "expand-less" : "expand-more"}
                                    size={24}
                                    color={Colors[theme].text}
                                />
                            </View>
                            {abilityFilters.length > 0 && (
                                <TouchableOpacity
                                    onPress={() => setAbilityFilters([])}
                                    style={[styles.clearButton, { backgroundColor: Colors[theme].TabBarBackground }]}
                                >
                                    <ThemedText style={[styles.abilityCount, { color: Colors[theme].text }]}>
                                        {abilityFilters.length}
                                    </ThemedText>
                                    <MaterialIcons name="close" size={16} color={Colors[theme].text} />
                                </TouchableOpacity>
                            )}
                        </TouchableOpacity>

                        <Animated.View style={{ height: abilityAccordionHeight, overflow: "hidden" }}>
                            <View style={styles.abilityFilters}>
                                {[
                                    "[Blocker]",
                                    "[Activate: Main]",
                                    "[On Play]",
                                    "[Rush]",
                                    "[Main]",
                                    "[Once Per Turn]",
                                    "[When Attacking]",
                                    "[Opponent's Turn]",
                                    "[On K.O.]",
                                    "[Your Turn]",
                                    "[On Your Opponent's Attack]",
                                    "[Counter]",
                                ].map((ability) => {
                                    const abilityColor = abilityColorMap[ability]; // Obtiene el color de fondo basado en la habilidad

                                    return (
                                        <TouchableOpacity
                                            key={ability}
                                            style={[
                                                styles.abilityButton,
                                                abilityFilters.includes(ability)
                                                    ? { backgroundColor: abilityColor } // Usamos el color de la habilidad cuando está clicado
                                                    : {
                                                          backgroundColor: abilityColor,
                                                          opacity: 0.4, // Reducimos la opacidad cuando no está clicado
                                                      },
                                            ]}
                                            onPress={() => handleAbilityFilterToggle(ability)}
                                        >
                                            <ThemedText
                                                style={[styles.abilityButtonText, { color: Colors[theme].background }]}
                                            >
                                                {ability.replace(/[\[\]]/g, "")}
                                            </ThemedText>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </Animated.View>

                        {/* <View style={[styles.separator, { backgroundColor: Colors[theme].icon }]} /> */}
                        {/* Botón "Aplicar" para filtrar */}
                        <TouchableOpacity
                            style={[styles.applyButton, { backgroundColor: Colors[theme].highlight }]}
                            onPress={applyFilters}
                        >
                            <ThemedText style={styles.applyButtonText}>{t("filter")}</ThemedText>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </Modalize>
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
        marginTop: 30,
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
        overflow: "hidden", // Evita el desbordamiento
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
        alignItems: "center", // Centra horizontalmente
        justifyContent: "center",
        zIndex: 1000, // Asegura que esté encima del contenido
        elevation: 10,
        height: 50,
    },
    detailedCardContainer: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%", // Asegura que ocupe todo el ancho
        padding: 12,
        borderRadius: 12,
        marginBottom: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 5, // Sombra para resaltar el componente
    },
    
    cardDetails: {
        flex: 1, // Permite que el contenido se expanda dentro del contenedor
        paddingHorizontal: 16,
        // gap: 20,
        height: "100%",
        justifyContent: "space-around",
    },

    cardRarityContainer: {
        position: "absolute",
        right: -5,
        top: -5,
        width:40,
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

    cardHeader: {
  
    },
    
    cardFooter: {

    },
    
    cardName: {
        fontSize: 20, // Tamaño más grande para destacar el nombre
        fontWeight: "bold",
        overflow: "hidden",
        textOverflow: "ellipsis",
        width: "90%",
    },
    
    colorFilters: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 15,
    },
    colorCircle: {
        width: 24,
        height: 24,
        borderRadius: 15,
    },
    colorCircleContainer: {
        padding: 2,
        borderWidth: 2,
        borderRadius: 25,
        marginHorizontal: 5,
    },
    selectedColorCircle: {
        borderWidth: 2,
    },
    filterButton: {
        marginLeft: 10,
    },
    modalContent: {
        padding: 20,
        justifyContent: "center",
        alignItems: "center",
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 10,
    },
    filterLabel: {
        fontSize: 16,
        fontWeight: "600",
        marginTop: 5,
        marginBottom: 10,
        // backgroundColor: "#a1a1a1",
        // padding: 5,
        // borderRadius: 15,
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
        bottom: 0, // Puedes ajustar este valor según lo necesites
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
    dropdownsContainer: {
        flexDirection: "row",
        // justifyContent: 'space-between',
        marginBottom: 10,
        gap: 10,
    },
    pickerContainer: {
        flex: 1,
        flexDirection: "column",
        alignItems: "center",
        marginHorizontal: 5,
        gap: 5,
    },
    pickerLabel: {
        flex: 1,
        fontSize: 16,
        fontWeight: "bold",
        textAlign: "center",
    },
    picker: {
        flex: 1,
        height: 50,
        borderWidth: 2,
        borderColor: Colors.light.icon,
        borderRadius: 8,
        fontSize: 16,
        paddingHorizontal: 10,
        color: Colors.light.icon,
        width: "100%",
    },
    typeFilters: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 5,
        gap: 10,
    },
    typeButton: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
    },
    typeButtonText: {
        color: "#fff",
        fontWeight: "bold",
        fontSize: 16,
    },
    rarityFilters: {
        flex: 1,
        width: "100%",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 5,
    },
    rarityButton: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
    },
    rarityButtonText: {
        color: "#fff",
        fontWeight: "bold",
        fontSize: 16,
    },
    label: {
        fontSize: 16,
        fontWeight: "600",
        marginBottom: 10,
    },
    triggerFilterContainer: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        marginVertical: 10,
    },
    triggerButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
        alignItems: "center",
        justifyContent: "center",
    },
    triggerButtonText: {
        fontSize: 16,
        fontWeight: "bold",
    },
    accordionHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 10,
        paddingHorizontal: 15,
        backgroundColor: Colors.light.background,
        borderRadius: 8,
        marginBottom: 10,
    },
    accordionHeaderText: {
        fontSize: 16,
        fontWeight: "bold",
    },
    abilityFilters: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 10,
        gap: 5,
    },
    abilityButton: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
        margin: 5,
        borderWidth: 2,
        borderColor: "white",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 3.84,
        elevation: 5,
    },
    abilityButtonText: {
        fontSize: 16,
        fontWeight: "bold",
    },
    abilityHeader: {
        flexDirection: "row",
        alignItems: "center",
    },
    abilityCount: {
        fontSize: 12,
        fontWeight: "bold",
        position: "absolute",
        top: -10,
        right: -10,
    },
    clearButton: {
        marginLeft: 10,
        padding: 5,
        borderRadius: 10,
        fontWeight: "bold",
    },
});
