import { useEffect } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { useTranslation } from "react-i18next";

export default function AuthCallbackScreen() {
    const router = useRouter();
    const { t } = useTranslation();
    const params = useLocalSearchParams();

    useEffect(() => {
        // Aquí podrías procesar los parámetros del callback si lo necesitas
        // Por ahora, simplemente redirige a la home después de un breve delay
        const timeout = setTimeout(() => {
            router.replace("/(tabs)");
        }, 1200);
        return () => clearTimeout(timeout);
    }, [router]);

    return (
        <View style={styles.container}>
            <View style={styles.centerContent}>
                <ActivityIndicator size="large" />
                <ThemedText style={{ marginTop: 20, textAlign: "center" }}>
                    {t("processing_login", "Procesando login...")}
                </ThemedText>
                {/* Debug: mostrar parámetros del callback si existen */}
                {Object.keys(params).length > 0 && (
                    <View style={{ marginTop: 20 }}>
                        <ThemedText style={{ fontSize: 12, color: "#888", textAlign: "center" }}>
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
        backgroundColor: "#fff",
    },
    centerContent: {
        width: "90%",
        alignItems: "center",
        justifyContent: "center",
        alignSelf: "center",
    },
});
