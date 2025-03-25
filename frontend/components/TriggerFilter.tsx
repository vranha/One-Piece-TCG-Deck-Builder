import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { Colors } from "@/constants/Colors";
import { useTheme } from "@/hooks/ThemeContext";

interface TriggerFilterProps {
    triggerFilter: boolean;
    onToggle: () => void;
}

const TriggerFilter: React.FC<TriggerFilterProps> = ({ triggerFilter, onToggle }) => {
    const { theme } = useTheme();

    return (
        <View style={styles.triggerFilterContainer}>
            <TouchableOpacity
                style={[
                    styles.triggerButton,
                    {
                        backgroundColor: triggerFilter ? Colors[theme].triggerActive : Colors[theme].triggerInactive,
                    },
                ]}
                onPress={onToggle}
            >
                <ThemedText
                    style={[
                        styles.triggerButtonText,
                        {
                            color: triggerFilter ? Colors[theme].triggerActiveText : Colors[theme].triggerInactiveText,
                        },
                    ]}
                >
                    Trigger
                </ThemedText>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    triggerFilterContainer: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        marginVertical: 10,
    },
    triggerButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
        alignItems: "center",
        justifyContent: "center",
    },
    triggerButtonText: {
        fontSize: 16,
        fontWeight: "bold",
    },
});

export default TriggerFilter;
