import React from "react";
import { View, TouchableOpacity, StyleSheet, Text } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { Colors } from "@/constants/Colors";
import { useTheme } from "@/hooks/ThemeContext";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons"; // Importamos nuevos iconos
import { useTranslation } from "react-i18next";

interface NotificationsHeaderProps {
    activeTab: "notifications" | "friendRequests";
    setActiveTab: (tab: "notifications" | "friendRequests") => void;
}

const NotificationsHeader: React.FC<NotificationsHeaderProps> = ({ activeTab, setActiveTab }) => {
    const { theme } = useTheme();
    const { t } = useTranslation();

    return (
        <View style={[styles.headerContainer, { backgroundColor: Colors[theme].background }]}>
            <TouchableOpacity
                onPress={() => {
                    if (router.canGoBack()) {
                        router.back();
                    } else {
                        router.push("/"); // Navigate to a default screen, e.g., "Home"
                    }
                }}
                style={styles.backButton}
            >
                <MaterialIcons name="arrow-back" size={24} color={Colors[theme].text} />
            </TouchableOpacity>
            <View style={styles.tabContainer}>
                <TouchableOpacity style={styles.tab} onPress={() => setActiveTab("notifications")}>
                    <Ionicons
                        name="notifications-outline"
                        size={20}
                        color={activeTab === "notifications" ? Colors[theme].info : Colors[theme].tabIconDefault}
                    />
                    <Text
                        style={[
                            styles.tabText,
                            activeTab === "notifications"
                                ? { color: Colors[theme].info }
                                : { color: Colors[theme].tabIconDefault },
                        ]}
                    >
                        {t("notifications")}
                    </Text>
                    {activeTab === "notifications" && (
                        <View style={[styles.activeIndicator, { backgroundColor: Colors[theme].info }]} />
                    )}
                </TouchableOpacity>
                <TouchableOpacity style={styles.tab} onPress={() => setActiveTab("friendRequests")}>
                    <Ionicons
                        name="person-add-outline"
                        size={20}
                        color={activeTab === "friendRequests" ? Colors[theme].info : Colors[theme].tabIconDefault}
                    />
                    <Text
                        style={[
                            styles.tabText,
                            activeTab === "friendRequests"
                                ? { color: Colors[theme].info }
                                : { color: Colors[theme].tabIconDefault },
                        ]}
                    >
                        {t("friendRequests")}
                    </Text>
                    {activeTab === "friendRequests" && (
                        <View style={[styles.activeIndicator, { backgroundColor: Colors[theme].info }]} />
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    headerContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 10,
        marginTop: 30,
    },
    backButton: {
        paddingRight: 16,
    },
    tabContainer: {
        flexDirection: "row",
        flex: 1,
        justifyContent: "center",
    },
    tab: {
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginHorizontal: 8,
    },
    tabText: {
        fontSize: 12, // Reducimos el tamaño del texto para que encaje mejor con los iconos
        fontWeight: "bold",
        marginTop: 4, // Espacio entre el icono y el texto
    },
    activeIndicator: {
        marginTop: 4,
        height: 3,
        width: "100%",
        borderRadius: 2,
    },
});

export default NotificationsHeader;
