import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { Colors } from "@/constants/Colors";
import { useTheme } from "@/hooks/ThemeContext";

interface ColorFiltersProps {
    selectedColors: string[];
    onColorSelect: (color: string) => void;
}

const ColorFilters: React.FC<ColorFiltersProps> = ({ selectedColors, onColorSelect }) => {
    const { theme } = useTheme();

    const capitalizeFirstLetter = (string: string) => {
        return string.charAt(0).toUpperCase() + string.slice(1);
    };

    return (
        <View style={styles.colorFilters}>
            {["blue", "red", "green", "yellow", "purple", "black"].map((color) => (
                <TouchableOpacity
                    key={color}
                    style={[
                        styles.colorCircleContainer,
                        { borderColor: Colors[theme].tabIconDefault },
                        selectedColors.includes(capitalizeFirstLetter(color))
                            ? [styles.selectedColorCircle, { borderColor: Colors[theme].text }]
                            : "",
                    ]}
                    onPress={() => onColorSelect(capitalizeFirstLetter(color))}
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
