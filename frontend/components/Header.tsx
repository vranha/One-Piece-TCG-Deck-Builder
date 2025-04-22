import React, { useEffect, useState } from "react";
import { View, Button, TouchableOpacity, StyleSheet, Image } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Colors } from "@/constants/Colors";
import { useTheme } from "@/hooks/ThemeContext";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import useApi from "@/hooks/useApi";
import { supabase } from "@/supabaseClient";
import { useFocusEffect } from "@react-navigation/native";

interface HeaderProps {
    title: string;
}

export default function Header({ title }: HeaderProps) {
    const { theme } = useTheme();

    return (
        <View style={{ flexDirection: "row" }}>
            <ThemedText type="title" style={{ position: "relative", bottom: 5, left: 3 }}>
                <MaterialIcons
                    name="trip-origin"
                    size={14}
                    style={{ position: "absolute", top: 3, right: 0, color: Colors[theme].info }}
                />
            </ThemedText>
            <ThemedText type="title" style={{ fontSize: 28, color: Colors[theme].tint }}>
                {title.split(" ")[0].slice(1).toUpperCase()}
            </ThemedText>
            <ThemedText
                type="title"
                style={{ fontSize: 28, position: "relative", right: 2, color: Colors[theme].highlight }}
            >
                {title.split(" ")[1].toLowerCase()}
            </ThemedText>
        </View>
    );
}

Header.LeftButton = function LeftButton() {
    return (
        <View style={{ marginLeft: 16, marginRight: 16 }}>
            <Image source={require("@/assets/images/icon-round.png")} style={styles.logo} />
        </View>
    );
};

Header.RightButton = function RightButton({ onPress }: any) {
    const { theme } = useTheme();
    return (
        <TouchableOpacity onPress={onPress} style={{ marginRight: 16 }}>
            <IconSymbol size={28} name="gearshape.fill" color={Colors[theme].text} />
        </TouchableOpacity>
    );
};

Header.RightButtonSearch = function RightButtonSearch({ onPress }: any) {
    const { theme } = useTheme();
    return (
        <TouchableOpacity onPress={onPress} style={{ marginRight: 16 }}>
            <MaterialIcons name="style" size={28} color={Colors[theme].text} />
        </TouchableOpacity>
    );
};

Header.RightButtonDeckSearcher = function RightButtonDeckSearcher({ onPress }: any) {
    const { theme } = useTheme();
    return (
        <TouchableOpacity onPress={onPress} style={{ marginRight: 16 }}>
            <IconSymbol size={28} name="magnifyingglass" color={Colors[theme].text} />
        </TouchableOpacity>
    );
};

Header.LeftButtonNotifications = function RightButtonNotifications({ onPress }: any) {
    const { theme } = useTheme();
    const [hasNotifications, setHasNotifications] = useState(false);
    const api = useApi();

    const fetchNotifications = async () => {
        try {
            const session = await supabase.auth.getSession();
            const userId = session?.data?.session?.user?.id;

            if (userId) {
                console.log("Fetching notifications for userId:", userId); // Log userId
                const { data } = await api.get("/notifications", {
                    params: { userId }, // Pass userId as a query parameter
                    headers: {
                        Authorization: `Bearer ${session.data.session?.access_token || ""}`, // Log token
                    },
                });
                console.log("Notifications response data:", data); // Log response data
                setHasNotifications(data.hasNotifications);
            } else {
                console.error("User ID is missing in the session.");
            }
        } catch (error) {
            console.error("Error fetching notifications:", (error as any).response?.data || (error as any).message);
        }
    };

    useFocusEffect(
        React.useCallback(() => {
            fetchNotifications(); // Call fetchNotifications every time the component is accessed
        }, [])
    );

    return (
        <TouchableOpacity onPress={onPress} style={{ position: "relative" }}>
            <MaterialIcons name="notifications" size={28} color={Colors[theme].text} />
            {hasNotifications && (
                <View
                    style={{
                        position: "absolute",
                        top: -2,
                        right: -2,
                        width: 10,
                        height: 10,
                        borderRadius: 5,
                        backgroundColor: Colors[theme].tint,
                    }}
                />
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    logo: {
        width: 40,
        height: 40,
    },
});
