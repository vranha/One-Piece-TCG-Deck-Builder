import React from "react";
import { StyleSheet, View, Image, TouchableOpacity, Dimensions } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/ThemeContext";
import { Colors } from "@/constants/Colors";
import Carousel from "react-native-reanimated-carousel";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

interface Deck {
    id: string;
    name: string;
    deck_colors: { color_id: number }[];
    leaderCardImage: string | null;
}

interface DeckCarouselProps {
    decks: Deck[];
    onNewDeckPress: () => void;
    onDeckPress: (deckId: string) => void;
}

const DeckCarousel: React.FC<DeckCarouselProps> = ({ decks, onNewDeckPress, onDeckPress }) => {
    const { theme } = useTheme();
    const { t } = useTranslation();

    const renderDeckItem = ({ item, index }: { item: Deck; index: number }) => {
        if (item.id === "new") {
            return (
                <TouchableOpacity style={[styles.newDeckItem, {borderColor: Colors[theme].tint}]} onPress={onNewDeckPress}>
                    <Ionicons name="add-circle-outline" size={50} color={Colors[theme].tint} />
                    <ThemedText style={[styles.newDeckText]}>{t("new_deck")}</ThemedText>
                </TouchableOpacity>
            );
        }

        return (
            <TouchableOpacity onPress={() => onDeckPress(item.id)}>
                <View style={styles.deckItem}>
                    {item.leaderCardImage ? (
                        <Image source={{ uri: item.leaderCardImage }} style={[styles.deckImage, {borderColor: Colors[theme].tint}]} />
                    ) : null}
                    <ThemedText style={styles.deckName}>{item.name}</ThemedText>
                </View>
            </TouchableOpacity>
        );
    };

    const windowWidth = Dimensions.get("window").width;
    const itemWidth = windowWidth / 3; // Tres elementos visibles

    return (
        <View style={[styles.carouselContainer, { backgroundColor: Colors[theme].TabBarBackground }]}>
            <Carousel
                loop={false}
                width={itemWidth}
                vertical={false}
                height={145}
                autoPlay={false}
                data={decks}
                renderItem={renderDeckItem}
                scrollAnimationDuration={1000}
                style={styles.carousel}
                mode="parallax"
                modeConfig={{
                    parallaxScrollingScale: 1,
                    parallaxScrollingOffset: 30,
                    parallaxAdjacentItemScale: 0.9,
                }}
                customConfig={() => ({ type: "positive", viewCount: 3 })}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    carouselContainer: {
        paddingVertical: 10,
        borderRadius: 10,
    },
    carousel: {
        width: Dimensions.get("window").width / 1.2,
    },
    deckItem: {
        alignItems: "center",
        justifyContent: "center",
    },
    newDeckItem: {
        alignItems: "center",
        justifyContent: "center",
        width: 100,
        height: 145,
        borderRadius: 5,
        borderWidth: 4,
        marginHorizontal: 10,
        paddingHorizontal: 5,
        gap: 10,
    },
    newDeckText: {
        fontSize: 16,
        textAlign: "center",
    },
    deckImage: {
        width: 90,
        height: 125,
        boxSizing: "content-box",
        borderRadius: 5,
        borderWidth: 4,
    },
    deckName: {
        fontSize: 16,
        fontWeight: "bold",
        letterSpacing: 1.5,
        textAlign: "center",
        flexWrap: "wrap",
        marginBottom: 0,
    },
});

export default DeckCarousel;
