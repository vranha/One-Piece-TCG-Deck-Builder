import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { Colors } from "@/constants/Colors";
import { useTheme } from "@/hooks/ThemeContext";

interface AbilityFiltersProps {
    abilityFilters: string[];
    onAbilityFilterToggle: (ability: string) => void;
    abilityColorMap: { [key: string]: string };
}

const AbilityFilters: React.FC<AbilityFiltersProps> = ({ abilityFilters, onAbilityFilterToggle, abilityColorMap }) => {
    const { theme } = useTheme();

    return (
        <View style={styles.abilityFilters}>
            {[
                "[Blocker]",
                "[Activate: Main]",
                "[On Play]",
                "[Rush]",
                "[Main]",
                "[Once Per Turn]",
                "[When Attacking]",
                "[Opponent's Turn]",
                "[On K.O.]",
                "[Your Turn]",
                "[On Your Opponent's Attack]",
                "[Counter]",
            ].map((ability) => {
                const abilityColor = abilityColorMap[ability]; // Obtiene el color de fondo basado en la habilidad

                return (
                    <TouchableOpacity
                        key={ability}
                        style={[
                            styles.abilityButton,
                            abilityFilters.includes(ability)
                                ? { backgroundColor: abilityColor } // Usamos el color de la habilidad cuando está clicado
                                : {
                                      backgroundColor: abilityColor,
                                      opacity: 0.4, // Reducimos la opacidad cuando no está clicado
                                  },
                        ]}
                        onPress={() => onAbilityFilterToggle(ability)}
                    >
                        <ThemedText style={[styles.abilityButtonText, { color: Colors[theme].background }]}>
                            {ability.replace(/[\[\]]/g, "")}
                        </ThemedText>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
};

const styles = StyleSheet.create({
    abilityFilters: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 10,
        gap: 5,
    },
    abilityButton: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
        margin: 5,
        borderWidth: 2,
        borderColor: "white",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 3.84,
        elevation: 5,
    },
    abilityButtonText: {
        fontSize: 16,
        fontWeight: "bold",
    },
});

export default AbilityFilters;
