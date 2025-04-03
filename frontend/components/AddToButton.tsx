import React from "react";
import { TouchableOpacity, StyleSheet } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { Colors } from "@/constants/Colors";

interface AddToButtonProps {
    isDisabled: boolean;
    onPress: () => void;
    text: string;
    theme: "light" | "dark";
}

const AddToButton: React.FC<AddToButtonProps> = ({ isDisabled, onPress, text, theme }) => {
    return (
        <TouchableOpacity
            style={[styles.addButton, { opacity: isDisabled ? 0.5 : 1, backgroundColor: Colors[theme].highlight }]}
            onPress={onPress}
            disabled={isDisabled}
        >
            <ThemedText style={styles.addButtonText}>{text}</ThemedText>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    addButton: {
        flex: 1,
        marginHorizontal: 16,
        // marginBottom: 10,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: "center",
    },
    addButtonText: {
        color: Colors.light.text,
        fontSize: 18,
        fontWeight: "bold",
    },
});

export default AddToButton;
