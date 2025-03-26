import React, { useEffect, useState } from "react";
import { View, Image, StyleSheet, ActivityIndicator, TouchableOpacity, TextInput, LogBox } from "react-native";
import { useNavigation, useLocalSearchParams, useRouter } from "expo-router";
import { Colors } from "@/constants/Colors";
import { useTheme } from "@/hooks/ThemeContext";
import useApi from "@/hooks/useApi";
import { ThemedText } from "@/components/ThemedText";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import FormattedAbility from "@/hooks/useFormattedAbility";
import useDividerStyle from "@/hooks/useDividerStyle";
import useResponsiveFontSize from "@/hooks/useResponsiveFontSize";
import { LinearGradient } from "expo-linear-gradient";
import CustomNumericInput from "@/components/CustomNumericInput";

LogBox.ignoreLogs(["TNodeChildrenRenderer: Support for defaultProps will be removed"]);

interface CardDetail {
    id: string;
    name: string;
    cost: number;
    power: number;
    counter: string;
    type: string;
    code: string;
    images_large: string;
    ability: string;
    rarity: string;
    attribute_image: string;
    attribute_name: string;
    trigger: string;
    color: string;
    family: string;
}

export default function CardDetailScreen() {
    const { theme } = useTheme();
    const api = useApi();
    const { cardId, cardName } = useLocalSearchParams();
    const [cardDetail, setCardDetail] = useState<CardDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedButton, setSelectedButton] = useState("Deck");
    const [quantity, setQuantity] = useState(0);
    const navigation = useNavigation();
    const router = useRouter();

    useEffect(() => {
        const fetchCardDetail = async () => {
            try {
                const response = await api.get(`/cards/${cardId}`);
                setCardDetail(response.data);
            } catch (error: any) {
                console.error("Error fetching card detail:", error.response?.data || error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchCardDetail();
    }, [cardId]);

    useEffect(() => {
        navigation.setOptions({
            headerShown: true,
            title: cardName,
            headerLeft: () => (
                <TouchableOpacity onPress={() => router.push("/search")} style={styles.backButton}>
                    <MaterialIcons name="arrow-back" size={24} color={Colors[theme].text} />
                </TouchableOpacity>
            ),
            headerTitle: () => (
                <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                    <ThemedText style={[styles.cardName, { color: Colors[theme].text }]}>{cardName}</ThemedText>
                </View>
            ),
        });
    }, [navigation, cardName, theme]);

    const hasPower = cardDetail?.type === "CHARACTER" || cardDetail?.type === "LEADER";
    const dividerStyle = useDividerStyle(cardDetail?.color || "");
    const familyFontSize = useResponsiveFontSize(cardDetail?.family || "");

    const handleQuantityChange = (value: number) => {
        if (value >= 0 && value <= 4) {
            setQuantity(value);
        }
    };

    if (loading) {
        return (
            <View style={[styles.container, { backgroundColor: Colors[theme].background }]}>
                <ActivityIndicator size="large" color={Colors[theme].tint} />
            </View>
        );
    }

    if (!cardDetail) {
        return (
            <View style={[styles.container, { backgroundColor: Colors[theme].background }]}>
                <ThemedText style={{ color: Colors[theme].text }}>No se encontró la carta.</ThemedText>
            </View>
        );
    }

    return (
        <>
            <View style={{ padding: 4, backgroundColor: Colors[theme].background }}>
                {/* Contenedor de botones y input de números */}
                <View style={styles.buttonContainer}>
                    <TouchableOpacity
                        style={[
                            styles.optionButton,
                            styles.firstOptionButton,
                            {backgroundColor: '#edc398'},
                            selectedButton !== "Deck" && { backgroundColor: '#645140'},
                        ]}
                        onPress={() => setSelectedButton("Deck")}
                    >
                        <ThemedText style={[styles.optionButtonText, {color: Colors[theme].background}]}>Deck</ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[
                            styles.optionButton,
                            {backgroundColor: '#edc398'},
                            selectedButton !== "WishList" && { backgroundColor: '#645140'},
                        ]}
                        onPress={() => setSelectedButton("WishList")}
                    >
                        <ThemedText style={[styles.optionButtonText, {color: Colors[theme].background}]}>Wish</ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[
                            styles.optionButton,
                            styles.lastOptionButton,
                            {backgroundColor: '#edc398'},
                            selectedButton !== "Collection" && { backgroundColor: '#645140'},
                        ]}
                        onPress={() => setSelectedButton("Collection")}
                    >
                        <ThemedText style={[styles.optionButtonText, {color: Colors[theme].background}]}>Collect</ThemedText>
                    </TouchableOpacity>
                    <CustomNumericInput value={quantity} onChange={handleQuantityChange} />
                    <TouchableOpacity style={[styles.addButton, {backgroundColor: Colors[theme].tint}]}>
                    <Ionicons name="checkmark" size={24} color={Colors[theme].text} />
                    </TouchableOpacity>
                </View>
            </View>
            <View style={[styles.container, { backgroundColor: Colors[theme].background }]}>
                {/* Contenedor principal con stats e imagen */}
                <View style={styles.cardContainer}>
                    {/* Columna Izquierda (Stats) */}
                    <View style={[styles.statsContainer, { backgroundColor: Colors[theme].TabBarBackground }]}>
                        <View style={{ alignItems: "center" }}>
                            <Image source={{ uri: cardDetail.attribute_image }} style={styles.attributeImage} />
                            <ThemedText style={styles.attributeText}>{cardDetail.attribute_name}</ThemedText>
                            <ThemedText type="subtitle" style={styles.statType}>
                                {cardDetail.type}
                            </ThemedText>
                        </View>
                        <View style={{ alignItems: "center" }}>
                            <ThemedText style={[styles.statTitle, { color: Colors[theme].icon }]}>Cost</ThemedText>
                            <ThemedText style={styles.statText}>{cardDetail.cost}</ThemedText>
                        </View>
                        {hasPower && (
                            <View style={{ alignItems: "center" }}>
                                <ThemedText style={[styles.statTitle, { color: Colors[theme].icon }]}>Power</ThemedText>
                                <ThemedText style={styles.statText}>{cardDetail.power}</ThemedText>
                            </View>
                        )}
                        <View style={{ alignItems: "center" }}>
                            <ThemedText style={[styles.statTitle, { color: Colors[theme].icon }]}>Counter</ThemedText>
                            <ThemedText style={styles.statText}>
                                {cardDetail.counter !== "-" ? `+${cardDetail.counter}` : ""}
                            </ThemedText>
                        </View>
                        <View style={styles.codeRarityContainer}>
                            <ThemedText style={styles.codeText}>{cardDetail.code}</ThemedText>
                            <ThemedText style={[styles.rarityText, { backgroundColor: dividerStyle.color }]}>
                                {cardDetail.rarity}
                            </ThemedText>
                        </View>
                    </View>

                    {/* Columna Derecha (Imagen) */}
                    <Image source={{ uri: cardDetail.images_large }} style={styles.cardImage} />
                </View>

                <ThemedText
                    type="title"
                    style={{
                        textAlign: "center",
                        width: "100%",
                        fontSize: familyFontSize,
                    }}
                >
                    {cardDetail.family}
                </ThemedText>

                {/* Descripción */}
                <View style={styles.descriptionContainer}>
                    {dividerStyle.type === "gradient" ? (
                        <LinearGradient
                            colors={dividerStyle.colors as [string, string, ...string[]]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.divider}
                        />
                    ) : (
                        <View style={[styles.divider, { backgroundColor: dividerStyle.color }]} />
                    )}
                    {cardDetail.ability !== "-" ? (
                        <View
                            style={{
                                alignItems: "flex-start",
                                backgroundColor: Colors[theme].TabBarBackground,
                                borderRadius: 5,
                                padding: 12,
                            }}
                        >
                            <FormattedAbility text={cardDetail.ability} />
                        </View>
                    ) : (
                        <ThemedText style={{ textAlign: "center", width: "100%" }} type="subtitle">
                            --No Effect--
                        </ThemedText>
                    )}
                    {cardDetail.trigger ? (
                        <View
                            style={{
                                alignItems: "flex-start",
                                backgroundColor: Colors[theme].icon,
                                borderRadius: 5,
                                padding: 12,
                            }}
                        >
                            <FormattedAbility trigger text={cardDetail.trigger} />
                        </View>
                    ) : null}
                    {dividerStyle.type === "gradient" ? (
                        <LinearGradient
                            colors={dividerStyle.colors as [string, string, ...string[]]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.divider}
                        />
                    ) : (
                        <View style={[styles.divider, { backgroundColor: dividerStyle.color }]} />
                    )}
                </View>
            </View>
        </>
    );
}

