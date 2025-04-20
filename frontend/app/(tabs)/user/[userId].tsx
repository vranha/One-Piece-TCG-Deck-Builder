import React, { useEffect, useState } from "react";
import { StyleSheet, View, Image, ActivityIndicator } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/ThemeContext";
import { Colors } from "@/constants/Colors";
import useApi from "@/hooks/useApi";

interface UserProfile {
    id: string;
    username: string;
    avatar_url: string | null;
    bio: string | null;
    location: string | null;
}

export default function UserProfileScreen() {
    const { theme } = useTheme();
    const api = useApi();
    const router = useRouter();
    const { userId } = useLocalSearchParams();
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchUserProfile() {
            try {
                const { data } = await api.get(`/users/${userId}`);
                setUserProfile(data);
            } catch (error) {
                console.error("Error fetching user profile:", error);
            } finally {
                setLoading(false);
            }
        }

        if (userId) {
            fetchUserProfile();
        }
    }, [userId]);

    if (loading) {
        return (
            <ThemedView style={[styles.container, { backgroundColor: Colors[theme].background }]}>
                <ActivityIndicator size="large" color={Colors[theme].tint} />
            </ThemedView>
        );
    }

    if (!userProfile) {
        return (
            <ThemedView style={[styles.container, { backgroundColor: Colors[theme].background }]}>
                <ThemedText style={{ color: Colors[theme].text }}>User not found</ThemedText>
            </ThemedView>
        );
    }

    return (
        <ThemedView style={[styles.container, { backgroundColor: Colors[theme].background }]}>
            <View style={styles.profileContainer}>
                {userProfile.avatar_url ? (
                    <Image source={{ uri: userProfile.avatar_url }} style={styles.avatar} />
                ) : null}
                <ThemedText type="title" style={[styles.username, { color: Colors[theme].text }]}>
                    {userProfile.username}
                </ThemedText>
                {userProfile.bio ? (
                    <ThemedText style={[styles.bio, { color: Colors[theme].text }]}>{userProfile.bio}</ThemedText>
                ) : null}
                {userProfile.location ? (
                    <ThemedText style={[styles.location, { color: Colors[theme].text }]}>
                        {userProfile.location}
                    </ThemedText>
                ) : null}
            </View>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 16,
    },
    profileContainer: {
        alignItems: "center",
    },
    avatar: {
        width: 120,
        height: 120,
        borderRadius: 60,
        marginBottom: 16,
    },
    username: {
        fontSize: 24,
        fontWeight: "bold",
        marginBottom: 8,
    },
    bio: {
        fontSize: 16,
        textAlign: "center",
        marginBottom: 8,
    },
    location: {
        fontSize: 14,
        textAlign: "center",
        color: "gray",
    },
});
