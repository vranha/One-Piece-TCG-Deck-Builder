import React from "react";
import { View, StyleSheet } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { Colors } from "@/constants/Colors";

interface TriggerChartProps {
    triggerProbabilities: { triggers: number; probability: number }[];
    totalTriggers: number;
    theme: string;
}

export const TriggerChart: React.FC<TriggerChartProps> = ({ triggerProbabilities, totalTriggers, theme }) => {
    return (
        <View style={[styles.chartContainer, { backgroundColor: Colors[theme].TabBarBackground }]}>
            <View style={styles.titleContainerChartTrigger}>
                <ThemedText style={{ paddingLeft: 20 }} type="subtitle">
                    Num. of
                </ThemedText>
                <View>
                    <ThemedText
                        type="subtitle"
                        style={{
                            backgroundColor: "#ddd345",
                            color: "black",
                            borderRadius: 10,
                            paddingHorizontal: 6,
                            paddingVertical: 3,
                        }}
                    >
                        Triggers
                    </ThemedText>
                </View>
                <ThemedText type="subtitle">in lifes</ThemedText>
            </View>
            <View
                style={{
                    alignItems: "center",
                    justifyContent: "flex-start",
                    flexDirection: "row",
                    gap: 30,
                }}
            >
                <View
                    style={{
                        flexDirection: "column",
                        marginVertical: 20,
                        gap: 5,
                        alignItems: "flex-start",
                        minWidth: 150,
                    }}
                >
                    {triggerProbabilities.map(({ triggers, probability }) => (
                        <View key={triggers} style={{ flexDirection: "row", alignItems: "center" }}>
                            <ThemedText
                                style={{
                                    fontSize: 12,
                                    color: Colors[theme].text,
                                    marginRight: 10,
                                    marginLeft: 20,
                                }}
                            >
                                {triggers} Tr:
                            </ThemedText>
                            <View
                                style={{
                                    height: 20,
                                    width: (probability / 100) * 110,
                                    backgroundColor: "#ddd345",
                                    borderRadius: 5,
                                }}
                            />
                            <ThemedText
                                style={{
                                    fontSize: 12,
                                    fontWeight: "bold",
                                    color: Colors[theme].tabIconDefault,
                                    marginLeft: 10,
                                }}
                            >
                                {probability.toFixed(2)}%
                            </ThemedText>
                        </View>
                    ))}
                </View>
                <View
                    style={{
                        justifyContent: "flex-start",
                        alignSelf: "flex-end",
                        gap: 10,
                        marginBottom: 50,
                    }}
                >
                    <ThemedText
                        type="title"
                        style={{ textAlign: "center", color: Colors[theme].text, marginBottom: -8 }}
                    >
                        Triggers
                    </ThemedText>
                    <ThemedText type="subtitle" style={{ textAlign: "center", color: Colors[theme].tabIconDefault }}>
                        in deck
                    </ThemedText>
                    <ThemedText type="title" style={{ textAlign: "center", color: "#ddd345" }}>
                        {totalTriggers}
                    </ThemedText>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    chartContainer: {
        marginTop: 20,
        paddingTop: 20,
        borderRadius: 15,
        fontSize: 16,
        fontWeight: "bold",
    },
    titleContainerChartTrigger: {
        flexDirection: "row",
        justifyContent: "flex-start",
        alignItems: "center",
        width: "95%",
        gap: 6,
    },
});
