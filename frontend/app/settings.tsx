import React, { useEffect } from "react";
import { View, Switch, StyleSheet, Alert, TouchableOpacity, Image } from "react-native";
import { useTheme } from "@/hooks/ThemeContext";
import { ThemedText } from "@/components/ThemedText";
import { Colors } from "@/constants/Colors";
import { supabase } from "@/supabaseClient";
import { useNavigation, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

export default function SettingsScreen() {
    const navigation = useNavigation();
    const { t, i18n } = useTranslation();

    useEffect(() => {
        navigation.setOptions({ headerShown: true, title: t("settings") });
    }, [navigation, t]);

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

    const handleLanguageChange = (language: string) => {
        i18n.changeLanguage(language);
    };

    return (
        <View style={[styles.container, { backgroundColor: Colors[theme].background }]}>
            {/* Modo Oscuro */}
            <View style={[styles.card, { backgroundColor: Colors[theme].TabBarBackground }]}>
                <View style={styles.row}>
                    <Ionicons name={isDarkMode ? "moon" : "sunny"} size={24} color={Colors[theme].icon} />
                    <ThemedText style={[styles.optionText, { color: Colors[theme].text }]}>{t("light/dark_mode")}</ThemedText>
                </View>
                <Switch value={isDarkMode} onValueChange={toggleTheme} />
            </View>

            {/* Selección de Idioma */}
            <View style={[styles.card, { backgroundColor: Colors[theme].TabBarBackground }]}>
                <View style={styles.row}>
                    <Ionicons name="language" size={24} color={Colors[theme].icon} />
                    <ThemedText style={[styles.optionText, { color: Colors[theme].text }]}>{t("language")}</ThemedText>
                </View>
                <View style={styles.languageContainer}>
                    <TouchableOpacity
                        style={[
                            styles.languageOption,
                            i18n.language === "en" ? styles.activeLanguage : styles.inactiveLanguage,
                        ]}
                        onPress={() => handleLanguageChange("en")}
                    >
                        <Image source={require("../assets/flags/en.png")} style={styles.flag} />
                        <ThemedText style={styles.languageText}>English</ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[
                            styles.languageOption,
                            i18n.language === "es" ? styles.activeLanguage : styles.inactiveLanguage,
                        ]}
                        onPress={() => handleLanguageChange("es")}
                    >
                        <Image source={require("../assets/flags/es.png")} style={styles.flag} />
                        <ThemedText style={styles.languageText}>Español</ThemedText>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Botón de Logout */}
            <TouchableOpacity
                style={[styles.logoutButton, { backgroundColor: Colors[theme].close }]}
                onPress={handleLogout}
            >
                <Ionicons name="log-out-outline" size={20} color="#FFF" />
                <ThemedText style={styles.logoutText}>{t("logout")}</ThemedText>
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
    languageContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    languageOption: {
        alignItems: "center",
        marginHorizontal: 10,
    },
    activeLanguage: {
        opacity: 1,
    },
    inactiveLanguage: {
        opacity: 0.5,
    },
    flag: {
        width: 40,
        height: 30,
        marginBottom: 5,
    },
    languageText: {
        fontSize: 14,
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
