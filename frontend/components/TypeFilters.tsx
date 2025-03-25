import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { Colors } from "@/constants/Colors";
import { useTheme } from "@/hooks/ThemeContext";

interface TypeFiltersProps {
    selectedTypes: string[];
    onTypeSelect: (type: string) => void;
}

const TypeFilters: React.FC<TypeFiltersProps> = ({ selectedTypes, onTypeSelect }) => {
    const { theme } = useTheme();

    return (
        <View style={styles.typeFilters}>
            {["LEADER", "CHARACTER", "EVENT", "STAGE"].map((type) => (
                <TouchableOpacity
                    key={type}
                    style={[
                        styles.typeButton,
                        selectedTypes.includes(type)
                            ? { backgroundColor: Colors[theme].icon }
                            : { backgroundColor: Colors[theme].disabled },
                    ]}
                    onPress={() => onTypeSelect(type)}
                >
                    <ThemedText style={[styles.typeButtonText, { color: Colors[theme].background }]}>{type}</ThemedText>
                </TouchableOpacity>
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    typeFilters: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 5,
        gap: 10,
    },
    typeButton: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
    },
    typeButtonText: {
        color: "#fff",
        fontWeight: "bold",
        fontSize: 16,
    },
});

export default TypeFilters;
