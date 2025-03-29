import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import CustomNumericInput from "@/components/CustomNumericInput";
import { Colors } from "@/constants/Colors";
import { useTheme } from "@/hooks/ThemeContext";
import { useTranslation } from "react-i18next";

interface CardOptionsProps {
    selectedButton: string;
    setSelectedButton: (value: string) => void;
    quantity: number;
    onQuantityChange: (value: number) => void;
    onAddButtonPress: () => void;
}

const CardOptions: React.FC<CardOptionsProps> = ({
    selectedButton,
    setSelectedButton,
    quantity,
    onQuantityChange,
    onAddButtonPress,
}) => {
    const { theme } = useTheme();
    const { t } = useTranslation();

    return (
        <View style={[styles.buttonContainer, { backgroundColor: Colors[theme].TabBarBackground }]}>
            <TouchableOpacity
                style={[
                    styles.optionButton,
                    styles.firstOptionButton,
                    { backgroundColor: "#edc398" },
                    selectedButton !== "Deck" && { backgroundColor: "#645140" },
                ]}
                onPress={() => setSelectedButton("Deck")}
            >
                <ThemedText style={[styles.optionButtonText, { color: Colors[theme].background }]}>
                    {t("deck")}
                </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
                style={[
                    styles.optionButton,
                    { backgroundColor: "#edc398" },
                    selectedButton !== "Collection" && { backgroundColor: "#645140" },
                ]}
                onPress={() => setSelectedButton("Collection")}
            >
                <ThemedText style={[styles.optionButtonText, { color: Colors[theme].background }]}>
                    {t("collect")}
                </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
                style={[
                    styles.optionButton,
                    styles.lastOptionButton,
                    { backgroundColor: "#edc398" },
                    selectedButton !== "WishList" && { backgroundColor: "#645140" },
                ]}
                onPress={() => setSelectedButton("WishList")}
            >
                <ThemedText style={[styles.optionButtonText, { color: Colors[theme].background }]}>
                    {t("wish")}
                </ThemedText>
            </TouchableOpacity>
            <CustomNumericInput value={quantity} onChange={onQuantityChange} />
            <TouchableOpacity
                style={[styles.addButton, { backgroundColor: Colors[theme].tint }]}
                onPress={onAddButtonPress}
            >
                <Ionicons name="checkmark" size={24} color={Colors[theme].text} />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    buttonContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 10,
        padding: 10,
        borderRadius: 5,
    },
    optionButton: {
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderRadius: 5,
        borderTopLeftRadius: 0,
        borderBottomLeftRadius: 0,
        borderTopRightRadius: 0,
        borderBottomRightRadius: 0,
        transform: [{ skewX: "-20deg" }],
        borderWidth: 2,
    },
    optionButtonText: {
        fontSize: 16,
        fontWeight: "bold",
        transform: [{ skewX: "20deg" }],
    },
    firstOptionButton: {
        borderTopLeftRadius: 10,
        borderBottomLeftRadius: 10,
        borderTopRightRadius: 0,
        borderBottomRightRadius: 0,
    },
    lastOptionButton: {
        borderTopRightRadius: 10,
        borderBottomRightRadius: 10,
    },
    addButton: {
        paddingHorizontal: 10,
        paddingVertical: 7,
        borderRadius: 5,
    },
});

export default CardOptions;
