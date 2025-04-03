import React from "react";
import { Modal, TouchableOpacity, View, ScrollView, StyleSheet, Pressable } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { MaterialIcons } from "@expo/vector-icons";
import { Colors } from "@/constants/Colors";
import useStore from "@/store/useStore";
import { useTranslation } from "react-i18next";

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
    decreaseCardQuantity: (cardId: string, color: string, name: string) => void;
    increaseCardQuantity: (cardId: string, color: string, name: string) => void;
    openUserDecksModal: () => void;
}

const SelectedCardsModal: React.FC<SelectedCardsModalProps> = ({
    isVisible,
    onClose,
    // selectedCards,
    theme,
    // decreaseCardQuantity,
    // increaseCardQuantity,
    openUserDecksModal,
}) => {
    const { selectedCards, updateCardQuantity } = useStore();
    const { t } = useTranslation();

    const decreaseCardQuantity = (cardId: string, color: string, name: string) => {
        updateCardQuantity(cardId, -1, color, name);
    };

    const increaseCardQuantity = (cardId: string, color: string, name: string) => {
        updateCardQuantity(cardId, 1, color, name);
    };

    return (
        <Modal
            visible={isVisible}
            animationType="fade"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                {/* Backdrop que cierra la modal */}
                <Pressable style={styles.backdrop} onPress={onClose} />
                <View style={[styles.modalContainer, { backgroundColor: Colors[theme].TabBarBackground }]}>
                    <ThemedText style={styles.modalTitle}>{t('your_selection')}</ThemedText>
                    <View style={styles.scrollContainer}>
                        <ScrollView 
                            style={styles.scrollView} 
                            contentContainerStyle={styles.scrollViewContent}
                            keyboardShouldPersistTaps="handled"
                        >
                            <View style={styles.tableContainer}>
                                <View style={styles.tableHeader}>
                                    <ThemedText style={[styles.tableHeaderText, { color: Colors[theme].disabled }]}>
                                    {t('name')}
                                    </ThemedText>
                                    <ThemedText style={[styles.tableHeaderText, { color: Colors[theme].disabled }]}>
                                    {t('quantity')}
                                    </ThemedText>
                                    <ThemedText style={[styles.tableHeaderText, { color: Colors[theme].disabled }]}>
                                    { t('color')}
                                    </ThemedText>
                                </View>
                                {selectedCards.map((item) => (
                                    <View
                                        key={item.cardId}
                                        style={[styles.tableRow, { borderColor: Colors[theme].backgroundSoft }]}
                                    >
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
                                            <Pressable
                                                style={[styles.iconButton, { backgroundColor: Colors[theme].backgroundSoft }]}
                                                onPress={() => decreaseCardQuantity(item.cardId, item.color, item.name)}
                                            >
                                                <MaterialIcons name="remove" size={16} color={Colors[theme].background} />
                                            </Pressable>
                                            <Pressable
                                                style={[styles.iconButton, { backgroundColor: Colors[theme].backgroundSoft }]}
                                                onPress={() => increaseCardQuantity(item.cardId, item.color, item.name)}
                                            >
                                                <MaterialIcons name="add" size={16} color={Colors[theme].background} />
                                            </Pressable>
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
                        <Pressable
                            style={[styles.actionButton, { backgroundColor: Colors[theme].backgroundSoft }]}
                            onPress={openUserDecksModal}
                        >
                            <ThemedText style={[styles.actionButtonText, { color: Colors[theme].tint }]}>{t('deck')}</ThemedText>
                        </Pressable>
                        <Pressable
                            style={[styles.actionButton, { backgroundColor: Colors[theme].backgroundSoft }]}
                            onPress={() => console.log("Collection clicked")}
                        >
                            <ThemedText style={[styles.actionButtonText, { color: Colors[theme].tint }]}>{t('collection')}</ThemedText>
                        </Pressable>
                        <Pressable
                            style={[styles.actionButton, { backgroundColor: Colors[theme].backgroundSoft }]}
                            onPress={() => console.log("Wish clicked")}
                        >
                            <ThemedText style={[styles.actionButtonText, { color: Colors[theme].tint }]}>{t('wish')}</ThemedText>
                        </Pressable>
                    </View>
                </View>
            </View>
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
    backdrop: {
        ...StyleSheet.absoluteFillObject,
    },
    modalContainer: {
        width: "90%",
        borderRadius: 10,
        padding: 20,
        paddingHorizontal: 10,
        alignItems: "center",
        zIndex: 2,
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
    scrollViewContent: {
        paddingBottom: 20,
    },
    tableContainer: {
        width: "100%",
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
        textAlign: "left",
        marginLeft: 10,
    },
    tableRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 8,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        gap: 10,
    },
    tableCell: {
        flex: 1,
        fontSize: 14,
    },
    colorIndicator: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 1,
        alignSelf: "center",
    },
    actionButtonsContainer: {
        flexDirection: "row",
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
        fontSize: 16,
        fontWeight: "bold",
    },
});

export default SelectedCardsModal;