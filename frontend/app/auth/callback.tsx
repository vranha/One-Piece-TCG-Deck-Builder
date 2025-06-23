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
        const refreshSessionAndRedirect = async () => {
            setLoading(true);
            setError(null);
            let tries = 0;
            let session = null;
            // Intentar refrescar la sesión explícitamente
            try {
                await supabase.auth.refreshSession();
            } catch (e) {
                // Ignorar error, seguimos intentando getSession
            }
            while (tries < 20 && !cancelled) {
                try {
                    const { data, error: sessionError } = await supabase.auth.getSession();
                    session = data.session;
                    if (session && session.user) break;
                    if (sessionError) {
                        setError(sessionError.message);
                        break;
                    }
                } catch (e: any) {
                    setError(e.message || "Unknown error");
                    break;
                }
                await new Promise((res) => setTimeout(res, 500));
                tries++;
            }
            if (cancelled) return;
            if (session && session.user) {
                setLoading(false);
                setError(null);
                router.replace("/(tabs)");
            } else {
                setLoading(false);
                setError(t("login_session_error", "No se pudo obtener la sesión. Intenta de nuevo o vuelve al login."));
            }
        };
        refreshSessionAndRedirect();
        return () => {
            cancelled = true;
        };
    }, [router, retry, t]);

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
                {/* Debug: mostrar parámetros del callback si existen */}
                {Object.keys(params).length > 0 && (
                    <View style={{ marginTop: 20 }}>
                        <ThemedText style={{ fontSize: 12, color: Colors[theme].tint, textAlign: "center" }}>
                            Params: {JSON.stringify(params)}
                        </ThemedText>
                    </View>
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
