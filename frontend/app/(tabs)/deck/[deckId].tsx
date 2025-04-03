import React, { useEffect, useState } from "react";
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
                color: Colors[theme].text, // Color para el resto de las cartas
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

    const result = getProbabilityForCardWithHighestX();

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
            <View style={[styles.chartContainer, { backgroundColor: Colors[theme].TabBarBackground }]}>
                <View style={styles.titleContainerChart}>
                    <ThemedText style={{ paddingLeft: 20 }} type="subtitle">
                        Cost Curve
                    </ThemedText>
                    <ThemedText style={{ fontWeight: "bold", color: Colors[theme].tabIconDefault }}>
                        Average: {calculateAverageCost()}
                    </ThemedText>
                </View>
                <BarChart
                    data={{
                        labels: ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10"],
                        datasets: [{ data: calculateCardCosts() }],
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
                        Average: {calculateAveragePower()}
                    </ThemedText>
                </View>
                <BarChart
                    data={{
                        labels: ["0k", "1k", "2k", "3k", "4k", "5k", "6k", "7k", "8k", "9k", "+10k"],
                        datasets: [{ data: calculateCardPowers() }],
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
                        Family Distribution
                    </ThemedText>
                </View>
                <View style={{ alignItems: "center", flexDirection: "row" }}>
                    <PieChart
                        data={calculateFamilyDistribution()}
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
                            <ThemedText style={{ paddingLeft: 20, color: calculateFamilyDistribution()[0].color }}>
                                {calculateFamilyDistribution()[0].name} -{" "}
                                {(
                                    (calculateFamilyDistribution()[0].count /
                                        deckDetail.cards
                                            .filter((card) => card.type !== "LEADER") // Excluye las cartas de tipo LEADER
                                            .reduce((total, card) => total + (card.quantity ?? 1), 0)) *
                                    100
                                ).toFixed(1)}
                                %
                            </ThemedText>
                            <View
                                style={[styles.pyeColor, { backgroundColor: calculateFamilyDistribution()[0].color }]}
                            ></View>
                        </View>
                        <View style={styles.pyeDetailsUnit}>
                            <ThemedText style={{ paddingLeft: 20, color: calculateFamilyDistribution()[1].color }}>
                                {calculateFamilyDistribution()[1].name} -{" "}
                                {(
                                    (calculateFamilyDistribution()[1].count /
                                        deckDetail.cards
                                            .filter((card) => card.type !== "LEADER") // Excluye las cartas de tipo LEADER
                                            .reduce((total, card) => total + (card.quantity ?? 1), 0)) *
                                    100
                                ).toFixed(1)}
                                %
                            </ThemedText>
                            <View
                                style={[styles.pyeColor, { backgroundColor: calculateFamilyDistribution()[1].color }]}
                            ></View>
                        </View>
                    </View>
                </View>
                {findCardWithHighestX() ? (
                    <View style={styles.searcherContainer}>
                        <Image
                            source={{ uri: findCardWithHighestX()?.images_small || "" }}
                            style={{ width: 80, height: 115, borderRadius: 5 }}
                        />
                        <View style={styles.statsContainer}>
                            <ThemedText type="subtitle" style={{ fontWeight: "bold", marginBottom: -2 }}>
                                Searcher
                            </ThemedText>
                            <View style={styles.statItem}>
                                <Ionicons name="search" size={16} color={Colors[theme].tint} />
                                <ThemedText style={[styles.statText, {color: Colors[theme].tabIconDefault}]}>{result?.x} searched</ThemedText>
                            </View>

                            <View style={styles.statItem}>
                                <Ionicons name="bar-chart" size={16} color={Colors[theme].tint} />
                                <ThemedText style={[styles.statText, {color: Colors[theme].tabIconDefault}]}>{result?.probability.toFixed(2)}%</ThemedText>
                            </View>
                        </View>
                    </View>
                ) : (
                    <ThemedText style={{ color: Colors[theme].text }}>No searchers</ThemedText>
                )}
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
        marginVertical: 8,
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
        gap: 30,
        paddingBottom: 20,
    },
    statsContainer: {
        gap: 15,
        marginTop: 10,
    },
    statItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
    },
    statText: {
        fontWeight: "bold",
        // color: Colors[theme].tint,
    },
});
