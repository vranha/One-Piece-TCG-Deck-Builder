import React from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import { BarChart } from "react-native-chart-kit";
import { ThemedText } from "@/components/ThemedText";
import { Colors } from "@/constants/Colors";
import { useTheme } from "@/hooks/ThemeContext";
import { useTranslation } from "react-i18next";

interface CostCurveChartProps {
    cardCosts: number[];
    averageCost: string | number;
}

export const CostCurveChart: React.FC<CostCurveChartProps> = ({ cardCosts, averageCost }) => {
    const { theme } = useTheme();
    const { t } = useTranslation();

    return (
        <View style={[styles.chartContainer, { backgroundColor: Colors[theme].TabBarBackground }]}>
            <View style={styles.titleContainer}>
                <ThemedText style={{ paddingLeft: 20 }} type="subtitle">
                    {t("cost_curve")}
                </ThemedText>
                <ThemedText style={{ fontWeight: "bold", color: Colors[theme].tabIconDefault }}>
                    {t("average_cost")}: {averageCost}
                </ThemedText>
            </View>
            <BarChart
                data={{
                    labels: ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10"],
                    datasets: [{ data: cardCosts }],
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
                    color: (opacity = 1) => "#446fcc",
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
