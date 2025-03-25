import React from "react";
import { View, StyleSheet } from "react-native";
import MultiSlider from "@ptomasroos/react-native-multi-slider";
import { ThemedText } from "@/components/ThemedText";
import { Colors } from "@/constants/Colors";
import { useTheme } from "@/hooks/ThemeContext";

interface FilterSliderProps {
    label: string;
    range: [number, number];
    min: number;
    max: number;
    step: number;
    onValuesChangeFinish: (values: number[]) => void;
}

const FilterSlider: React.FC<FilterSliderProps> = ({ label, range, min, max, step, onValuesChangeFinish }) => {
    const { theme } = useTheme();

    return (
        <View style={styles.container}>
            <ThemedText style={styles.label}>
                {label} <ThemedText style={{ color: Colors[theme].icon }}>({range[0]} - {range[1]})</ThemedText>
            </ThemedText>
            <MultiSlider
                values={range}
                min={min}
                max={max}
                step={step}
                onValuesChangeFinish={(values) => onValuesChangeFinish(values as [number, number])}
                selectedStyle={{ backgroundColor: Colors[theme].highlight }}
                unselectedStyle={{ backgroundColor: "#888" }}
                trackStyle={{ height: 5 }}
                isMarkersSeparated={true}
                customMarkerLeft={(e) => (
                    <View style={styles.markerContainer}>
                        <ThemedText style={{ fontWeight: "bold", color: Colors[theme].icon }}>
                            {e.currentValue}
                        </ThemedText>
                        <View style={[styles.marker, {backgroundColor: Colors[theme].icon}]} />
                    </View>
                )}
                customMarkerRight={(e) => (
                    <View style={styles.markerContainer}>
                        <ThemedText style={{ fontWeight: "bold", color: Colors[theme].icon }}>
                            {e.currentValue}
                        </ThemedText>
                        <View style={[styles.marker, {backgroundColor: Colors[theme].icon}]} />
                    </View>
                )}
                allowOverlap
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: "100%",
        alignItems: "center",
        marginBottom: 5,
    },
    label: {
        fontSize: 16,
        fontWeight: "600",
        marginBottom: 10,
    },
    markerContainer: {
        alignItems: "center",
        justifyContent: "center",
        position: "absolute",
        top: -32,
    },
    marker: {
        width: 20,
        height: 20,
        borderRadius: 10,
    },
});

export default FilterSlider;
