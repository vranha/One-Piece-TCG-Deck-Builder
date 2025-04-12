import React, { useState } from "react";
import { View, Pressable, StyleSheet, ScrollView, Clipboard, Image, Modal, TouchableOpacity } from "react-native";
import { Colors } from "../constants/Colors";
import { useTheme } from "@/hooks/ThemeContext";
import useApi from "@/hooks/useApi";
import { LinearGradient } from "expo-linear-gradient";
import { ThemedText } from "./ThemedText";

interface ImportDeckModalProps {
    visible: boolean;
    onClose: () => void;
    onImport: (cards: { quantity: number; code: string; color: string[]; name: string }[]) => void;
}

export default function ImportDeckModal({ visible, onClose, onImport }: ImportDeckModalProps) {
    const [deckString, setDeckString] = useState("");
    const [parsedCards, setParsedCards] = useState<
        {
            quantity: number;
            code: string;
            images_small?: string | null;
            color?: string[] | null;
            name?: string | null;
        }[]
    >([]);
    const [error, setError] = useState("");
    const { theme } = useTheme();
    const api = useApi();

    const handlePaste = async () => {
        const clipboardContent = await Clipboard.getString();
        const lines = clipboardContent.split("\n").filter((line) => line.trim() !== "");
        const cards = [];

        for (const line of lines) {
            const match = line.match(/^([1-4])x([A-Z]{2}\d{2}-\d{3})$/);
            if (!match) {
                setError("Deck format not recognized");
                setParsedCards([]);
                return;
            }
            const [, quantity, code] = match;
            cards.push({ quantity: parseInt(quantity, 10), code });
        }

        try {
            const codes = cards.map((card) => card.code).join(",");
            const response = await api.get(`/cards/by-codes/${codes}`);
            const fetchedCards: {
                code: string;
                images_small?: string | null;
                color?: string[] | null;
                name?: string;
            }[] = response.data;

            const mergedCards = cards.map((card) => {
                const fetchedCard = fetchedCards.find((f) => f.code === card.code);
                return {
                    ...card,
                    images_small: fetchedCard?.images_small || null,
                    color: fetchedCard?.color?.map((c) => c.toLowerCase()) || null,
                    name: fetchedCard?.name || null,
                };
            });

            setError("");
            setDeckString(clipboardContent);
            setParsedCards(mergedCards);
        } catch (error) {
            console.error("Error fetching cards:", error);
            setError("Failed to fetch card details");
        }
    };

    const handleImport = () => {
        if (parsedCards.length > 0) {
            onImport(
                parsedCards.map((card) => ({
                    quantity: card.quantity,
                    code: card.code,
                    color: card.color || [],
                    name: card.name || "",
                }))
            );
            setParsedCards([]);
            setDeckString("");
        }
    };

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose} // Close the modal when the back button is pressed
        >
            <View style={styles.overlay}>
                <Pressable
                    style={StyleSheet.absoluteFill}
                    onPress={onClose} // Close the modal when clicking outside
                />
                <View style={[styles.modal, { backgroundColor: Colors[theme].background }]}>
                    <ThemedText style={[styles.title, { color: Colors[theme].text }]}>Import Deck</ThemedText>
                    {parsedCards.length === 0 && (
                        <>
                            <ThemedText style={[styles.description, { color: Colors[theme].disabled }]}>
                                Please paste your deck using the "Paste" button below. The deck should follow the
                                format:
                            </ThemedText>
                            <ThemedText style={[styles.description2, { color: Colors[theme].disabled }]}>
                                {"\n"}1xOP01-001{"\n"}2xST02-002{"\n"}...
                            </ThemedText>
                        </>
                    )}
                    {parsedCards.length > 0 ? (
                        <TouchableOpacity
                            style={[styles.button, { backgroundColor: Colors[theme].tint }]}
                            onPress={() => {
                                setDeckString("");
                                setParsedCards([]);
                                setError("");
                            }}
                        >
                            <ThemedText style={styles.buttonText}>Erase</ThemedText>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity
                            style={[styles.button, { backgroundColor: Colors[theme].tint }]}
                            onPress={handlePaste}
                        >
                            <ThemedText style={styles.buttonText}>Paste</ThemedText>
                        </TouchableOpacity>
                    )}

                    {error ? (
                        <ThemedText style={[styles.error, { color: Colors[theme].error }]}>{error}</ThemedText>
                    ) : null}
                    {parsedCards.length > 0 && (
                        <View
                            style={{
                                maxHeight: 300,
                                width: "100%",
                                borderRadius: 5,
                                margin: 10,
                                backgroundColor: Colors[theme].backgroundSoft,
                                alignItems: "center",
                            }}
                        >
                            <ScrollView
                                contentContainerStyle={styles.flatListContainer}
                                keyboardShouldPersistTaps="handled" // Allow taps to propagate while the keyboard is open
                                showsVerticalScrollIndicator={true} // Show vertical scroll indicator
                            >
                                {parsedCards.map((item) => (
                                    <View key={item.code} style={styles.listItemContainer}>
                                        <ThemedText style={[styles.listItemText, { color: Colors[theme].text }]}>
                                            {" "}
                                            {`${item.quantity}`}{" "}
                                        </ThemedText>
                                        {item.images_small && (
                                            <View style={styles.imageContainer}>
                                                <Image
                                                    source={{ uri: item.images_small }}
                                                    style={styles.cardImage}
                                                    resizeMode="cover"
                                                />
                                            </View>
                                        )}
                                        <ThemedText
                                            style={[styles.listItemText, { color: Colors[theme].tabIconDefault }]}
                                        >
                                            {" "}
                                            {item.code}{" "}
                                        </ThemedText>
                                        <ThemedText style={[styles.listItemText, { color: Colors[theme].text }]}>
                                            {Array.isArray(item.color) ? (
                                                item.color.map((color, index) => (
                                                    <View
                                                        key={index}
                                                        style={{
                                                            width: 10,
                                                            height: 10,
                                                            borderRadius: 5,
                                                            backgroundColor: color.toLowerCase() || "transparent",
                                                            marginHorizontal: 2,
                                                        }}
                                                    />
                                                ))
                                            ) : (
                                                <View
                                                    style={{
                                                        width: 10,
                                                        height: 10,
                                                        borderRadius: 5,
                                                        backgroundColor: item.color || "transparent",
                                                        marginHorizontal: 2,
                                                    }}
                                                />
                                            )}
                                        </ThemedText>
                                    </View>
                                ))}
                            </ScrollView>
                            <LinearGradient
                                colors={["transparent", "rgba(0,0,0,0.1)"]}
                                style={{
                                    position: "absolute",
                                    bottom: 0,
                                    left: 0,
                                    right: 0,
                                    height: 20,
                                }}
                            />
                        </View>
                    )}
                    {parsedCards.length > 0 && (
                        <View style={[styles.listItemContainer, { marginTop: 0, marginBottom: 0 }]}>
                            <ThemedText type="subtitle" style={{ color: Colors[theme].text }}>
                                TOTAL:{" "}
                            </ThemedText>
                            <ThemedText type="subtitle" style={{ color: Colors[theme].tint }}>
                                {parsedCards.length > 0 ? parsedCards.reduce((acc, card) => acc + card.quantity, 0) : 0}{" "}
                            </ThemedText>
                        </View>
                    )}
                    <View style={styles.buttonRow}>
                        <TouchableOpacity
                            style={[styles.button, { backgroundColor: Colors[theme].TabBarBackground }]}
                            onPress={onClose}
                        >
                            <ThemedText style={[styles.buttonText, { color: Colors[theme].tint }]}>Close</ThemedText>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                styles.button,
                                { backgroundColor: Colors[theme].success },
                                parsedCards.length === 0 && { backgroundColor: Colors[theme].backgroundSoft },
                            ]}
                            onPress={handleImport}
                            disabled={parsedCards.length === 0}
                        >
                            <ThemedText
                                style={[
                                    styles.buttonText,
                                    parsedCards.length === 0
                                        ? { color: Colors[theme].TabBarBackground }
                                        : { color: Colors[theme].background },
                                ]}
                            >
                                Import
                            </ThemedText>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0, 0, 0, 0.6)",
    },
    modal: {
        width: "90%",
        borderRadius: 15,
        padding: 20,
        alignItems: "center",
        elevation: 5,
    },
    title: {
        fontSize: 20,
        fontWeight: "bold",
        marginBottom: 15,
    },
    description: {
        fontSize: 14,
        textAlign: "center",
    },
    description2: {
        fontSize: 16,
        textAlign: "center",
        marginTop: -15,
        marginBottom: 15,
    },
    button: {
        borderRadius: 10,
        paddingVertical: 10,
        paddingHorizontal: 20,
        alignItems: "center",
        marginVertical: 5,
    },
    buttonText: {
        fontSize: 16,
        fontWeight: "bold",
    },
    buttonRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        width: "100%",
        marginTop: 10,
    },
    error: {
        fontSize: 14,
        marginVertical: 10,
        textAlign: "center",
    },
    flatListContainer: {
        width: "100%",
        marginVertical: 10,
        marginHorizontal: 30,
        alignItems: "center",
        justifyContent: "center",
        paddingBottom: 20,
    },
    listItem: {
        fontSize: 16,
        marginVertical: 2,
    },
    listItemContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginVertical: 4,
    },
    listItemText: {
        fontSize: 16,
        marginHorizontal: 5,
        fontWeight: "bold",
        textAlign: "center",
    },
    imageContainer: {
        width: 40,
        height: 40,
        borderRadius: 50,
        overflow: "hidden",
        marginHorizontal: 5,
    },
    cardImage: {
        width: 50,
        height: 50,
    },
});
