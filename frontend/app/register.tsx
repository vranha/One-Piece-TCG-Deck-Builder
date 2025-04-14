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
import useApi from "@/hooks/useApi";

export default function RegisterScreen() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isEmailFocused, setIsEmailFocused] = useState(false);
    const [isPasswordFocused, setIsPasswordFocused] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isConfirmPasswordFocused, setIsConfirmPasswordFocused] = useState(false);
    const router = useRouter();
    const { theme } = useTheme();
    const { t } = useTranslation();
    const api = useApi(); // Initialize the API hook

    const handleRegister = async () => {
        if (password !== confirmPassword) {
            Toast.show({
                type: "error",
                text1: "Error",
                text2: t("passwords_do_not_match"),
                position: "bottom",
            });
            return;
        }

        // Registrar al usuario en Supabase Authentication
        const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });

        if (authError) {
            Toast.show({
                type: "error",
                text1: "Error",
                text2: authError.message,
                position: "bottom",
            });
            return;
        }

        if (!authData.user) {
            Toast.show({
                type: "error",
                text1: "Error",
                text2: t("registration_failed"),
                position: "bottom",
            });
            return;
        }

        try {
            // Agregar el usuario a la tabla 'users' en Supabase
            const { error: dbError } = await supabase
                .from("users")
                .insert([{ id: authData.user.id, email, username: email.split("@")[0] }]);

            if (dbError) {
                throw new Error(dbError.message || t("backend_registration_failed"));
            }

            Toast.show({
                type: "success",
                text1: t("success"),
                text2: t("user_registered_successfully"),
                position: "bottom",
            });

            // Verifica si el email necesita confirmación
            if (!authData.user.email_confirmed_at) {
                Toast.show({
                    type: "info",
                    text1: t("email_confirmation"),
                    text2: t("check_email_for_confirmation"),
                    position: "bottom",
                });
            }

            router.push("/(tabs)");
        } catch (error) {
            Toast.show({
                type: "error",
                text1: "Error",
                text2: error instanceof Error ? error.message : t("unknown_error"),
                position: "bottom",
            });
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
                    placeholder={t("password")}
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
            <View
                style={[
                    styles.input,
                    styles.passwordWrapper,
                    {
                        backgroundColor: Colors[theme].backgroundSoft,
                        borderColor: isConfirmPasswordFocused ? Colors[theme].tint : Colors[theme].background,
                    },
                ]}
            >
                <TextInput
                    style={{
                        flex: 1,
                        color: Colors[theme].text,
                        fontSize: 16,
                        paddingRight: 40,
                    }}
                    placeholder={t("confirm_password")}
                    placeholderTextColor={Colors[theme].tabIconDefault}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showPassword}
                    onFocus={() => setIsConfirmPasswordFocused(true)}
                    onBlur={() => setIsConfirmPasswordFocused(false)}
                />
                <TouchableOpacity style={styles.eyeIconWrapper} onPress={() => setShowPassword(!showPassword)}>
                    <Ionicons name={showPassword ? "eye-off" : "eye"} size={24} color={Colors[theme].tabIconDefault} />
                </TouchableOpacity>
            </View>

            <TouchableOpacity style={[styles.button, { backgroundColor: Colors[theme].tint }]} onPress={handleRegister}>
                <ThemedText style={styles.buttonText}>{t("register")}</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
                style={[
                    styles.buttonOutline,
                    { borderColor: Colors[theme].background, backgroundColor: Colors[theme].TabBarBackground },
                ]}
                onPress={() => router.push("/login")}
            >
                <ThemedText style={[styles.buttonText, { color: Colors[theme].tint }]}>
                    {t("already_account")}
                </ThemedText>
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
        zIndex: 1,
    },
    passwordWrapper: {
        flexDirection: "row",
        alignItems: "center",
        position: "relative", // Ensure proper positioning
    },
    eyeIconWrapper: {
        position: "absolute",
        right: 10, // Position the eye icon inside the input field
        zIndex: 2,
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
