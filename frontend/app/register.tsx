import React, { useState } from "react";
import { View, TextInput, StyleSheet, Image, TouchableOpacity, Keyboard } from "react-native";
import { supabase } from "@/supabaseClient";
import { useRouter } from "expo-router";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/ThemeContext";
import { Colors } from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import { useTranslation } from "react-i18next";

export default function RegisterScreen() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isEmailFocused, setIsEmailFocused] = useState(false);
    const [isPasswordFocused, setIsPasswordFocused] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const router = useRouter();
    const { theme } = useTheme();
    const { t } = useTranslation();

    const handleRegister = async () => {
        const { error } = await supabase.auth.signUp({ email, password });

        if (error) {
            Toast.show({
                type: "error",
                text1: "Error",
                text2: error.message,
            });
            return;
        }

        const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
        if (loginError) {
            Toast.show({
                type: "error",
                text1: "Error",
                text2: loginError.message,
            });
        } else {
            router.push("/(tabs)");
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: Colors[theme].background }]}>
            <ThemedText type="title" style={[styles.title, { color: Colors[theme].tint }]}>
                {t("register")}
            </ThemedText>
            <Image source={require("@/assets/images/OPLAB-logo.png")} style={styles.logo} />
            <ThemedText type="subtitle" style={[styles.title, { color: Colors[theme].tint }]}>

                {t("¡Únete a la tripulación!")}🏴‍☠️
            </ThemedText>

            <TextInput
                style={[
                    styles.input,
                    {
                        color: Colors[theme].text,
                        backgroundColor: Colors[theme].backgroundSoft,
                        borderColor: isEmailFocused ? Colors[theme].tint : Colors[theme].background,
                    },
                ]}
                placeholder="Email"
                placeholderTextColor={Colors[theme].tabIconDefault}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                onFocus={() => setIsEmailFocused(true)}
                onBlur={() => setIsEmailFocused(false)}
            />

            <View
                style={[
                    styles.input,
                    styles.passwordWrapper,
                    {
                        backgroundColor: Colors[theme].backgroundSoft,
                        borderColor: isPasswordFocused ? Colors[theme].tint : Colors[theme].background,
                    },
                ]}
            >
                <TextInput
                    style={{
                        flex: 1,
                        color: Colors[theme].text,
                        fontSize: 16,
                        paddingRight: 40, // Add padding to avoid overlap with the eye icon
                    }}
                    placeholder="Contraseña"
                    placeholderTextColor={Colors[theme].tabIconDefault}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    onFocus={() => setIsPasswordFocused(true)}
                    onBlur={() => setIsPasswordFocused(false)}
                />
                <TouchableOpacity
                    style={styles.eyeIconWrapper} // Add a wrapper style for positioning
                    onPress={() => setShowPassword(!showPassword)}
                >
                    <Ionicons name={showPassword ? "eye-off" : "eye"} size={24} color={Colors[theme].tabIconDefault} />
                </TouchableOpacity>
            </View>

            <TouchableOpacity style={[styles.button, { backgroundColor: Colors[theme].tint }]} onPress={handleRegister}>
                <ThemedText style={styles.buttonText}>Registrarse</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
                style={[
                    styles.buttonOutline,
                    { borderColor: Colors[theme].background, backgroundColor: Colors[theme].TabBarBackground },
                ]}
                onPress={() => router.push("/login")}
            >
                <ThemedText style={[styles.buttonText, { color: Colors[theme].tint }]}>Ya tengo cuenta</ThemedText>
            </TouchableOpacity>

            <Image
                source={require("@/assets/images/cards_5.png")}
                style={[styles.cardsLogo, { tintColor: Colors[theme].TabBarBackground }]}
            />

            <Toast />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 20,
        marginTop: -40,
    },
    logo: {
        width: 220,
        height: 220,
        marginBottom: 30,
    },
    title: {
        fontWeight: "bold",
        marginBottom: 20,
        letterSpacing: 2,
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
    passwordWrapper: {
        flexDirection: "row",
        alignItems: "center",
        position: "relative", // Ensure proper positioning
    },
    eyeIconWrapper: {
        position: "absolute",
        right: 10, // Position the eye icon inside the input field
        zIndex: 1,
    },
    button: {
        width: "100%",
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: "center",
        marginTop: 10,
        zIndex: 1,
    },
    buttonOutline: {
        width: "100%",
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: "center",
        marginTop: 10,
        borderWidth: 2,
        zIndex: 1,
    },
    buttonText: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#FFF",
    },
    cardsLogo: {
        position: "absolute",
        bottom: -230,
        width: 400,
        height: 400,
        marginBottom: 30,
        zIndex: 0,
    },
});
