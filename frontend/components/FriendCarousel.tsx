import React from "react";
import { StyleSheet, View, Image, TouchableOpacity, FlatList, useWindowDimensions } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/ThemeContext";
import { Colors } from "@/constants/Colors";
import { useTranslation } from "react-i18next";

interface Friend {
    id: number;
    user: {
        id: string;
        username: string;
        avatar_url: string | null;
    };
}

interface FriendCarouselProps {
    friends: Friend[]; // Updated to match the new structure
    onFriendPress: (friendId: string) => void;
}

const FriendCarousel: React.FC<FriendCarouselProps> = ({ friends, onFriendPress }) => {
    const { theme } = useTheme();
    const { width } = useWindowDimensions();

    const renderFriendItem = ({ item }: { item: Friend }) => {
        const itemWidth = 90;
        const itemHeight = 125;

        return (
            <TouchableOpacity onPress={() => onFriendPress(item.user.id)}>
                <View style={[styles.friendItem, { width: itemWidth, height: itemHeight }]}>
                    {item.user.avatar_url ? (
                        <Image
                            source={{ uri: item.user.avatar_url }}
                            style={[styles.friendAvatar, { borderColor: Colors[theme].tint }]}
                            resizeMode="cover"
                        />
                    ) : null}
                    <ThemedText style={styles.friendName}>{item.user.username}</ThemedText>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View
            style={[styles.carouselContainer, { backgroundColor: Colors[theme].TabBarBackground, width: width * 0.95 }]}
        >
            <FlatList
                data={friends}
                renderItem={renderFriendItem}
                keyExtractor={(item) => item.user.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.carousel}
                ItemSeparatorComponent={() => <View style={{ width: width * 0.04 }} />}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    carouselContainer: {
        paddingVertical: 15,
        borderRadius: 10,
        alignSelf: "center",
        overflow: "hidden",
    },
    carousel: {
        paddingHorizontal: "5%",
    },
    friendItem: {
        alignItems: "center",
        justifyContent: "flex-start",
        borderRadius: 5,
        overflow: "hidden",
    },
    friendAvatar: {
        width: "100%",
        height: "100%",
        borderRadius: 5,
        borderWidth: 2,
        alignSelf: "center",
    },
    friendName: {
        fontSize: 14,
        fontWeight: "bold",
        textAlign: "center",
        marginTop: 5,
    },
});

export default FriendCarousel;
