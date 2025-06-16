import React from "react";
import { StyleSheet, View, Image, TouchableOpacity, FlatList, useWindowDimensions } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/ThemeContext";
import { Colors } from "@/constants/Colors";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons"; // Import Ionicons
import { useRouter } from "expo-router"; // Import useRouter

interface Friend {
    id: number;
    user: {
        id: string;
        username: string;
        avatar_url: string | null;
    };
}

interface FriendCarouselProps {
    friends: Friend[];
    onFriendPress: (friendId: string) => void;
    isOwnProfile?: boolean;
}

const FriendCarousel: React.FC<FriendCarouselProps> = ({ friends, onFriendPress, isOwnProfile = true }) => {
    const { theme } = useTheme();
    const { width } = useWindowDimensions();
    const { t } = useTranslation();
    const router = useRouter(); // Initialize router

    const renderFriendItem = ({ item }: { item: Friend }) => {
        const itemWidth = 70; // Más pequeño para usuarios
        const itemHeight = 100; // Ajustado para un diseño más compacto

        return (
            <TouchableOpacity onPress={() => onFriendPress(item.user.id)}>
                <View
                    style={[
                        styles.friendItem,
                        { width: itemWidth, height: itemHeight, backgroundColor: Colors[theme].backgroundSoft },
                    ]}
                >
                    {item.user.avatar_url ? (
                        <View
                            style={{
                                width: "80%",
                                height: "70%",
                                overflow: "visible",
                                alignItems: "center",
                                justifyContent: "center",
                                position: "relative",
                            }}
                        >
                            <Image
                                source={{ uri: item.user.avatar_url }}
                                style={[styles.friendAvatar, { borderColor: Colors[theme].tint }]}
                                resizeMode="cover"
                            />
                            <Image
                                source={{ uri: item.user.avatar_url }}
                                style={[styles.friendAvatarBack, { borderColor: Colors[theme].info }]}
                                resizeMode="cover"
                            />
                        </View>
                    ) : (
                        <View
                            style={[
                                styles.placeholderAvatar,
                                { borderColor: Colors[theme].tint, backgroundColor: Colors[theme].backgroundSoft },
                            ]}
                        >
                            <ThemedText style={[styles.placeholderText, { color: Colors[theme].text }]}>
                                {item.user.username.charAt(0).toUpperCase()}
                            </ThemedText>
                        </View>
                    )}
                    <ThemedText style={[styles.friendName, { color: Colors[theme].text }]} numberOfLines={1}>
                        {item.user.username}
                    </ThemedText>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View
            style={[styles.carouselContainer, { backgroundColor: Colors[theme].TabBarBackground, width: width * 0.95 }]}
        >
            {friends.length === 0 ? (
                <View style={styles.noFriendsContainer}>
                    {isOwnProfile ? (
                        <View style={styles.noFriendsRow}>
                            <ThemedText style={[styles.noFriendsText, { color: Colors[theme].text }]}>
                                {t("no_friends_message")}
                            </ThemedText>
                            <TouchableOpacity onPress={() => router.push("/deckSearcher")}>
                                <Ionicons
                                    name="search"
                                    size={20}
                                    color={Colors[theme].tint}
                                    style={styles.searchIcon}
                                />
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={styles.noFriendsRow}>
                            <ThemedText style={[styles.noFriendsText, { color: Colors[theme].text }]}>
                                {t("no_users")}
                            </ThemedText>
                        </View>
                    )}
                </View>
            ) : (
                <FlatList
                    data={friends}
                    renderItem={renderFriendItem}
                    keyExtractor={(item) => item.user.id}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.carousel}
                    ItemSeparatorComponent={() => <View style={{ width: width * 0.04 }} />}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    carouselContainer: {
        paddingVertical: 10, // Más compacto
        borderRadius: 10, // Bordes más redondeados
        alignSelf: "center",
        overflow: "hidden",
    },
    carousel: {
        paddingHorizontal: "3%", // Menor padding horizontal
    },
    friendItem: {
        alignItems: "center",
        justifyContent: "center", // Centrado
        borderRadius: 10, // Bordes más redondeados
        overflow: "hidden",
        padding: 5, // Espaciado interno
    },
    friendAvatarBack: {
        width: "100%", // Más pequeño
        height: "100%", // Proporcional al nuevo tamaño
        filter: "blur(10px)", // Sin desenfoque
        zIndex: 1, // Detrás de la imagen principal
        opacity: 1, // Más opaco
    },
    friendAvatar: {
        position: "absolute",
        width: "100%", // Más pequeño
        height: "100%", // Proporcional al nuevo tamaño
        borderRadius: 50, // Circular
        borderWidth: 2,
        alignSelf: "center",
        zIndex: 2,
    },
    placeholderAvatar: {
        width: "80%",
        height: "70%",
        borderRadius: 50,
        borderWidth: 2,
        alignItems: "center",
        justifyContent: "center",
    },
    placeholderText: {
        fontSize: 20,
        fontWeight: "bold",
    },
    friendName: {
        fontSize: 14, // Más pequeño
        fontWeight: "600", // Menos negrita
        textAlign: "center",
        marginTop: 5,
        color: Colors.light.text, // Color del texto
    },
    noFriendsContainer: {
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 20,
    },
    noFriendsRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
    },
    noFriendsText: {
        fontSize: 16,
        fontWeight: "bold",
        textAlign: "center",
        marginRight: 8, // Space between text and icon
    },
    searchIcon: {
        marginLeft: 4, // Optional spacing for better alignment
    },
});

export default FriendCarousel;
