import React from "react";
import { View, Text, StyleSheet, Image } from "react-native";
import { Colors } from "@/constants/Colors"; // Asegúrate de que esta ruta sea correcta para los colores de tu app

const toastConfig = {
    success: ({ text1, text2 }: { text1?: string; text2?: string }) => (
        <View style={[styles.toastContainer, { backgroundColor: Colors.light.success }]}>
            <Text>😍</Text>
            <View style={styles.textContainer}>
                {text1 && <Text style={styles.title}>{text1}</Text>}
                {text2 && <Text style={styles.subtitle}>{text2}</Text>}
            </View>
        </View>
    ),
    error: ({ text1, text2 }: { text1?: string; text2?: string }) => (
        <View style={[styles.toastContainer, { backgroundColor: Colors.light.error }]}>
            <Text>😰</Text>
            <View style={styles.textContainer}>
                {text1 && <Text style={styles.title}>{text1}</Text>}
                {text2 && <Text style={styles.subtitle}>{text2}</Text>}
            </View>
        </View>
    ),
    info: ({ text1, text2 }: { text1?: string; text2?: string }) => (
        <View style={[styles.toastContainer, { backgroundColor: Colors.light.info }]}>
            <Text>🥸</Text>
            <View style={styles.textContainer}>
                {text1 && <Text style={styles.title}>{text1}</Text>}
                {text2 && <Text style={styles.subtitle}>{text2}</Text>}
            </View>
        </View>
    ),
};

const styles = StyleSheet.create({
    toastContainer: {
        flexDirection: "row",
        alignItems: "center",
        padding: 10,
        borderRadius: 8,
        marginHorizontal: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 5,
    },
    icon: {
        width: 30,
        height: 30,
        marginRight: 10,
    },
    textContainer: {
        flex: 1,
    },
    title: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#fff",
    },
    subtitle: {
        fontSize: 14,
        color: "#fff",
    },
});

export default toastConfig;