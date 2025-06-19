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
import VisibilityBottomSheet from "@/components/VisibilityBottomSheet";
import IconCards from "@/assets/icons/IconCards.svg";
import IconPeople from "@/assets/icons/IconPeople.svg";

interface UserProfile {
    id: string;
    username: string;
    avatar_url: string | null;
    bio: string | null;
    location: string | null;
    region: string | null;
    lang?: string | null;
    decks_visibility?: string | null;
    friends_visibility?: string | null;
    collections_visibility?: string | null;
}

interface FriendStatus {
    status: "pending" | "accepted";
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
    const [friendStatus, setFriendStatus] = useState<FriendStatus | undefined>({ status: "pending" }); // default to pending
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [isDeleteFriendModalVisible, setIsDeleteFriendModalVisible] = useState(false); // State for delete friend modal
    const [decks, setDecks] = useState([]); // State for user's decks
    const [friends, setFriends] = useState([]); // State for user's friends
    const [collections, setCollections] = useState([]); // State for user's collections
    const [isNewDeckModalVisible, setIsNewDeckModalVisible] = useState(false); // State for new deck modal
    const [visibilitySheetType, setVisibilitySheetType] = useState<null | "decks" | "friends" | "collections">(null);
    const [currentVisibility, setCurrentVisibility] = useState({
        decks: userProfile?.decks_visibility || "public",
        friends: userProfile?.friends_visibility || "public",
        collections: userProfile?.collections_visibility || "public",
    }); // State para la visibilidad

    const setOpenChatUser = useStore((state) => state.setOpenChatUser);

    useEffect(() => {
        const fetchUserId = async () => {
            const session = await supabase.auth.getSession();
            setCurrentUserId(session?.data?.session?.user?.id || null);
        };

        fetchUserId();
    }, []);

    // Limpiar perfil y datos relacionados al cambiar userId, pero no poner loading a true si el componente no está montado
    useEffect(() => {
        setUserProfile(null);
        setDecks([]);
        setFriends([]);
        setCollections([]);
        // No tocar loading aquí
    }, [userId]);

    useEffect(() => {
        let isMounted = true;
        // Solo cargar datos si ambos IDs están definidos
        if (!userId || !currentUserId) return;
        const fetchAll = async () => {
            if (!isMounted) return;
            setLoading(true);
            try {
                const [{ data: userData }, { data: decksData }, { data: friendsData }, { data: collectionsData }] =
                    await Promise.all([
                        api.get(`/users/${userId}`),
                        api.get(`/decks/${userId}`),
                        api.get(`/friends/${userId}/accepted`),
                        api.get(`/collections/${userId}`),
                    ]);
                if (!isMounted) return;
                setUserProfile(userData);
                setDecks(decksData?.data || []);
                setFriends(friendsData || []);
                setCollections(Array.isArray(collectionsData) ? collectionsData : collectionsData?.data || []);
            } catch (error) {
                if (isMounted) setUserProfile(null);
            } finally {
                if (isMounted) setLoading(false);
            }
        };
        fetchAll();
        return () => {
            isMounted = false;
        };
    }, [userId, currentUserId]);

    // Sincronizar currentVisibility con userProfile cuando cambie
    useEffect(() => {
        if (userProfile) {
            setCurrentVisibility({
                decks: userProfile.decks_visibility || "public",
                friends: userProfile.friends_visibility || "public",
                collections: userProfile.collections_visibility || "public",
            });
        }
    }, [userProfile]);

    // Determinar estado de amistad real al cargar perfil ajeno
    useEffect(() => {
        if (!userId || !currentUserId || userId === currentUserId) return;
        const fetchFriendStatus = async () => {
            try {
                const { data: friendsList } = await api.get("/friends", { params: { userId: currentUserId } });
                // Buscar si el perfil es amigo (comparar con id del otro usuario)
                const friend = Array.isArray(friendsList) ? friendsList.find((f) => f.id === userId) : null;
                if (friend) {
                    if (friend.status === "pending") {
                        setFriendStatus({ status: "pending" });
                    } else if (friend.status === "accepted") {
                        setFriendStatus({ status: "accepted" });
                    } else {
                        setFriendStatus(undefined);
                    }
                } else {
                    setFriendStatus(undefined); // No es amigo
                }
            } catch (error) {
                setFriendStatus(undefined);
            }
        };
        fetchFriendStatus();
    }, [userId, currentUserId]);

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

