import React, { useEffect, useState, useMemo } from "react";
import { StyleSheet, View, Image, ActivityIndicator, TouchableOpacity, Modal } from "react-native";
import { useRouter, useLocalSearchParams, useNavigation } from "expo-router";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/ThemeContext";
import { Colors } from "@/constants/Colors";
import useApi from "@/hooks/useApi";
import { MaterialIcons } from "@expo/vector-icons"; // Import MaterialIcons
import Toast from "react-native-toast-message"; // Import Toast for notifications
import { supabase } from "@/supabaseClient";
import { useFocusEffect } from "@react-navigation/native"; // Import useFocusEffect
import { Ionicons } from "@expo/vector-icons"; // Import Ionicons
import DeckCarousel from "@/components/DeckCarousel"; // Import DeckCarousel
import { useTranslation } from "react-i18next";

interface UserProfile {
    id: string;
    username: string;
    avatar_url: string | null;
    bio: string | null;
    location: string | null;
}

interface FriendStatus {
    status: "none" | "sent" | "received" | "accepted";
}

export default function UserProfileScreen() {
    const { theme } = useTheme();
    const api = useApi();
    const { t } = useTranslation();
    const router = useRouter();
    const navigation = useNavigation();
    const { userId } = useLocalSearchParams();
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [friendStatus, setFriendStatus] = useState<FriendStatus>({ status: "none" });
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [isDeleteFriendModalVisible, setIsDeleteFriendModalVisible] = useState(false); // State for delete friend modal
    const [decks, setDecks] = useState([]); // State for user's decks

    useEffect(() => {
        const fetchUserId = async () => {
            const session = await supabase.auth.getSession();
            setCurrentUserId(session?.data?.session?.user?.id || null);
        };

        fetchUserId();
    }, []);

    useFocusEffect(
        React.useCallback(() => {
            const fetchData = async () => {
                if (userId && currentUserId) {
                    setLoading(true);
                    await Promise.all([fetchUserProfile(), fetchFriendStatus()]);
                    setLoading(false);
                }
            };

            fetchData();
        }, [userId, currentUserId])
    );

    async function fetchUserProfile() {
        try {
            const { data } = await api.get(`/users/${userId}`);
            setUserProfile(data);
        } catch (error) {
            console.error("Error fetching user profile:", error);
        }
    }

    async function fetchFriendStatus() {
        if (!currentUserId) return;

        try {
            const { data: friends } = await api.get(`/friends`, { params: { userId: currentUserId } });

            const friend = friends.find((friend: any) => friend.id === userId);

            if (friend) {
                if (friend.status === "accepted") {
                    setFriendStatus({ status: "accepted" });
                } else if (friend.isSender && friend.status === "pending") {
                    setFriendStatus({ status: "sent" });
                } else if (!friend.isSender && friend.status === "pending") {
                    setFriendStatus({ status: "received" });
                }
            } else {
                setFriendStatus({ status: "none" });
            }
        } catch (error) {
            console.error("Error fetching friend status:", error);
        }
    }

    const handleDeleteFriend = async () => {
        try {
            console.log("Deleting friend with ID:", userId); // Verificar el ID del amigo
            console.log("Current user ID:", currentUserId); // Verificar el ID del usuario actual

            if (!userId || !currentUserId) {
                throw new Error("Both userId and currentUserId are required.");
            }

            const response = await api.delete(`/friends/${userId}`, {
                data: { userId: currentUserId }, // Enviar el userId actual en el cuerpo de la solicitud
            });
            console.log("Delete response:", response); // Verificar la respuesta del servidor

            setFriendStatus({ status: "none" });
            Toast.show({
                type: "success",
                text1: "Friend Removed",
                text2: "The friend has been removed successfully.",
                position: "bottom",
            });

            router.push("/"); // Redirigir a la ruta "/"
        } catch (error) {
            console.error("Error removing friend:", error); // Verificar el error
            Toast.show({
                type: "error",
                text1: "Error",
                text2: "Failed to remove friend.",
                position: "bottom",
            });
        } finally {
            setIsDeleteFriendModalVisible(false);
        }
    };

    const headerOptions = useMemo(
        () => ({
            headerShown: true,
            headerLeft: () => (
                <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 12 }}>
                    <MaterialIcons name="arrow-back" size={24} color={Colors[theme].text} />
                </TouchableOpacity>
            ),
            headerTitle: () => null, // No title in the center
            headerRight: () => {
                switch (friendStatus.status) {
                    case "none":
                        return (
                            <TouchableOpacity
                                onPress={async () => {
                                    try {
                                        await api.post("/friends/request", {
                                            userId: userProfile?.id,
                                            friendId: userId,
                                        });
                                        setFriendStatus({ status: "sent" });
                                        Toast.show({
                                            type: "success",
                                            text1: "Friend Request Sent",
                                            text2: "Your friend request has been sent successfully.",
                                            position: "bottom",
                                        });
                                    } catch (error) {
                                        console.error("Error sending friend request:", error);
                                        Toast.show({
                                            type: "error",
                                            text1: "Error",
                                            text2: "Failed to send friend request.",
                                            position: "bottom",
                                        });
                                    }
                                }}
                                style={{
                                    backgroundColor: Colors[theme].success,
                                    paddingVertical: 5,
                                    paddingHorizontal: 10,
                                    borderRadius: 5,
                                    marginRight: 12,
                                }}
                            >
                                <ThemedText style={{ color: Colors[theme].background, fontWeight: "bold" }}>
                                    Add Friend
                                </ThemedText>
                            </TouchableOpacity>
                        );
                    case "sent":
                        return (
                            <View
                                style={{
                                    backgroundColor: Colors[theme].disabled,
                                    paddingVertical: 5,
                                    paddingHorizontal: 10,
                                    borderRadius: 5,
                                    marginRight: 12,
                                }}
                            >
                                <ThemedText style={{ color: Colors[theme].background, fontWeight: "bold" }}>
                                    Request Sent
                                </ThemedText>
                            </View>
                        );
                    case "received":
                        return (
                            <TouchableOpacity
                                onPress={async () => {
                                    try {
                                        await api.put(`/friends/${userId}/accept`, { userId: userProfile?.id });
                                        setFriendStatus({ status: "accepted" });
                                        Toast.show({
                                            type: "success",
                                            text1: "Friend Request Accepted",
                                            text2: "You are now friends.",
                                            position: "bottom",
                                        });
                                    } catch (error) {
                                        console.error("Error accepting friend request:", error);
                                        Toast.show({
                                            type: "error",
                                            text1: "Error",
                                            text2: "Failed to accept friend request.",
                                            position: "bottom",
                                        });
                                    }
                                }}
                                style={{
                                    backgroundColor: Colors[theme].info,
                                    paddingVertical: 5,
                                    paddingHorizontal: 10,
                                    borderRadius: 5,
                                    marginRight: 12,
                                }}
                            >
                                <ThemedText style={{ color: Colors[theme].background, fontWeight: "bold" }}>
                                    Accept Friend
                                </ThemedText>
                            </TouchableOpacity>
                        );
                    case "accepted":
                        return (
                            <View style={{ flexDirection: "row", alignItems: "center" }}>
                                <View
                                    style={{
                                        paddingVertical: 5,
                                        paddingHorizontal: 10,
                                        borderRadius: 5,
                                        marginRight: 12,
                                    }}
                                >
                                    <ThemedText style={{ color: Colors[theme].text, fontWeight: "bold" }}>
                                        Your Friend 😊
                                    </ThemedText>
                                </View>
                                <TouchableOpacity
                                    onPress={() => setIsDeleteFriendModalVisible(true)}
                                    style={{
                                        backgroundColor: Colors[theme].error,
                                        padding: 5,
                                        borderRadius: 5,
                                        marginRight: 12,
                                    }}
                                >
                                    <Ionicons name="trash" size={20} color={Colors[theme].background} />
                                </TouchableOpacity>
                            </View>
                        );
                    default:
                        return null;
                }
            },
        }),
        [theme, userProfile, userId, friendStatus]
    );

    useEffect(() => {
        navigation.setOptions(headerOptions);
    }, [navigation, headerOptions]);

    useEffect(() => {
        const fetchDecks = async () => {
            try {
                const { data } = await api.get(`/decks/${userId}`);
                console.log("Fetched decks:", data); // Log the fetched decks
                setDecks(data.data);
            } catch (error) {
                console.error("Error fetching user's decks:", error);
            }
        };

        if (userId) {
            fetchDecks();
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
        <>
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
                <View style={styles.dividerContainer}>
                    <View style={[styles.divider, { backgroundColor: Colors[theme].tint }]} />
                    <Ionicons style={styles.dividerIcon} name="albums" size={34} color={Colors[theme].info} />
                    <View style={[styles.divider, { backgroundColor: Colors[theme].tint }]} />
                </View>
                {decks.length > 0 ? (
                    <DeckCarousel
                        decks={decks}
                        onNewDeckPress={() => {}}
                        onDeckPress={(deckId) => router.push({ pathname: `/(tabs)/deck/[deckId]`, params: { deckId } })}
                    />
                ) : (
                    <View style={styles.noDecksContainer}>
                        <Ionicons name="skull" size={50} color={Colors[theme].text} />
                        <ThemedText style={[styles.noDecksText, { color: Colors[theme].text }]}>
                            {t("no_decks")}
                        </ThemedText>
                    </View>
                )}
            </ThemedView>
            <Modal
                visible={isDeleteFriendModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setIsDeleteFriendModalVisible(false)}
            >
                <TouchableOpacity
                    style={styles.modalContainer}
                    activeOpacity={1}
                    onPressOut={() => setIsDeleteFriendModalVisible(false)}
                >
                    <View style={[styles.modalContent, { backgroundColor: Colors[theme].backgroundSoft }]}>
                        <View style={{ alignItems: "center", marginBottom: 20 }}>
                            <ThemedText type="subtitle" style={styles.modalText}>
                                Are you sure you want to remove this friend?
                            </ThemedText>
                            <ThemedText type="subtitle">🙄⚠️</ThemedText>
                        </View>
                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[
                                    styles.modalButton,
                                    { backgroundColor: Colors[theme].backgroundSoft, borderColor: Colors[theme].error },
                                ]}
                                onPress={() => setIsDeleteFriendModalVisible(false)}
                            >
                                <ThemedText style={[styles.modalButtonText, { color: Colors[theme].error }]}>
                                    No
                                </ThemedText>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[
                                    styles.modalButton,
                                    { backgroundColor: Colors[theme].success, borderColor: Colors[theme].success },
                                ]}
                                onPress={handleDeleteFriend}
                            >
                                <ThemedText style={[styles.modalButtonText, { color: Colors[theme].text }]}>
                                    Yes
                                </ThemedText>
                            </TouchableOpacity>
                        </View>
                    </View>
                </TouchableOpacity>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "flex-start",
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
    modalContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
    },
    modalContent: {
        width: 300,
        padding: 20,
        borderRadius: 10,
        alignItems: "center",
    },
    modalText: {
        fontSize: 18,
        textAlign: "center",
        marginBottom: 20,
    },
    modalButtons: {
        flexDirection: "row",
        justifyContent: "space-between",
        width: "100%",
    },
    modalButton: {
        flex: 1,
        paddingVertical: 10,
        marginHorizontal: 5,
        borderRadius: 5,
        borderWidth: 1,
        alignItems: "center",
    },
    modalButtonText: {
        fontSize: 16,
        fontWeight: "bold",
    },
    dividerContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginVertical: 12,
    },
    divider: {
        flex: 1,
        height: 1,
    },
    dividerIcon: {
        marginHorizontal: 20,
    },
    noDecksContainer: {
        alignItems: "center",
    },
    noDecksText: {
        fontSize: 16,
        fontWeight: "bold",
        textAlign: "center",
        marginTop: 10,
    },
});
