import React, { useState } from "react";
import { View, TextInput, StyleSheet, Alert, Image, TouchableOpacity, Keyboard, ActivityIndicator } from "react-native";
import { supabase } from "@/supabaseClient";
import { useRouter } from "expo-router";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/ThemeContext";
import { Colors } from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import * as WebBrowser from "expo-web-browser";
import { useFocusEffect } from "@react-navigation/native";
import { getRedirectUri } from "@/utils/authUtils";

export default function LoginScreen() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isEmailFocused, setIsEmailFocused] = useState(false);
    const [isPasswordFocused, setIsPasswordFocused] = useState(false);
    const [showPassword, setShowPassword] = useState(false); // Add state for toggling password visibility
    const [googleLoading, setGoogleLoading] = useState(false); // Estado para feedback visual
    const router = useRouter();
    const { theme } = useTheme();
    const { t } = useTranslation();
    const redirectUri = getRedirectUri();

    // Cierra la sesión automáticamente al entrar en la pantalla de login
    useFocusEffect(
        React.useCallback(() => {
            supabase.auth.signOut();
        }, [])
    );

    // Escuchar cambios de autenticación
    React.useEffect(() => {
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === "SIGNED_IN" && session) {
                setGoogleLoading(false);
                router.replace("/(tabs)");
            } else if (event === "SIGNED_OUT") {
                setGoogleLoading(false);
            }
        });
        return () => {
            subscription.unsubscribe();
        };
    }, [router]);

    const handleLogin = async () => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
            Alert.alert("Error", error.message);
        } else {
            router.push("/(tabs)");
        }
    };
    const handleGoogleLogin = async () => {
        setGoogleLoading(true);
        try {
            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: "google",
                options: {
                    redirectTo: redirectUri,
                    queryParams: {
                        access_type: "offline",
                        prompt: "consent",
                    },
                },
            });
            if (error) {
                Alert.alert("Error", error.message);
                setGoogleLoading(false);
                return;
            }
            if (data?.url) {
                const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUri, {
                    dismissButtonStyle: "cancel",
                    readerMode: false,
                    enableBarCollapsing: false,
                    showInRecents: false,
                });
                if (result.type === "success") {
                    if (result.url) {
                        try {
                            const url = new URL(result.url);
                            let callbackUrl = "/auth/callback";
                            if (url.searchParams.toString()) {
                                callbackUrl += `?${url.searchParams.toString()}`;
                            }
                            if (url.hash) {
                                const hashParams = url.hash.substring(1);
                                if (hashParams) {
                                    callbackUrl += url.searchParams.toString() ? `&${hashParams}` : `?${hashParams}`;
                                }
                            }
                            // Solución de tipado para rutas dinámicas
                            router.replace(callbackUrl as any);
                        } catch (e) {
                            router.replace("/auth/callback");
                        }
                    } else {
                        router.replace("/auth/callback");
                    }
                } else if (result.type === "cancel" || result.type === "dismiss") {
                    Alert.alert(t("login_cancelled", "Inicio de sesión cancelado"));
                    setGoogleLoading(false);
                } else {
                    setGoogleLoading(false);
                }
            } else {
                Alert.alert("Error", "No se pudo iniciar el proceso de autenticación");
                setGoogleLoading(false);
            }
        } catch (err: any) {
            Alert.alert("Error", err.message || "Google login failed");
            setGoogleLoading(false);
        }
        // No establecer setGoogleLoading(false) aquí para "success" ya que esperamos ser redirigidos
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
            <TouchableOpacity style={[styles.button, { backgroundColor: Colors[theme].tint }]} onPress={handleLogin}>
                <ThemedText style={styles.buttonText}>{t("sign_in")}</ThemedText>
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
                {t("or_continue_with")}
            </ThemedText>
            <View style={styles.othersContainer}>
                <TouchableOpacity
                    style={[
                        styles.googleButton,
                        {
                            borderColor: Colors[theme].background,
                            backgroundColor: Colors[theme].highlight,
                            opacity: googleLoading ? 0.6 : 1,
                        },
                    ]}
                    onPress={handleGoogleLogin}
                    disabled={googleLoading}
                >
                    {googleLoading ? (
                        <ActivityIndicator color={Colors[theme].TabBarBackground} />
                    ) : (
                        <Ionicons name="logo-google" size={24} color={Colors[theme].TabBarBackground} />
                    )}
                </TouchableOpacity>
            </View>{" "}
            <Image
                source={require("@/assets/images/cards_5.png")}
                style={[styles.cardsLogo, { tintColor: Colors[theme].TabBarBackground }]}
            />
            {/* Debugger de autenticación eliminado para producción */}
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
});