            setFriendStatus({ status: "pending" }); // Si se elimina, vuelve a estado pendiente
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

    // Cambiar visibilidad del usuario (decks, friends, collections)
    const updateUserVisibility = async (changes: Partial<typeof currentVisibility>) => {
        if (!currentUserId || !userProfile?.id) {
            Toast.show({
                type: "error",
                text1: t("error"),
                text2: t("user_id_null"),
                position: "bottom",
            });
            return;
        }
        const prevVisibility = { ...currentVisibility };
        const newVisibility = { ...currentVisibility, ...changes };
        setCurrentVisibility(newVisibility); // Optimista
        try {
            await api.put("/users/update-visibility", {
                userId: currentUserId,
                decks_visibility: newVisibility.decks,
                friends_visibility: newVisibility.friends,
                collections_visibility: newVisibility.collections,
            });
            Toast.show({
                type: "success",
                text1: t("success"),
                text2: t("user_details_update_success_message"),
                position: "bottom",
            });
        } catch (error) {
            setCurrentVisibility(prevVisibility); // Revertir si falla
            Toast.show({
                type: "error",
                text1: t("error"),
                text2: t("user_details_update_error_message"),
                position: "bottom",
            });
        }
    };

    const headerOptions = useMemo(
        () => ({
            headerShown: true,
            headerLeft: () => (
                <TouchableOpacity onPress={() => router.back()} style={{ marginHorizontal: 12 }}>
                    <MaterialIcons name="arrow-back" size={24} color={Colors[theme].text} />
                </TouchableOpacity>
            ),
            headerTitle: () =>
                userProfile?.id && currentUserId && userProfile.id === currentUserId ? (
                    <ThemedText style={{ fontWeight: "bold", fontSize: 20 }}>{t("your_profile")}</ThemedText>
                ) : null,
            headerRight: () => {
                if (userProfile?.id && currentUserId && userProfile.id === currentUserId) {
                    return (
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingRight: 10 }}>
                            {/* Botón de visibilidad */}
                            <TouchableOpacity
                                onPress={() => setVisibilitySheetType("decks")}
                                style={{ backgroundColor: Colors[theme].tint, padding: 6, borderRadius: 6 }}
                            >
                                <Ionicons name="eye" size={20} color={Colors[theme].background} />
                            </TouchableOpacity>
                            {/* Botón de settings */}
                            <TouchableOpacity
                                onPress={() =>
                                    router.push({ pathname: "/settings", params: { openAccordion: "true" } })
                                }
                                style={{
                                    backgroundColor: Colors[theme].info,
                                    padding: 6,
                                    borderRadius: 6,
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
                                <IconPeople style={{ color: Colors[theme].background, width: 20, height: 20}} />
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
                                if (!friendStatus) {
                                    // No es amigo
                                    return (
                                        <TouchableOpacity
                                            onPress={async () => {
                                                try {
                                                    await api.post("/friends/request", {
                                                        userId: currentUserId,
                                                        friendId: userProfile?.id,
                                                    });
                                                    setFriendStatus({ status: "pending" });
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
                                                {t("add_friend")}
                                            </ThemedText>
                                        </TouchableOpacity>
                                    );
                                }
                                switch (friendStatus.status) {
                                    case "pending":
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
                                    case "accepted":
                                        return (
                                            <View style={{ flexDirection: "row", alignItems: "center" }}>
                                                <View
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
                                                        {t("your_friend")} 🤍
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

    const themed = Colors[theme];

    // Antes de lanzar la petición, asegurarse de que userId está definido
    useEffect(() => {
        if (!userId) return; // No buscar hasta que userId esté definido
        setLoading(true);
        const fetchUser = async () => {
            try {
                const { data: userData } = await api.get(`/users/${userId}`);
                setUserProfile(userData);
            } catch (error) {
                setUserProfile(null);
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, [userId]);

    if (!userId) {
        return <ThemedView style={{ flex: 1, justifyContent: "center", alignItems: "center" }} />;
    }

    if (loading) {
        return (
            <ThemedView style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                <ActivityIndicator size="large" />
            </ThemedView>
        );
    }

    if (!loading && !userProfile) {
        return (
            <ThemedView style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                <ThemedText>{t("user_not_found")}</ThemedText>
            </ThemedView>
        );
    }

    const isOwnProfile = userProfile?.id === currentUserId; // Verificar si es el propio perfil

    // Permisos de visibilidad
    const canViewDecks =
        userProfile?.decks_visibility === "public" ||
        (userProfile?.decks_visibility === "friends" && friendStatus?.status === "accepted") ||
        userProfile?.id === currentUserId;
    const canViewFriends =
        userProfile?.friends_visibility === "public" ||
        (userProfile?.friends_visibility === "friends" && friendStatus?.status === "accepted") ||
        userProfile?.id === currentUserId;
    const canViewCollections =
        userProfile?.collections_visibility === "public" ||
        (userProfile?.collections_visibility === "friends" && friendStatus?.status === "accepted") ||
        userProfile?.id === currentUserId;

    return (
        <>
            <ThemedView style={{ flex: 1, backgroundColor: themed.background, paddingBottom: 80 }}>
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    <View style={[styles.profileCard, { backgroundColor: themed.backgroundSoft, shadowColor: "#000" }]}>
                        <View style={{ alignItems: "center", flexDirection: "row" }}>
                            <View style={{ position: "relative", justifyContent: "center", alignItems: "center" }}>
                                {userProfile && userProfile.avatar_url ? (
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
                                <View style={{ alignItems: "flex-start", justifyContent: "center", paddingTop: 4 }}>
                                    <ThemedText
                                        style={[
                                            styles.profileName,
                                            { color: themed.tint, lineHeight: 32, marginTop: 2 },
                                        ]}
                                    >
                                        {userProfile?.username}
                                    </ThemedText>
                                    {userProfile && userProfile.location ? (
                                        <ThemedText
                                            style={[
                                                styles.profileLocation,
                                                { color: themed.textSoft, fontWeight: "bold" },
                                            ]}
                                        >
                                            {userProfile.location}
                                        </ThemedText>
                                    ) : null}
                                    {userProfile && userProfile.region ? (
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
                                        <IconCards style={{ color: Colors[theme].tint, width: 18, height: 18 }} />
                                        <ThemedText style={[styles.profileStatText, { color: themed.text }]}>
                                            {decks.length} {t("decks")}
                                        </ThemedText>
                                    </View>
                                    <View style={[styles.profileStatBox, { backgroundColor: themed.background }]}>
                                        <IconPeople style={{ color: Colors[theme].tint, width: 18, height: 18 }} />
                                        <ThemedText style={[styles.profileStatText, { color: themed.text }]}>
                                            {friends.length} {t("friends")}
                                        </ThemedText>
                                    </View>
                                    <View style={[styles.profileStatBox, { backgroundColor: themed.background }]}>
                                        <Ionicons name="albums" size={18} color={themed.tint} />
                                        <ThemedText style={[styles.profileStatText, { color: themed.text }]}>
                                            {collections.length} {t("collections")}
                                        </ThemedText>
                                    </View>
                                </View>
                            </View>
                        </View>
                        {userProfile && userProfile.bio && (
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
                        <IconCards style={{ color: Colors[theme].info, width: 40, height: 40, marginLeft: 20, marginRight:20 }} />
                        <View style={{ flex: 1, height: 1, backgroundColor: Colors[theme].tabIconDefault }} />
                    </View>
                    {!canViewDecks ? (
                        <View
                            style={{
                                alignItems: "center",
                                justifyContent: "center",
                                paddingVertical: 24,
                                paddingHorizontal: 16,
                                marginVertical: 8,
                                backgroundColor: themed.TabBarBackground,
                                borderRadius: 12,
                                borderWidth: 1,
                                borderColor: themed.info,
                                shadowColor: "#000",
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: 0.08,
                                shadowRadius: 8,
                                elevation: 2,
                                marginBottom: 26,
                            }}
                        >
                            <Ionicons name="lock-closed" size={32} color={themed.info} style={{ marginBottom: 8 }} />
                            <ThemedText
                                style={{
                                    textAlign: "center",
                                    marginVertical: 4,
                                    color: themed.info,
                                    fontWeight: "bold",
                                    fontSize: 16,
                                }}
                            >
                                {t("decks_private_message")}
                            </ThemedText>
                        </View>
                    ) : decks.length > 0 ? (
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
                            {(() => {
                                const message = t("no_decks");
                                const dotIndex = message.indexOf(".");
                                let firstPart = message;
                                let secondPart = "";
                                if (dotIndex !== -1) {
                                    firstPart = message.slice(0, dotIndex + 1);
                                    secondPart = message.slice(dotIndex + 1).trim();
                                }
                                return (
                                    <>
                                        <ThemedText style={[styles.noDecksText, { color: themed.info, fontSize: 18 }]}>
                                            {firstPart}
                                        </ThemedText>
                                        {secondPart ? (
                                            <ThemedText
                                                style={{
                                                    color: themed.text,
                                                    fontSize: 14,
                                                    fontWeight: "bold",
                                                    marginTop: 4,
                                                }}
                                            >
                                                {secondPart}
                                            </ThemedText>
                                        ) : null}
                                    </>
                                );
                            })()}
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
                        <IconPeople style={{ color: Colors[theme].info, width: 34, height: 34, marginLeft: 20, marginRight: 20 }} />
                        <View style={{ flex: 1, height: 1, backgroundColor: Colors[theme].tabIconDefault }} />
                    </View>
                    {!canViewFriends ? (
                        <View
                            style={{
                                alignItems: "center",
                                justifyContent: "center",
                                paddingVertical: 24,
                                paddingHorizontal: 16,
                                marginVertical: 8,
                                backgroundColor: themed.TabBarBackground,
                                borderRadius: 12,
                                borderWidth: 1,
                                borderColor: themed.info,
                                shadowColor: "#000",
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: 0.08,
                                shadowRadius: 8,
                                elevation: 2,
                                marginBottom: 26,
                            }}
                        >
                            <Ionicons name="lock-closed" size={32} color={themed.info} style={{ marginBottom: 8 }} />
                            <ThemedText
                                style={{
                                    textAlign: "center",
                                    marginVertical: 4,
                                    color: themed.info,
                                    fontWeight: "bold",
                                    fontSize: 16,
                                }}
                            >
                                {t("friends_private_message")}
                            </ThemedText>
                        </View>
                    ) : (
                        <FriendCarousel
                            friends={friends}
                            onFriendPress={(userId) =>
                                router.push({ pathname: `/(tabs)/user/[userId]`, params: { userId } })
                            }
                            isOwnProfile={userProfile?.id === currentUserId}
                        />
                    )}
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
                        <Ionicons style={styles.dividerIcon} name="albums" size={34} color={themed.info} />
                        <View style={{ flex: 1, height: 1, backgroundColor: Colors[theme].tabIconDefault }} />
                    </View>
                    {!canViewCollections && (
                        <View
                            style={{
                                alignItems: "center",
                                justifyContent: "center",
                                paddingVertical: 24,
                                paddingHorizontal: 16,
                                marginVertical: 8,
                                backgroundColor: themed.TabBarBackground,
                                borderRadius: 12,
                                borderWidth: 1,
                                borderColor: themed.info,
                                shadowColor: "#000",
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: 0.08,
                                shadowRadius: 8,
                                elevation: 2,
                                marginBottom: 26,
                            }}
                        >
                            <Ionicons name="lock-closed" size={32} color={themed.info} style={{ marginBottom: 8 }} />
                            <ThemedText
                                style={{
                                    textAlign: "center",
                                    marginVertical: 4,
                                    color: themed.info,
                                    fontWeight: "bold",
                                    fontSize: 16,
                                }}
                            >
                                {t("collections_private_message")}
                            </ThemedText>
                        </View>
                    )}
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
            {/* BottomSheet de visibilidad */}
            {visibilitySheetType && (
                <VisibilityBottomSheet
                    visible={!!visibilitySheetType}
                    currentVisibility={currentVisibility}
                    onClose={() => setVisibilitySheetType(null)}
                    onChange={updateUserVisibility}
                />
            )}
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
