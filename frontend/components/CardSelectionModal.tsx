import React from "react";
import { Modal, Pressable, View, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { Image as ExpoImage } from "expo-image";
import { Colors } from "@/constants/Colors";
import { ThemedText } from "@/components/ThemedText";

interface Card {
    id: string;
    images_small: string;
    type: string; // Agregar las propiedades faltantes
    name: string;
    set_name: string;
    code: string;
    rarity: string;
    family?: string;
    quantity?: number;
    cost?: number;
    counter?: string | number;
    power?: string;
    ability?: string;
    color?: string;
    is_leader?: boolean;
    trigger?: boolean;
}

interface CardSelectionModalProps {
    isVisible: boolean;
    onClose: () => void;
    relatedCards: Card[];
    onCardSelect: (card: Card) => void;
    theme: keyof typeof Colors;
    t: (key: string) => string;
}

const CardSelectionModal: React.FC<CardSelectionModalProps> = ({
    isVisible,
    onClose,
    relatedCards,
    onCardSelect,
    theme,
    t,
}) => {
    return (
        <Modal visible={isVisible} animationType="fade" transparent>
            <Pressable onPress={onClose} style={styles.modalOverlay}>
                <View style={[styles.modalContent, { backgroundColor: Colors[theme].TabBarBackground }]}>
                    <ThemedText style={[styles.modalTitle, { color: Colors[theme].text }]}>
                        {t("change_art")}
                    </ThemedText>
                    <ScrollView contentContainerStyle={styles.cardList}>
                        {relatedCards.map((card) => (
                            <TouchableOpacity key={card.id} onPress={() => onCardSelect(card)} style={styles.card}>
                                <ExpoImage source={{ uri: card.images_small }} style={styles.cardImage} />
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                    <TouchableOpacity
                        onPress={onClose}
                        style={[styles.closeButton, { backgroundColor: Colors[theme].tabIconDefault }]}
                    >
                        <ThemedText style={[styles.closeButtonText, { color: Colors[theme].background }]}>
                            {t("close")}
                        </ThemedText>
                    </TouchableOpacity>
                </View>
            </Pressable>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.815)",
        justifyContent: "center",
        alignItems: "center",
    },
    modalContent: {
        width: "90%",
        maxHeight: "80%",
        borderRadius: 10,
        padding: 20,
        alignItems: "center",
        justifyContent: "center",
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 15,
    },
    cardList: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "center",
        gap: 20,
    },
    card: {
        width: 100,
        alignItems: "center",
        marginBottom: 15,
    },
    cardImage: {
        width: 97,
        height: 137,
        borderRadius: 5,
    },
    closeButton: {
        marginTop: 20,
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 5,
    },
    closeButtonText: {
        fontWeight: "bold",
    },
});

export default CardSelectionModal;
