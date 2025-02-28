import React, { useState } from "react";
import { View, TextInput, StyleSheet, Alert, Image, TouchableOpacity, Keyboard } from "react-native";
import { supabase } from "@/supabaseClient";
import { useRouter } from "expo-router";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/ThemeContext";
import { Colors } from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";

export default function LoginScreen() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const router = useRouter();
    const { theme } = useTheme();

    const handleLogin = async () => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
            Alert.alert("Error", error.message);
        } else {
            router.push("/(tabs)");
        }
    };

    const handleGoogleLogin = async () => {
        console.log("Intentando iniciar sesión con Google...");
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: "http://localhost:8081",
            },
        });

        if (error) {
            Alert.alert("Error", error.message);
        }
    };

    const handleKeyPress = (e: any) => {
        if (e.nativeEvent.key === "Enter") {
            Keyboard.dismiss();
            handleLogin();
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: Colors[theme].background }]}>
            <Image source={require("@/assets/images/react-logo.png")} style={styles.logo} />
            <ThemedText type="title" style={[styles.title, { color: Colors[theme].text }]}>
                Iniciar Sesión
            </ThemedText>

            <TextInput
                style={[styles.input, { borderColor: Colors[theme].icon, color: Colors[theme].text }]}
                placeholder="Email"
                placeholderTextColor={Colors[theme].icon}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                onKeyPress={handleKeyPress}
            />

            <TextInput
                style={[styles.input, { borderColor: Colors[theme].icon, color: Colors[theme].text }]}
                placeholder="Contraseña"
                placeholderTextColor={Colors[theme].icon}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                onKeyPress={handleKeyPress}
            />

            <TouchableOpacity style={[styles.button, { backgroundColor: Colors[theme].tint }]} onPress={handleLogin}>
                <ThemedText style={styles.buttonText}>Iniciar sesión</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.buttonOutline, { borderColor: Colors[theme].tint }]}
                onPress={() => router.push("/register")}
            >
                <ThemedText style={[styles.buttonText, { color: Colors[theme].tint }]}>Registrarse</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.googleButton, { borderColor: Colors[theme].icon }]}
                onPress={handleGoogleLogin}
            >
                <Ionicons name="logo-google" size={24} color={Colors[theme].text} />
                <ThemedText style={[styles.googleButtonText, { color: Colors[theme].text }]}>
                    Iniciar sesión con Google
                </ThemedText>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 20,
    },
    logo: {
        width: 180,
        height: 100,
        marginBottom: 30,
    },
    title: {
        fontSize: 26,
        fontWeight: "bold",
        marginBottom: 20,
    },
    input: {
        height: 50,
        width: "100%",
        borderWidth: 1,
        borderRadius: 10,
        paddingHorizontal: 15,
        marginBottom: 12,
        fontSize: 16,
    },
    button: {
        width: "100%",
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: "center",
        marginTop: 10,
    },
    buttonOutline: {
        width: "100%",
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: "center",
        marginTop: 10,
        borderWidth: 2,
    },
    buttonText: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#FFF",
    },
    googleButton: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 20,
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 10,
        borderWidth: 1,
        width: "100%",
        justifyContent: "center",
    },
    googleButtonText: {
        marginLeft: 10,
        fontSize: 16,
    },
});
