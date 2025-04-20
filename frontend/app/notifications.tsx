import React, { useState, useEffect } from "react";
import { View, StyleSheet, Text, FlatList } from "react-native";
import NotificationsHeader from "@/components/NotificationsHeader";
import { useTheme } from "@/hooks/ThemeContext";
import { Colors } from "@/constants/Colors";
import useApi from "@/hooks/useApi";
import { supabase } from "@/supabaseClient";

export default function Notifications() {
    const [activeTab, setActiveTab] = useState<"notifications" | "friendRequests">("notifications");
    interface FriendRequest {
        friend_id: string;
    }

    const [pendingFriends, setPendingFriends] = useState<FriendRequest[]>([]);
    const [userId, setUserId] = useState<string | null>(null);
    const { theme } = useTheme();
    const api = useApi();

    useEffect(() => {
        const fetchUserId = async () => {
            const session = await supabase.auth.getSession();
            setUserId(session?.data?.session?.user?.id || null);
        };

        fetchUserId();
    }, []);

    useEffect(() => {
        const fetchPendingFriends = async () => {
            if (userId) {
                try {
                    const { data } = await api.get(`/friends?status=pending&userId=${userId}`);
                    setPendingFriends(data);
                } catch (error) {
                    console.error("Error fetching pending friends:", error);
                }
            }
        };

        if (activeTab === "friendRequests") {
            fetchPendingFriends();
        }
    }, [activeTab, userId]);

    return (
        <View style={[styles.container, { backgroundColor: Colors[theme].background }]}>
            {/* Header */}
            <NotificationsHeader activeTab={activeTab} setActiveTab={setActiveTab} />

            {/* Content */}
            <View style={styles.content}>
                {activeTab === "notifications" ? (
                    <Text style={{ color: Colors[theme].text }}>All notifications will be listed here.</Text>
                ) : (
                    <FlatList
                        data={pendingFriends}
                        keyExtractor={(item) => item.friend_id}
                        renderItem={({ item }) => (
                            <Text style={{ color: Colors[theme].text }}>
                                Pending friend request from: {item.friend_id}
                            </Text>
                        )}
                    />
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
    },
    content: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
});
