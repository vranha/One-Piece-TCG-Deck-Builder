import React from "react";
import { View, StyleSheet } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { Colors } from "@/constants/Colors";

interface DeckStatsProps {
    blockers: number;
    plus5kCards: number;
    events: number;
    theme: "light" | "dark";
}

export const DeckStats: React.FC<DeckStatsProps> = ({ blockers, plus5kCards, events, theme }) => {
    return (
        <View style={styles.container}>
            <StatItem label="Blockers:" value={blockers} theme={theme} />
            <StatItem label="+5k Card:" value={plus5kCards} theme={theme} />
            <StatItem label="Events:" value={events} theme={theme} />
        </View>
    );
};

const StatItem = ({ label, value, theme }: { label: string; value: number; theme: "light" | "dark" }) => (
    <View style={styles.statItem}>
        <View style={[styles.labelContainer, { backgroundColor: Colors[theme].TabBarBackground }]}>
            <ThemedText style={[styles.labelText, { color: Colors[theme].text }]}>{label}</ThemedText>
        </View>
        <View style={[styles.valueContainer, { backgroundColor: Colors[theme].tint }]}>
            <ThemedText style={[styles.valueText, { color: Colors[theme].text }]}>{value}</ThemedText>
        </View>
    </View>
);

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        justifyContent: "space-between",
        width: "100%",
        padding: 5,
        marginTop: 20,
    },
    statItem: {
        flexDirection: "row",
        borderRadius: 5,
        overflow: "hidden",
        marginLeft: 5,
    },
    labelContainer: {
        paddingLeft: 10,
        paddingRight: 7,
        paddingVertical: 7,
        borderTopLeftRadius: 5,
        borderBottomLeftRadius: 5,
    },
    labelText: {
        fontSize: 14,
        fontWeight: "bold",
    },
    valueContainer: {
        paddingLeft: 7,
        paddingRight: 10,
        paddingVertical: 7,
        borderTopRightRadius: 5,
        borderBottomRightRadius: 5,
    },
    valueText: {
        fontSize: 14,
        fontWeight: "bold",
    },
});
