import React, { useState } from "react";
import { View, TextInput, Button, StyleSheet, Alert, Image, TouchableOpacity } from "react-native";
import { supabase } from "@/supabaseClient";
import { useRouter } from "expo-router";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/ThemeContext";
import { Colors } from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import { showMessage } from "react-native-flash-message";

export default function RegisterScreen() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const router = useRouter();
    const { theme } = useTheme();

    const handleRegister = async () => {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) {
            showMessage({
                message: "Error",
                description: error.message,
                type: "danger",
                icon: "auto",
            });
        } else {
            const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
            if (loginError) {
                showMessage({
                    message: "Error",
                    description: loginError.message,
                    type: "danger",
                    icon: "auto",
                });
            } else {
                router.push("/(tabs)");
            }
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: Colors[theme].background }]}>
            <Image source={require("@/assets/images/react-logo.png")} style={styles.logo} />
            <ThemedText type="title" style={[styles.title, { color: Colors[theme].text }]}>
                Registrarse
            </ThemedText>
            <TextInput
                style={[styles.input, { borderColor: Colors[theme].text, color: Colors[theme].text }]}
                placeholder="Email"
                placeholderTextColor={Colors[theme].icon}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
            />
            <View style={styles.passwordContainer}>
                <TextInput
                    style={[styles.input, { borderColor: Colors[theme].text, color: Colors[theme].text, flex: 1 }]}
                    placeholder="Password"
                    placeholderTextColor={Colors[theme].icon}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <Ionicons name={showPassword ? "eye-off" : "eye"} size={24} color={Colors[theme].icon} />
                </TouchableOpacity>
            </View>
            <Button title="Registrarse" onPress={handleRegister} color={Colors[theme].tint} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 16,
    },
    logo: {
        width: 200,
        height: 100,
        marginBottom: 20,
    },
    title: {
        fontSize: 24,
        marginBottom: 20,
    },
    input: {
        height: 40,
        borderWidth: 1,
        borderRadius: 8,
        marginBottom: 12,
        paddingHorizontal: 8,
        width: "100%",
    },
    passwordContainer: {
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderRadius: 8,
        marginBottom: 12,
        paddingHorizontal: 8,
        width: "100%",
    },
});
