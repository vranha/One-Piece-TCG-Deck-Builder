import React, { useEffect, useState, useMemo, useRef } from "react";
import {
    View,
    StyleSheet,
    ActivityIndicator,
    TouchableOpacity,
    Text,
    ScrollView,
    Dimensions,
    Platform,
    ToastAndroid,
    Alert,
    TextInput,
    FlatList,
} from "react-native";
import { Image as ExpoImage } from "expo-image";
import { useNavigation, useLocalSearchParams, useRouter } from "expo-router";
import { Colors } from "@/constants/Colors";
import { useTheme } from "@/hooks/ThemeContext";
import useApi from "@/hooks/useApi";
import { ThemedText } from "@/components/ThemedText";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { BarChart, PieChart } from "react-native-chart-kit";
import { LoadingIndicator } from "@/components/LoadingIndicator"; // Import the new component
import { NoDeckFound } from "@/components/NoDeckFound"; // Import the new component
import { CostCurveChart } from "@/components/CostCurveChart"; // Import the new component
import { PowerCurveChart } from "@/components/PowerCurveChart"; // Import the new component
import { ArchetypeChart } from "@/components/ArchetypeChart"; // Import the new component
import { Searcher } from "@/components/Searcher"; // Import the new component
import { TriggerChart } from "@/components/TriggerChart"; // Import the new component
import { CounterDistributionChart } from "@/components/CounterDistributionChart"; // Import the new component
import { DeckStats } from "@/components/DeckStats"; // Import the new component
import * as Clipboard from "expo-clipboard";
import Toast from "react-native-toast-message";
import { Modalize } from "react-native-modalize";
import { useTranslation } from "react-i18next";

interface DeckDetail {
    id: string;
    name: string;
    description: string;
    leaderCardImage: string;
    cards: Card[];
}

interface Card {
    id: string;
    images_small: string;
    type: string; // Add the 'type' property to match the usage
    name: string; // Add the 'name' property to fix the error
    set_name: string;
    code: string;
    rarity: string;
    family?: string; // Add the 'family' property to match the usage
    quantity?: number; // Add the 'quantity' property to fix the error
    cost?: number; // Changed 'cost' property to type 'number' to match usage
    counter?: string | number; // Add the 'counter' property to fix the error
    power?: string; // Add the 'power' property to fix the error
    ability?: string; // Add the 'ability' property to fix the error
    color?: string; // Add the 'color' property to fix the error
    is_leader?: boolean; // Add the 'is_leader' property to fix the error
    trigger?: boolean; // Add the 'trigger' property to fix the error
    // Add other properties of the card if needed
}

