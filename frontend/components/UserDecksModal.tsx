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
    cards: Array<{ cardId: string; quantity: number }>; // Accept an array of cards
    handleAddCardToDeck: (deckId: string, totalQuantity: number, deckName: string) => void;
    hasTabBar?: boolean;
}

const UserDecksModal: React.FC<UserDecksModalProps> = ({
    modalizeRef,
    userDecks,
    cards,
    handleAddCardToDeck,
    hasTabBar = false,
}) => {
    const { theme } = useTheme();
    const { t } = useTranslation();

    return (
        <Modalize ref={modalizeRef} adjustToContentHeight>
            <View
                style={[
                    styles.containerModalize,
                    { backgroundColor: Colors[theme].TabBarBackground, marginBottom: hasTabBar ? 64 : 0 },
                ]}
            >
                {userDecks.length > 0 ? (
                    <View style={styles.deckGrid}>
                        {userDecks.map((deck) => {
                            let totalQuantitySum = 0;
                            let showWarning = false;

                            cards.forEach(({ cardId, quantity }) => {
                                const existingCard = deck.deck_cards.find((card) => card.card_id === cardId);
                                const cardCode = existingCard?.cards?.code || ""; // Use card_code for validation
                                const totalQuantityForCode = deck.deck_cards
                                    .filter((card) => card.cards?.code === cardCode)
                                    .reduce((sum, card) => sum + card.quantity, 0);

                                const totalQuantity = totalQuantityForCode + quantity;

                                // If the total quantity for the same card_code exceeds 4, show a warning
                                if (totalQuantity > 4) {
                                    showWarning = true;
                                }

                                totalQuantitySum += Math.min(4 - totalQuantityForCode, quantity);
                            });

                            return (
                                <TouchableOpacity
                                    key={deck.id}
                                    style={[
                                        styles.deckItem,
                                        {
                                            backgroundColor: Colors[theme].backgroundSoft,
                                            opacity: showWarning || deck.totalCards + totalQuantitySum > 51 ? 0.4 : 1, // Reduce opacity if limit exceeded
                                        },
                                    ]}
                                    onPress={
                                        showWarning || deck.totalCards + totalQuantitySum > 51
                                            ? undefined // Disable onPress if limit exceeded
                                            : () => {
                                                  const totalQuantities: { [cardCode: string]: number } = {};

                                                  // Calculate total quantities for each card_code
                                                  cards.forEach(({ cardId, quantity }) => {
                                                      const existingCard = deck.deck_cards.find(
                                                          (card) => card.card_id === cardId
                                                      );
                                                      const cardCode = existingCard?.cards?.code || "";
                                                      const totalQuantityForCode = deck.deck_cards
                                                          .filter((card) => card.cards?.code === cardCode)
                                                          .reduce((sum, card) => sum + card.quantity, 0);

                                                      const totalQuantity = Math.min(
                                                          4 - totalQuantityForCode,
                                                          quantity
                                                      );

                                                      if (totalQuantity > 0) {
                                                          totalQuantities[cardCode] =
                                                              (totalQuantities[cardCode] || 0) + totalQuantity;
                                                      }
                                                  });

                                                  // Call handleAddCardToDeck only once per deck
                                                  if (Object.keys(totalQuantities).length > 0) {
                                                      handleAddCardToDeck(
                                                          deck.id,
                                                          Object.values(totalQuantities).reduce((a, b) => a + b, 0),
                                                          deck.name
                                                      );
                                                  }
                                              }
                                    }
                                >
                                    {showWarning && (
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
                                                {t("playset_complete")}
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
                                                {deck.totalCards + totalQuantitySum}
                                            </ThemedText>
                                            /51
                                        </ThemedText>
                                    </View>
                                    <ThemedText type="title" style={{ color: Colors[theme].background }}>
                                        +
                                    </ThemedText>
                                    <ThemedText type="superTitle" style={{ color: Colors[theme].tint }}>
                                        {totalQuantitySum}
                                    </ThemedText>
                                    <ThemedText
                                        type="title"
                                        style={{
                                            color: Colors[theme].background,
                                            position: "relative",
                                            top: 5,
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
        justifyContent: "space-around",
        gap: 5,
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
