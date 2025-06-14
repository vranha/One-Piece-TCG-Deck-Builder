import React, { useState } from "react";
import { View, TouchableOpacity } from "react-native";
import { Image as ExpoImage } from "expo-image";
import { ThemedText } from "@/components/ThemedText";
import { MaterialIcons } from "@expo/vector-icons";

interface Card {
    id: string;
    code: string;
    images_small: string;
    images_thumb: string;
    name: string;
    set_name: string;
    type: string;
    rarity: string;
    color: string[]; // Ahora color es un array de colores
}

interface CardItemProps {
    item: Card;
    handleCardPress: (card: Card) => void;
    cardSizeOption: number;
    styles: any;
    Colors: any;
    theme: string;
    loading: boolean;
    isSelectionEnabled: boolean;
    selectedQuantity: number;
    updateCardQuantity: (cardId: string, change: number, color: string) => void;
}

export default function CardItem({
    item,
    handleCardPress,
    cardSizeOption,
    styles,
    Colors,
    theme,
    loading,
    isSelectionEnabled,
    selectedQuantity,
    updateCardQuantity,
}: CardItemProps) {
    const [imageLoaded, setImageLoaded] = useState(false);

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
                return { bottom: 12, padding: 8, left: 15 };
            default:
                return { bottom: 4, padding: 4 };
        }
    };

    const { height, imageStyle } = getCardDimensions();

    // Usamos el primer color del array, o un color predeterminado si es necesario
    const cardColor = item.color[0]; // O puedes elegir otro color del array

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
                    {/* {loading && (
                        <View style={{ height, opacity: 0.3 }}>
                            <ExpoImage
                                source={require("../assets/images/card_placeholder.webp")}
                                style={[styles.cardImage, imageStyle]}
                                contentFit="contain"
                                transition={300}
                                cachePolicy="memory-disk"
                            />
                        </View>
                    )} */}
                    <ExpoImage
                        source={{ uri: item.images_thumb || item.images_small }}
                        placeholder={require("../assets/images/card_placeholder.webp")}
                        style={[styles.cardImage, imageStyle]}
                        contentFit="contain"
                        transition={300}
                        cachePolicy="memory-disk"
                        onLoadEnd={() => setImageLoaded(true)}
                    />
                                                        {!imageLoaded && (
                                                            <View
                                                                style={{
                                                                    position: "absolute",
                                                                    bottom: 5,
                                                                    justifyContent: "flex-end",
                                                                    alignItems: "center",
                                                                    // backgroundColor: "rgba(0,0,0,0.2)",
                                                                    paddingHorizontal: 8,
                                                                }}
                                                            >
                                                                <ThemedText
                                                                    style={{
                                                                        color: Colors[theme as keyof typeof Colors].tabIconDefault,
                                                                        fontWeight: "bold",
                                                                        fontSize: 14,
                                                                        textAlign: "center",
                                                                    }}
                                                                >
                                                                    {item.code}
                                                                </ThemedText>
                                                            </View>
                                                        )}
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
            {isSelectionEnabled && item.type !== "LEADER" && (
                <View style={[styles.quantityControls, getQuantityControlsStyle()]}>
                    <TouchableOpacity onPress={() => updateCardQuantity(item.id, -1, cardColor)}>
                        <MaterialIcons name="remove-circle-outline" size={24} color={Colors[theme].icon} />
                    </TouchableOpacity>
                    <ThemedText style={[styles.quantityText, { color: "white" }]}>{selectedQuantity}</ThemedText>
                    <TouchableOpacity onPress={() => updateCardQuantity(item.id, 1, cardColor)}>
                        <MaterialIcons name="add-circle-outline" size={24} color={Colors[theme].icon} />
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}
