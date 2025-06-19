import React, { useEffect, useState, useMemo, useRef, useCallback } from "react";
import {
    View,
    StyleSheet,
    TouchableOpacity,
    Text,
    ScrollView,
    Platform,
    TextInput,
    Alert,
    Modal,
    Linking,
} from "react-native";
import { Image as ExpoImage } from "expo-image";
import { useNavigation, useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import { Colors } from "@/constants/Colors";
import { useTheme } from "@/hooks/ThemeContext";
import useApi from "@/hooks/useApi";
import { ThemedText } from "@/components/ThemedText";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { Animated, Easing } from "react-native";
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
import FilterSlider from "@/components/FilterSlider";
import ImageModal from "@/components/ImageModal"; // Import the new component
import CardSelectionModal from "@/components/CardSelectionModal"; // Import the new component
import TriggerFilter from "@/components/TriggerFilter";
import { LinearGradient } from "expo-linear-gradient";
import AbilityAccordion from "@/components/AbilityAccordion";
import AttributeFilters from "@/components/AttributeFilters";
import { abilityColorMap } from "@/constants/abilityColorMap";
import useStore from "@/store/useStore";
import Tags from "@/components/Tags"; // Import the new Tags component
import { useAuth } from "@/contexts/AuthContext";
import AsyncStorage from "@react-native-async-storage/async-storage"; // Import AsyncStorage
import ViewShot from "react-native-view-shot";
import * as Sharing from "expo-sharing"; // Si usas Expo, para compartir imágenes
import * as FileSystem from "expo-file-system";
import { Buffer } from "buffer";
import * as Progress from "react-native-progress";
import IconUser from "@/assets/icons/iconUser.svg";

interface DeckDetail {
    id: string;
    name: string;
    description: string;
    leaderCardImage: string;
    cards: Card[];
    user_id: string;
    // Removed tags property
}

interface Card {
    id: string;
    images_small: string;
    images_thumb: string;
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
    const { theme } = useTheme() as { theme: keyof typeof Colors };
    const api = useApi();
    const { session } = useAuth();
    const { deckId } = useLocalSearchParams();
    const [deckDetail, setDeckDetail] = useState<DeckDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const navigation = useNavigation();
    const router = useRouter();
    const [cardSizeOption, setCardSizeOption] = useState(0); // 0: small, 1: large, 2: detailed
    const modalizeRef = useRef<Modalize>(null);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [selectedCards, setSelectedCards] = useState<{ [key: string]: number }>({}); // State to store selected cards and their quantities
    const [deckCardCount, setDeckCardCount] = useState(0); // Add state for deckCardCount
    const [costRange, setCostRange] = useState<[number, number]>([0, 10]); // State for cost filter
    const [powerRange, setPowerRange] = useState<[number, number]>([0, 13000]); // State for power filter
    const [counterRange, setCounterRange] = useState<[number, number]>([0, 2000]); // State for counter filter
    const [isModalOpen, setIsModalOpen] = useState(false); // State to track modal open/close
    const [showSelectedCardsOnly, setShowSelectedCardsOnly] = useState(false); // State to toggle showing only selected cards

    const [relatedCards, setRelatedCards] = useState<Card[]>([]); // Estado para cartas relacionadas
    const [selectedCard, setSelectedCard] = useState<Card | null>(null); // Carta seleccionada para reemplazo
    const [isModalVisible, setIsModalVisible] = useState(false); // Estado del modal

    const [isImageModalVisible, setIsImageModalVisible] = useState(false); // State for image modal
    const [selectedImage, setSelectedImage] = useState<string | null>(null); // State for selected image
    const [triggerFilter, setTriggerFilter] = useState<boolean>(false); // State for selected trigger filter
    const [abilityFilters, setAbilityFilters] = useState<string[]>([]); // State for selected abilities
    const [attributes, setAttributes] = useState<{ attribute_name: string; attribute_image: string }[]>([]);
    const [selectedAttributes, setSelectedAttributes] = useState<string[]>([]); // State for selected attributes
    const [tags, setTags] = useState<{ id: string; name: string; color: string }[]>([]); // State for tags
    const [allTags, setAllTags] = useState<{ id: string; name: string; color: string }[]>([]); // State for all available tags

    const [isEditing, setIsEditing] = useState(false); // State for edit mode
    const [editedName, setEditedName] = useState(""); // State for edited name
    const [editedDescription, setEditedDescription] = useState(""); // State for edited description
    const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false); // State for delete modal visibility
    const [imageLoaded, setImageLoaded] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1); // Total number of pages
    const [hasMoreCards, setHasMoreCards] = useState(true);
    const [isSharing, setIsSharing] = useState(false);
    const [progress, setProgress] = useState(0); // Progreso de la barra

    const fetchRelatedCards = async (code: string) => {
        try {
            const response = await api.get(`/cards/by-code/${code}`);
            setRelatedCards(response.data);
            setIsModalVisible(true); // Abre el modal
        } catch (error) {
            console.error("Error fetching related cards:", error);
        }
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

    // Determinar si el deck pertenece al usuario actual
    const isOwner = useMemo(() => {
        return session?.user?.id === deckDetail?.user_id; // Suponiendo que `ownerId` está en los datos del deck
    }, [session, deckDetail]);

    const viewShotRef = useRef(null);

    const handleShareDeckImage = async () => {
        setIsSharing(true);
        setProgress(0);
        let progressInterval: NodeJS.Timeout | null = null;
        try {
            // Simula el progreso de 0 a 0.8 en ~3.2 segundos (más rápido)
            progressInterval = setInterval(() => {
                setProgress((prev) => {
                    if (prev < 0.9) {
                        return prev + 0.02;
                    } else {
                        clearInterval(progressInterval!);
                        return prev;
                    }
                });
            }, 40);
            // Calcula la distribución de counters para enviar al backend
            const counterDist = [
                counterDistribution.noCounter || 0,
                counterDistribution.counter1000 || 0,
                counterDistribution.counter2000 || 0,
                counterDistribution.eventCounter || 0,
            ];
            // Calcula los nuevos stats (con null check)
            const blockers =
                deckDetail?.cards.reduce(
                    (total, card) => total + (card.ability?.includes("[Blocker]") ? card.quantity ?? 1 : 0),
                    0
                ) ?? 0;
            const plus5kCards =
                deckDetail?.cards.reduce(
                    (total, card) => total + (card.power && Number(card.power) >= 5000 ? card.quantity ?? 1 : 0),
                    0
                ) ?? 0;
            const events =
                deckDetail?.cards.reduce(
                    (total, card) => total + (card.type === "EVENT" ? card.quantity ?? 1 : 0),
                    0
                ) ?? 0;
            const response = await api.post(
                "/image/deck-image",
                {
                    cards: deckDetail?.cards
                        .sort((a, b) => (a.is_leader ? -1 : b.is_leader ? 1 : 0))
                        .map((card) => ({
                            image: card?.images_small,
                            quantity: card.quantity ?? 1,
                            cost: card.cost ?? 0,
                            power: card.power ?? 0,
                            family: card.family ?? "",
                        })),
                    counterDistribution: counterDist,
                    blockers,
                    plus5kCards,
                    events,
                    deckId, // <-- Añadimos el deckId para el QR
                },
                { responseType: "arraybuffer" }
            );
            // Completa el progreso al 100% antes de compartir
            setProgress(1);
            const fileUri = FileSystem.cacheDirectory + "deck.png";
            await FileSystem.writeAsStringAsync(fileUri, Buffer.from(response.data, "binary").toString("base64"), {
                encoding: FileSystem.EncodingType.Base64,
            });
            await Sharing.shareAsync(fileUri, {
                dialogTitle: "Compartir deck",
                mimeType: "image/png",
            });
        } catch (error) {
            Alert.alert("Error al compartir", (error as any).message);
        } finally {
            if (progressInterval) clearInterval(progressInterval);
            setTimeout(() => {
                setIsSharing(false);
                setProgress(0);
            }, 500); // Pequeño delay para que se vea el 100%
        }
    };

    useEffect(() => {
        // const fetchSetNames = async () => {
        //     try {
        //         const response = await api.get("/set_names");
        //         setSetNames(response.data);
        //     } catch (err) {
        //         console.error("Error fetching set names:", err);
        //     }
        // };

        // const fetchFamilies = async () => {
        //     try {
        //         const response = await api.get("/families");
        //         setFamilies(response.data);
        //     } catch (err) {
        //         console.error("Error fetching families:", err);
        //     }
        // };
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
        // fetchSetNames();
        // fetchFamilies();
    }, []);
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

    const replaceCard = async (newCard: Card) => {
        if (!deckDetail || !selectedCard) return;
        console.log(newCard);

        // Check if the new card already exists in the deck
        const existingCardIndex = deckDetail.cards.findIndex((card) => card.id === newCard.id);

        let updatedCards;
        if (existingCardIndex !== -1) {
            // If the new card already exists, sum the quantities
            updatedCards = deckDetail.cards
                .map((card, index) =>
                    index === existingCardIndex
                        ? { ...card, quantity: (card.quantity ?? 0) + (selectedCard?.quantity ?? 0) }
                        : card.id === selectedCard.id
                        ? null // Remove the replaced card
                        : card
                )
                .filter(Boolean); // Remove null entries
        } else {
            // If the new card does not exist, replace the selected card
            updatedCards = deckDetail.cards.map((card) =>
                card.id === selectedCard.id
                    ? { ...newCard, quantity: card.quantity, is_leader: newCard.type === "LEADER" }
                    : card
            );
        }

        setDeckDetail((prev) => ({
            ...prev!,
            cards: updatedCards.filter((card): card is Card => card !== null),
        }));

        try {
            // Sync the updated deck with the server
            const adjustedCards = updatedCards.map((card) => ({
                cardId: card?.id ?? "",
                quantity: card ? card.quantity ?? 1 : 1,
                is_leader: card?.is_leader ?? false,
            }));

            await api.post("/decks/cards/sync", {
                deckId,
                cards: adjustedCards,
            });

            Toast.show({
                type: "success",
                text1: t("deck_synced_title"),
                text2: t("deck_synced_message"),
                position: "bottom",
            });
        } catch (error) {
            console.error("Error syncing deck cards:", error);
            Toast.show({
                type: "error",
                text1: t("deck_sync_error_title"),
                text2: t("deck_sync_error_message"),
                position: "bottom",
            });
        }
        useStore.getState().setRefreshDecks(true); // Notify the DeckCarousel
        setIsModalVisible(false); // Close the modal
    };

    const openImageModal = (imageUri: string) => {
        setSelectedImage(imageUri);
        setIsImageModalVisible(true);
    };

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
            const currentQuantity = prevSelectedCards[cardId] || 0;
            const updatedQuantity = currentQuantity + change;

            // Asegúrate de que la cantidad esté dentro del rango válido (0 a 4)
            if (updatedQuantity < 0 || updatedQuantity > 4) return prevSelectedCards;

            return { ...prevSelectedCards, [cardId]: updatedQuantity };
        });
    };

    const selectedQuantity = (cardId: string) => selectedCards[cardId] || 0;
    interface Card {
        id: string;
        images_small: string;
        images_thumb: string;
        type: string; // Add the 'type' property to match the usage
        name: string; // Add the 'name' property to fix the error
        set_name: string;
        code: string;
        rarity: string;
        family?: string; // Add the 'family' property to match the usage
        cost?: number; // Add the 'cost' property to fix the error
        quantity?: number; // Add the 'cost' property to fix the error
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
        if (isModalOpen) {
            modalizeRef.current?.close(); // Close the modal if it's already open
            setIsModalOpen(false);
        } else {
            modalizeRef.current?.open(); // Open the modal if it's not open
            setIsModalOpen(true);
        }
    };

    const [isReadyToRender, setIsReadyToRender] = useState(false);

    useFocusEffect(
        useCallback(() => {
            const fetchDeckDetail = async () => {
                // Limpia el estado antes de cargar el nuevo deck
                setDeckDetail(null);
                setIsReadyToRender(false); // Bloquea el renderizado
                setLoading(true); // Activa el estado de carga

                try {
                    const response = await api.get(`/deckById/${deckId}`);
                    setDeckDetail(response.data); // Establece el nuevo deck
                } catch (error: any) {
                    console.error("Error fetching deck detail:", error.response?.data || error.message);
                } finally {
                    setLoading(false); // Desactiva el estado de carga
                    setIsReadyToRender(true); // Permite el renderizado
                }
            };

            fetchDeckDetail();

            // Limpia el estado al desmontar el componente
            return () => {
                setDeckDetail(null);
                setIsReadyToRender(false);
            };
        }, [deckId]) // Dependencia: se ejecutará cuando cambie el deckId
    );

    useEffect(() => {
        const fetchTags = async () => {
            try {
                const response = await api.get(`/decks/${deckId}/tags`);
                setTags(response.data);
            } catch (error) {
                console.error("Error fetching tags:", error);
            }
        };

        if (deckId) {
            fetchTags();
        }
    }, [deckId]);

    useEffect(() => {
        const fetchTags = async () => {
            try {
                const response = await api.get(`/decks/${deckId}/tags`);
                setTags(response.data);
            } catch (error) {
                console.error("Error fetching tags:", error);
            }
        };

        const fetchAllTags = async () => {
            try {
                const response = await api.get(`/tags`);
                setAllTags(response.data);
            } catch (error) {
                console.error("Error fetching all tags:", error);
            }
        };

        if (deckId) {
            fetchTags();
            fetchAllTags();
        }
    }, [deckId]);

    const handleTagToggle = async (tag: { id: string; name: string; color: string }) => {
        try {
            const isTagSelected = tags.some((t) => t.id === tag.id);
            if (isTagSelected) {
                await api.delete(`/decks/${deckId}/tags/${tag.id}`);
                setTags((prev) => prev.filter((t) => t.id !== tag.id));
            } else {
                await api.post(`/decks/${deckId}/tags`, { tagId: tag.id });
                setTags((prev) => [...prev, tag]);
            }
        } catch (error) {
            console.error("Error toggling tag:", error);
        }
    };

    const copyDeckToClipboard = async () => {
        if (!deckDetail || !deckDetail.cards.length) return;

        const deckString = deckDetail.cards.map((card) => `${card.quantity ?? 1}x${card.code}`).join("\n");

        // Copy to clipboard
        Clipboard.setStringAsync(deckString);

        try {
            // Check if email preference is enabled
            const emailPreference = await AsyncStorage.getItem("emailPreference");
            const shouldSendEmail = emailPreference === null || emailPreference === "true"; // Default to true

            if (shouldSendEmail) {
                await api.post("/send-deck-email", {
                    email: session?.user?.email,
                    deckName: deckDetail.name,
                    userName: session?.user?.user_metadata?.name,
                    deckString,
                });

                Toast.show({
                    type: "success",
                    text1: t("deck_copied_title"),
                    text2: t("deck_copied_and_emailed_message"),
                    position: "bottom",
                });
            } else {
                Toast.show({
                    type: "success",
                    text1: t("deck_copied_title"),
                    text2: t("deck_copied_message"),
                    position: "bottom",
                });
            }
        } catch (error) {
            console.error("Error sending deck email:", error);
            Toast.show({
                type: "error",
                text1: t("email_error_title"),
                text2: t("email_error_message"),
                position: "bottom",
            });
        }
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
        images_thumb: string;
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

            // Grupo 1: Cartas con counter=null, "-", o 0 (excluyendo las que cumplen la condición del grupo 4)
            if ((counter === null || counter === "-" || counter === 0) && card.type !== "EVENT") {
                console.log("EEEEE", counter, quantity, card.type);
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
            }
        });

        console.log("AAAAAA", noCounter, counter1000, counter2000, eventCounter, eventCounterDetails);

        return { noCounter, counter1000, counter2000, eventCounter, eventCounterDetails };
    };

    const calculateLeaderLifes = () => {
        const leaderCard = deckDetail?.cards.find((card) => card.type === "LEADER");
        if (!leaderCard) return 0;

        if (leaderCard.cost) {
            return leaderCard.cost;
        }

        // Aseguramos que color sea string o array
        let colors: string[] = [];

        if (typeof leaderCard.color === "string") {
            colors = leaderCard.color.split("/");
        } else if (Array.isArray(leaderCard.color)) {
            colors = leaderCard.color;
        }

        if (colors.length === 1) {
            return 5;
        } else if (colors.length === 2) {
            return 4;
        }

        return 0;
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

    const transformSliderValue = (value: number | null | undefined, defaultValue: string) => {
        if (value === 0 || value == null) {
            return defaultValue; // Transform 0 or null to the default value for the API
        }
        return value.toString();
    };

    const itemsPerPage = 18; // Número de elementos por página

    const fetchFilteredCards = async (page: number) => {
        try {
            if (showSelectedCardsOnly) {
                // Fetch all selected cards ignoring filters
                const response = await api.get(
                    `/cards?search=&color=${
                        Array.isArray(leaderColors) ? leaderColors.join(",") : leaderColors
                    }&type=CHARACTER,EVENT,STAGE&family=&cost_gte=null&cost_lte=10&power_gte=0&power_lte=13000&counter_gte=&counter_lte=2000&limit=10000`
                ); // Base state route
                const { data: cards } = response.data;

                const selectedCardIds = Object.entries(selectedCards)
                    .filter(([_, quantity]) => quantity > 0)
                    .map(([cardId]) => cardId);

                setFilteredCards(cards.filter((card: Card) => selectedCardIds.includes(card.id)));
            } else {
                // Fetch cards with current filters
                const triggerQuery = triggerFilter ? `&trigger=true` : "";
                let attributeQuery =
                    selectedAttributes.length > 0 ? `&attribute_name=${selectedAttributes.join(",")}` : "";
                const abilityQuery = abilityFilters.length > 0 ? `&ability=${abilityFilters.join(",")}` : "";

                const response = await api.get(
                    `/cards?search=${searchQuery}&color=${
                        Array.isArray(leaderColors) ? leaderColors.join(",") : leaderColors
                    }&type=${selectedTypes.join(",")}&family=${selectedFamilies.join(
                        ","
                    )}${triggerQuery}${attributeQuery}${abilityQuery}&cost_gte=${transformSliderValue(
                        costRange[0],
                        "null"
                    )}&cost_lte=${transformSliderValue(costRange[1], "null")}&power_gte=${powerRange[0]}&power_lte=${
                        powerRange[1]
                    }&counter_gte=${transformSliderValue(counterRange[0], "")}&counter_lte=${transformSliderValue(
                        counterRange[1],
                        ""
                    )}&uniqueCodes=true&limit=${itemsPerPage}&page=${page}` // Ensure uniqueCodes=true is passed
                );

                const { data: cards, pagination } = response.data;
                setFilteredCards(cards); // Store all cards
                setCurrentPage(pagination.page); // Actualiza la página actual desde la API
                setTotalPages(pagination.totalPages); // Actualiza el total de páginas desde la API
                setHasMoreCards(pagination.page < pagination.totalPages); // Verifica si hay más páginas
            }
        } catch (error) {
            console.error("Error fetching filtered cards:", error);
        }
    };

    const toggleShowSelectedCardsOnly = () => {
        setShowSelectedCardsOnly((prev) => !prev);
        fetchFilteredCards(1); // Trigger fetch with updated state
    };

    const [visibleCardsCount, setVisibleCardsCount] = useState(21); // Number of cards to display initially

    const loadMoreCards = () => {
        setVisibleCardsCount((prevCount) => prevCount + 21); // Add 21 more cards to the visible list
    };

    const handleSearchChange = (query: string) => {
        setSearchQuery(query);
        // fetchFilteredCards(); // Reinicia la búsqueda
    };

    const isAddDisabled = useCallback(
        (card: Card): boolean => {
            const cardCode = card.code;

            // Depuración: Imprime información detallada
            console.log(`Evaluando isAddDisabled para la carta: ${card.name} (code: ${cardCode})`);

            const totalCardsWithSameCode = Object.entries(selectedCards).reduce((sum, [id, quantity]) => {
                const selectedCard =
                    filteredCards.find((c) => c.id === id) || deckDetail?.cards.find((c) => c.id === id);
                if (selectedCard?.code === cardCode) {
                    console.log(`Incluyendo carta: ${selectedCard.name} (id: ${id}, cantidad: ${quantity})`);
                }
                return selectedCard?.code === cardCode ? sum + quantity : sum;
            }, 0);

            console.log(`Total de cartas con el mismo code (${cardCode}): ${totalCardsWithSameCode}`);

            return totalCardsWithSameCode >= 4;
        },
        [selectedCards, filteredCards, deckDetail]
    );

    const [filtersVisible, setFiltersVisible] = useState(false);
    const [selectedTypes, setSelectedTypes] = useState(["CHARACTER", "EVENT", "STAGE"]);
    const [selectedFamilies, setSelectedFamilies] = useState<string[]>([]); // Move this above the useEffect
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchQuery);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearchQuery(searchQuery); // Actualiza el valor después del retraso
        }, 300); // 300ms de retraso (puedes ajustarlo)

        return () => {
            clearTimeout(handler); // Limpia el timeout si el usuario sigue escribiendo
        };
    }, [searchQuery]);

    useEffect(() => {
        fetchFilteredCards(1); // Reset search whenever filters change
    }, [
        debouncedSearchQuery,
        leaderColors,
        selectedTypes,
        selectedFamilies,
        costRange,
        powerRange,
        counterRange,
        showSelectedCardsOnly,
        triggerFilter,
        selectedAttributes,
        abilityFilters,
    ]); // Updated dependencies

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

    const toggleCardSize = () => {
        setCardSizeOption((prevOption) => (prevOption + 1) % 3);
    };

    const syncDeckCards = async () => {
        try {
            const adjustedCards = Object.entries(selectedCards).map(([cardId, quantity]) => {
                const isLeader = deckDetail?.cards.find((card) => card.id === cardId)?.is_leader || false;
                return { cardId, quantity, is_leader: isLeader };
            });

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

        // Normaliza y ordena las cartas del deck actual
        const currentDeck = Object.entries(selectedCards)
            .map(([cardId, quantity]) => ({
                cardId,
                quantity,
                is_leader: deckDetail?.cards.find((card) => card.id === cardId)?.is_leader || false,
            }))
            .sort((a, b) => a.cardId.localeCompare(b.cardId)); // Ordena por ID de carta

        // Normaliza y ordena las cartas del deck original
        const originalDeck = deckDetail.cards
            .map((card) => ({
                cardId: card.id,
                quantity: card.quantity ?? 0,
                is_leader: card.is_leader || false,
            }))
            .sort((a, b) => a.cardId.localeCompare(b.cardId)); // Ordena por ID de carta

        // Compara los decks normalizados
        return JSON.stringify(currentDeck) !== JSON.stringify(originalDeck);
    };

    useEffect(() => {
        // Close the modal and reset the state when the component is opened
        modalizeRef.current?.close();
        setIsModalOpen(false);
    }, []);

    useEffect(() => {
        if (deckDetail) {
            setEditedName(deckDetail.name);
            setEditedDescription(deckDetail.description || "");
        }
    }, [deckDetail]);

    useEffect(() => {
        console.log("Edited Name updated:", editedName); // Debugging log
        console.log("Edited Description updated:", editedDescription); // Debugging log
    }, [editedName, editedDescription]);

    const handleDeleteDeck = async () => {
        try {
            await api.delete(`/decks/${deckId}`);
            Toast.show({
                type: "success",
                text1: t("deck_deleted_title"),
                text2: t("deck_deleted_message"),
                position: "bottom",
            });
            useStore.getState().setRefreshDecks(true); // Notificar al DeckCarousel
            router.replace("/"); // Navigate back to the main screen
        } catch (error) {
            console.error("Error deleting deck:", error);
            Toast.show({
                type: "error",
                text1: t("deck_delete_error_title"),
                text2: t("deck_delete_error_message"),
                position: "bottom",
            });
        }
    };

    const handleEditDeck = async () => {
        try {
            const updatedName = editedName.trim(); // Ensure no leading/trailing spaces
            const updatedDescription = editedDescription.trim(); // Ensure no leading/trailing spaces

            await api.put(`/deck/${deckId}`, {
                name: updatedName,
                description: updatedDescription,
            });

            setDeckDetail((prev) => ({
                ...prev!,
                name: updatedName,
                description: updatedDescription,
            }));

            setIsEditing(!isEditing); // Close edit mode

            Toast.show({
                type: "success",
                text1: t("deck_updated_title"),
                text2: t("deck_updated_message"),
                position: "bottom",
            });
            useStore.getState().setRefreshDecks(true); // Notificar al DeckCarousel
        } catch (error) {
            console.error("Error editing deck:", error);
            Toast.show({
                type: "error",
                text1: t("deck_update_error_title"),
                text2: t("deck_update_error_message"),
                position: "bottom",
            });
        }
    };

    const [isAtTop, setIsAtTop] = useState(true); // Estado para saber si estás en la parte superior

    const handleScroll = (event: any) => {
        const offsetY = event.nativeEvent.contentOffset.y;
        setIsAtTop(offsetY <= 0); // Si el desplazamiento es 0 o menor, estás en la parte superior
    };

    // const [headerOptions, setHeaderOptions] = useState<any>({}); // Estado inicial vacío para las opciones del encabezado

    const [isHeaderReady, setIsHeaderReady] = useState(false);

    useEffect(() => {
        if (isReadyToRender && deckDetail) {
            // Configura las opciones del header solo cuando el componente esté listo
            navigation.setOptions(
                isOwner
                    ? {
                          headerShown: true,
                          headerLeft: () => (
                              <TouchableOpacity
                                  onPress={() => {
                                      router.back();
                                      modalizeRef.current?.close();
                                  }}
                                  style={styles.backButton}
                              >
                                  <MaterialIcons name="arrow-back" size={24} color={Colors[theme].text} />
                              </TouchableOpacity>
                          ),
                          headerTitle: () => null,
                          headerRight: () => (
                              <View style={{ flexDirection: "row", alignItems: "center" }}>
                                  <TouchableOpacity
                                      onPress={openModal}
                                      style={{
                                          backgroundColor: isModalOpen ? Colors[theme].disabled : Colors[theme].success,
                                          paddingVertical: 5,
                                          paddingHorizontal: 10,
                                          borderRadius: 5,
                                          marginRight: 10,
                                      }}
                                      disabled={isModalOpen}
                                  >
                                      <ThemedText style={{ color: Colors[theme].background, fontWeight: "bold" }}>
                                          {isModalOpen ? t("close_to_make_changes") : t("cards")}
                                      </ThemedText>
                                  </TouchableOpacity>
                                  <TouchableOpacity
                                      onPress={handleShareDeckImage}
                                      style={{
                                          backgroundColor: Colors[theme].info,
                                          paddingVertical: 5,
                                          paddingHorizontal: 10,
                                          borderRadius: 5,
                                          marginRight: 10,
                                      }}
                                  >
                                      <Ionicons name="share-social" size={22} color={Colors[theme].background} />
                                  </TouchableOpacity>
                                  <TouchableOpacity
                                      onPress={copyDeckToClipboard}
                                      style={{
                                          backgroundColor: Colors[theme].info,
                                          paddingVertical: 5,
                                          paddingHorizontal: 10,
                                          borderRadius: 5,
                                          marginRight: 10,
                                      }}
                                  >
                                      <ThemedText style={{ color: Colors[theme].background, fontWeight: "bold" }}>
                                          <Ionicons name="copy" size={22} color={Colors[theme].background} />
                                      </ThemedText>
                                  </TouchableOpacity>
                                  <TouchableOpacity
                                      style={{
                                          backgroundColor: Colors[theme].highlight,
                                          paddingVertical: 5,
                                          paddingHorizontal: 5,
                                          borderRadius: 5,
                                          marginRight: 10,
                                      }}
                                      onPress={() => {
                                          setIsEditing(!isEditing);
                                          setEditedName(deckDetail?.name || ""); // Reset name
                                          setEditedDescription(deckDetail?.description || ""); // Reset description
                                      }}
                                  >
                                      <MaterialIcons name="edit" size={24} color={Colors[theme].background} />
                                  </TouchableOpacity>
                                  <TouchableOpacity
                                      onPress={() => {
                                          setIsDeleteModalVisible(true);
                                      }}
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
                      }
                    : {
                          headerShown: true,
                          headerLeft: () => (
                              <TouchableOpacity
                                  onPress={() => {
                                      router.back();
                                  }}
                                  style={styles.backButton}
                              >
                                  <MaterialIcons name="arrow-back" size={24} color={Colors[theme].text} />
                              </TouchableOpacity>
                          ),
                          headerTitle: () => null,
                          headerRight: () => (
                              <View style={{ flexDirection: "row", alignItems: "center" }}>
                                  {" "}
                                  <TouchableOpacity
                                      onPress={handleShareDeckImage}
                                      style={{
                                          backgroundColor: Colors[theme].info,
                                          paddingVertical: 5,
                                          paddingHorizontal: 10,
                                          borderRadius: 5,
                                          marginRight: 10,
                                      }}
                                  >
                                      <Ionicons name="share-social" size={22} color={Colors[theme].background} />
                                  </TouchableOpacity>
                                  <TouchableOpacity
                                      onPress={copyDeckToClipboard}
                                      style={{
                                          backgroundColor: Colors[theme].info,
                                          paddingVertical: 5,
                                          paddingHorizontal: 10,
                                          borderRadius: 5,
                                          marginRight: 10,
                                      }}
                                  >
                                      <ThemedText style={{ color: Colors[theme].background, fontWeight: "bold" }}>
                                          <Ionicons name="copy" size={22} color={Colors[theme].background} />
                                      </ThemedText>
                                  </TouchableOpacity>
                                  <TouchableOpacity
                                      onPress={() => router.push(`/user/${deckDetail?.user_id}`)} // Navegar al perfil del usuario
                                      style={{
                                          backgroundColor: Colors[theme].success,
                                          paddingVertical: 5,
                                          paddingHorizontal: 10,
                                          borderRadius: 5,
                                          marginRight: 10,
                                          flexDirection: "row",
                                          gap: 3,
                                      }}
                                  >
                                      <IconUser style={{width:24, height: 24, color: Colors[theme].background }} />
                                      <ThemedText style={{ color: Colors[theme].background, fontWeight: "bold" }}>
                                          {t("User Profile")}
                                      </ThemedText>
                                  </TouchableOpacity>{" "}
                              </View>
                          ),
                      }
            );

            // Marca el header como listo
            setIsHeaderReady(true);
        } else {
            // Oculta el header si el componente no está listo
            navigation.setOptions({ headerShown: false });
            setIsHeaderReady(false);
        }
    }, [isReadyToRender, deckDetail, isOwner, theme, isModalOpen, navigation]);

    useEffect(() => {
        // Close all modals, including the delete modal, when navigating away
        return () => {
            modalizeRef.current?.close();
            setIsModalOpen(false);
            setIsDeleteModalVisible(false); // Close the delete modal
        };
    }, []);

    if (!isReadyToRender || !isHeaderReady) {
        // Bloquea el renderizado hasta que el header y el componente estén listos
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
            <View
                style={[
                    styles.pagination,
                    { marginBottom: Platform.OS === "web" ? 150 : 100 }, // Adjust margin based on platform
                ]}
            >
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
            {isSharing && (
                <Modal transparent visible animationType="fade">
                    <View
                        style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            justifyContent: "center",
                            alignItems: "center",
                            backgroundColor: "rgba(0,0,0,0.45)",
                            zIndex: 1000,
                        }}
                    >
                        <View
                            style={{
                                backgroundColor: Colors[theme].background,
                                padding: 32,
                                borderRadius: 20,
                                alignItems: "center",
                                minWidth: 220,
                                height: 270,
                            }}
                        >
                            <Ionicons
                                name="skull"
                                size={48}
                                color={Colors[theme].tint}
                                style={{
                                    marginBottom: 18,
                                }}
                            />
                            <Progress.Bar
                                progress={progress}
                                width={220}
                                color={Colors[theme].tint}
                                borderRadius={8}
                                height={16}
                                borderWidth={0}
                                unfilledColor={Colors[theme].backgroundSoft}
                                animated
                            />
                            <Text
                                style={{
                                    marginTop: 18,
                                    fontSize: 18,
                                    textAlign: "center",
                                    color: Colors[theme].text,
                                    fontWeight: "bold",
                                    letterSpacing: 1,
                                }}
                            >
                                {t("generating_deck_image") || "¡Generando imagen del mazo pirata!"}
                            </Text>
                            <Text
                                style={{
                                    marginTop: 18,
                                    fontSize: 18,
                                    textAlign: "center",
                                    color: Colors[theme].tabIconDefault,
                                    fontWeight: "bold",
                                    letterSpacing: 1,
                                }}
                            >
                                {t("may_take") || "¡Generando imagen del mazo pirata!"}
                            </Text>
                        </View>
                    </View>
                </Modal>
            )}

            <ScrollView
                style={[styles.container, { backgroundColor: Colors[theme].background }]}
                contentContainerStyle={{ paddingBottom: 150 }}
            >
                {isOwner && isEditing ? (
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
                            onPress={handleEditDeck} // Call handleEditDeck directly
                        >
                            <MaterialIcons name="check" size={24} color={Colors[theme].background} />
                        </TouchableOpacity>
                    </View>
                ) : (
                    <>
                        <ThemedText style={[styles.title, { color: Colors[theme].text }]}>{deckDetail.name}</ThemedText>
                        {deckDetail.description ? (
                            <ThemedText style={[styles.description, { color: Colors[theme].disabled }]}>
                                {deckDetail.description}
                            </ThemedText>
                        ) : null}
                    </>
                )}
                <Tags isOwner={isOwner} tags={tags} allTags={allTags} onTagToggle={handleTagToggle} />
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
                            <View key={item.id} style={styles.cardWrapper}>
                                <TouchableOpacity onPress={() => openImageModal(item.images_small)}>
                                    <View
                                        style={[
                                            styles.cardContainer,
                                            { borderColor: Colors[theme].backgroundSoft },
                                            item.is_leader
                                                ? { borderColor: Colors[theme].tint, transform: [{ scale: 1.1 }] }
                                                : {},
                                        ]}
                                    >
                                        <ExpoImage
                                            source={{ uri: item.images_thumb }}
                                            style={styles.cardImage}
                                            placeholder={require("../../../assets/images/card_placeholder.webp")}
                                            contentFit="contain"
                                            transition={300}
                                            cachePolicy="memory-disk"
                                        />

                                        {!item.is_leader ? (
                                            <View
                                                style={[
                                                    styles.quantityContainerBack,
                                                    { backgroundColor: Colors[theme].backgroundSoft },
                                                ]}
                                            >
                                                <View
                                                    style={[
                                                        styles.quantityContainer,
                                                        { backgroundColor: Colors[theme].tint },
                                                    ]}
                                                >
                                                    <Text
                                                        style={[
                                                            styles.quantityText,
                                                            { color: Colors[theme].backgroundSoft },
                                                        ]}
                                                    >
                                                        {item.quantity}
                                                    </Text>
                                                </View>
                                            </View>
                                        ) : null}
                                    </View>
                                </TouchableOpacity>
                                {isOwner && (
                                    <TouchableOpacity
                                        style={[
                                            styles.changeArtIcon,
                                            item.is_leader
                                                ? {
                                                      transform: [{ scale: 1.1 }],
                                                      bottom: -4,
                                                      left: -4,
                                                      backgroundColor: Colors[theme].tint,
                                                  }
                                                : { backgroundColor: Colors[theme].backgroundSoft },
                                        ]}
                                        onPress={() => {
                                            setSelectedCard(item);
                                            fetchRelatedCards(item.code);
                                        }}
                                    >
                                        <MaterialIcons name="palette" size={16} color={Colors[theme].text} />
                                    </TouchableOpacity>
                                )}
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
                                    total + (card.power && Number(card.power) >= 5000 ? card.quantity ?? 1 : 0),
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
                                cardImage={cardWithHighestX.images_thumb}
                                x={probabilityForCardWithHighestX?.x!}
                                probability={probabilityForCardWithHighestX?.probability!}
                            />
                        ) : (
                            <ThemedText
                                type="subtitle"
                                style={{
                                    color: Colors[theme].text,
                                    textAlign: "center",
                                    marginTop: 20,
                                }}
                            >
                                {t("no_searchers")}
                            </ThemedText>
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
            <ImageModal
                isVisible={isImageModalVisible}
                onClose={() => setIsImageModalVisible(false)}
                imageUri={selectedImage}
                theme={theme}
            />
            <CardSelectionModal
                isVisible={isModalVisible}
                onClose={() => setIsModalVisible(false)}
                relatedCards={relatedCards}
                onCardSelect={replaceCard}
                theme={theme}
                t={t}
            />
            <Modalize
                ref={modalizeRef}
                // snapPoint={100}
                closeSnapPointStraightEnabled={false}
                avoidKeyboardLikeIOS={true}
                keyboardAvoidingBehavior={Platform.OS === "ios" ? undefined : "height"}
                modalStyle={{ backgroundColor: Colors[theme].backgroundSoft }}
                velocity={8000} // gesto extremadamente rápido necesario
                threshold={200} // gesto muy largo también necesario si no supera velocity
                dragToss={0.01} // poca inercia, más control
                disableScrollIfPossible={true} // Desactiva el scroll si es necesario
                onBackButtonPress={() => isAtTop} // Solo permite cerrar si estás en la parte superior
                onOverlayPress={() => isAtTop} // Solo permite cerrar si estás en la parte superior
                onClose={() => {
                    console.log("Modalize onClose triggered");
                    setSearchQuery("");
                    setIsModalOpen(false);
                    if (hasDeckChanged()) {
                        console.log("Deck has changed, syncing...");
                        syncDeckCards();
                    }
                }}
                FooterComponent={<PaginationControls />}
                HeaderComponent={
                    <View style={[styles.containerModalize]}>
                        <View style={styles.searchContainer}>
                            <Text style={[styles.deckCardCount, { color: Colors[theme].text }]}>
                                <Text
                                    style={{
                                        fontWeight: "bold",
                                        color:
                                            deckCardCount === limitDeckNum
                                                ? Colors[theme].error
                                                : Colors[theme].success,
                                    }}
                                >
                                    {deckCardCount}
                                </Text>
                                <Text
                                    style={{
                                        fontWeight: "bold",
                                        color: Colors[theme].disabled,
                                    }}
                                >
                                    /{limitDeckNum}
                                </Text>
                            </Text>
                            <TextInput
                                style={[
                                    styles.searchInput,
                                    {
                                        borderColor: Colors[theme].TabBarBackground,
                                        color: Colors[theme].text,
                                    },
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
                            <TouchableOpacity
                                onPress={() => setShowSelectedCardsOnly((prev) => !prev)} // Toggle showing selected cards
                                style={styles.filterButton}
                                delayPressIn={0}
                            >
                                <MaterialIcons
                                    name={showSelectedCardsOnly ? "visibility" : "visibility-off"}
                                    size={24}
                                    color={showSelectedCardsOnly ? Colors[theme].info : Colors[theme].text}
                                />
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={{ maxHeight: 500 }} persistentScrollbar={true}>
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
                                        {t("type")}
                                    </ThemedText>
                                    <View style={styles.filtersContainer}>
                                        {["CHARACTER", "EVENT", "STAGE"].map((type) => (
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
                                    <ScrollView
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
                                    </ScrollView>
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
                flatListProps={{
                    data: filteredCards, // Remove slicing as pagination is now handled
                    keyExtractor: (card) => card.id,
                    renderItem: ({ item: card }) => (
                        <CardItem
                            card={card}
                            height={height}
                            imageStyle={imageStyle}
                            cardSizeOption={cardSizeOption}
                            theme={theme}
                            getQuantityControlsStyle={getQuantityControlsStyle}
                            updateCardQuantity={updateCardQuantity}
                            selectedQuantity={selectedQuantity}
                            limitDeckNum={limitDeckNum}
                            deckCardCount={deckCardCount}
                            loading={loading}
                            isAddDisabled={isAddDisabled}
                        />
                    ),
                    contentContainerStyle: [styles.cardList],
                    keyboardShouldPersistTaps: "handled", // Allow taps to propagate while the keyboard is open
                    showsVerticalScrollIndicator: true, // Ensure the vertical scroll indicator is visible
                    nestedScrollEnabled: true, // Allow nested scrolling
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
                onRequestClose={() => setIsDeleteModalVisible(false)} // Close modal on back press
            >
                <TouchableOpacity
                    style={styles.modalContainer}
                    activeOpacity={1}
                    onPressOut={() => setIsDeleteModalVisible(false)} // Close modal when clicking outside
                >
                    <View style={[styles.modalContent, { backgroundColor: Colors[theme].backgroundSoft }]}>
                        <View style={{ alignItems: "center", marginBottom: 20 }}>
                            <ThemedText type="subtitle" style={styles.modalText}>
                                {t("delete_confirmation")}
                            </ThemedText>
                            <ThemedText type="subtitle">🙄⚠️</ThemedText>
                        </View>
                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[
                                    styles.modalButton,
                                    { backgroundColor: Colors[theme].backgroundSoft, borderColor: Colors[theme].error },
                                ]}
                                onPress={() => setIsDeleteModalVisible(false)}
                            >
                                <ThemedText style={[styles.modalButtonText, { color: Colors[theme].error }]}>
                                    {t("no")}
                                </ThemedText>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[
                                    styles.modalButton,
                                    { backgroundColor: Colors[theme].success, borderColor: Colors[theme].success },
                                ]}
                                onPress={() => {
                                    handleDeleteDeck();
                                    setIsDeleteModalVisible(false);
                                }}
                            >
                                <ThemedText style={[styles.modalButtonText, { color: Colors[theme].text }]}>
                                    {t("yes")}
                                </ThemedText>
                            </TouchableOpacity>
                        </View>
                    </View>
                </TouchableOpacity>
            </Modal>
        </>
    );
}

interface DeckGridPreviewCard {
    image: string;
    quantity: number;
}

const DeckGridPreview: React.FC<{ cards: DeckGridPreviewCard[]; leaderName?: string }> = ({ cards, leaderName }) => {
    if (!cards.length) return null;

    // Suponemos que la primera carta es el líder
    const leader = cards[0];
    const rest = cards.slice(1);

    // Divide las cartas en filas de 4
    const rows = [];
    for (let i = 0; i < rest.length; i += 4) {
        rows.push(rest.slice(i, i + 4));
    }

    return (
        <View
            style={{
                paddingTop: 28,
                paddingBottom: 28,
                paddingHorizontal: 14,
                borderRadius: 18,
                minWidth: 260,
                maxWidth: 340,
                alignItems: "center",
                backgroundColor: "#2e2e2e", // Fondo fijo
                shadowColor: "#a84848", // Sombra roja OP
                shadowOpacity: 0.25,
                shadowRadius: 12,
                elevation: 8,
            }}
        >
            {/* Leader y logo en fila */}
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
                <ExpoImage
                    source={require("@/assets/images/OPLAB-logo.png")}
                    style={{ width: 48, height: 48, marginRight: 10 }}
                    contentFit="contain"
                />
                <View style={{ alignItems: "center" }}>
                    <ExpoImage
                        source={{ uri: leader.image }}
                        style={{
                            width: 84,
                            height: 116,
                            borderRadius: 10,
                            borderWidth: 3,
                            borderColor: "#a84848",
                            backgroundColor: "#fff",
                            marginBottom: 2,
                            shadowColor: "#a84848",
                            shadowOpacity: 0.4,
                            shadowRadius: 8,
                        }}
                        contentFit="contain"
                    />
                </View>
            </View>
            {/* Nombre del líder */}
            {leaderName && (
                <Text
                    style={{
                        fontSize: 17,
                        color: "#a84848",
                        fontWeight: "bold",
                        letterSpacing: 1,
                        marginBottom: 10,
                        textShadowColor: "#fff",
                        textShadowOffset: { width: 1, height: 1 },
                        textShadowRadius: 2,
                        fontFamily: "serif",
                    }}
                >
                    {leaderName}
                </Text>
            )}
            {/* Grid de cartas */}
            <View style={{ gap: 3 }}>
                {rows.map((row, rowIdx) => (
                    <View key={rowIdx} style={{ flexDirection: "row", justifyContent: "center", marginBottom: 3 }}>
                        {row.map((card, idx) => (
                            <View key={idx} style={{ marginHorizontal: 2 }}>
                                <ExpoImage
                                    source={{ uri: card.image }}
                                    style={{
                                        width: 40,
                                        height: 56,
                                        borderRadius: 4,
                                        borderWidth: 1.5,
                                        borderColor: Colors.light.tabIconDefault,
                                        backgroundColor: "#fff",
                                    }}
                                    contentFit="contain"
                                />
                                <View
                                    style={{
                                        position: "absolute",
                                        bottom: 2,
                                        right: 2,
                                        backgroundColor: "#a84848",
                                        borderRadius: 8,
                                        paddingHorizontal: 5,
                                        paddingVertical: 1,
                                        borderWidth: 1,
                                        borderColor: "#fff",
                                    }}
                                >
                                    <Text style={{ color: "#222", fontWeight: "bold", fontSize: 12 }}>
                                        {card.quantity}
                                    </Text>
                                </View>
                            </View>
                        ))}
                    </View>
                ))}
            </View>
        </View>
    );
};
// Componente CardItem para modularizar el renderizado de las cartas
const CardItem = React.memo(
    ({
        card,
        height,
        imageStyle,
        cardSizeOption,
        theme,
        getQuantityControlsStyle,
        updateCardQuantity,
        selectedQuantity,
        limitDeckNum,
        deckCardCount,
        loading,
        isAddDisabled,
    }: {
        card: Card;
        height: number;
        imageStyle: any;
        cardSizeOption: number;
        theme: string;
        getQuantityControlsStyle: () => any;
        updateCardQuantity: (cardId: string, change: number) => void;
        selectedQuantity: (cardId: string) => number;
        limitDeckNum: number; // Added limitDeckNum to the props
        deckCardCount: number; // Added deckCardCount to the props
        loading: boolean;
        isAddDisabled: (card: Card) => boolean; // Added isAddDisabled to the props
    }) => {
        const [imageLoaded, setImageLoaded] = useState(false);
        return (
            <View key={card.id}>
                <View
                    style={[
                        styles.cardContainerSearch,
                        { height },
                        cardSizeOption === 2 && [
                            styles.detailedCardContainer,
                            {
                                backgroundColor: Colors[theme as keyof typeof Colors].TabBarBackground,
                            },
                        ],
                    ]}
                >
                    <ExpoImage
                        source={{ uri: card.images_thumb }}
                        placeholder={require("@/assets/images/card_placeholder.webp")}
                        style={[styles.cardImage, imageStyle, loading && { opacity: 0.3 }]}
                        contentFit="contain"
                        // transition={300}
                        onLoadEnd={() => setImageLoaded(true)}
                        cachePolicy="memory-disk"
                    />
                    {!imageLoaded && (
                        <View
                            style={{
                                position: "absolute",
                                top: 3,
                                justifyContent: "flex-end",
                                alignItems: "center",
                                // backgroundColor: "rgba(0,0,0,0.2)",
                                paddingHorizontal: 8,
                            }}
                        >
                            <Text
                                style={{
                                    color: Colors[theme as keyof typeof Colors].tabIconDefault,
                                    fontWeight: "bold",
                                    fontSize: 14,
                                    textAlign: "center",
                                }}
                            >
                                {card.code}
                            </Text>
                        </View>
                    )}
                    <View style={[styles.quantityControls, getQuantityControlsStyle()]}>
                        <TouchableOpacity
                            onPress={() => updateCardQuantity(card.id, -1)}
                            disabled={selectedQuantity(card.id) <= 0} // Desactiva si la cantidad es 0 // Usar la prop aquí
                        >
                            <MaterialIcons
                                name="remove-circle-outline"
                                size={24}
                                color={
                                    selectedQuantity(card.id) > 0
                                        ? Colors[theme as keyof typeof Colors].icon
                                        : Colors[theme as keyof typeof Colors].disabled
                                }
                            />
                        </TouchableOpacity>
                        <ThemedText style={[styles.quantityTextSearch, { color: "white" }]}>
                            {selectedQuantity(card.id)}
                        </ThemedText>
                        <TouchableOpacity
                            onPress={() => updateCardQuantity(card.id, 1)}
                            disabled={
                                isAddDisabled(card) || // Verifica si el total de cartas con el mismo code alcanza 4
                                deckCardCount >= limitDeckNum || // Verifica si se alcanza el límite del deck
                                selectedQuantity(card.id) >= 4 // Verifica si la cantidad de la carta seleccionada es 4
                            }
                        >
                            <MaterialIcons
                                name="add-circle-outline"
                                size={24}
                                color={
                                    !isAddDisabled(card) &&
                                    deckCardCount < limitDeckNum &&
                                    selectedQuantity(card.id) < 4
                                        ? Colors[theme as keyof typeof Colors].icon
                                        : Colors[theme as keyof typeof Colors].disabled
                                }
                            />
                        </TouchableOpacity>
                    </View>
                    {cardSizeOption === 2 && (
                        <View style={styles.cardDetails}>
                            <View
                                style={[
                                    styles.cardRarityContainer,
                                    {
                                        backgroundColor: Colors[theme as keyof typeof Colors].background,
                                    },
                                ]}
                            >
                                <ThemedText
                                    style={[
                                        styles.cardRarity,
                                        {
                                            color: Colors[theme as keyof typeof Colors].icon,
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
                                            color: Colors[theme as keyof typeof Colors].tabIconDefault,
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
                                            color: Colors[theme as keyof typeof Colors].tabIconDefault,
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
            </View>
        );
    }
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
        marginBottom: 15,
        marginTop: 20,
    },
    description: {
        fontSize: 16,
        textAlign: "center",
        marginBottom: 20,
        padding: 12,
    },
    cardsContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "center",
        gap: 10,
        marginTop: 10,
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
        paddingTop: 15,
        paddingHorizontal: 10,
        // marginBottom: 65,
        display: "flex",
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
    cardWrapper: {
        position: "relative",
    },
    changeArtIcon: {
        position: "absolute",
        bottom: 2,
        left: 0,
        padding: 5,
        borderRadius: 5,
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
        textAlignVertical: "top", // clave para multiline
        marginBottom: 20,
        borderWidth: 1,
        borderColor: "#ccc",
        padding: 10,
        borderRadius: 5,
        width: "90%",
        maxWidth: 500,
        height: 120,
    },

    modalContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0, 0, 0, 0.719)",
    },
    modalContent: {
        width: "80%",
        borderRadius: 10,
        padding: 20,
        alignItems: "center",
        gap: 20,
    },
    modalText: {
        fontSize: 18,
        marginBottom: 10,
        textAlign: "center",
    },
    modalButtons: {
        flexDirection: "row",
        justifyContent: "space-between",
        width: "100%",
    },
    modalButton: {
        flex: 1,
        marginHorizontal: 5,
        paddingVertical: 10,
        borderRadius: 5,
        alignItems: "center",
        borderWidth: 1,
    },
    modalButtonText: {
        fontWeight: "bold",
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
    pagination: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%",
        paddingHorizontal: 10,
    },
    paginationIcon: {
        padding: 10,
        borderRadius: 5,
    },
    disabledIcon: {
        opacity: 0.5,
    },
    pageNumbersContainerCentered: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        flex: 1,
    },
    pageButton: {
        padding: 10,
        borderRadius: 5,
        marginHorizontal: 5,
    },
    pageButtonText: {
        fontWeight: "bold",
    },
});
