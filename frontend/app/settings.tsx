import React, { useEffect } from "react";
import { View, Switch, StyleSheet, Alert, TouchableOpacity } from "react-native";
import { useTheme } from "@/hooks/ThemeContext";
import { ThemedText } from "@/components/ThemedText";
import { Colors } from "@/constants/Colors";
import { supabase } from "@/supabaseClient";
import { useNavigation, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function SettingsScreen() {
    const navigation = useNavigation();

    useEffect(() => {
        navigation.setOptions({ headerShown: true, title: "Ajustes" });
    }, [navigation]);
    const { theme, toggleTheme } = useTheme();
    const isDarkMode = theme === "dark";
    const router = useRouter();

    const handleLogout = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            Alert.alert("Error", error.message);
        } else {
            router.replace("/login");
        }
    };

    return (
        
        <View style={[styles.container, { backgroundColor: Colors[theme].background }]}>
            {/* Modo Oscuro */}
            <View style={[styles.card, { backgroundColor: Colors[theme].TabBarBackground }]}>
                <View style={styles.row}>
                    <Ionicons
                        name={isDarkMode ? "moon" : "sunny"}
                        size={24}
                        color={Colors[theme].icon}
                    />
                    <ThemedText style={[styles.optionText, { color: Colors[theme].text }]}>
                        Modo Oscuro
                    </ThemedText>
                </View>
                <Switch value={isDarkMode} onValueChange={toggleTheme} />
            </View>

            {/* Botón de Logout */}
            <TouchableOpacity
                style={[styles.logoutButton, { backgroundColor: Colors[theme].highlight }]}
                onPress={handleLogout}
            >
                <Ionicons name="log-out-outline" size={20} color="#FFF" />
                <ThemedText style={styles.logoutText}>Cerrar sesión</ThemedText>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        alignItems: "center",
        justifyContent: "center",
    },
    headerText: {
        fontSize: 24,
        fontWeight: "bold",
        marginBottom: 20,
    },
    card: {
        width: "100%",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 15,
        borderRadius: 12,
        marginBottom: 20,
        elevation: 2,
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
    },
    optionText: {
        fontSize: 16,
        marginLeft: 10,
    },
    logoutButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        padding: 15,
        borderRadius: 12,
        marginTop: 20,
    },
    logoutText: {
        color: "#FFF",
        fontSize: 16,
        marginLeft: 10,
    },
});
