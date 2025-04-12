import React from "react";
import { View, TouchableOpacity, StyleSheet, Animated } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { MaterialIcons } from "@expo/vector-icons";
import { Colors } from "@/constants/Colors";
import { useTheme } from "@/hooks/ThemeContext";
import AbilityFilters from "@/components/AbilityFilters";
import { useTranslation } from "react-i18next";

interface AbilityAccordionProps {
    isAbilityAccordionOpen: boolean;
    toggleAbilityAccordion: () => void;
    abilityAccordionHeight: Animated.Value;
    abilityFilters: string[];
    handleAbilityFilterToggle: (ability: string | null) => void;
    abilityColorMap: { [key: string]: string };
}

const AbilityAccordion: React.FC<AbilityAccordionProps> = ({
    isAbilityAccordionOpen,
    toggleAbilityAccordion,
    abilityAccordionHeight,
    abilityFilters,
    handleAbilityFilterToggle,
    abilityColorMap,
}) => {
    const { theme } = useTheme();
    const { t } = useTranslation();

    return (
        <>
            <TouchableOpacity
                onPress={toggleAbilityAccordion}
                style={[styles.accordionHeader, { backgroundColor: Colors[theme].background }]}
            >
                <View style={styles.abilityHeader}>
                    <ThemedText style={[styles.accordionHeaderText, { color: Colors[theme].text }]}>{t('abilities')}</ThemedText>
                    <MaterialIcons
                        name={isAbilityAccordionOpen ? "expand-less" : "expand-more"}
                        size={24}
                        color={Colors[theme].text}
                    />
                </View>
                {abilityFilters.length > 0 && (
                    <TouchableOpacity
                        onPress={() => handleAbilityFilterToggle(null)} // Clear all selected abilities
                        style={[styles.clearButton, { backgroundColor: Colors[theme].TabBarBackground }]}
                    >
                        <ThemedText style={[styles.abilityCount, { color: Colors[theme].tint }]}>
                            {abilityFilters.length}
                        </ThemedText>
                        <MaterialIcons name="close" size={16} color={Colors[theme].text} />
                    </TouchableOpacity>
                )}
            </TouchableOpacity>

            <Animated.View style={{ height: abilityAccordionHeight, overflow: "hidden" }}>
                <AbilityFilters
                    abilityFilters={abilityFilters}
                    onAbilityFilterToggle={handleAbilityFilterToggle}
                    abilityColorMap={abilityColorMap}
                />
            </Animated.View>
        </>
    );
};

const styles = StyleSheet.create({
    accordionHeader: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        width: "100%",
        paddingVertical: 10,
        paddingHorizontal: 15,
        backgroundColor: Colors.light.background,
        borderRadius: 8,
        marginBottom: 10,
    },
    accordionHeaderText: {
        fontSize: 16,
        fontWeight: "bold",
    },
    abilityHeader: {
        flexDirection: "row",
        alignItems: "center",
    },
    abilityCount: {
        fontSize: 12,
        fontWeight: "bold",
        position: "absolute",
        top: -10,
        right: -10,
    },
    clearButton: {
        marginLeft: 10,
        padding: 5,
        borderRadius: 10,
        fontWeight: "bold",
    },
});

export default AbilityAccordion;
