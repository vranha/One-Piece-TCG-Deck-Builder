import React from "react";
import { View, StyleSheet } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { Colors } from "@/constants/Colors";
import { useTranslation } from "react-i18next";

interface CounterDistributionChartProps {
    counterDistribution: {
        noCounter: number;
        counter1000: number;
        counter2000: number;
        eventCounter: number;
        eventCounterDetails: { [key: string]: number };
    };
    theme: "light" | "dark";
}

export const CounterDistributionChart: React.FC<CounterDistributionChartProps> = ({ counterDistribution, theme }) => {
    const { t } = useTranslation();
    const { noCounter, counter1000, counter2000, eventCounter, eventCounterDetails } = counterDistribution;

    return (
        <View style={[styles.chartContainer, { backgroundColor: Colors[theme].TabBarBackground }]}>
            <ThemedText type="subtitle" style={styles.title}>
                {t("counter_distribution")}
            </ThemedText>

            {/* Legend */}
            <View style={styles.legendContainer}>
                {[
                    { label: t("counter_0"), color: Colors[theme].tint, opacity: 0.2 },
                    { label: t("counter_1000"), color: Colors[theme].tint, opacity: 0.4 },
                    { label: t("counter_2000"), color: Colors[theme].tint, opacity: 0.8 },
                    { label: t("counter_event"), color: Colors[theme].highlight, opacity: 0.7 },
                ].map(({ label, color, opacity }) => (
                    <LegendItem key={label} label={label} color={color} opacity={opacity} theme={theme} />
                ))}
            </View>

            {/* Horizontal Bar */}
            <View style={styles.barContainer}>
                <BarSegment flex={noCounter} color={Colors[theme].tint} opacity={0.2} />
                <BarSegment flex={counter1000} color={Colors[theme].tint} opacity={0.4} />
                <BarSegment flex={counter2000} color={Colors[theme].tint} opacity={0.8} />
                <BarSegment flex={eventCounter} color={Colors[theme].highlight} opacity={0.7} />
            </View>

            {/* Numbers Above Bar */}
            <View style={styles.numbersContainer}>
                {[noCounter, counter1000, counter2000, eventCounter].map((value, index) => (
                    <NumberItem key={index} value={value} theme={theme} />
                ))}
            </View>

            {/* Event Counter Details */}
            <View style={styles.eventDetailsContainer}>
                <ThemedText style={[styles.eventDetailsTitle, { color: Colors[theme].tabIconDefault }]}>
                    {t("events") + ":"}
                </ThemedText>
                {Object.entries(eventCounterDetails).map(([xxxx, count]) => (
                    <EventDetail key={xxxx} xxxx={xxxx} count={count} theme={theme} />
                ))}
            </View>
        </View>
    );
};

const LegendItem = ({
    label,
    color,
    opacity,
    theme,
}: {
    label: string;
    color: string;
    opacity: number;
    theme: "light" | "dark";
}) => (
    <View style={styles.legendItem}>
        <ThemedText style={[styles.legendText, { color: Colors[theme].tabIconDefault }]}>{label}</ThemedText>
        <View style={[styles.legendColor, { backgroundColor: color, opacity }]} />
    </View>
);

const BarSegment = ({ flex, color, opacity }: { flex: number; color: string; opacity: number }) => {
    const minimumFlex = 0.1; // Valor mínimo para que los segmentos con 0 aún sean visibles
    return <View style={{ flex: flex > 0 ? flex : minimumFlex, backgroundColor: color, opacity }} />;
};

const NumberItem = ({ value, theme }: { value: number; theme: "light" | "dark" }) => (
    <View style={[styles.numberItem, { flex: value }]}>
        <ThemedText style={{ fontSize: 12, color: Colors[theme].tabIconDefault }}>{value}</ThemedText>
    </View>
);

const EventDetail = ({ xxxx, count, theme }: { xxxx: string; count: number; theme: "light" | "dark" }) => (
    <View style={styles.eventDetail}>
        <View style={[styles.eventDetailLabel, { backgroundColor: Colors[theme].highlight, opacity: 0.7 }]}>
            <ThemedText style={[styles.eventDetailText, { color: Colors[theme].TabBarBackground }]}>{`+${parseInt(
                xxxx
            )}:`}</ThemedText>
        </View>
        <View style={[styles.eventDetailValue, { backgroundColor: Colors[theme].text, opacity: 0.8 }]}>
            <ThemedText style={[styles.eventDetailText, { color: Colors[theme].background }]}>{count}</ThemedText>
        </View>
    </View>
);

const styles = StyleSheet.create({
    chartContainer: {
        marginTop: 20,
        padding: 20,
        borderRadius: 15,
    },
    title: {
        marginBottom: 10,
    },
    legendContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 10,
    },
    legendItem: {
        alignItems: "center",
    },
    legendText: {
        fontSize: 12,
        marginBottom: -2,
    },
    legendColor: {
        width: 20,
        height: 10,
        borderRadius: 2,
    },
    barContainer: {
        flexDirection: "row",
        height: 20,
        borderRadius: 5,
        overflow: "hidden",
    },
    numbersContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 5,
    },
    numberItem: {
        flex: 1,
        alignItems: "center",
    },
    eventDetailsContainer: {
        marginTop: 15,
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "flex-end",
    },
    eventDetailsTitle: {
        fontWeight: "bold",
        marginRight: 5,
    },
    eventDetail: {
        flexDirection: "row",
        marginRight: 10,
        marginBottom: 5,
        borderRadius: 5,
        overflow: "hidden",
    },
    eventDetailLabel: {
        paddingHorizontal: 8,
        paddingVertical: 2,
    },
    eventDetailValue: {
        paddingHorizontal: 8,
        paddingVertical: 2,
    },
    eventDetailText: {
        fontSize: 14,
        fontWeight: "bold",
    },
});
