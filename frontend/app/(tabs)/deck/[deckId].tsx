import React, { useEffect, useState, useMemo } from "react";
import {
    View,
    StyleSheet,
    ActivityIndicator,
    TouchableOpacity,
    Image,
    Text,
    ScrollView,
    Dimensions,
} from "react-native";
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
        setDeckDetail(null); // Reset deckDetail when deckId changes
        setLoading(true); // Reset loading state
    }, [deckId]);

    useEffect(() => {
        const fetchDeckDetail = async () => {
            try {
                const response = await api.get(`/deckById/${deckId}`);
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
        if (!deckDetail) return; // Avoid setting options if deckDetail is null

        navigation.setOptions({
            headerShown: true,
            title: deckDetail.name,
            headerLeft: () => (
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <MaterialIcons name="arrow-back" size={24} color={Colors[theme].text} />
                </TouchableOpacity>
            ),
        });
    }, [deckDetail?.name, theme]); // Only depend on deckDetail.name and theme

    const calculateCardCosts = () => {
        const costCounts = Array(11).fill(0); // Array para costos de 0 a 10

        deckDetail?.cards.forEach((card) => {
            if (card.type === "LEADER") return; // Excluye las cartas de tipo 'LEADER'
            const cost = card.cost ?? 0; // Trata null como 0
            const quantity = card.quantity ?? 1; // Si no hay quantity, asume 1
            if (cost >= 0 && cost <= 10) {
                costCounts[cost] += quantity; // Suma el quantity al índice correspondiente
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

            totalCost += cost * quantity; // Suma el poder total considerando la cantidad
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

            if (power >= 0 && power < 10000) {
                const index = Math.floor(power / 1000); // Convierte 1000 -> 1, 2000 -> 2, ..., 9000 -> 9
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

            totalPower += power * quantity; // Suma el poder total considerando la cantidad
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
        const totalCards = deckDetail?.cards
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
    const triggerProbabilities = calculateTriggerProbabilities(leaderLifes);

    const familyDistribution = useMemo(() => calculateFamilyDistribution(), [deckDetail]);
    const cardWithHighestX = useMemo(() => findCardWithHighestX(), [deckDetail]);
    const probabilityForCardWithHighestX = useMemo(() => getProbabilityForCardWithHighestX(), [deckDetail]);
    const counterDistribution = useMemo(() => calculateCounterDistribution(), [deckDetail]);
    const cardCosts = useMemo(() => calculateCardCosts(), [deckDetail]);
    const cardPowers = useMemo(() => calculateCardPowers(), [deckDetail]);
    const averageCost = useMemo(() => calculateAverageCost(), [deckDetail]);
    const averagePower = useMemo(() => calculateAveragePower(), [deckDetail]);

    const nonLeaderCards = deckDetail?.cards.filter((card) => card.type !== "LEADER") ?? [];

    if (loading) {
        return <LoadingIndicator />;
    }

    if (!deckDetail) {
        return <NoDeckFound />;
    }

    return (
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
                        return (a.cost ?? 0) - (b.cost ?? 0); // Ordenar por costo
                    })
                    .map((item) => (
                        <View
                            key={item.id}
                            style={[
                                styles.cardContainer,
                                { borderColor: Colors[theme].TabBarBackground },
                                item.is_leader ? { borderColor: Colors[theme].tint, transform: [{ scale: 1.1 }] } : {},
                            ]}
                        >
                            <Image source={{ uri: item.images_small }} style={styles.cardImage} />
                            <View style={[styles.quantityContainer, { backgroundColor: Colors[theme].tint }]}>
                                <Text style={styles.quantityText}>{item.quantity}</Text>
                            </View>
                        </View>
                    ))}
            </View>

            <View
                style={{ flexDirection: "row", height: 20, marginVertical: 10, borderRadius: 5, overflow: "hidden" }}
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
                            (total, card) => total + (card.power > 5000 ? card.quantity ?? 1 : 0),
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
                        <ThemedText style={{ color: Colors[theme].text }}>No searchers</ThemedText>
                    )}
                    <TriggerChart
                        triggerProbabilities={triggerProbabilities}
                        totalTriggers={deckDetail.cards.reduce(
                            (total, card) => total + (card.trigger ? card.quantity : 0),
                            0
                        )}
                        theme={theme}
                    />
                </>
            )}
        </ScrollView>
    );
}

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
        textAlign: "center",
        marginBottom: 20,
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
