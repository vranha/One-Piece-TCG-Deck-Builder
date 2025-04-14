import React, { useState } from "react";
import { View, TextInput, StyleSheet, Alert, Image, TouchableOpacity, Keyboard } from "react-native";
import { supabase } from "@/supabaseClient";
import { useRouter } from "expo-router";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/ThemeContext";
import { Colors } from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

export default function LoginScreen() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isEmailFocused, setIsEmailFocused] = useState(false);
    const [isPasswordFocused, setIsPasswordFocused] = useState(false);
    const router = useRouter();
    const { theme } = useTheme(); 
    const { t } = useTranslation();

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
            <ThemedText type="title" style={[styles.title, { color: Colors[theme].tint }]}>
                {t("welcome_to")}
            </ThemedText>
            <Image source={require("@/assets/images/OPLAB-logo.png")} style={styles.logo} />
            <ThemedText type="subtitle" style={[styles.title, { color: Colors[theme].tint }]}>
                {t("enter_new_world")}⚓️
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
                onKeyPress={handleKeyPress}
                onFocus={() => setIsEmailFocused(true)}
                onBlur={() => setIsEmailFocused(false)}
                autoComplete="email" // Habilita el autocompletado para el email
            />

            <TextInput
                style={[
                    styles.input,
                    {
                        color: Colors[theme].text,
                        backgroundColor: Colors[theme].backgroundSoft,
                        borderColor: isPasswordFocused ? Colors[theme].tint : Colors[theme].background,
                    },
                ]}
                placeholder={t("password")}
                placeholderTextColor={Colors[theme].tabIconDefault}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                onKeyPress={handleKeyPress}
                onFocus={() => setIsPasswordFocused(true)}
                onBlur={() => setIsPasswordFocused(false)}
            />

            <TouchableOpacity style={[styles.button, { backgroundColor: Colors[theme].tint }]} onPress={handleLogin}>
                <ThemedText style={styles.buttonText}>{t('sign_in')}</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
                style={[
                    styles.buttonOutline,
                    { borderColor: Colors[theme].background, backgroundColor: Colors[theme].TabBarBackground },
                ]}
                onPress={() => router.push("/register")}
            >
                <ThemedText style={[styles.buttonText, { color: Colors[theme].tint }]}>{t(`register`)}</ThemedText>
            </TouchableOpacity>

            <ThemedText
                style={{
                    color: Colors[theme].tabIconDefault,
                    fontSize: 14,
                    fontWeight: "bold",
                    marginTop: 40,
                    zIndex: 1,
                }}
            >
                {t('or_continue_with')}
            </ThemedText>

            <View style={styles.othersContainer}>
                <TouchableOpacity
                    style={[
                        styles.googleButton,
                        { borderColor: Colors[theme].background, backgroundColor: Colors[theme].highlight },
                    ]}
                    onPress={handleGoogleLogin}
                >
                    <Ionicons name="logo-google" size={24} color={Colors[theme].TabBarBackground} />
                </TouchableOpacity>
            </View>
            <Image
                source={require("@/assets/images/cards_5.png")}
                style={[styles.cardsLogo, { tintColor: Colors[theme].TabBarBackground }]}
            />
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
        width: 220,
        height: 220,
        marginBottom: 30,
    },
    title: {
        fontWeight: "bold",
        marginBottom: 15,
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
    othersContainer: {
        flexDirection: "row",
        justifyContent: "center",
        gap: 10,
        zIndex: 1,
    },
    googleButton: {
        alignItems: "center",
        marginTop: 10,
        paddingVertical: 15,
        paddingHorizontal: 25,
        borderRadius: 10,
        borderWidth: 1,
        justifyContent: "center",
    },
    googleButtonText: {
        marginLeft: 10,
        fontSize: 16,
    },
    cardsLogo: {
        position: "absolute",
        bottom: -230,
        width: 400,
        height: 400,
        marginBottom: 30,
        zIndex: 0,
        // transform: [{ rotate: "-50deg" }],
    },
});
