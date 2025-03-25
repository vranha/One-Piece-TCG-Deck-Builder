import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { Colors } from "@/constants/Colors";
import { useTheme } from "@/hooks/ThemeContext";

interface RarityFiltersProps {
    selectedRarities: string[];
    onRaritySelect: (rarity: string) => void;
}

const RarityFilters: React.FC<RarityFiltersProps> = ({ selectedRarities, onRaritySelect }) => {
    const { theme } = useTheme();

    return (
        <View style={styles.rarityFilters}>
            {["C", "UC", "R", "SR", "L", "P", "SEC", "TR"].map((rarity) => (
                <TouchableOpacity
                    key={rarity}
                    style={[
                        styles.rarityButton,
                        selectedRarities.includes(rarity)
                            ? { backgroundColor: Colors[theme].icon }
                            : { backgroundColor: Colors[theme].disabled },
                    ]}
                    onPress={() => onRaritySelect(rarity)}
                >
                    <ThemedText style={[styles.rarityButtonText, { color: Colors[theme].background }]}>
                        {rarity}
                    </ThemedText>
                </TouchableOpacity>
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    rarityFilters: {
        flex: 1,
        width: "100%",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 5,
    },
    rarityButton: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
    },
    rarityButtonText: {
        color: "#fff",
        fontWeight: "bold",
        fontSize: 16,
    },
});

export default RarityFilters;
