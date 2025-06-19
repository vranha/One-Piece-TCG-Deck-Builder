import React, { useEffect, useState, useRef } from "react";
import { View, Image, StyleSheet, ActivityIndicator, TouchableOpacity, LogBox } from "react-native";
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
import { Modalize } from "react-native-modalize";
import { supabase } from "@/supabaseClient";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScrollView } from "react-native-gesture-handler";
import { useTranslation } from "react-i18next";
import Toast from "react-native-toast-message";
import CardOptions from "@/components/CardOptions";
import CardStats from "@/components/CardStats";
import CardDescription from "@/components/CardDescription";
import UserDecksModal from "@/components/UserDecksModal";

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
    const { t } = useTranslation();
    const { cardId, cardName } = useLocalSearchParams();
    const [cardDetail, setCardDetail] = useState<CardDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedButton, setSelectedButton] = useState("Deck");
    const [quantity, setQuantity] = useState(1);
    const navigation = useNavigation();
    const router = useRouter();
    const modalizeRef = useRef<Modalize>(null);
    const [userDecks, setUserDecks] = useState([]);
    const [userId, setUserId] = useState<string | null>(null);

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

    useEffect(() => {
        const fetchCardDetail = async () => {
            try {
                const response = await api.get(`/cards/${cardId}`);
                console.log("cardId", cardId);
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
    const dividerStyle = useDividerStyle([cardDetail?.color || ""]);
    const familyFontSize = useResponsiveFontSize(cardDetail?.family || "");

    const handleQuantityChange = (value: number) => {
        if (value >= 1 && value <= 4) {
            setQuantity(value);
        }
    };

    const fetchUserDecks = async () => {
        if (!userId || !cardDetail) return;

        // Suponiendo que cardDetail.color ahora es un array de colores
        const cardColors = Array.isArray(cardDetail.color) ? cardDetail.color : [cardDetail.color];

        // Mapeamos los colores a sus correspondientes ID
        const colorNameToId = { red: 1, blue: 2, green: 3, yellow: 4, purple: 5, black: 6 };

        // Convertimos los colores de la carta en color_ids (asegurándonos que estén en minúsculas)
        const colorIds = cardColors
            .map((color) => colorNameToId[color.toLowerCase() as keyof typeof colorNameToId])
            .filter((id) => id); // Filtramos cualquier color que no tenga un ID correspondiente

        // Verificamos si hay más de 2 colores
        if (colorIds.length > 2) {
            Toast.show({
                type: "error",
                text1: t("No se pueden seleccionar más de 2 colores."),
            });
            return;
        }

        try {
            const response = await api.get(`/decks/${userId}`);
            const allDecks = response.data.data;

            // Filtramos los mazos que contienen al menos uno de los colores correspondientes
            const filteredDecks = allDecks.filter((deck: { deck_colors: { color_id: number }[] }) =>
                deck.deck_colors.some((color) => colorIds.includes(color.color_id))
            );

            setUserDecks(filteredDecks);
            console.log(filteredDecks);
        } catch (error: any) {
            console.error("Error fetching user decks:", error.response?.data || error.message);
        }
    };

    const handleAddButtonPress = () => {
        if (selectedButton === "Deck") {
            fetchUserDecks();
            modalizeRef.current?.open();
        }
    };

    const handleAddCardToDeck = async (deckId: string, totalQuantity: number, deckName: string) => {
        try {
            console.log("dadasda", deckId, cardId, totalQuantity); // Hacer el POST a /decks/cards
            const response = await api.post("/decks/cards", {
                deckId: deckId.toString(),
                cardId: cardId,
                quantity: totalQuantity,
            });

            if (response.status === 200 || response.status === 201) {
                // Mostrar un mensaje de éxito
                Toast.show({
                    type: "success",
                    text1: t("cardAddedToDeck", { deckName }),
                });

                // Cerrar el modal
                modalizeRef.current?.close();
            }
        } catch (error: any) {
            console.error("Error adding card to deck:", error.response?.data || error.message);

            // Mostrar un mensaje de error
            Toast.show({
                type: "error",
                text1: t("error"),
                text2: t("errorAddingCard"),
            });
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

    const cardsToAdd = [{ cardId: Array.isArray(cardId) ? cardId[0] : cardId, quantity }];

    return (
        <>
            <ScrollView
                contentContainerStyle={{ flexGrow: 1, paddingBottom: 80 }}
                style={{ backgroundColor: Colors[theme].background }}
            >
                <View style={{ padding: 4, backgroundColor: Colors[theme].background }}>
                    {cardDetail.type !== "LEADER" && (
                        <CardOptions
                            selectedButton={selectedButton}
                            setSelectedButton={setSelectedButton}
                            quantity={quantity}
                            onQuantityChange={handleQuantityChange}
                            onAddButtonPress={handleAddButtonPress}
                        />
                    )}
                </View>
                <View style={[styles.container, { backgroundColor: Colors[theme].background }]}>
                    <View>

                    <CardStats
                        cardDetail={cardDetail}
                        hasPower={hasPower}
                        dividerStyle={{ color: dividerStyle.color || "#000" }}
                    />
                                    <View style={styles.codeRarityContainer}>
                                        <ThemedText style={[styles.codeText,  { backgroundColor: dividerStyle.color, shadowColor: dividerStyle.color, color:Colors[theme].background }]}>{cardDetail.code}</ThemedText>
                                        <View
                                            style={[
                                                styles.rarityBadge,
                                                { backgroundColor: dividerStyle.color, shadowColor: dividerStyle.color },
                                            ]}
                                        >
                                            <ThemedText style={[styles.rarityText, {color: Colors[theme].background}]}>{cardDetail.rarity}</ThemedText>
                                        </View>
                                    </View>
                    </View>
                    <ThemedText
                        type="title"
                        style={{
                            textAlign: "center",
                            width: "100%",
                            fontSize: familyFontSize,
                            marginBottom: 15,
                        }}
                    >
                        {cardDetail.family}
                    </ThemedText>
                    <CardDescription
                        cardDetail={cardDetail}
                        dividerStyle={{ ...dividerStyle, color: dividerStyle.color || "#000" }}
                    />
                </View>
            </ScrollView>
            <UserDecksModal
                modalizeRef={modalizeRef}
                userDecks={userDecks}
                cards={cardsToAdd}
                handleAddCardToDeck={handleAddCardToDeck}
                hasTabBar={true}
            />
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
       codeRarityContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "flex-end",
        width: "100%",
        gap:5,
        marginTop: -10,
        marginBottom: 10,
        paddingRight: 10,
    },
    codeText: {
        fontSize: 15,
        fontWeight: "600",
        textAlign: "center",
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 2,
        // opacity: 0.7,
    },
    rarityBadge: {
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 2,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.18,
        shadowRadius: 4,
        elevation: 2,
    },
    rarityText: {
        fontSize: 13,
        fontWeight: "700",
        color: "#FFFFFF",
        letterSpacing: 1,
    },
});
