import React from "react";
import { StyleSheet, View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/ThemeContext";
import { Colors } from "@/constants/Colors";

const CollectionCarousel: React.FC = () => {
    const { theme } = useTheme();

    return (
        <View style={[styles.container, { backgroundColor: Colors[theme].TabBarBackground }]}>
            <Text style={[styles.placeholder, { color: Colors[theme].text }]}>No collections available</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingVertical: 15,
        borderRadius: 10,
        alignItems: "center",
        marginVertical: 12,
    },
    placeholder: {
        fontSize: 16,
        fontWeight: "bold",
    },
});

export default CollectionCarousel;
