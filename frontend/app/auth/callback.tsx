import React, { useEffect, useState } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import { View, ActivityIndicator, StyleSheet, TouchableOpacity } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { useTranslation } from "react-i18next";
import { supabase } from "@/supabaseClient";
import { Colors } from "@/constants/Colors";
import { useTheme } from "@/hooks/ThemeContext";

export default function AuthCallbackScreen() {
    const router = useRouter();
    const { t } = useTranslation();
    const params = useLocalSearchParams();
    const { theme } = useTheme();
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [retry, setRetry] = useState(0);
    useEffect(() => {
        let cancelled = false;
        let timeoutId: NodeJS.Timeout;
        const handleAuthCallback = async () => {
            setLoading(true);
            setError(null);
            try {
                // Intentar establecer la sesión si hay tokens en los parámetros
                const urlParams = params as { [key: string]: string };
                let access_token = urlParams.access_token;
                let refresh_token = urlParams.refresh_token;
                if (access_token && refresh_token) {
                    const { error: sessionError } = await supabase.auth.setSession({
                        access_token,
                        refresh_token,
                    });
                    if (sessionError) {
                        throw new Error(sessionError.message);
                    }
                }
                await new Promise((resolve) => setTimeout(resolve, 1000));
                const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
                if (sessionData.session && sessionData.session.user) {
                    setLoading(false);
                    router.replace("/(tabs)");
                    return;
                }
                if (sessionError) {
                    throw new Error(sessionError.message);
                }
                // Configurar timeout de 30 segundos
                timeoutId = setTimeout(() => {
                    if (!cancelled) {
                        setError(t("auth_timeout", "La autenticación ha tardado demasiado. Intenta de nuevo."));
                        setLoading(false);
                    }
                }, 30000);
            } catch (error: any) {
                if (!cancelled) {
                    setError(error.message || "Error de autenticación");
                    setLoading(false);
                }
            }
        };
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === "SIGNED_IN" && session && !cancelled) {
                if (timeoutId) clearTimeout(timeoutId);
                setLoading(false);
                setError(null);
                router.replace("/(tabs)");
            } else if (event === "SIGNED_OUT" && !cancelled) {
                if (timeoutId) clearTimeout(timeoutId);
                setError(t("auth_failed", "La autenticación falló. Intenta de nuevo."));
                setLoading(false);
            }
        });
        handleAuthCallback();
        return () => {
            cancelled = true;
            if (timeoutId) clearTimeout(timeoutId);
            subscription.unsubscribe();
        };
    }, [router, retry, t, params]);
    return (
        <View style={[styles.container, { backgroundColor: Colors[theme].background }]}>
            <View style={styles.centerContent}>
                {loading && (
                    <>
                        <ActivityIndicator size="large" color={Colors[theme].tint} />
                        <ThemedText
                            style={{
                                marginTop: 20,
                                textAlign: "center",
                                fontWeight: "bold",
                                fontSize: 18,
                                color: Colors[theme].text,
                            }}
                        >
                            {t("processing_login", "Procesando login...")}
                        </ThemedText>
                    </>
                )}
                {!loading && error && (
                    <>
                        <ThemedText
                            style={{
                                color: Colors[theme].error,
                                fontWeight: "bold",
                                fontSize: 16,
                                marginBottom: 20,
                                textAlign: "center",
                            }}
                        >
                            {error}
                        </ThemedText>
                        <TouchableOpacity
                            style={{
                                backgroundColor: Colors[theme].tint,
                                padding: 12,
                                borderRadius: 8,
                                marginBottom: 10,
                            }}
                            onPress={() => setRetry((r) => r + 1)}
                        >
                            <ThemedText style={{ color: "#fff", fontWeight: "bold" }}>
                                {t("retry", "Reintentar")}
                            </ThemedText>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={{ backgroundColor: Colors[theme].backgroundSoft, padding: 12, borderRadius: 8 }}
                            onPress={() => router.replace("/login")}
                        >
                            <ThemedText style={{ color: Colors[theme].tint, fontWeight: "bold" }}>
                                {t("back_to_login", "Volver al login")}
                            </ThemedText>
                        </TouchableOpacity>
                    </>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    centerContent: {
        width: "90%",
        alignItems: "center",
        justifyContent: "center",
        alignSelf: "center",
    },
});
