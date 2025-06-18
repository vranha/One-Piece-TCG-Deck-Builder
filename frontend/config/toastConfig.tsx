import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Colors } from "@/constants/Colors";
import { useTheme } from "@/hooks/ThemeContext";

const toastConfig = {
    success: ({ text1, text2 }: { text1?: string; text2?: string }) => {
        const { theme } = useTheme();
        const themeColors = Colors[theme];
        return (
            <View
                style={[
                    styles.toastContainer,
                    { backgroundColor: themeColors.background, borderColor: themeColors.highlight },
                ]}
            >
                <Text style={[styles.emoji]}>{"🎉"}</Text>
                <View style={styles.textContainer}>
                    {text1 && (
                        <Text
                            style={[styles.title, { color: themeColors.success, textShadowColor: themeColors.highlight }]}
                        >
                            {text1}
                        </Text>
                    )}
                    {text2 && (
                        <Text
                            style={[
                                styles.subtitle,
                                { color: themeColors.textSoft, textShadowColor: themeColors.highlight },
                            ]}
                        >
                            {text2}
                        </Text>
                    )}
                </View>
            </View>
        );
    },
    error: ({ text1, text2 }: { text1?: string; text2?: string }) => {
        const { theme } = useTheme();
        const themeColors = Colors[theme];
        return (
            <View
                style={[
                    styles.toastContainer,
                    { backgroundColor: themeColors.error, borderColor: themeColors.highlight },
                ]}
            >
                <Text style={[styles.emoji]}>{"💀"}</Text>
                <View style={styles.textContainer}>
                    {text1 && (
                        <Text
                            style={[styles.title, { color: themeColors.background, textShadowColor: themeColors.highlight }]}
                        >
                            {text1}
                        </Text>
                    )}
                    {text2 && (
                        <Text
                            style={[
                                styles.subtitle,
                                { color: themeColors.backgroundSoft, textShadowColor: themeColors.highlight },
                            ]}
                        >
                            {text2}
                        </Text>
                    )}
                </View>
            </View>
        );
    },
    info: ({ text1, text2 }: { text1?: string; text2?: string }) => {
        const { theme } = useTheme();
        const themeColors = Colors[theme];
        return (
            <View
                style={[
                    styles.toastContainer,
                    { backgroundColor: themeColors.info, borderColor: themeColors.highlight },
                ]}
            >
                <Text style={[styles.emoji]}>{"🍖"}</Text>
                <View style={styles.textContainer}>
                    {text1 && (
                        <Text
                            style={[styles.title, { color: themeColors.text, textShadowColor: themeColors.highlight }]}
                        >
                            {text1}
                        </Text>
                    )}
                    {text2 && (
                        <Text
                            style={[
                                styles.subtitle,
                                { color: themeColors.textSoft, textShadowColor: themeColors.highlight },
                            ]}
                        >
                            {text2}
                        </Text>
                    )}
                </View>
            </View>
        );
    },
};

const styles = StyleSheet.create({
    toastContainer: {
        flexDirection: "row",
        alignItems: "center",
        padding: 16,
        borderRadius: 18,
        marginHorizontal: 20,
        marginTop: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 10,
        borderWidth: 2,
        zIndex: 9999,
    },
    emoji: {
        fontSize: 32,
        marginRight: 14,
        marginLeft: 2,
    },
    textContainer: {
        flex: 1,
    },
    title: {
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 2,
    },
    subtitle: {
        fontSize: 15,
        fontWeight: "600",
    },
});

export default toastConfig;
