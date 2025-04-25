import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { Colors } from "@/constants/Colors";
import { useTheme } from "@/hooks/ThemeContext";
import useStore from "@/store/useStore";

const ColorFilters: React.FC = () => {
    const { theme } = useTheme();
    const { selectedColors, setSelectedColors } = useStore();

    const handleColorSelect = (color: string) => {
        const updatedColors = selectedColors.includes(color)
            ? selectedColors.filter((c) => c !== color) // Remove color if already selected
            : [...selectedColors, color]; // Add color if not selected

        setSelectedColors(updatedColors);
    };

    return (
        <View style={styles.colorFilters}>
            {["blue", "red", "green", "yellow", "purple", "black"].map((color) => (
                <TouchableOpacity
                    key={color}
                    style={[
                        styles.colorCircleContainer,
                        { borderColor: Colors[theme].backgroundSoft },
                        selectedColors.includes(color)
                            ? [styles.selectedColorCircle, { borderColor: Colors[theme].text }]
                            : "",
                    ]}
                    onPress={() => handleColorSelect(color)} // Llama a la función con el nombre del color
                >
                    <View style={[styles.colorCircle, { backgroundColor: color }]} />
                </TouchableOpacity>
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    colorFilters: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 15,
    },
    colorCircle: {
        width: 24,
        height: 24,
        borderRadius: 15,
    },
    colorCircleContainer: {
        padding: 2,
        borderWidth: 2,
        borderRadius: 25,
        marginHorizontal: 5,
    },
    selectedColorCircle: {
        borderWidth: 2,
    },
});

export default ColorFilters;
