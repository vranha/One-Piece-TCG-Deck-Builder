import React, { useState } from "react";
import { View, TouchableOpacity, Image, StyleSheet, ActivityIndicator } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { Colors } from "@/constants/Colors";
import { useTheme } from "@/hooks/ThemeContext";
import { MaterialIcons } from "@expo/vector-icons";

interface Card {
    id: string;
    code: string;
    images_small: string;
    name: string;
    set_name: string;
    type: string;
    rarity: string;
    color: string;
}

interface CardItemProps {
    item: Card;
    handleCardPress: (card: Card) => void;
    cardSizeOption: number;
    styles: any;
    Colors: any;
    theme: string;
    isSelectionEnabled: boolean;
    selectedQuantity: number;
    updateCardQuantity: (cardId: string, change: number, color:string) => void;
}

export default function CardItem({
    item,
    handleCardPress,
    cardSizeOption,
    styles,
    Colors,
    theme,
    isSelectionEnabled,
    selectedQuantity,
    updateCardQuantity,
}: CardItemProps) {
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

    const getQuantityControlsStyle = () => {
        switch (cardSizeOption) {
            case 0: // Small card
                return { bottom: 4, padding: 8 };
            case 1: // Large card
                return { bottom: 7, paddingHorizontal: 38 };
            case 2: // Detailed card
                return { bottom: 12, padding: 8, left: 15};
            default:
                return { bottom: 4, padding: 4 };
        }
    };

    const { height, imageStyle } = getCardDimensions();

    return (
        <View style={[styles.cardContainer, { alignItems: "center" }]}>
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
                                <ThemedText
                                    style={[styles.cardType, { color: Colors[theme].tabIconDefault }]}
                                    numberOfLines={1}
                                >
                                    {item.type}
                                </ThemedText>
                                <ThemedText
                                    style={[styles.cardSet, { color: Colors[theme].tabIconDefault }]}
                                    numberOfLines={1}
                                >
                                    {item.set_name}
                                </ThemedText>
                            </View>
                        </View>
                    )}
                </View>
            </TouchableOpacity>
            {(isSelectionEnabled && item.type !== 'LEADER') && (
                <View style={[styles.quantityControls, getQuantityControlsStyle()]}>
                    <TouchableOpacity onPress={() => updateCardQuantity(item.id, -1,item.color )}>
                        <MaterialIcons name="remove-circle-outline" size={24} color={Colors[theme].icon} />
                    </TouchableOpacity>
                    <ThemedText style={[styles.quantityText, {color: 'white'}]}>{selectedQuantity}</ThemedText>
                    <TouchableOpacity onPress={() => updateCardQuantity(item.id, 1, item.color)}>
                        <MaterialIcons name="add-circle-outline" size={24} color={Colors[theme].icon} />
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}
