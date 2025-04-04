import React from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { Colors } from "@/constants/Colors";
import { useTheme } from "@/hooks/ThemeContext";

export const LoadingIndicator = () => {
    const { theme } = useTheme();

    return (
        <View style={[styles.container, { backgroundColor: Colors[theme].background }]}>
            <ActivityIndicator size="large" color={Colors[theme].tint} />
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