export const options = {
    tabBarItemStyle: { display: "none" },
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 10,
    },
    backButton: {
        marginRight: 12,
        marginLeft: 12,
    },
    cardName: {
        fontSize: 24,
        fontWeight: "bold",
    },
    buttonContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 10,
    },
    optionButton: {
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderRadius: 5,
        borderTopLeftRadius: 0,
        borderBottomLeftRadius: 0,
        borderTopRightRadius: 0,
        borderBottomRightRadius: 0,
        transform: [{ skewX: "-20deg" }],
        borderWidth: 2,
    },
    optionButtonText: {
        fontSize: 16,
        fontWeight: "bold",
        transform: [{ skewX: "20deg" }],
    },
    firstOptionButton: {
        borderTopLeftRadius: 10,
        borderBottomLeftRadius: 10,
        borderTopRightRadius: 0,
        borderBottomRightRadius: 0,
    },
    lastOptionButton: {
        borderTopRightRadius: 10,
        borderBottomRightRadius: 10,
    },
    addButton: {
        paddingHorizontal: 10,
        paddingVertical: 7,
        borderRadius: 5,
    },
    cardContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 16,
        gap: 10,
    },
    statsContainer: {
        flex: 1,
        justifyContent: "space-between",
        alignItems: "center",
        height: 320, // Hace que ocupe todo el alto del contenedor
        paddingTop: 12,
        paddingBottom: 8,
        paddingHorizontal: 12,
        borderRadius: 10,
    },
    attributeImage: {
        width: 24,
        height: 24,
    },
    statTitle: {
        fontSize: 18,
        fontWeight: "600",
        // paddingHorizontal: 10,
        // paddingVertical: 0,
        marginVertical: 2,
        // borderRadius: 5,
    },
    statText: {
        fontSize: 22,
        fontWeight: "600",

        // padding: 2,
        letterSpacing: 2,
    },
    statType: {
        fontSize: 18,
        fontWeight: "600",
    },
    codeRarityContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%",
    },
    codeText: {
        fontSize: 16,
        fontWeight: "600",
        textAlign: "center",
    },
    rarityText: {
        fontSize: 12,
        fontWeight: "600",
        color: "#FFFFFF",
        position: "absolute",
        bottom: 0,
        right: 0,
        paddingHorizontal: 6,
        paddingVertical: 0,
        borderRadius: 5,
    },
    attributeText: {
        marginTop: -6,
        marginBottom: -6,
        fontSize: 10,
    },
    cardImage: {
        width: 224,
        height: 320,
        borderRadius: 10,
    },
    descriptionContainer: {
        marginTop: 0,
        paddingVertical: 10,
        paddingHorizontal: 15,
        gap: 10,
    },
    divider: {
        paddingHorizontal: 3,
        paddingVertical: 1,
        borderRadius: 5,
        marginVertical: 5,
    },
    cardDescription: {
        fontSize: 16,
        color: "#FFFFFF",
    },
});
