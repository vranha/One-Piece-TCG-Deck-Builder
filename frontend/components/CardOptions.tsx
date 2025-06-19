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

    // Helper to get button style based on selection
    const getButtonStyle = (button: string, isFirst = false, isLast = false) => [
        styles.optionButton,
        isFirst && styles.firstOptionButton,
        isLast && styles.lastOptionButton,
        {
            backgroundColor: selectedButton === button ? Colors[theme].info : Colors[theme].info + "80", // Slightly transparent when not selected

        },
    ];

    const getTextStyle = (button: string) => [
        styles.optionButtonText,
        {
            color: selectedButton === button ? Colors[theme].background : Colors[theme].text + "80", // Text color changes based on selection
        },
    ];

    return (
        <View style={[styles.buttonContainer, { backgroundColor: Colors[theme].background }]}>
            <TouchableOpacity
                style={getButtonStyle("Deck", true, false)}
                onPress={() => setSelectedButton("Deck")}
                activeOpacity={0.85}
            >
                <ThemedText style={getTextStyle("Deck")}>{t("deck")}</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
                style={getButtonStyle("Collection", false, false)}
                onPress={() => setSelectedButton("Collection")}
                activeOpacity={0.85}
            >
                <ThemedText style={getTextStyle("Collection")}>{t("collection")}</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
                style={getButtonStyle("WishList", false, true)}
                onPress={() => setSelectedButton("WishList")}
                activeOpacity={0.85}
            >
                <ThemedText style={getTextStyle("WishList")}>{t("wish")}</ThemedText>
            </TouchableOpacity>
            <CustomNumericInput value={quantity} onChange={onQuantityChange} />
            <TouchableOpacity
                style={[
                    styles.addButton,
                    {
                        backgroundColor: Colors[theme].success,
                        shadowColor: Colors[theme].success,
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.18,
                        shadowRadius: 4,
                        elevation: 3,
                    },
                ]}
                onPress={onAddButtonPress}
                activeOpacity={0.85}
            >
                <Ionicons name="checkmark" size={26} color={Colors[theme].background} />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    buttonContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        marginVertical: 8,
        padding: 6,
        borderRadius: 10,
        // gap: 4,
    },
    optionButton: {
        paddingHorizontal: 12, // reducido
        paddingVertical: 10, // reducido
        borderRadius: 0,
        borderTopLeftRadius: 0,
        borderBottomLeftRadius: 0,
        borderTopRightRadius: 0,
        borderBottomRightRadius: 0,
        minWidth: 40, // reducido
        alignItems: "center",
        justifyContent: "center",
    },
    optionButtonText: {
        fontSize: 14, // reducido
        fontWeight: "bold",
        transform: [{ skewX: "18deg" }],
        letterSpacing: 0.2,
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
        paddingHorizontal: 7, // reducido
        paddingVertical: 5, // reducido
        borderRadius: 8,
        marginLeft: 4, // reducido
        alignItems: "center",
        justifyContent: "center",
    },
});

export default CardOptions;
