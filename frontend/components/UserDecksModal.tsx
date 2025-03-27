import React from "react";
import { View, TouchableOpacity, Image, StyleSheet } from "react-native";
import { Modalize } from "react-native-modalize";
import { ThemedText } from "@/components/ThemedText";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/Colors";
import { useTheme } from "@/hooks/ThemeContext";
import { useTranslation } from "react-i18next";

interface UserDecksModalProps {
    modalizeRef: React.RefObject<Modalize>;
    userDecks: Array<{
        id: string;
        name: string;
        leaderCardImage: string;
        deck_cards: any[];
        totalCards: number;
    }>;
    cardId: string;
    quantity: number;
    handleAddCardToDeck: (deckId: string, totalQuantity: number, deckName: string) => void;
}

const UserDecksModal: React.FC<UserDecksModalProps> = ({
    modalizeRef,
    userDecks,
    cardId,
    quantity,
    handleAddCardToDeck,
}) => {
    const { theme } = useTheme();
    const { t } = useTranslation();

    return (
        <Modalize ref={modalizeRef} adjustToContentHeight>
            <View style={[styles.containerModalize, { backgroundColor: Colors[theme].TabBarBackground }]}>
                {userDecks.length > 0 ? (
                    <View style={styles.deckGrid}>
                        {userDecks.map((deck) => {
                            const existingCard = deck.deck_cards.find((card) => card.card_id === cardId);
                            const totalQuantity = existingCard
                                ? Math.min(quantity + existingCard.quantity, 4) - existingCard.quantity
                                : Math.min(quantity, 4);

                            return (
                                <TouchableOpacity
                                    key={deck.id}
                                    style={[styles.deckItem, { backgroundColor: Colors[theme].backgroundSoft }]}
                                    onPress={() => handleAddCardToDeck(deck.id, totalQuantity, deck.name)}
                                >
                                    {existingCard && (
                                        <View
                                            style={{
                                                position: "absolute",
                                                top: 10,
                                                right: 10,
                                                flexDirection: "row",
                                                alignItems: "center",
                                                gap: 4,
                                            }}
                                        >
                                            <ThemedText style={{ color: Colors[theme].tabIconDefault }}>
                                                {t("previouslyHad", { quantity: existingCard?.quantity })}
                                            </ThemedText>
                                            <Ionicons name="warning" size={30} color={Colors[theme].tabIconDefault} />
                                        </View>
                                    )}
                                    <View style={{ alignItems: "center" }}>
                                        <ThemedText style={styles.deckName}>{deck.name}</ThemedText>
                                        <Image source={{ uri: deck.leaderCardImage }} style={styles.smallCard} />
                                    </View>
                                    <View style={{ alignItems: "center" }}>
                                        <ThemedText style={styles.deckCards}>
                                            <ThemedText style={[styles.deckCards, { color: Colors[theme].tint }]}>
                                                {deck.totalCards}
                                            </ThemedText>
                                            /51
                                        </ThemedText>
                                        <Ionicons name="arrow-down" size={28} color={Colors[theme].background} />
                                        <ThemedText style={styles.deckCards}>
                                            <ThemedText style={[styles.deckCards, { color: Colors[theme].tint }]}>
                                                {deck.totalCards + totalQuantity}
                                            </ThemedText>
                                            /51
                                        </ThemedText>
                                    </View>

                                    <ThemedText type="title" style={{ color: Colors[theme].background }}>
                                        +
                                    </ThemedText>
                                    <ThemedText
                                        type="superTitle"
                                        style={{ color: Colors[theme].tint, marginLeft: -15 }}
                                    >
                                        {totalQuantity}
                                    </ThemedText>
                                    <ThemedText
                                        type="title"
                                        style={{
                                            color: Colors[theme].background,
                                            position: "relative",
                                            top: 5,
                                            right: 15,
                                        }}
                                    >
                                        {t("cards")}
                                    </ThemedText>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                ) : (
                    <ThemedText style={styles.noDecksText}>{t("no_decks_available")}</ThemedText>
                )}
            </View>
        </Modalize>
    );
};

const styles = StyleSheet.create({
    containerModalize: {
        padding: 20,
        marginBottom: 65,
    },
    deckGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
    },
    deckItem: {
        flexDirection: "row",
        width: "100%",
        borderRadius: 5,
        marginBottom: 15,
        padding: 10,
        alignItems: "center",
        justifyContent: "center",
        gap: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 3.84,
        elevation: 5,
    },
    smallCard: {
        width: 90,
        height: 125,
        borderRadius: 5,
        marginVertical: 5,
    },
    deckName: {
        fontSize: 20,
        fontWeight: "bold",
        textAlign: "center",
    },
    deckCards: {
        fontSize: 18,
        fontWeight: "bold",
        textAlign: "center",
    },
    noDecksText: {
        textAlign: "center",
        fontSize: 22,
        fontWeight: "bold",
        marginBottom: 200,
    },
});

export default UserDecksModal;
