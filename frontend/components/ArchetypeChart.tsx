import React from "react";
import { View, StyleSheet } from "react-native";
import { PieChart } from "react-native-chart-kit";
import { ThemedText } from "@/components/ThemedText";
import { Colors } from "@/constants/Colors";
import { useTheme } from "@/hooks/ThemeContext";

interface ArchetypeChartProps {
    familyDistribution: {
        name: string;
        count: number;
        color: string;
    }[];
    totalCards: number;
}

export const ArchetypeChart: React.FC<ArchetypeChartProps> = ({ familyDistribution, totalCards }) => {
    const { theme } = useTheme();

    return (
        <View style={[styles.chartContainer, { backgroundColor: Colors[theme].TabBarBackground }]}>
            <View style={styles.titleContainer}>
                <ThemedText style={{ paddingLeft: 20 }} type="subtitle">
                    Archetype
                </ThemedText>
            </View>
            <View style={{ alignItems: "center", flexDirection: "row" }}>
                <PieChart
                    data={familyDistribution}
                    width={120}
                    height={120}
                    chartConfig={{
                        backgroundColor: Colors[theme].TabBarBackground,
                        backgroundGradientFrom: Colors[theme].TabBarBackground,
                        backgroundGradientTo: Colors[theme].TabBarBackground,
                        color: (opacity = 1) => Colors[theme].tint,
                        labelColor: (opacity = 1) => Colors[theme].text,
                    }}
                    accessor={"count"}
                    backgroundColor={"transparent"}
                    paddingLeft={"40"}
                    hasLegend={false}
                />
                <View style={styles.pieDetails}>
                    {familyDistribution.map((family, index) => (
                        <View key={index} style={styles.pieDetailsUnit}>
                            <ThemedText style={{ paddingLeft: 20, color: family.color }}>
                                {family.name} - {((family.count / totalCards) * 100).toFixed(1)}%
                            </ThemedText>
                            <View style={[styles.pieColor, { backgroundColor: family.color }]}></View>
                        </View>
                    ))}
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
    titleContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-end",
        width: "95%",
    },
    pieDetails: {
        justifyContent: "flex-start",
        alignItems: "flex-end",
        gap: 10,
        marginLeft: 0,
        marginTop: -20,
    },
    pieDetailsUnit: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
    },
    pieColor: {
        width: 15,
        height: 15,
        borderRadius: 10,
    },
});
