import React from "react";
import { View, StyleSheet } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { Colors } from "@/constants/Colors";
import { useTheme } from "@/hooks/ThemeContext";

export const NoDeckFound = () => {
    const { theme } = useTheme();

    return (
        <View style={[styles.container, { backgroundColor: Colors[theme].background }]}>
            <ThemedText style={{ color: Colors[theme].text }}>No se encontró el mazo.</ThemedText>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
});
