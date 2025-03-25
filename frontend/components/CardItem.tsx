import React, { useState } from "react";
import { View, TouchableOpacity, Image, StyleSheet, ActivityIndicator } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { Colors } from "@/constants/Colors";
import { useTheme } from "@/hooks/ThemeContext";

interface Card {
    id: string;
    code: string;
    images_small: string;
    name: string;
    set_name: string;
    type: string;
    rarity: string;
}

interface CardItemProps {
    item: Card;
    handleCardPress: (card: Card) => void;
    cardSizeOption: number;
    styles: any;
    Colors: any;
    theme: string;
}

const CardItem: React.FC<CardItemProps> = ({ item, handleCardPress, cardSizeOption, styles, Colors, theme }) => {
    const [loading, setLoading] = useState(true);

    // Determina las dimensiones y estilos según cardSizeOption
    const getCardDimensions = () => {
        switch (cardSizeOption) {
            case 0:
                return { height: 152, imageStyle: styles.smallCard };
            case 1:
                return { height: 239, imageStyle: styles.largeCard };
            case 2:
                return { height: 152, imageStyle: styles.smallCard };
            default:
                return { height: 152, imageStyle: styles.smallCard };
        }
    };

    const { height, imageStyle } = getCardDimensions();

    return (
        <TouchableOpacity onPress={() => handleCardPress(item)}>
            <View
                style={[
                    styles.cardContainer,
                    { height },
                    cardSizeOption === 2 && [
                        styles.detailedCardContainer,
                        { backgroundColor: Colors[theme].TabBarBackground },
                    ],
                ]}
            >
                {loading && (
                    <View style={{ height, opacity: 0.3 }}>
                        <Image
                            source={require("../assets/images/card_placeholder.webp")}
                            style={[styles.cardImage, imageStyle]}
                        />
                    </View>
                )}
                <Image
                    source={{ uri: item.images_small }}
                    style={[styles.cardImage, imageStyle]}
                    onLoadStart={() => setLoading(true)}
                    onLoadEnd={() => setLoading(false)}
                />
                {cardSizeOption === 2 && !loading && (
                    <View style={styles.cardDetails}>
                        <View style={[styles.cardRarityContainer, { backgroundColor: Colors[theme].background }]}>
                            <ThemedText style={[styles.cardRarity, { color: Colors[theme].icon }]}>
                                {item.rarity}
                            </ThemedText>
                        </View>
                        <View style={styles.cardHeader}>
                            <ThemedText style={styles.cardName} numberOfLines={1} ellipsizeMode="tail">
                                {item.name}
                            </ThemedText>
                            <ThemedText style={styles.cardCode}>{item.code}</ThemedText>
                        </View>
                        <View style={styles.cardFooter}>
                            <ThemedText style={[styles.cardType, { color: Colors[theme].tabIconDefault }]} numberOfLines={1}>
                                {item.type}
                            </ThemedText>
                            <ThemedText style={[styles.cardSet, { color: Colors[theme].tabIconDefault }]} numberOfLines={1}>
                                {item.set_name}
                            </ThemedText>
                        </View>
                    </View>
                )}
            </View>
        </TouchableOpacity>
    );
};

export default CardItem;
