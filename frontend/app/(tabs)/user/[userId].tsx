import React, { useEffect, useState, useMemo } from "react";
import { StyleSheet, View, Image, ActivityIndicator, TouchableOpacity, Modal, ScrollView, Share } from "react-native";
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
import FriendCarousel from "@/components/FriendCarousel"; // Import FriendCarousel
import CollectionCarousel from "@/components/CollectionCarousel"; // Import CollectionCarousel
import { useTranslation } from "react-i18next";
import ChatModal from "@/components/ChatModal";
import useStore from "@/store/useStore";
import NewDeckModal from "@/components/NewDeckModal"; // Import NewDeckModal
import es from "@/i18n/locales/es.json";
import en from "@/i18n/locales/en.json";

interface UserProfile {
    id: string;
    username: string;
    avatar_url: string | null;
    bio: string | null;
    location: string | null;
    region: string | null;
    lang?: string | null;
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
    const [friends, setFriends] = useState([]); // State for user's friends
    const [collections, setCollections] = useState([]); // State for user's collections
    const [isNewDeckModalVisible, setIsNewDeckModalVisible] = useState(false); // State for new deck modal

    const setOpenChatUser = useStore((state) => state.setOpenChatUser);

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

    const handleShareProfile = async () => {
        if (!currentUserId) return;
        let message = "";
        if (userProfile?.lang === "en") {
            // Si el usuario tiene inglés, mensaje en español con emoji
            message = `🏴‍☠️ ¡Echa un vistazo a mi perfil de OPLab! https://oplab.app/user/${currentUserId}`;
        } else {
            // Cualquier otro idioma, mensaje en inglés con emoji
            message = `🏴‍☠️ Check out my OPLab profile! https://oplab.app/user/${currentUserId}`;
        }
        try {
            await Share.share({ message });
        } catch (error) {
            Toast.show({
                type: "error",
                text1: userProfile?.lang === "en" ? es["error"] : en["error"],
                text2: userProfile?.lang === "en" ? es["feedback_error_message"] : en["feedback_error_message"],
            });
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
                if (userProfile?.id && currentUserId && userProfile.id === currentUserId) {
                    // Header para el propio perfil: 3 botones
                    return (
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingRight: 10 }}>
                            {/* Botón de settings */}
                            <TouchableOpacity
                                onPress={() =>
                                    router.push({ pathname: "/settings", params: { openAccordion: "true" } })
                                }
                                style={{
                                    backgroundColor: Colors[theme].info,
                                    padding: 6,
                                    borderRadius: 6,
                                    marginRight: 2,
                                }}
                            >
                                <Ionicons name="pencil" size={20} color={Colors[theme].background} />
                            </TouchableOpacity>
                            {/* Botón de compartir perfil */}
                            <TouchableOpacity
                                onPress={handleShareProfile}
                                style={{
                                    backgroundColor: Colors[theme].highlight,
                                    padding: 6,
                                    borderRadius: 6,
                                    marginRight: 2,
                                }}
                            >
                                <Ionicons name="share-social" size={20} color={Colors[theme].background} />
                            </TouchableOpacity>
                            {/* Botón de buscar amigos */}
                            <TouchableOpacity
                                onPress={() =>
                                    router.push({ pathname: "/deckSearcher", params: { showUsers: "true" } })
                                }
                                style={{ backgroundColor: Colors[theme].success, padding: 6, borderRadius: 6 }}
                            >
                                <Ionicons name="people" size={20} color={Colors[theme].background} />
                            </TouchableOpacity>
                        </View>
                    );
                }
                if (userProfile?.id && currentUserId && userProfile.id !== currentUserId) {
                    return (
                        <View style={{ flexDirection: "row", alignItems: "center" }}>
                            <TouchableOpacity
                                onPress={() => {
                                    setOpenChatUser({
                                        id: userProfile.id,
                                        username: userProfile.username,
                                        avatar_url: userProfile.avatar_url || undefined,
                                    });
                                }}
                                style={{
                                    backgroundColor: Colors[theme].info,
                                    padding: 5,
                                    borderRadius: 5,
                                    marginRight: 8,
                                }}
                            >
                                <Ionicons name="chatbubble-ellipses" size={20} color={Colors[theme].background} />
                            </TouchableOpacity>
                            {/* Botón de amistad como estaba */}
                            {(() => {
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
                                                <ThemedText
                                                    style={{ color: Colors[theme].background, fontWeight: "bold" }}
                                                >
                                                    {t("add_friend")}
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
                                                <ThemedText
                                                    style={{ color: Colors[theme].background, fontWeight: "bold" }}
                                                >
                                                    {t("request_sent")}
                                                </ThemedText>
                                            </View>
                                        );
                                    case "received":
                                        return (
                                            <TouchableOpacity
                                                onPress={async () => {
                                                    try {
                                                        await api.put(`/friends/${userId}/accept`, {
                                                            userId: userProfile?.id,
                                                        });
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
                                                <ThemedText
                                                    style={{ color: Colors[theme].background, fontWeight: "bold" }}
                                                >
                                                    {t("accept_friend")}
                                                </ThemedText>
                                            </TouchableOpacity>
                                        );
                                    case "accepted":
                                        return (
                                            <View style={{ flexDirection: "row", alignItems: "center" }}>
                                                <View
                                                    style={{
                                                        backgroundColor: Colors[theme].backgroundSoft,
                                                        paddingVertical: 5,
                                                        paddingHorizontal: 10,
                                                        borderRadius: 5,
                                                        marginRight: 12,
                                                    }}
                                                >
                                                    <ThemedText
                                                        style={{ color: Colors[theme].text, fontWeight: "bold" }}
                                                    >
                                                        {t("your_friend")}
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
                            })()}
                        </View>
                    );
                }
                // ...si es el propio usuario, dejar como estaba o personalizar...
                return null;
            },
        }),
        [theme, userProfile, userId, friendStatus]
    );

    useEffect(() => {
        navigation.setOptions(headerOptions);
    }, [navigation, headerOptions]);

    useEffect(() => {
        let isMounted = true;
        const fetchDecks = async () => {
            try {
                const { data } = await api.get(`/decks/${userId}`);
                if (isMounted) setDecks(data.data);
            } catch (error) {
                console.error("Error fetching user's decks:", error);
            }
        };
        const fetchFriends = async () => {
            try {
                const { data } = await api.get(`/friends/${userId}/accepted`);
                if (isMounted) setFriends(data);
            } catch (error) {
                console.error("Error fetching user's friends:", error);
            }
        };
        const fetchCollections = async () => {
            try {
                const { data } = await api.get(`/collections/${userId}`);
                if (isMounted) setCollections(Array.isArray(data) ? data : data?.data || []);
            } catch (error) {
                console.error("Error fetching user's collections:", error);
                if (isMounted) setCollections([]);
            }
        };
        if (userId) {
            fetchDecks();
            fetchFriends();
            fetchCollections();
        }
        return () => {
            isMounted = false;
        };
    }, [userId, api]);

    const themed = Colors[theme];

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
            <ThemedView style={{ flex: 1, backgroundColor: themed.background, paddingBottom: 80 }}>
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    <View style={[styles.profileCard, { backgroundColor: themed.backgroundSoft, shadowColor: "#000" }]}>
                        <View style={{ alignItems: "center", flexDirection: "row" }}>
                            <View style={{ position: "relative", justifyContent: "center", alignItems: "center" }}>
                                {userProfile.avatar_url ? (
                                    <Image
                                        source={{ uri: userProfile.avatar_url }}
                                        style={[
                                            styles.avatarBig,
                                            { borderColor: themed.tint, backgroundColor: themed.background },
                                        ]}
                                    />
                                ) : (
                                    <Ionicons name="person-circle" size={90} color={themed.tabIconDefault} />
                                )}
                                <Ionicons
                                    name="skull"
                                    size={25}
                                    color={themed.background}
                                    style={{
                                        position: "absolute",
                                        top: 4,
                                        left: 15,
                                        transform: [{ translateX: -25 }, { translateY: -25 }],
                                        zIndex: 2,
                                    }}
                                />
                            </View>
                            <View
                                style={{
                                    marginLeft: 10,
                                    flex: 1,
                                    flexDirection: "row",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    gap: 20,
                                }}
                            >
                                <View style={{ alignItems: "flex-start", justifyContent: "center" }}>
                                    <ThemedText style={[styles.profileName, { color: themed.tint }]}>
                                        {userProfile.username}
                                    </ThemedText>
                                    {userProfile.location ? (
                                        <ThemedText
                                            style={[
                                                styles.profileLocation,
                                                { color: themed.textSoft, fontWeight: "bold" },
                                            ]}
                                        >
                                            {userProfile.location}
                                        </ThemedText>
                                    ) : null}
                                    {userProfile.region ? (
                                        <View
                                            style={{
                                                flexDirection: "row",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                paddingHorizontal: 15,
                                                paddingVertical: 3,
                                                borderRadius: 5,
                                                marginTop: 15,
                                                backgroundColor:
                                                    userProfile.region === "west" ? themed.info : themed.highlight,
                                            }}
                                        >
                                            <ThemedText
                                                style={[
                                                    styles.profileLocation,
                                                    { color: themed.background, fontWeight: "bold" },
                                                ]}
                                            >
                                                {t(userProfile.region)}
                                            </ThemedText>
                                        </View>
                                    ) : null}
                                </View>
                                <View style={styles.profileStatsRow}>
                                    <View style={[styles.profileStatBox, { backgroundColor: themed.background }]}>
                                        <Ionicons name="albums" size={18} color={themed.tint} />
                                        <ThemedText style={[styles.profileStatText, { color: themed.text }]}>
                                            {decks.length} {t("decks")}
                                        </ThemedText>
                                    </View>
                                    <View style={[styles.profileStatBox, { backgroundColor: themed.background }]}>
                                        <Ionicons name="people" size={18} color={themed.tint} />
                                        <ThemedText style={[styles.profileStatText, { color: themed.text }]}>
                                            {friends.length} {t("friends")}
                                        </ThemedText>
                                    </View>
                                    <View style={[styles.profileStatBox, { backgroundColor: themed.background }]}>
                                        <Ionicons name="folder" size={18} color={themed.tint} />
                                        <ThemedText style={[styles.profileStatText, { color: themed.text }]}>
                                            {collections.length} {t("collections")}
                                        </ThemedText>
                                    </View>
                                </View>
                            </View>
                        </View>
                        {userProfile.bio && (
                            <ThemedText
                                style={{
                                    fontWeight: "bold",
                                    marginTop: 10,
                                    color: themed.success,
                                    fontStyle: "italic",
                                }}
                            >
                                "{userProfile.bio}"{" "}
                            </ThemedText>
                        )}
                    </View>
                    <View
                        style={{
                            flexDirection: "row",
                            alignItems: "center",
                            marginVertical: 12,
                            marginHorizontal: 20,
                        }}
                    >
                        <View style={{ flex: 1, height: 1, backgroundColor: Colors[theme].tabIconDefault }} />
                        <Ionicons style={styles.dividerIcon} name="albums" size={34} color={themed.info} />
                        <View style={{ flex: 1, height: 1, backgroundColor: Colors[theme].tabIconDefault }} />
                    </View>
                    {decks.length > 0 ? (
                        <DeckCarousel
                            decks={decks}
                            onNewDeckPress={() => setIsNewDeckModalVisible(true)}
                            onDeckPress={(deckId) =>
                                router.push({ pathname: `/(tabs)/deck/[deckId]`, params: { deckId } })
                            }
                        />
                    ) : userProfile?.id === currentUserId ? (
                        <View style={[styles.noDecksContainer, { backgroundColor: themed.TabBarBackground }]}>
                            <ThemedText style={[styles.noDecksText, { color: themed.text, marginBottom: 4 }]}>
                                {t("no_decks_own")}
                            </ThemedText>
                            <TouchableOpacity
                                style={{
                                    flexDirection: "row",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: 10,
                                }}
                                onPress={() => setIsNewDeckModalVisible(true)}
                            >
                                <ThemedText style={{ color: themed.info, fontWeight: "bold", fontSize: 16 }}>
                                    {t("create_first_deck")}
                                </ThemedText>
                                <Ionicons name="add-circle" size={25} color={themed.info} />
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={[styles.noDecksContainer, { backgroundColor: themed.TabBarBackground }]}>
                            <ThemedText style={[styles.noDecksText, { color: themed.text }]}>
                                {t("no_decks")}
                            </ThemedText>
                        </View>
                    )}
                    {/* FriendCarousel debajo del DeckCarousel */}
                    <View
                        style={{
                            flexDirection: "row",
                            alignItems: "center",
                            marginVertical: 12,
                            marginHorizontal: 20,
                        }}
                    >
                        <View style={{ flex: 1, height: 1, backgroundColor: Colors[theme].tabIconDefault }} />
                        <Ionicons style={styles.dividerIcon} name="people" size={34} color={themed.info} />
                        <View style={{ flex: 1, height: 1, backgroundColor: Colors[theme].tabIconDefault }} />
                    </View>
                    <FriendCarousel
                        friends={friends}
                        onFriendPress={(userId) =>
                            router.push({ pathname: `/(tabs)/user/[userId]`, params: { userId } })
                        }
                        isOwnProfile={userProfile?.id === currentUserId}
                    />
                    {/* CollectionCarousel debajo del FriendCarousel */}
                    <View
                        style={{
                            flexDirection: "row",
                            alignItems: "center",
                            marginVertical: 12,
                            marginHorizontal: 20,
                        }}
                    >
                        <View style={{ flex: 1, height: 1, backgroundColor: Colors[theme].tabIconDefault }} />
                        <Ionicons style={styles.dividerIcon} name="folder" size={34} color={themed.info} />
                        <View style={{ flex: 1, height: 1, backgroundColor: Colors[theme].tabIconDefault }} />
                    </View>

                    <CollectionCarousel
                        collections={collections}
                        userId={typeof userId === "string" ? userId : Array.isArray(userId) ? userId[0] : null}
                        onCollectionPress={(collectionId) =>
                            router.push({ pathname: `/(tabs)/collection/[collectionId]`, params: { collectionId } })
                        }
                        isOwnProfile={userProfile?.id === currentUserId}
                    />
                </ScrollView>
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
                                    {t("no")}
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
                                    {t("yes")}
                                </ThemedText>
                            </TouchableOpacity>
                        </View>
                    </View>
                </TouchableOpacity>
            </Modal>
            <NewDeckModal
                visible={isNewDeckModalVisible}
                onClose={() => setIsNewDeckModalVisible(false)}
                onCreate={() => setIsNewDeckModalVisible(false)}
            />
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
    profileCard: {
        width: "100%",
        borderRadius: 18,
        padding: 18,
        marginVertical: 24,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 2,
        alignSelf: "center",
    },
    avatarBig: {
        width: 90,
        height: 90,
        borderRadius: 45,
        borderWidth: 3,
    },
    profileName: {
        fontSize: 26,
        fontWeight: "bold",
        marginBottom: 2,
    },
    profileBio: {
        fontSize: 15,
        marginBottom: 2,
    },
    profileLocation: {
        fontSize: 14,
    },
    profileStatsRow: {
        flexDirection: "column",
        gap: 5,
        marginTop: 6,
    },
    profileStatBox: {
        flexDirection: "row",
        alignItems: "center",
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 4,
        marginRight: 8,
    },
    profileStatText: {
        fontSize: 13,
        marginLeft: 6,
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
        paddingVertical: 20,
        paddingHorizontal: 16,
        borderRadius: 10,
    },
    noDecksText: {
        fontSize: 16,
        fontWeight: "bold",
        textAlign: "center",
        marginTop: 10,
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
    scrollContent: {
        paddingBottom: 32,
        paddingHorizontal: 16,
        alignItems: "center",
    },
});
