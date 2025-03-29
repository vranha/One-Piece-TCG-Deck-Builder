import React from "react";
import { Modal, TouchableOpacity, View, ScrollView, StyleSheet } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { MaterialIcons } from "@expo/vector-icons";
import { Colors } from "@/constants/Colors";

interface SelectedCard {
    cardId: string;
    name: string;
    quantity: number;
    color: string;
}

interface SelectedCardsModalProps {
    isVisible: boolean;
    onClose: () => void;
    selectedCards: SelectedCard[];
    theme: "light" | "dark";
    decreaseCardQuantity: (cardId: string) => void;
    increaseCardQuantity: (cardId: string) => void;
    openUserDecksModal: () => void;
}

const SelectedCardsModal: React.FC<SelectedCardsModalProps> = ({
    isVisible,
    onClose,
    selectedCards,
    theme,
    decreaseCardQuantity,
    increaseCardQuantity,
    openUserDecksModal,
}) => {
    return (
        <Modal visible={isVisible} animationType="fade" transparent={true} onRequestClose={onClose}>
            <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
                <TouchableOpacity
                    style={[styles.modalContainer, { backgroundColor: Colors[theme].TabBarBackground }]}
                    activeOpacity={1}
                >
                    <ThemedText style={styles.modalTitle}>Cartas Seleccionadas</ThemedText>
                    <View style={styles.scrollContainer}>
                        <ScrollView style={styles.scrollView}>
                            <View style={styles.tableContainer}>
                                <View style={styles.tableHeader}>
                                    <ThemedText style={styles.tableHeaderText}>Nombre</ThemedText>
                                    <ThemedText style={styles.tableHeaderText}>Cantidad</ThemedText>
                                    <ThemedText style={styles.tableHeaderText}>Color</ThemedText>
                                </View>
                                {selectedCards.map((item) => (
                                    <View key={item.cardId} style={styles.tableRow}>
                                        <ThemedText style={styles.tableCell}>{item.name}</ThemedText>
                                        <ThemedText style={styles.tableCell}>{item.quantity}</ThemedText>
                                        <View
                                            style={[
                                                styles.colorIndicator,
                                                {
                                                    backgroundColor: item.color.toLowerCase(),
                                                    borderColor: Colors[theme].text,
                                                },
                                            ]}
                                        />
                                        <View style={styles.actionButtonsContainer}>
                                            <TouchableOpacity
                                                style={[
                                                    styles.iconButton,
                                                    { backgroundColor: Colors[theme].highlight },
                                                ]}
                                                onPress={() => decreaseCardQuantity(item.cardId)}
                                            >
                                                <MaterialIcons name="remove" size={16} color={Colors.light.text} />
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={[
                                                    styles.iconButton,
                                                    { backgroundColor: Colors[theme].highlight },
                                                ]}
                                                onPress={() => increaseCardQuantity(item.cardId)}
                                            >
                                                <MaterialIcons name="add" size={16} color={Colors.light.text} />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        </ScrollView>
                    </View>
                    <ThemedText type="subtitle" style={{ marginTop: 10 }}>
                        Total: {selectedCards.reduce((sum, card) => sum + card.quantity, 0)}
                    </ThemedText>
                    <View style={styles.buttonContainer}>
                        <TouchableOpacity
                            style={[styles.actionButton, { backgroundColor: Colors[theme].highlight }]}
                            onPress={openUserDecksModal}
                        >
                            <ThemedText style={styles.actionButtonText}>Deck</ThemedText>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.actionButton, { backgroundColor: Colors[theme].highlight }]}
                            onPress={() => console.log("Collection clicked")}
                        >
                            <ThemedText style={styles.actionButtonText}>Collection</ThemedText>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.actionButton, { backgroundColor: Colors[theme].highlight }]}
                            onPress={() => console.log("Wish clicked")}
                        >
                            <ThemedText style={styles.actionButtonText}>Wish</ThemedText>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </TouchableOpacity>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0, 0, 0, 0.712)",
    },
    modalContainer: {
        width: "90%",
        borderRadius: 10,
        padding: 20,
        alignItems: "center",
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 20,
        textAlign: "center",
    },
    scrollContainer: {
        maxHeight: 400,
        width: "100%",
    },
    scrollView: {
        width: "100%",
    },
    tableContainer: {
        width: "85%",
        marginTop: 10,
    },
    tableHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: Colors.light.icon,
    },
    tableHeaderText: {
        fontSize: 16,
        fontWeight: "bold",
        flex: 1,
        textAlign: "center",
    },
    tableRow: {
        flexDirection: "row",
        justifyContent: "space-around",
        paddingVertical: 8,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: Colors.light.icon,
    },
    tableCell: {
        fontSize: 14,
        flex: 1,
        textAlign: "left",
    },
    colorIndicator: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        alignSelf: "center",
    },
    actionButtonsContainer: {
        position: "absolute",
        top: "50%",
        right: "-20%",
        transform: [{ translateY: "-20%" }],
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
    },
    iconButton: {
        width: 24,
        height: 24,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
    },
    buttonContainer: {
        flexDirection: "row",
        justifyContent: "space-around",
        marginTop: 20,
        gap: 10,
    },
    actionButton: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
    },
    actionButtonText: {
        color: Colors.light.text,
        fontSize: 16,
        fontWeight: "bold",
    },
});

export default SelectedCardsModal;
