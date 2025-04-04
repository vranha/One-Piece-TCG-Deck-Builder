import React from "react";
import { TouchableOpacity, StyleSheet } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { Colors } from "@/constants/Colors";
import { useTheme } from "@/hooks/ThemeContext";

interface ApplyFiltersButtonProps {
    onPress: () => void;
    label: string;
}

const ApplyFiltersButton: React.FC<ApplyFiltersButtonProps> = ({ onPress, label }) => {
    const { theme } = useTheme();

    return (
        <TouchableOpacity style={[styles.applyButton, { backgroundColor: Colors[theme].success }]} onPress={onPress}>
            <ThemedText style={[styles.applyButtonText, { color:Colors[theme].background }]}>{label}</ThemedText>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    applyButton: {
        marginTop: 20,
        paddingHorizontal: 22,
        paddingVertical: 10,
        borderRadius: 8,
        alignItems: "center",
    },
    applyButtonText: {
        fontWeight: "bold",
        fontSize: 16,
    },
});

export default ApplyFiltersButton;
