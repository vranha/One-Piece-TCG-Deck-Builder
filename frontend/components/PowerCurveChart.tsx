import React from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import { BarChart } from "react-native-chart-kit";
import { ThemedText } from "@/components/ThemedText";
import { Colors } from "@/constants/Colors";
import { useTheme } from "@/hooks/ThemeContext";
import { useTranslation } from "react-i18next";

interface PowerCurveChartProps {
    cardPowers: number[];
    averagePower: string | number;
}

export const PowerCurveChart: React.FC<PowerCurveChartProps> = ({ cardPowers, averagePower }) => {
    const { theme } = useTheme();
    const { t } = useTranslation();

    return (
        <View style={[styles.chartContainer, { backgroundColor: Colors[theme].TabBarBackground }]}>
            <View style={styles.titleContainer}>
                <ThemedText style={{ paddingLeft: 20 }} type="subtitle">
                    {t("power_curve")}
                </ThemedText>
                <ThemedText style={{ fontWeight: "bold", color: Colors[theme].tabIconDefault }}>
                    {t("average_power")}: {averagePower}
                </ThemedText>
            </View>
            <BarChart
                data={{
                    labels: ["0k", "1k", "2k", "3k", "4k", "5k", "6k", "7k", "8k", "9k", "+10k"],
                    datasets: [{ data: cardPowers }],
                }}
                width={Dimensions.get("window").width - 30} // Adjust width
                height={180}
                yAxisLabel=""
                yAxisSuffix=" Cards"
                fromZero={true} // Ensure the scale starts from 0
                chartConfig={{
                    backgroundColor: Colors[theme].TabBarBackground,
                    backgroundGradientFrom: Colors[theme].TabBarBackground,
                    backgroundGradientTo: Colors[theme].TabBarBackground,
                    decimalPlaces: 0,
                    barPercentage: 0.3,
                    color: (opacity = 1) => "#cc44cc",
                    labelColor: (opacity = 1) => Colors[theme].tabIconDefault,
                    style: { borderRadius: 16 },
                }}
                style={{ marginVertical: 20, borderRadius: 16, alignSelf: "center" }}
                showValuesOnTopOfBars
                showBarTops={false}
                withInnerLines={false}
            />
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
});
