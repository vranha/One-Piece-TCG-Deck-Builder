import React from "react";
import { View, TouchableOpacity, StyleSheet, Text } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { Colors } from "@/constants/Colors";
import { useTheme } from "@/hooks/ThemeContext";
import { router } from "expo-router";

interface NotificationsHeaderProps {
    activeTab: "notifications" | "friendRequests";
    setActiveTab: (tab: "notifications" | "friendRequests") => void;
}

const NotificationsHeader: React.FC<NotificationsHeaderProps> = ({ activeTab, setActiveTab }) => {
    const { theme } = useTheme();

    return (
        <View style={[styles.headerContainer, { backgroundColor: Colors[theme].background }]}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                <MaterialIcons name="arrow-back" size={24} color={Colors[theme].text} />
            </TouchableOpacity>
            <View style={styles.tabContainer}>
                <TouchableOpacity
                    style={[styles.tabButton, activeTab === "notifications" && styles.activeTab]}
                    onPress={() => setActiveTab("notifications")}
                >
                    <Text style={[styles.tabText, activeTab === "notifications" && { color: Colors[theme].info }]}>
                        Notifications
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tabButton, activeTab === "friendRequests" && styles.activeTab]}
                    onPress={() => setActiveTab("friendRequests")}
                >
                    <Text style={[styles.tabText, activeTab === "friendRequests" && { color: Colors[theme].info }]}>
                        Friend Requests
                    </Text>
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
    tabButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        backgroundColor: "#f0f0f0",
        marginHorizontal: 4,
    },
    activeTab: {
        backgroundColor: "#d0d0d0",
    },
    tabText: {
        fontSize: 16,
        color: "#000",
    },
});

export default NotificationsHeader;
