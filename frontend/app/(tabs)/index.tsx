import React from "react";
import { StyleSheet, View, Image } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/ThemeContext";
import { Colors } from "@/constants/Colors";

export default function HomeScreen() {
    const { theme } = useTheme();

    return (
        <ThemedView style={[styles.container, { backgroundColor: Colors[theme].background }]}>
            <View style={styles.welcomeContainer}>
                {/* <Image source={require("@/assets/images/one-piece-logo.png")} style={styles.logo} /> */}
                <ThemedText type="title" style={[styles.title, { color: Colors[theme].text }]}>
                    Bienvenido a la App de One Piece TCG
                </ThemedText>
                <ThemedText type="subtitle" style={[styles.subtitle, { color: Colors[theme].icon }]}>
                    ¡Explora y disfruta del juego!
                </ThemedText>
            </View>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 16,
    },
    welcomeContainer: {
        alignItems: "center",
    },
    logo: {
        width: 200,
        height: 100,
        marginBottom: 20,
    },
    title: {
        fontSize: 24,
        textAlign: "center",
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 18,
        textAlign: "center",
    },
});