export default function DeckDetailScreen() {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const api = useApi();
    const { deckId } = useLocalSearchParams();
    const [deckDetail, setDeckDetail] = useState<DeckDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const navigation = useNavigation();
    const router = useRouter();
    const [cardSizeOption, setCardSizeOption] = useState(0); // 0: small, 1: large, 2: detailed
    const modalizeRef = useRef<Modalize>(null);
    const [imageLoading, setImageLoading] = useState<{ [key: string]: boolean }>({});
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [selectedCards, setSelectedCards] = useState<{ [key: string]: number }>({}); // State to store selected cards and their quantities
    const [deckCardCount, setDeckCardCount] = useState(0); // Add state for deckCardCount

    useEffect(() => {
        if (!deckDetail) return;

        // Initialize selectedCards with the quantities from the deck
        const initialSelectedCards: { [key: string]: number } = {};
        deckDetail.cards.forEach((card) => {
            initialSelectedCards[card.id] = card.quantity ?? 0;
        });
        setSelectedCards(initialSelectedCards);
    }, [deckDetail]);

    useEffect(() => {
        // Update deckCardCount whenever selectedCards changes
        const currentDeckCardCount = Object.values(selectedCards).reduce((sum, qty) => sum + qty, 0);
        setDeckCardCount(currentDeckCardCount);
    }, [selectedCards]);

    const updateCardQuantity = (cardId: string, change: number) => {
        setSelectedCards((prevSelectedCards) => {
            const updatedQuantity = (prevSelectedCards[cardId] || 0) + change;

            // Ensure the quantity is within the valid range (0 to 4)
            if (updatedQuantity < 0 || updatedQuantity > 4) return prevSelectedCards;

            // Calculate the new deckCardCount
            const currentDeckCardCount = Object.values(prevSelectedCards).reduce((sum, qty) => sum + qty, 0);
            const newDeckCardCount = currentDeckCardCount + change;

            // Prevent adding cards if the deckCardCount exceeds the limit
            if (newDeckCardCount > limitDeckNum) return prevSelectedCards;

            // Check if the card's code already exists in the deck with quantity 4
            const card = filteredCards.find((c) => c.id === cardId);
            if (!card) return prevSelectedCards;

            const isCodeMaxedOut = deckDetail?.cards.some(
                (deckCard) => deckCard.code === card.code && (deckCard.quantity ?? 0) >= 4
            );

            if (isCodeMaxedOut && updatedQuantity > 0) return prevSelectedCards;

            return { ...prevSelectedCards, [cardId]: updatedQuantity };
        });
    };

    const selectedQuantity = (cardId: string) => selectedCards[cardId] || 0;
    interface Card {
        id: string;
        images_small: string;
        type: string; // Add the 'type' property to match the usage
        name: string; // Add the 'name' property to fix the error
        set_name: string;
        code: string;
        rarity: string;
        family?: string; // Add the 'family' property to match the usage
        cost?: number; // Add the 'cost' property to fix the error
        // Add other properties of the card if needed
    }

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

    const { height, imageStyle } = getCardDimensions();

    const [filteredCards, setFilteredCards] = useState<Card[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const limitDeckNum = 51;

    const openModal = () => {
        modalizeRef.current?.open();
    };

    useEffect(() => {
        setDeckDetail(null); // Reset deckDetail when deckId changes
        setLoading(true); // Reset loading state
    }, [deckId]);

    useEffect(() => {
        const fetchDeckDetail = async () => {
            try {
                const response = await api.get(`/deckById/${deckId}`);
                setDeckDetail(response.data);
                console.log(response.data);
            } catch (error: any) {
                console.error("Error fetching deck detail:", error.response?.data || error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchDeckDetail();
    }, [deckId]);

    useEffect(() => {
        if (!deckDetail) return; // Avoid setting options if deckDetail is null

        navigation.setOptions({
            headerShown: true,
            headerLeft: () => (
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <MaterialIcons name="arrow-back" size={24} color={Colors[theme].text} />
                </TouchableOpacity>
            ),
            headerTitle: () => null, // No title in the center
            headerRight: () => (
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <TouchableOpacity
                        onPress={deckCardCount < limitDeckNum ? openModal : undefined}
                        style={{
                            backgroundColor:
                                deckCardCount < limitDeckNum ? Colors[theme].success : Colors[theme].disabled,
                            paddingVertical: 5,
                            paddingHorizontal: 10,
                            borderRadius: 5,
                            marginRight: 10,
                        }}
                        disabled={deckCardCount >= limitDeckNum}
                    >
                        <ThemedText style={{ color: Colors[theme].background, fontWeight: "bold" }}>
                            {t("add_card")}
                        </ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={copyDeckToClipboard}
                        style={{
                            backgroundColor: Colors[theme].info,
                            paddingVertical: 5,
                            paddingHorizontal: 10,
                            borderRadius: 5,
                        }}
                    >
                        <ThemedText style={{ color: Colors[theme].background, fontWeight: "bold" }}>
                            {t("copy_deck")}
                        </ThemedText>
                    </TouchableOpacity>
                </View>
            ),
        });
    }, [deckDetail?.cards.length, theme]);

    // Función para manejar el inicio de carga de una imagen
    const handleImageLoadStart = (cardId: string) => {
        setImageLoading((prev) => ({ ...prev, [cardId]: true }));
    };

    // Función para manejar el fin de carga de una imagen
    const handleImageLoadEnd = (cardId: string) => {
        setImageLoading((prev) => ({ ...prev, [cardId]: false }));
    };

    const copyDeckToClipboard = () => {
        if (!deckDetail || !deckDetail.cards.length) return;

        // Generar el string con los códigos y cantidades, separando cada carta con un salto de línea
        const deckString = deckDetail.cards.map((card) => `${card.quantity ?? 1}x${card.code}`).join("\n"); // Aseguramos que cada carta esté en una línea nueva

        // Copiar al portapapeles
        Clipboard.setStringAsync(deckString);

        // Mostrar el mensaje de confirmación personalizado
        Toast.show({
            type: "success", // Tipo de mensaje (success, error, info)
            text1: t("deck_copied_title"), // Título del mensaje
            text2: t("deck_copied_message"), // Subtítulo opcional
            position: "bottom", // Posición del toast (top, bottom)
        });
    };

    const calculateCardCosts = () => {
        const costCounts = Array(11).fill(0); // Array para costos de 0 a 10

        deckDetail?.cards.forEach((card) => {
            if (card.type === "LEADER") return; // Excluye las cartas de tipo 'LEADER'
            const cost = card.cost ?? 0; // Trata null como 0
            const quantity = card.quantity ?? 1; // Si no hay quantity, asume 1
            if (Number(cost) >= 0 && Number(cost) <= 10) {
                costCounts[Number(cost)] += quantity; // Suma el quantity al índice correspondiente
            }
        });

        return costCounts;
    };

    const calculateAverageCost = () => {
        if (!deckDetail || !deckDetail.cards.length) return 0;

        let totalCost = 0;
        let totalCards = 0;

        deckDetail.cards.forEach((card) => {
            if (card.type === "LEADER") return; // Excluye las cartas de tipo 'LEADER'
            const cost = card.cost ?? 0; // Si el poder es null, trátalo como 0
            const quantity = card.quantity ?? 1; // Si no hay cantidad, asume 1

            totalCost += Number(cost) * Number(quantity); // Suma el poder total considerando la cantidad
            totalCards += quantity; // Suma la cantidad total de cartas
        });

        return totalCards > 0 ? (totalCost / totalCards).toFixed(1) : 0; // Calcula el promedio y redondea a 2 decimales
    };

    const calculateCardPowers = () => {
        const powerCounts = Array(11).fill(0); // De 0 a 10, donde 10 será para 10000+

        deckDetail?.cards.forEach((card) => {
            if (card.type === "LEADER") return; // Excluye las cartas de tipo 'LEADER'
            let power = card.power ?? 0; // Si es null, lo tratamos como 0
            const quantity = card.quantity ?? 1; // Si no hay quantity, asume 1

            if (Number(power) >= 0 && Number(power) < 10000) {
                const index = Math.floor(Number(power) / 1000); // Convierte 1000 -> 1, 2000 -> 2, ..., 9000 -> 9
                powerCounts[index] += quantity; // Suma el quantity al índice correspondiente
            } else {
                powerCounts[10] += quantity; // Agrupa 10000 o más en el último índice
            }
        });

        return powerCounts;
    };

    const calculateAveragePower = () => {
        if (!deckDetail || !deckDetail.cards.length) return "0k";

        let totalPower = 0;
        let totalCards = 0;

        deckDetail.cards.forEach((card) => {
            if (card.type === "LEADER") return; // Excluye las cartas de tipo 'LEADER'
            const power = card.power ?? 0; // Si el poder es null, trátalo como 0
            const quantity = card.quantity ?? 1; // Si no hay cantidad, asume 1

            totalPower += Number(power) * Number(quantity); // Suma el poder total considerando la cantidad
            totalCards += quantity; // Suma la cantidad total de cartas
        });

        const averagePower = totalCards > 0 ? totalPower / totalCards : 0;

        // Formatear el promedio en formato "X.Xk" sin redondear
        if (averagePower >= 1000) {
            const truncatedValue = Math.floor((averagePower / 1000) * 10) / 10; // Trunca a un decimal
            return `${truncatedValue}k`;
        }

        return averagePower.toFixed(1); // Si es menor a 1000, muestra el número completo con 1 decimal
    };

    const calculateFamilyDistribution = () => {
        if (!deckDetail || !deckDetail.cards.length) return [];

        const familyCounts: { [key: string]: number } = {};
        let totalCards = 0;

        // Contar las cartas por familia
        deckDetail.cards.forEach((card) => {
            if (card.type === "LEADER") return; // Excluye las cartas de tipo 'LEADER'

            const families = card.family ? card.family.split("/") : ["Unknown"]; // Divide las familias por "/"
            const quantity = card.quantity ?? 1; // Si no hay cantidad, asume 1

            families.forEach((family: string) => {
                const trimmedFamily = family.trim(); // Elimina espacios en blanco alrededor de cada familia
                if (familyCounts[trimmedFamily]) {
                    familyCounts[trimmedFamily] += quantity;
                } else {
                    familyCounts[trimmedFamily] = quantity;
                }
            });

            totalCards += quantity; // Suma la cantidad total de cartas
        });

        // Encontrar la familia más representada
        let mostRepresentedFamily = "";
        let mostRepresentedCount = 0;

        Object.entries(familyCounts).forEach(([family, count]) => {
            if (count > mostRepresentedCount) {
                mostRepresentedFamily = family;
                mostRepresentedCount = count;
            }
        });

        // Calcular el resto de las cartas
        const othersCount = totalCards - mostRepresentedCount;

        // Retornar los datos para el gráfico
        return [
            {
                name: mostRepresentedFamily,
                count: mostRepresentedCount,
                color: Colors[theme].tint, // Color para la familia más representada
                legendFontColor: Colors[theme].text,
                legendFontSize: 12,
            },
            {
                name: "Others",
                count: othersCount,
                color: Colors[theme].triggerInactive, // Color para el resto de las cartas
                legendFontColor: Colors[theme].text,
                legendFontSize: 12,
            },
        ];
    };
    const findCardWithHighestX = (): {
        id: string;
        name: string;
        images_small: string;
        ability?: string;
        x?: number;
    } | null => {
        if (!deckDetail || !deckDetail.cards.length) return null;

        const mostRepresentedFamily = calculateFamilyDistribution()[0].name; // Familia más representada
        let cardWithHighestX = null;
        let highestX = 0;

        deckDetail.cards.forEach((card) => {
            if (!card.ability) return; // Si no tiene habilidad, omitir

            const match = card.ability.match(/Look at (\d+) cards from the top of your deck/i);
            if (match && card.ability.includes(mostRepresentedFamily)) {
                const x = parseInt(match[1], 10); // Extraer el valor de X como número
                if (x > highestX) {
                    highestX = x;
                    cardWithHighestX = { ...card, x }; // Guardar la carta junto con el valor de X
                }
            }
        });

        return cardWithHighestX;
    };
    const calculateProbability = (x: number, familyCount: number, totalCards: number): number => {
        if (x > totalCards) x = totalCards; // No puedes mirar más cartas de las que hay en el mazo

        let probabilityNone = 1;

        for (let i = 0; i < x; i++) {
            probabilityNone *= (totalCards - familyCount - i) / (totalCards - i);
        }

        const probabilityAtLeastOne = 1 - probabilityNone;

        return probabilityAtLeastOne * 100; // Devuelve el porcentaje
    };

    const getProbabilityForCardWithHighestX = () => {
        const cardWithHighestX = findCardWithHighestX();
        if (!cardWithHighestX) return null;

        const mostRepresentedFamily = calculateFamilyDistribution()[0].name;
        const familyCount = calculateFamilyDistribution()[0].count - 1; // Excluir la carta en sí
        const totalCards: any = deckDetail?.cards
            .filter((card) => card.type !== "LEADER") // Excluir líderes
            .reduce((total, card) => total + (card.quantity ?? 1), 0);

        const probability = calculateProbability(cardWithHighestX.x!, familyCount, totalCards);

        return { card: cardWithHighestX, probability, family: mostRepresentedFamily, x: cardWithHighestX.x };
    };

    const calculateCounterDistribution = () => {
        if (!deckDetail || !deckDetail.cards.length)
            return { noCounter: 0, counter1000: 0, counter2000: 0, eventCounter: 0, eventCounterDetails: {} };

        let noCounter = 0;
        let counter1000 = 0;
        let counter2000 = 0;
        let eventCounter = 0;
        const eventCounterDetails: { [key: string]: number } = {}; // Para rastrear los valores de XXXX

        deckDetail.cards.forEach((card) => {
            if (card.type === "LEADER") return; // Excluir líderes

            const counter = card.counter ?? 0; // Si no tiene counter, tratarlo como 0
            const quantity = card.quantity ?? 1; // Si no tiene quantity, asumir 1

            // Grupo 1: Cartas con counter=null o 0 (excluyendo las que cumplen la condición del grupo 4)
            if ((counter === null || counter === "-" || counter === 0) && card.type !== "EVENT") {
                noCounter += quantity;
            }

            // Grupo 2: Cartas con counter=1000
            if (counter === "1000" || counter === 1000) {
                counter1000 += quantity;
            }

            // Grupo 3: Cartas con counter=2000
            if (counter === "2000" || counter === 2000) {
                counter2000 += quantity;
            }

            // Grupo 4: Cartas de tipo "EVENT" con "[Counter]" en su habilidad y "gains +XXXX"
            if (
                card.type === "EVENT" &&
                card.ability?.includes("[Counter]") &&
                /\bgains \+\d{4}\b/.test(card.ability)
            ) {
                eventCounter += quantity;

                // Extraer el valor de XXXX
                const match = card.ability.match(/\bgains \+(\d{4})\b/);
                if (match) {
                    const xxxx = match[1]; // Extraer el valor de XXXX como string
                    if (eventCounterDetails[xxxx]) {
                        eventCounterDetails[xxxx] += quantity; // Sumar la cantidad
                    } else {
                        eventCounterDetails[xxxx] = quantity; // Inicializar con la cantidad
                    }
                }

                if (counter === null || counter === "-" || counter === 0) {
                    noCounter -= quantity; // Descontar del grupo 1 si cumple esta condición
                }
            }
        });

        return { noCounter, counter1000, counter2000, eventCounter, eventCounterDetails };
    };

    const calculateLeaderLifes = () => {
        const leaderCard = deckDetail?.cards.find((card) => card.type === "LEADER");
        if (!leaderCard) return 0; // Si no hay líder, no hay lifes

        if (leaderCard.cost) {
            return leaderCard.cost; // Si tiene cost, ese es su lifes
        }

        const colors = leaderCard.color?.split("/") ?? []; // Dividimos los colores por "/"
        if (colors.length === 1) {
            return 5; // Un color -> 5 lifes
        } else if (colors.length === 2) {
            return 4; // Dos colores -> 4 lifes
        }

        return 0; // Si no tiene cost ni colores, no hay lifes
    };

    const calculateTriggerProbabilities = (lifes: number) => {
        if (!deckDetail || !deckDetail.cards.length) return [];

        const totalCards = deckDetail.cards.reduce((total, card) => total + (card.quantity ?? 1), 0); // Total de cartas en el mazo
        const triggerCards = deckDetail.cards.reduce(
            (total, card) => total + ((card.trigger ? card.quantity : 0) ?? 0),
            0
        ); // Total de cartas con trigger

        const probabilities = [];

        for (let k = 0; k <= lifes; k++) {
            // Incluir el caso de 0 triggers
            // Probabilidad de obtener exactamente k cartas con trigger
            const probability =
                (combination(triggerCards, k) * combination(totalCards - triggerCards, lifes - k)) /
                combination(totalCards, lifes);

            probabilities.push({ triggers: k, probability: probability * 100 });
        }

        return probabilities;
    };

    // Función auxiliar para calcular combinaciones (nCk)
    const combination = (n: number, k: number): number => {
        if (k > n) return 0;
        if (k === 0 || k === n) return 1;
        k = Math.min(k, n - k); // Optimización: usar el menor de k y n-k
        let c = 1;
        for (let i = 0; i < k; i++) {
            c = (c * (n - i)) / (i + 1);
        }
        return c;
    };

    const leaderLifes = calculateLeaderLifes();
    const triggerProbabilities = calculateTriggerProbabilities(Number(leaderLifes));

    const familyDistribution = useMemo(() => calculateFamilyDistribution(), [deckDetail]);
    const cardWithHighestX = useMemo(() => findCardWithHighestX(), [deckDetail]);
    const probabilityForCardWithHighestX = useMemo(() => getProbabilityForCardWithHighestX(), [deckDetail]);
    const counterDistribution = useMemo(() => calculateCounterDistribution(), [deckDetail]);
    const cardCosts = useMemo(() => calculateCardCosts(), [deckDetail]);
    const cardPowers = useMemo(() => calculateCardPowers(), [deckDetail]);
    const averageCost = useMemo(() => calculateAverageCost(), [deckDetail]);
    const averagePower = useMemo(() => calculateAveragePower(), [deckDetail]);

    const nonLeaderCards = deckDetail?.cards.filter((card) => card.type !== "LEADER") ?? [];

    const leaderColors = useMemo(() => {
        const leaderCard = deckDetail?.cards.find((card) => card.is_leader);
        return leaderCard?.color || [];
    }, [deckDetail]);

    // Ajusté la función fetchFilteredCards para manejar correctamente la paginación y asegurar que se carguen más resultados.
    const fetchFilteredCards = async (reset = false) => {
        try {
            const response = await api.get(
                `/cards?search=${searchQuery}&color=${
                    Array.isArray(leaderColors) ? leaderColors.join(",") : leaderColors
                }&page=${reset ? 1 : page}&limit=1000` // Aumenté el límite de resultados por página
            );

            if (reset) {
                setFilteredCards(response.data.data);
                setPage(2); // Reinicia la paginación
            } else {
                setFilteredCards((prevCards) => [...prevCards, ...response.data.data]);
                setPage((prevPage) => prevPage + 1);
            }

            setHasMore(response.data.data.length > 0); // Verifica si hay más datos para cargar
        } catch (error) {
            console.error("Error fetching filtered cards:", error);
        }
    };

    const handleSearchChange = (query: string) => {
        setSearchQuery(query);
        fetchFilteredCards(true); // Reinicia la búsqueda
    };

    useEffect(() => {
        if (searchQuery || leaderColors.length > 0) {
            fetchFilteredCards(true); // Reinicia la búsqueda solo si hay cambios en las dependencias
        }
    }, [searchQuery, leaderColors]); // Eliminé la dependencia de `page` para evitar bucles infinitos

    const [filtersVisible, setFiltersVisible] = useState(false);
    const [selectedTypes, setSelectedTypes] = useState(["CHARACTER", "EVENT", "STAGE"]);
    const [selectedFamilies, setSelectedFamilies] = useState<string[]>([]);

    const toggleFilterVisibility = () => {
        setFiltersVisible(!filtersVisible);
    };

    const toggleTypeSelection = (type: string) => {
        if (selectedTypes.includes(type)) {
            setSelectedTypes(selectedTypes.filter((t) => t !== type));
        } else {
            setSelectedTypes([...selectedTypes, type]);
        }
    };

    const toggleFamilySelection = (family: string) => {
        if (selectedFamilies.includes(family)) {
            setSelectedFamilies(selectedFamilies.filter((f) => f !== family));
        } else {
            setSelectedFamilies([...selectedFamilies, family]);
        }
    };

    const sortFilteredCardsByTypeAndFamily = (cards: Card[]) => {
        return cards.sort((a, b) => {
            const getPrimaryFamily = (card: Card) => {
                return card.family?.split("/")[0].trim() || "Unknown";
            };

            const familyA = getPrimaryFamily(a);
            const familyB = getPrimaryFamily(b);

            if (familyA < familyB) return -1;
            if (familyA > familyB) return 1;

            const costA = Number(a.cost) || 0;
            const costB = Number(b.cost) || 0;

            return costA - costB;
        });
    };

    const removeDuplicateCards = (cards: Card[]) => {
        const uniqueCards = new Map();

        cards.forEach((card) => {
            if (!uniqueCards.has(card.code)) {
                uniqueCards.set(card.code, card);
            } else {
                // If a card with the same code already exists, prioritize the one in the deck
                const existingCard = uniqueCards.get(card.code);
                const isExistingInDeck = deckDetail?.cards.some((deckCard) => deckCard.id === existingCard.id);
                const isCurrentInDeck = deckDetail?.cards.some((deckCard) => deckCard.id === card.id);

                if (isCurrentInDeck && !isExistingInDeck) {
                    uniqueCards.set(card.code, card);
                }
            }
        });

        return Array.from(uniqueCards.values());
    };

    const filteredCardsByTypeAndFamily = useMemo(() => {
        const filtered = filteredCards.filter(
            (card) =>
                selectedTypes.includes(card.type) &&
                (selectedFamilies.length === 0 || selectedFamilies.some((family) => card.family?.includes(family)))
        );
        const uniqueFiltered = removeDuplicateCards(filtered);
        return sortFilteredCardsByTypeAndFamily(uniqueFiltered);
    }, [filteredCards, selectedTypes, selectedFamilies]);

    const toggleCardSize = () => {
        setCardSizeOption((prevOption) => (prevOption + 1) % 3);
    };

    const syncDeckCards = async () => {
        try {
            const adjustedCards = Object.entries(selectedCards).map(([cardId, quantity]) => ({
                cardId,
                quantity,
            }));

            const response = await api.post("/decks/cards/sync", {
                deckId,
                cards: adjustedCards,
            });

            if (response.status === 201) {
                Toast.show({
                    type: "success",
                    text1: t("deck_synced_title"),
                    text2: t("deck_synced_message"),
                    position: "bottom",
                });

                // Refresh deck details after successful sync
                const updatedDeckResponse = await api.get(`/deckById/${deckId}`);
                setDeckDetail(updatedDeckResponse.data);
            } else {
                throw new Error("Failed to sync deck cards.");
            }
        } catch (error) {
            console.error("Error syncing deck cards:", error);
            Toast.show({
                type: "error",
                text1: t("deck_sync_error_title"),
                text2: t("deck_sync_error_message"),
                position: "bottom",
            });
        }
    };

    const hasDeckChanged = () => {
        if (!deckDetail) return false;

        const currentDeck = Object.entries(selectedCards).reduce((acc, [cardId, quantity]) => {
            acc[cardId] = quantity;
            return acc;
        }, {} as { [key: string]: number });

        const originalDeck = deckDetail.cards.reduce((acc, card) => {
            acc[card.id] = card.quantity ?? 0;
            return acc;
        }, {} as { [key: string]: number });

        return JSON.stringify(currentDeck) !== JSON.stringify(originalDeck);
    };

    if (loading) {
        return <LoadingIndicator />;
    }

    if (!deckDetail) {
        return <NoDeckFound />;
    }

    const leaderCardFamilies = deckDetail.cards
        .filter((card) => card.is_leader && card.family)
        .flatMap((card) => (card.family ?? "").split("/").map((family: string) => family.trim()));

    const mostRepresentedFamily = familyDistribution[0]?.name || "";

    const calculateDeckCardCount = () => {
        return deckDetail?.cards.reduce((total, card) => total + (card.quantity ?? 1), 0) || 0;
    };

    return (
        <>
            <ScrollView
                style={[styles.container, { backgroundColor: Colors[theme].background }]}
                contentContainerStyle={{ paddingBottom: 150 }}
            >
                <ThemedText style={[styles.title, { color: Colors[theme].text }]}>{deckDetail.name}</ThemedText>
                {deckDetail.description ? (
                    <ThemedText style={[styles.description, { color: Colors[theme].disabled }]}>
                        {deckDetail.description}
                    </ThemedText>
                ) : null}
                <View style={styles.cardsContainer}>
                    {deckDetail.cards
                        .sort((a, b) => {
                            if (a.is_leader) return -1; // Los LEADER van primero
                            if (b.is_leader) return 1;
                            if (a.type === "CHARACTER" && b.type !== "CHARACTER") return -1; // Los CHARACTER van después de LEADER
                            if (b.type === "CHARACTER" && a.type !== "CHARACTER") return 1;
                            return (Number(a.cost) || 0) - (Number(b.cost) || 0); // Ordenar por costo
                        })
                        .map((item) => (
                            <View
                                key={item.id}
                                style={[
                                    styles.cardContainer,
                                    { borderColor: Colors[theme].backgroundSoft },
                                    item.is_leader
                                        ? { borderColor: Colors[theme].tint, transform: [{ scale: 1.1 }] }
                                        : {},
                                ]}
                            >
                                <ExpoImage source={{ uri: item.images_small }} style={styles.cardImage} />
                                {!item.is_leader ? (
                                    <View
                                        style={[
                                            styles.quantityContainerBack,
                                            { backgroundColor: Colors[theme].backgroundSoft },
                                        ]}
                                    >
                                        <View
                                            style={[styles.quantityContainer, { backgroundColor: Colors[theme].tint }]}
                                        >
                                            <Text
                                                style={[styles.quantityText, { color: Colors[theme].backgroundSoft }]}
                                            >
                                                {item.quantity}
                                            </Text>
                                        </View>
                                    </View>
                                ) : null}
                            </View>
                        ))}
                </View>

                <View
                    style={{
                        flexDirection: "row",
                        height: 20,
                        marginVertical: 10,
                        borderRadius: 5,
                        overflow: "hidden",
                    }}
                ></View>

                {nonLeaderCards.length > 0 && (
                    <>
                        <CounterDistributionChart counterDistribution={counterDistribution} theme={theme} />
                        <DeckStats
                            blockers={deckDetail.cards.reduce(
                                (total, card) => total + (card.ability?.includes("[Blocker]") ? card.quantity ?? 1 : 0),
                                0
                            )}
                            plus5kCards={deckDetail.cards.reduce(
                                (total, card) =>
                                    total + (card.power && Number(card.power) > 5000 ? card.quantity ?? 1 : 0),
                                0
                            )}
                            events={deckDetail.cards.reduce(
                                (total, card) => total + (card.type === "EVENT" ? card.quantity ?? 1 : 0),
                                0
                            )}
                            theme={theme}
                        />
                        <CostCurveChart cardCosts={cardCosts} averageCost={averageCost} />
                        <PowerCurveChart cardPowers={cardPowers} averagePower={averagePower} />
                        <ArchetypeChart
                            familyDistribution={familyDistribution}
                            totalCards={nonLeaderCards.reduce((total, card) => total + (card.quantity ?? 1), 0)}
                        />
                        {cardWithHighestX ? (
                            <Searcher
                                cardImage={cardWithHighestX.images_small}
                                x={probabilityForCardWithHighestX?.x!}
                                probability={probabilityForCardWithHighestX?.probability!}
                            />
                        ) : (
                            <ThemedText style={{ color: Colors[theme].text }}>{t("no_searchers")}</ThemedText>
                        )}
                        <TriggerChart
                            triggerProbabilities={triggerProbabilities}
                            totalTriggers={deckDetail.cards.reduce(
                                (total, card) => total + (card.trigger ? card.quantity ?? 0 : 0),
                                0
                            )}
                            theme={theme}
                        />
                    </>
                )}
            </ScrollView>
            <Modalize
                ref={modalizeRef}
                snapPoint={500}
                modalStyle={{ backgroundColor: Colors[theme].backgroundSoft }}
                onClose={() => {
                    if (hasDeckChanged()) {
                        syncDeckCards();
                    }
                }}
            >
                <View style={[styles.containerModalize]}>
                    <View style={styles.searchContainer}>
                        <Text style={[styles.deckCardCount, { color: Colors[theme].text }]}>
                            <Text
                                style={{
                                    fontWeight: "bold",
                                    color: deckCardCount === limitDeckNum ? Colors[theme].error : Colors[theme].success,
                                }}
                            >
                                {deckCardCount}
                            </Text>
                            <Text style={{ fontWeight: "bold", color: Colors[theme].disabled }}>/{limitDeckNum}</Text>
                        </Text>
                        <TextInput
                            style={[
                                styles.searchInput,
                                { borderColor: Colors[theme].TabBarBackground, color: Colors[theme].text },
                            ]}
                            placeholder={t("search_cards")}
                            placeholderTextColor={Colors[theme].disabled}
                            value={searchQuery}
                            onChangeText={handleSearchChange}
                        />
                        <TouchableOpacity
                            onPress={toggleFilterVisibility}
                            style={styles.filterButton}
                            delayPressIn={0} // Reduce delay
                        >
                            <MaterialIcons
                                name="filter-list"
                                size={24}
                                color={filtersVisible ? Colors[theme].info : Colors[theme].text}
                            />
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={toggleCardSize}
                            style={styles.viewModeButton}
                            delayPressIn={0} // Reduce delay
                        >
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
                    {filtersVisible && (
                        <View style={styles.filtersContainer}>
                            {["CHARACTER", "EVENT", "STAGE"].map((type) => (
                                <TouchableOpacity
                                    key={type}
                                    style={[
                                        styles.typeButton,
                                        selectedTypes.includes(type)
                                            ? { backgroundColor: Colors[theme].icon }
                                            : { backgroundColor: Colors[theme].disabled },
                                    ]}
                                    onPress={() => toggleTypeSelection(type)}
                                >
                                    <ThemedText style={[styles.typeButtonText, { color: Colors[theme].background }]}>
                                        {type}
                                    </ThemedText>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}

                    {filtersVisible && (
                        <View style={styles.filtersContainer}>
                            {Array.from(new Set([...leaderCardFamilies, mostRepresentedFamily])).map((family) => (
                                <TouchableOpacity
                                    key={family}
                                    style={[
                                        styles.typeButton,
                                        selectedFamilies.includes(family)
                                            ? { backgroundColor: Colors[theme].icon }
                                            : { backgroundColor: Colors[theme].disabled },
                                    ]}
                                    onPress={() => toggleFamilySelection(family)}
                                >
                                    <ThemedText style={[styles.typeButtonText, { color: Colors[theme].background }]}>
                                        {family}
                                    </ThemedText>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                    {/* Render cards based on viewMode */}
                    <FlatList
                        data={filteredCardsByTypeAndFamily}
                        keyExtractor={(card) => card.id}
                        renderItem={({ item: card }) => (
                            <CardItem
                                card={card}
                                height={height}
                                imageStyle={imageStyle}
                                cardSizeOption={cardSizeOption}
                                theme={theme}
                                onLoadStart={handleImageLoadStart}
                                onLoadEnd={handleImageLoadEnd}
                                getQuantityControlsStyle={getQuantityControlsStyle} // Pass as prop
                                updateCardQuantity={updateCardQuantity} // Pass as prop
                                selectedQuantity={selectedQuantity} // Pass as prop
                            />
                        )}
                        contentContainerStyle={[styles.cardList, { paddingBottom: 20 }]}
                        nestedScrollEnabled={true}
                    />
                </View>
            </Modalize>
        </>
    );
}

interface CardItemProps {
    card: Card;
    height: number;
    imageStyle: any;
    cardSizeOption: number;
    theme: string;
    onLoadStart: (cardId: string) => void;
    onLoadEnd: (cardId: string) => void;
    getQuantityControlsStyle: () => any;
    updateCardQuantity: (cardId: string, change: number) => void;
    selectedQuantity: (cardId: string) => number;
}

const CardItem = React.memo(
    ({
        card,
        height,
        imageStyle,
        cardSizeOption,
        theme,
        onLoadStart,
        onLoadEnd,
        getQuantityControlsStyle,
        updateCardQuantity,
        selectedQuantity,
    }: CardItemProps) => (
        <View key={card.id}>
            <View
                style={[
                    styles.cardContainerSearch,
                    { height },
                    cardSizeOption === 2 && [
                        styles.detailedCardContainer,
                        { backgroundColor: Colors[theme as keyof typeof Colors].TabBarBackground },
                    ],
                ]}
            >
                <ExpoImage
                    source={{ uri: card.images_small }}
                    placeholder={require("@/assets/images/card_placeholder.webp")}
                    style={[styles.cardImage, imageStyle]}
                    contentFit="contain" // Similar to resizeMode="contain"
                    transition={300} // Smooth transition for image loading
                    cachePolicy="memory-disk" // Cache for better performance
                    onLoadStart={() => onLoadStart(card.id)}
                    onLoadEnd={() => onLoadEnd(card.id)}
                />
                <View style={[styles.quantityControls, getQuantityControlsStyle()]}>
                    <TouchableOpacity onPress={() => updateCardQuantity(card.id, -1)}>
                        <MaterialIcons
                            name="remove-circle-outline"
                            size={24}
                            color={Colors[theme as "light" | "dark"].icon}
                        />
                    </TouchableOpacity>
                    <ThemedText style={[styles.quantityTextSearch, { color: "white" }]}>
                        {selectedQuantity(card.id)}
                    </ThemedText>
                    <TouchableOpacity onPress={() => updateCardQuantity(card.id, 1)}>
                        <MaterialIcons
                            name="add-circle-outline"
                            size={24}
                            color={Colors[theme as "light" | "dark"].icon}
                        />
                    </TouchableOpacity>
                </View>
                {cardSizeOption === 2 && (
                    <View style={styles.cardDetails}>
                        <View
                            style={[
                                styles.cardRarityContainer,
                                { backgroundColor: Colors[theme as "light" | "dark"].background },
                            ]}
                        >
                            <ThemedText style={[styles.cardRarity, { color: Colors[theme as "light" | "dark"].icon }]}>
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
                                style={[styles.cardType, { color: Colors[theme as "light" | "dark"].tabIconDefault }]}
                                numberOfLines={1}
                            >
                                {card.type}
                            </ThemedText>
                            <ThemedText
                                style={[styles.cardSet, { color: Colors[theme as "light" | "dark"].tabIconDefault }]}
                                numberOfLines={1}
                            >
                                {card.set_name}
                            </ThemedText>
                        </View>
                    </View>
                )}
            </View>
        </View>
    )
);
const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 10,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
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
        textAlign: "left",
        marginBottom: 20,
        padding: 12,
    },
    cardsContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "center",
        gap: 10,
    },
    cardContainer: {
        marginVertical: 2,
        position: "relative",
        borderWidth: 4,
        borderRadius: 5,
    },
    cardImage: {
        width: 100,
        height: 140,
        borderRadius: 5,
    },
    quantityContainerBack: {
        position: "absolute", // Superpone el botón sobre la imagen
        bottom: -8, // Ajusta la posición vertical
        right: -8, // Ajusta la posición horizontal
        borderRadius: 50,
        padding: 4,
    },
    quantityContainer: {
        borderRadius: 50,
        width: 24,
        height: 24,
        justifyContent: "center",
        alignItems: "center",
    },
    quantityText: {
        fontSize: 16,
        fontWeight: "bold",
    },
    containerModalize: {
        padding: 20,
        marginBottom: 65,
    },
    searchContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 10,
    },
    searchInput: {
        flex: 1,
        height: 40,
        borderWidth: 1,
        paddingHorizontal: 8,
        borderRadius: 4,
    },
    filterButton: {
        marginLeft: 10,
    },
    viewModeButton: {
        marginLeft: 10,
    },
    filtersContainer: {
        flexDirection: "row",
        justifyContent: "center",
        marginBottom: 10,
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
    gridView: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "center",
    },
    listView: {
        flexDirection: "column",
    },
    compactView: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "center",
    },
    cardList: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-evenly",
    },
    cardContainerSearch: {
        alignItems: "center",
        overflow: "hidden",
        marginBottom: 15,
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
    cardImageSearch: {
        marginHorizontal: 4,
        borderRadius: 5,
    },
    smallCard: {
        width: 97,
        height: 137,
    },
    largeCard: {
        width: 134,
        height: 191,
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
    deckCardCount: {
        fontSize: 16,
        fontWeight: "bold",
        marginRight: 10,
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
    quantityTextSearch: {
        marginHorizontal: 8,
        fontSize: 16,
        fontWeight: "bold",
    },
});
