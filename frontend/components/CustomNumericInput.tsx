import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { Colors } from "@/constants/Colors";
import { ThemedText } from "./ThemedText";
import { useTheme } from "@/hooks/ThemeContext";

interface CustomNumericInputProps {
    value: number;
    onChange: (value: number) => void;
    minValue?: number;
    maxValue?: number;
}

const CustomNumericInput: React.FC<CustomNumericInputProps> = ({ value, onChange, minValue = 0, maxValue = 4 }) => {
    const handleIncrement = () => {
        if (value < maxValue) {
            onChange(value + 1);
        }
    };

    const handleDecrement = () => {
        if (value > minValue) {
            onChange(value - 1);
        }
    };
    const { theme } = useTheme();

    const isDecrementDisabled = value <= minValue;
    const isIncrementDisabled = value >= maxValue;

    return (
        <View
            style={[
                styles.container,
                {
                    backgroundColor: Colors[theme].background,

                },
            ]}
        >
            <TouchableOpacity
                onPress={handleDecrement}
                style={[
                    styles.button,
                    {
                        backgroundColor: isDecrementDisabled ? Colors[theme].disabledButton : Colors[theme].background,
                        borderColor: isDecrementDisabled ? Colors[theme].disabled : Colors[theme].tint,
                    },
                ]}
                disabled={isDecrementDisabled}
                activeOpacity={0.7}
            >
                <MaterialIcons
                    name="remove"
                    size={20}
                    color={isDecrementDisabled ? Colors[theme].disabled : Colors[theme].tint}
                />
            </TouchableOpacity>
            <ThemedText style={[styles.value, { color: Colors[theme].text }]}> {value} </ThemedText>
            <TouchableOpacity
                onPress={handleIncrement}
                style={[
                    styles.button,
                    {
                        backgroundColor: isIncrementDisabled ? Colors[theme].disabledButton : Colors[theme].background,
                        borderColor: isIncrementDisabled ? Colors[theme].disabled : Colors[theme].tint,
                    },
                ]}
                disabled={isIncrementDisabled}
                activeOpacity={0.7}
            >
                <MaterialIcons
                    name="add"
                    size={20}
                    color={isIncrementDisabled ? Colors[theme].disabled : Colors[theme].tint}
                />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        alignItems: "center",
        marginHorizontal: 5,
        paddingHorizontal: 2,
        paddingVertical: 2,
        minWidth: 90,
        justifyContent: "center",
    },
    button: {
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1.5,
        marginHorizontal: 0,
    },
    value: {
        marginHorizontal: 0,
        fontSize: 22,
        fontWeight: "bold",
        minWidth: 22,
        textAlign: "center",
        justifyContent: "center",
    },
});

export default CustomNumericInput;
