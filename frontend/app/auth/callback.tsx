import { useEffect } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import { View, ActivityIndicator, StyleSheet } from "react-native";
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

    useEffect(() => {
        // Refresca la sesión de Supabase tras el login OAuth
        const refreshSessionAndRedirect = async () => {
            let tries = 0;
            let session = null;
            // Espera hasta que la sesión esté disponible o se agoten los intentos
            while (tries < 10) {
                const { data } = await supabase.auth.getSession();
                session = data.session;
                if (session && session.user) break;
                await new Promise((res) => setTimeout(res, 300));
                tries++;
            }
            // Si hay sesión, redirige; si no, muestra error o reintenta
            if (session && session.user) {
                router.replace("/(tabs)");
            } else {
                // Puedes mostrar un error o reintentar
            }
        };
        refreshSessionAndRedirect();
    }, [router]);

    return (
        <View style={[styles.container, { backgroundColor: Colors[theme].background }]}>
            <View style={styles.centerContent}>
                <ActivityIndicator size="large" />
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
