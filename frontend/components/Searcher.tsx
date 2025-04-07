import React from "react";
import { View, Image, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { Colors } from "@/constants/Colors";
import { useTheme } from "@/hooks/ThemeContext";
import { useTranslation } from "react-i18next";

interface SearcherProps {
    cardImage: string;
    x: number;
    probability: number;
}

export const Searcher: React.FC<SearcherProps> = ({ cardImage, x, probability }) => {
    const { theme } = useTheme();
    const { t } = useTranslation();

    return (
        <View style={styles.searcherContainer}>
            <Image source={{ uri: cardImage }} style={{ width: 80, height: 115, borderRadius: 5, opacity: 0.8 }} />
            <View style={styles.statsContainer}>
                <ThemedText type="subtitle" style={{ fontWeight: "bold", marginBottom: 12 }}>
                    {t("searcher")}
                </ThemedText>
                <View style={styles.statItem}>
                    <Ionicons name="search" size={16} color={Colors[theme].tint} />
                    <ThemedText style={[styles.statText, { color: Colors[theme].tabIconDefault }]}>
                        {x} {t("cards")}
                    </ThemedText>
                </View>
                <View style={styles.statItem}>
                    <Ionicons name="bar-chart" size={16} color={Colors[theme].tint} />
                    <ThemedText style={[styles.statText, { color: Colors[theme].tabIconDefault }]}>
                        {probability.toFixed(1)}% {t("success_rate")}
                    </ThemedText>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    searcherContainer: {
        flexDirection: "row",
        marginTop: 20,
        justifyContent: "flex-start",
        alignItems: "center",
        gap: 25,
        paddingHorizontal: 30,
        paddingVertical: 15,
        borderRadius: 12,
    },
    statsContainer: {
        gap: 2,
        marginTop: 0,
    },
    statItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    statText: {
        fontWeight: "bold",
    },
});
