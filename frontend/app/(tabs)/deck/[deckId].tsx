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

    if (loading) {
        return (
            <View
                style={[
                    styles.container,
                    { backgroundColor: Colors[theme].background, height: Dimensions.get("window").height },
                ]}
            >
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

            <View
                style={[
                    styles.chartContainer,
                    { backgroundColor: Colors[theme].TabBarBackground, paddingHorizontal: 20 },
                ]}
            >
                <ThemedText type="subtitle">Counter Distribution</ThemedText>

                {/* Leyenda en forma de escalera */}
                <View
                    style={{
                        flexDirection: "row",
                        justifyContent: "flex-end",
                        alignItems: "flex-end",
                        marginBottom: 10,
                        gap: 30,
                    }}
                >
                    {/* Grupo 1: "+0" */}
                    <View style={{ alignItems: "center", gap: 3 }}>
                        <ThemedText style={{ fontSize: 12, color: Colors[theme].tabIconDefault, marginBottom: -5 }}>
                            +0
                        </ThemedText>
                        <View
                            style={{
                                width: 20,
                                height: 10,
                                borderRadius: 1,
                                backgroundColor: Colors[theme].tint,
                                opacity: 0.2, // Color del grupo 1
                            }}
                        />
                    </View>

                    {/* Grupo 2: "+1000" */}
                    <View style={{ alignItems: "center", gap: 3, marginTop: -10 }}>
                        <ThemedText style={{ fontSize: 12, color: Colors[theme].tabIconDefault, marginBottom: -5 }}>
                            +1000
                        </ThemedText>
                        <View
                            style={{
                                width: 20,
                                height: 10,
                                borderRadius: 1,
                                backgroundColor: Colors[theme].tint,
                                opacity: 0.4, // Color del grupo 2
                            }}
                        />
                    </View>

                    {/* Grupo 3: "+2000" */}
                    <View style={{ alignItems: "center", gap: 3, marginTop: -20 }}>
                        <ThemedText style={{ fontSize: 12, color: Colors[theme].tabIconDefault, marginBottom: -5 }}>
                            +2000
                        </ThemedText>
                        <View
                            style={{
                                width: 20,
                                height: 10,
                                borderRadius: 1,
                                backgroundColor: Colors[theme].tint,
                                opacity: 0.8, // Color del grupo 3
                            }}
                        />
                    </View>

                    {/* Grupo 4: "Counter Event" */}
                    <View style={{ alignItems: "center", gap: 3, marginTop: -30 }}>
                        <ThemedText style={{ fontSize: 12, color: Colors[theme].tabIconDefault, marginBottom: -5 }}>
                            Counter Event
                        </ThemedText>
                        <View
                            style={{
                                width: 20,
                                height: 10,
                                borderRadius: 1,
                                backgroundColor: Colors[theme].highlight,
                                opacity: 0.7, // Color del grupo 4
                            }}
                        />
                    </View>
                </View>

                {/* Barra horizontal */}
                {(deckDetail.cards.length ?? 0) > 0 ? (
                    <View
                        style={{
                            position: "relative", // Permite posicionar elementos dentro de este contenedor
                            height: 40, // Altura total para incluir la barra y los números
                            marginVertical: 10,
                        }}
                    >
                        {/* Barra horizontal */}
                        <View
                            style={{
                                flexDirection: "row",
                                height: 20,
                                borderRadius: 5,
                                overflow: "hidden",
                                borderWidth: 0,
                                borderColor: Colors[theme].tabIconDefault,
                            }}
                        >
                            <View
                                style={{
                                    flex: counterDistribution.noCounter,
                                    backgroundColor: Colors[theme].tint, // Color para el grupo 1
                                    opacity: 0.2,
                                }}
                            />
                            <View
                                style={{
                                    flex: counterDistribution.counter1000,
                                    backgroundColor: Colors[theme].tint, // Color para el grupo 2
                                    opacity: 0.4,
                                }}
                            />
                            <View
                                style={{
                                    flex: counterDistribution.counter2000,
                                    backgroundColor: Colors[theme].tint, // Color para el grupo 3
                                    opacity: 0.8,
                                }}
                            />
                            <View
                                style={{
                                    flex: counterDistribution.eventCounter,
                                    backgroundColor: Colors[theme].highlight, // Color para el grupo 4
                                    opacity: 0.7,
                                }}
                            />
                        </View>

                        {/* Números encima de cada sector */}
                        <View
                            style={{
                                position: "absolute",
                                bottom: 0,
                                left: 0,
                                right: 0,
                                flexDirection: "row",
                                justifyContent: "space-between",
                                alignItems: "center",
                            }}
                        >
                            {/* Grupo 1 */}
                            <View
                                style={{
                                    flex: counterDistribution.noCounter,
                                    alignItems: "center",
                                }}
                            >
                                <ThemedText style={{ fontSize: 12, color: Colors[theme].tabIconDefault }}>
                                    {counterDistribution.noCounter}
                                </ThemedText>
                            </View>

                            {/* Grupo 2 */}
                            <View
                                style={{
                                    flex: counterDistribution.counter1000,
                                    alignItems: "center",
                                }}
                            >
                                <ThemedText style={{ fontSize: 12, color: Colors[theme].tabIconDefault }}>
                                    {counterDistribution.counter1000}
                                </ThemedText>
                            </View>

                            {/* Grupo 3 */}
                            <View
                                style={{
                                    flex: counterDistribution.counter2000,
                                    alignItems: "center",
                                }}
                            >
                                <ThemedText style={{ fontSize: 12, color: Colors[theme].tabIconDefault }}>
                                    {counterDistribution.counter2000}
                                </ThemedText>
                            </View>

                            {/* Grupo 4 */}
                            <View
                                style={{
                                    flex: counterDistribution.eventCounter,
                                    alignItems: "center",
                                }}
                            >
                                <ThemedText style={{ fontSize: 12, color: Colors[theme].tabIconDefault }}>
                                    {counterDistribution.eventCounter}
                                </ThemedText>
                            </View>
                        </View>
                        {/* Textos de XXXX */}
                    </View>
                ) : (
                    <ThemedText style={{ color: Colors[theme].text }}>No cards to display</ThemedText>
                )}
                <View
                    style={{
                        alignSelf: "flex-end",
                        flexDirection: "row",
                        alignItems: "center",
                        flexWrap: "wrap",
                        marginBottom: 20,
                    }}
                >
                    <ThemedText style={{ fontWeight: "bold", color: Colors[theme].tabIconDefault }}>Events:</ThemedText>

                    {Object.entries(counterDistribution.eventCounterDetails).map(([xxxx, count]) => (
                        <View
                            key={xxxx}
                            style={{
                                flexDirection: "row",
                                borderRadius: 5,
                                overflow: "hidden", // Asegura que los bordes redondeados afecten ambos bloques de color
                                marginLeft: 5,
                            }}
                        >
                            {/* Primer fondo para el primer texto */}
                            <View
                                style={{
                                    backgroundColor: Colors[theme].highlight,
                                    opacity: 0.7,
                                    paddingLeft: 8,
                                    paddingRight: 5,
                                    paddingVertical: 2,
                                    borderTopLeftRadius: 5,
                                    borderBottomLeftRadius: 5,
                                }}
                            >
                                <ThemedText
                                    style={{ fontSize: 14, fontWeight: "bold", color: Colors[theme].TabBarBackground }}
                                >
                                    {`+${parseInt(xxxx)}:`}
                                </ThemedText>
                            </View>

                            {/* Segundo fondo para el segundo texto */}
                            <View
                                style={{
                                    backgroundColor: Colors[theme].text, // Color distinto para la segunda parte
                                    opacity: 0.8,
                                    paddingLeft: 5,
                                    paddingRight: 8,
                                    paddingVertical: 2,
                                    borderTopRightRadius: 5,
                                    borderBottomRightRadius: 5,
                                }}
                            >
                                <ThemedText
                                    style={{ fontSize: 14, fontWeight: "bold", color: Colors[theme].background }}
                                >
                                    {`${count}`}
                                </ThemedText>
                            </View>
                        </View>
                    ))}
                </View>
            </View>
            <View style={{ flexDirection: "row", justifyContent: "space-between", width: "100%", padding: 5, marginTop:20 }}>
                {/* Blockers */}
                <View
                    style={{
                        flexDirection: "row",
                        borderRadius: 5,
                        overflow: "hidden", // Asegura que los bordes redondeados afecten ambos bloques de color
                        marginLeft: 5,
                    }}
                >
                    {/* Primer fondo para el primer texto */}
                    <View
                        style={{
                            backgroundColor: Colors[theme].TabBarBackground,
                            paddingLeft: 10,
                            paddingRight: 7,
                            paddingVertical: 7,
                            borderTopLeftRadius: 5,
                            borderBottomLeftRadius: 5,
                        }}
                    >
                        <ThemedText style={{ fontSize: 14, fontWeight: "bold", color: Colors[theme].text }}>
                            Blockers:
                        </ThemedText>
                    </View>

                    {/* Segundo fondo para el segundo texto */}
                    <View
                        style={{
                            backgroundColor: Colors[theme].tint, // Color distinto para la segunda parte
                            paddingLeft: 7,
                            paddingRight: 10,
                            paddingVertical: 7,
                            borderTopRightRadius: 5,
                            borderBottomRightRadius: 5,
                        }}
                    >
                        <ThemedText style={{ fontSize: 14, fontWeight: "bold", color: Colors[theme].text }}>
                            {deckDetail.cards.reduce(
                                (total, card) => total + (card.ability?.includes("[Blocker]") ? card.quantity ?? 1 : 0),
                                0
                            )}
                        </ThemedText>
                    </View>
                </View>

                {/* Fighters */}
                <View
                    style={{
                        flexDirection: "row",
                        borderRadius: 5,
                        overflow: "hidden", // Asegura que los bordes redondeados afecten ambos bloques de color
                        marginLeft: 5,
                    }}
                >
                    {/* Primer fondo para el primer texto */}
                    <View
                        style={{
                            backgroundColor: Colors[theme].TabBarBackground,
                            paddingLeft: 10,
                            paddingRight: 7,
                            paddingVertical: 7,
                            borderTopLeftRadius: 5,
                            borderBottomLeftRadius: 5,
                        }}
                    >
                        <ThemedText style={{ fontSize: 14, fontWeight: "bold", color: Colors[theme].text }}>
                            +5k Card:
                        </ThemedText>
                    </View>

                    {/* Segundo fondo para el segundo texto */}
                    <View
                        style={{
                            backgroundColor: Colors[theme].tint, // Color distinto para la segunda parte
                            paddingLeft: 7,
                            paddingRight: 10,
                            paddingVertical: 7,
                            borderTopRightRadius: 5,
                            borderBottomRightRadius: 5,
                        }}
                    >
                        <ThemedText style={{ fontSize: 14, fontWeight: "bold", color: Colors[theme].text }}>
                            {deckDetail.cards.reduce(
                                (total, card) => total + (card.power > 5000 ? card.quantity ?? 1 : 0),
                                0
                            )}
                        </ThemedText>
                    </View>
                </View>

                {/* Events */}
                <View
                    style={{
                        flexDirection: "row",
                        borderRadius: 5,
                        overflow: "hidden", // Asegura que los bordes redondeados afecten ambos bloques de color
                        marginLeft: 5,
                    }}
                >
                    {/* Primer fondo para el primer texto */}
                    <View
                        style={{
                            backgroundColor: Colors[theme].TabBarBackground,
                            paddingLeft: 10,
                            paddingRight: 7,
                            paddingVertical: 7,
                            borderTopLeftRadius: 5,
                            borderBottomLeftRadius: 5,
                        }}
                    >
                        <ThemedText style={{ fontSize: 14, fontWeight: "bold", color: Colors[theme].text }}>
                            Events:
                        </ThemedText>
                    </View>

                    {/* Segundo fondo para el segundo texto */}
                    <View
                        style={{
                            backgroundColor: Colors[theme].tint, // Color distinto para la segunda parte
                            paddingLeft: 7,
                            paddingRight: 10,
                            paddingVertical: 7,
                            borderTopRightRadius: 5,
                            borderBottomRightRadius: 5,
                        }}
                    >
                        <ThemedText style={{ fontSize: 14, fontWeight: "bold", color: Colors[theme].text }}>
                            {deckDetail.cards.reduce(
                                (total, card) => total + (card.type === "EVENT" ? card.quantity ?? 1 : 0),
                                0
                            )}
                        </ThemedText>
                    </View>
                </View>
            </View>
            <View style={[styles.chartContainer, { backgroundColor: Colors[theme].TabBarBackground }]}>
                <View style={styles.titleContainerChart}>
                    <ThemedText style={{ paddingLeft: 20 }} type="subtitle">
                        Cost Curve
                    </ThemedText>
                    <ThemedText style={{ fontWeight: "bold", color: Colors[theme].tabIconDefault }}>
                        Average: {averageCost}
                    </ThemedText>
                </View>
                <BarChart
                    data={{
                        labels: ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10"],
                        datasets: [{ data: cardCosts }],
                    }}
                    width={Dimensions.get("window").width - 30} // Adjust width
                    height={180}
                    yAxisLabel=""
                    yAxisSuffix=" Cards"
                    fromZero={true} // Asegura que la escala empieza desde 0
                    chartConfig={{
                        backgroundColor: Colors[theme].TabBarBackground,
                        backgroundGradientFrom: Colors[theme].TabBarBackground,
                        backgroundGradientTo: Colors[theme].TabBarBackground,
                        decimalPlaces: 0,
                        barPercentage: 0.3,
                        color: (opacity = 1) => "#446fcc",
                        labelColor: (opacity = 1) => Colors[theme].tabIconDefault,
                        style: { borderRadius: 16 },
                        // propsForDots: { r: "6", strokeWidth: "2", stroke: Colors[theme].tint },
                    }}
                    style={{ marginVertical: 20, borderRadius: 16, alignSelf: "center" }}
                    showValuesOnTopOfBars
                    showBarTops={false}
                    withInnerLines={false}
                />
            </View>
            <View style={[styles.chartContainer, { backgroundColor: Colors[theme].TabBarBackground }]}>
                <View style={styles.titleContainerChart}>
                    <ThemedText style={{ paddingLeft: 20 }} type="subtitle">
                        Power Curve
                    </ThemedText>
                    <ThemedText style={{ fontWeight: "bold", color: Colors[theme].tabIconDefault }}>
                        Average: {averagePower}
                    </ThemedText>
                </View>
                <BarChart
                    data={{
                        labels: ["0k", "1k", "2k", "3k", "4k", "5k", "6k", "7k", "8k", "9k", "+10k"],
                        datasets: [{ data: cardPowers }],
                    }}
                    width={Dimensions.get("window").width - 30} // Adjust width
                    height={180}
                    yAxisLabel=""
                    yAxisSuffix=" Cards"
                    fromZero={true} // Asegura que la escala empieza desde 0
                    chartConfig={{
                        backgroundColor: Colors[theme].TabBarBackground,
                        backgroundGradientFrom: Colors[theme].TabBarBackground,
                        backgroundGradientTo: Colors[theme].TabBarBackground,
                        decimalPlaces: 0,
                        barPercentage: 0.3,
                        color: (opacity = 1) => "#cc44cc",
                        labelColor: (opacity = 1) => Colors[theme].tabIconDefault,
                        style: { borderRadius: 16 },
                        // propsForDots: { r: "6", strokeWidth: "2", stroke: Colors[theme].tint },
                    }}
                    style={{ marginVertical: 20, borderRadius: 16, alignSelf: "center" }}
                    showValuesOnTopOfBars
                    showBarTops={false}
                    withInnerLines={false}
                />
            </View>
            <View style={[styles.chartContainer, { backgroundColor: Colors[theme].TabBarBackground }]}>
                <View style={styles.titleContainerChart}>
                    <ThemedText style={{ paddingLeft: 20 }} type="subtitle">
                        Archetype
                    </ThemedText>
                </View>
                <View style={{ alignItems: "center", flexDirection: "row" }}>
                    <PieChart
                        data={familyDistribution}
                        width={120}
                        height={120}
                        chartConfig={{
                            backgroundColor: Colors[theme].TabBarBackground,
                            backgroundGradientFrom: Colors[theme].TabBarBackground,
                            backgroundGradientTo: Colors[theme].TabBarBackground,
                            color: (opacity = 1) => Colors[theme].tint,
                            labelColor: (opacity = 1) => Colors[theme].text,
                        }}
                        accessor={"count"}
                        backgroundColor={"transparent"}
                        paddingLeft={"40"}
                        hasLegend={false}
                        // center={[-20, 0]}
                    />
                    <View style={styles.pyeDetails}>
                        <View style={styles.pyeDetailsUnit}>
                            <ThemedText style={{ paddingLeft: 20, color: familyDistribution[0].color }}>
                                {familyDistribution[0].name} -{" "}
                                {(
                                    (familyDistribution[0].count /
                                        deckDetail.cards
                                            .filter((card) => card.type !== "LEADER") // Excluye las cartas de tipo LEADER
                                            .reduce((total, card) => total + (card.quantity ?? 1), 0)) *
                                    100
                                ).toFixed(1)}
                                %
                            </ThemedText>
                            <View style={[styles.pyeColor, { backgroundColor: familyDistribution[0].color }]}></View>
                        </View>
                        <View style={styles.pyeDetailsUnit}>
                            <ThemedText style={{ paddingLeft: 20, color: familyDistribution[1].color }}>
                                {familyDistribution[1].name} -{" "}
                                {(
                                    (familyDistribution[1].count /
                                        deckDetail.cards
                                            .filter((card) => card.type !== "LEADER") // Excluye las cartas de tipo LEADER
                                            .reduce((total, card) => total + (card.quantity ?? 1), 0)) *
                                    100
                                ).toFixed(1)}
                                %
                            </ThemedText>
                            <View style={[styles.pyeColor, { backgroundColor: familyDistribution[1].color }]}></View>
                        </View>
                    </View>
                </View>
                {cardWithHighestX ? (
                    <View style={styles.searcherContainer}>
                        <Image
                            source={{ uri: cardWithHighestX?.images_small || "" }}
                            style={{ width: 80, height: 115, borderRadius: 5, opacity: 0.8 }}
                        />
                        <View style={styles.statsContainer}>
                            <ThemedText type="subtitle" style={{ fontWeight: "bold", marginBottom: 12 }}>
                                Searcher
                            </ThemedText>
                            <View style={styles.statItem}>
                                <Ionicons name="search" size={16} color={Colors[theme].tint} />
                                <ThemedText style={[styles.statText, { color: Colors[theme].tabIconDefault }]}>
                                    {probabilityForCardWithHighestX?.x} cards
                                </ThemedText>
                            </View>

                            <View style={styles.statItem}>
                                <Ionicons name="bar-chart" size={16} color={Colors[theme].tint} />
                                <ThemedText style={[styles.statText, { color: Colors[theme].tabIconDefault }]}>
                                    {probabilityForCardWithHighestX?.probability.toFixed(2)}% Success rate
                                </ThemedText>
                            </View>
                        </View>
                    </View>
                ) : (
                    <ThemedText style={{ color: Colors[theme].text }}>No searchers</ThemedText>
                )}
            </View>
            <View style={[styles.chartContainer, { backgroundColor: Colors[theme].TabBarBackground }]}>
                <View style={styles.titleContainerChartTrigger}>
                    <ThemedText style={{ paddingLeft: 20 }} type="subtitle">
                        Num. of
                    </ThemedText>
                    <View>
                        <ThemedText
                            type="subtitle"
                            style={{
                                backgroundColor: "#ddd345",
                                color: "black",
                                borderRadius: 10,
                                paddingHorizontal: 6,
                                paddingVertical: 3,
                            }}
                        >
                            Triggers
                        </ThemedText>
                    </View>
                    <ThemedText type="subtitle">in lifes</ThemedText>
                </View>
                <View style={{ alignItems: "center", justifyContent: "flex-start", flexDirection: "row", gap: 30 }}>
                    <View
                        style={{
                            flexDirection: "column",
                            marginVertical: 20,
                            gap: 5,
                            alignItems: "flex-start",
                            minWidth: 150,
                        }}
                    >
                        {triggerProbabilities.map(({ triggers, probability }) => (
                            <View key={triggers} style={{ flexDirection: "row", alignItems: "center" }}>
                                {/* Etiqueta a la izquierda de la barra */}
                                <ThemedText
                                    style={{
                                        fontSize: 12,
                                        color: Colors[theme].text,
                                        // width: 30,
                                        textAlign: "right",
                                        marginRight: 10,
                                        marginLeft: 20,
                                    }}
                                >
                                    {triggers} Tr:
                                </ThemedText>

                                {/* Barra amarilla horizontal */}
                                <View
                                    style={{
                                        height: 20, // Altura fija para cada barra
                                        width: (probability / 100) * 110, // Ancho proporcional a la probabilidad
                                        backgroundColor: "#ddd345", // Color amarillo
                                        borderRadius: 5,
                                    }}
                                />

                                {/* Etiqueta de porcentaje al final de la barra */}
                                <ThemedText
                                    style={{
                                        fontSize: 12,
                                        fontWeight: "bold",
                                        color: Colors[theme].tabIconDefault,
                                        marginLeft: 10,
                                    }}
                                >
                                    {probability.toFixed(2)}%
                                </ThemedText>
                            </View>
                        ))}
                    </View>
                    <View style={{ justifyContent: "flex-start", alignSelf: "flex-end", gap: 10, marginBottom: 50 }}>
                        <ThemedText
                            type="title"
                            style={{ textAlign: "center", color: Colors[theme].text, marginBottom: -8 }}
                        >
                            Triggers
                        </ThemedText>
                        <ThemedText
                            type="subtitle"
                            style={{ textAlign: "center", color: Colors[theme].tabIconDefault }}
                        >
                            in deck
                        </ThemedText>
                        {/* <Ionicons name="return-down-forward" size ={30} color={Colors[theme].text} style={{position:'absolute', top:30,left:10}}/> */}
                        <ThemedText type="title" style={{ textAlign: "center", color: "#ddd345" }}>
                            {deckDetail.cards.reduce((total, card) => total + (card.trigger ? card.quantity : 0), 0)}
                        </ThemedText>
                    </View>
                </View>
            </View>
        </ScrollView>
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
    chartContainer: {
        marginTop: 20,
        paddingTop: 20,
        borderRadius: 15,
        fontSize: 16,
        fontWeight: "bold",
    },
    titleContainerChart: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-end",
        width: "95%",
    },
    titleContainerChartTrigger: {
        flexDirection: "row",
        justifyContent: "flex-start",
        alignItems: "center",
        width: "95%",
        gap: 6,
    },
    pyeDetails: {
        justifyContent: "flex-start",
        alignItems: "flex-end",
        gap: 10,
        marginLeft: 0,
        marginTop: -20,
    },
    pyeDetailsUnit: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
    },
    pyeColor: {
        width: 15,
        height: 15,
        borderRadius: 10,
    },
    searcherContainer: {
        flexDirection: "row",
        marginTop: 10,
        justifyContent: "center",
        alignItems: "center",
        gap: 15,
        paddingBottom: 20,
    },
    statsContainer: {
        gap: 2,
        marginTop: 0,
    },
    statItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    statText: {
        fontWeight: "bold",
        // color: Colors[theme].tint,
    },
});
