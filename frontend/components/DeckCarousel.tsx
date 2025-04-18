import React from "react";
import { StyleSheet, View, Image, TouchableOpacity, Dimensions, FlatList, useWindowDimensions } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/ThemeContext";
import { Colors } from "@/constants/Colors";
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
    const { width } = useWindowDimensions(); // Obtener el ancho de la pantalla

    const renderDeckItem = ({ item }: { item: Deck }) => {
        const itemWidth = 90; // Cada elemento ocupa el 30% del ancho
        const itemHeight = 125; // Altura fija como antes

        if (item.id === "new") {
            return (
                <TouchableOpacity
                    style={[
                        styles.newDeckItem,
                        {backgroundColor: Colors[theme].background, borderColor: Colors[theme].highlight, width: itemWidth, height: itemHeight },
                    ]}
                    onPress={onNewDeckPress}
                >
                    <Ionicons name="add-circle-outline" size={itemWidth * 0.5} color={Colors[theme].tint} />
                    {/* <ThemedText style={styles.newDeckText}>{t("deck")}</ThemedText> */}
                </TouchableOpacity>
            );
        }

        return (
            <TouchableOpacity onPress={() => onDeckPress(item.id)}>
                <View style={[styles.deckItem, { width: itemWidth, height: itemHeight }]}>
                    {item.leaderCardImage ? (
                        <Image
                            source={{ uri: item.leaderCardImage }}
                            style={[styles.deckImage, { borderColor: Colors[theme].tint }]}
                            resizeMode="contain" // Mostrar toda la imagen sin recortarla
                        />
                    ) : null}
                    <ThemedText style={styles.deckName}>{item.name}</ThemedText>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View
            style={[
                styles.carouselContainer,
                { backgroundColor: Colors[theme].TabBarBackground, width: width * 0.95 }, // Limitar el ancho al 95% de la pantalla
            ]}
        >
            <FlatList
                data={decks}
                renderItem={renderDeckItem}
                keyExtractor={(item) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.carousel}
                ItemSeparatorComponent={() => <View style={{ width: width * 0.04 }} />} // Separación dinámica
            />
        </View>
    );
};

const styles = StyleSheet.create({
    carouselContainer: {
        paddingVertical: 15,
        borderRadius: 10,
        alignSelf: "center", // Centrar el contenedor en la pantalla
        overflow: "hidden", // Evitar que el contenido se desborde
    },
    carousel: {
        paddingHorizontal: "5%", // Margen horizontal dinámico
    },
    deckItem: {
        alignItems: "center",
        justifyContent: "flex-start",
        borderRadius: 5,
        overflow: "hidden", // Asegura que las imágenes no se desborden
    },
    newDeckItem: {
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 5,
        borderWidth: 2,
        padding: 10,
    },
    newDeckText: {
        fontSize: 12, // Ajustado para pantallas pequeñas
        textAlign: "center",
        fontWeight: "bold",
    },
    deckImage: {
        width: "100%",
        height: "100%", // Ajustar la imagen al tamaño completo del contenedor
        borderRadius: 5,
        borderWidth: 2,
        alignSelf: "center", // Centrar la imagen dentro del contenedor
    },
    deckName: {
        fontSize: 14, // Ajustado para pantallas pequeñas
        fontWeight: "bold",
        textAlign: "center",
        marginTop: 0,
    },
});

export default DeckCarousel;
