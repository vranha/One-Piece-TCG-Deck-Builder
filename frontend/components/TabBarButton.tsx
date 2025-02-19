import React from "react";
import { TouchableOpacity, StyleSheet, GestureResponderEvent, View } from "react-native";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Colors } from "@/constants/Colors";
import { useTheme } from "@/hooks/ThemeContext";

type TabBarButtonProps = {
    name: any;
    isChatButton?: boolean;
    onPress?: (event: GestureResponderEvent) => void;
    [key: string]: any;
};

export default function TabBarButton({ name, isChatButton, onPress, ...props }: TabBarButtonProps) {
    const { theme } = useTheme();

    const handlePress = (e: GestureResponderEvent) => {
        e.preventDefault(); // Evitar la navegación predeterminada
        if (onPress) {
            onPress(e);
        }
    };

    return (
        <View style={isChatButton ? styles.chatContainer : null}>
            <TouchableOpacity
                {...props}
                activeOpacity={isChatButton ? 1 : 0.5}
                onPress={handlePress}
                style={[
                    styles.button,
                    isChatButton
                        ? [styles.chatButton, { backgroundColor: Colors[theme].TabBarBackground }]
                        : { backgroundColor: Colors[theme].TabBarBackground },
                ]}
            >
                <IconSymbol size={isChatButton ? 42 : 32} name={name} color={Colors[theme].text} />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    button: {
        justifyContent: "center",
        alignItems: "center",
        marginTop: 6,
        borderRadius: 32, // Botón redondo
        padding: 10,
    },
    chatContainer: {
        position: "absolute",
        bottom: 5, // Eleva el botón sobre la TabBar
        left: "50%",
        transform: [{ translateX: -50 }],
        width: 100,
        height: 100,
        borderRadius: 35,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "transparent",
    },
    chatButton: {
        width: 80,
        height: 80,
        borderRadius: 40,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -1 },
        shadowOpacity: 0.3,
        shadowRadius: 1,
        elevation: 1,
    },
});
