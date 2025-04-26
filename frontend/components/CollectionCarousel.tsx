import React, { useState } from "react";
import { StyleSheet, View, Text, FlatList, TouchableOpacity, Dimensions, useWindowDimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/ThemeContext";
import { Colors } from "@/constants/Colors";
import { useTranslation } from "react-i18next";
import { useNavigation } from "@react-navigation/native";

interface Collection {
    id: string;
    name: string;
    description: string;
    type: string;
    is_public: boolean; // Added is_public property
    collection_cards?: { card_id: string }[]; // Added optional collection_cards property
}

interface CollectionCarouselProps {
    collections: Collection[];
    onCollectionPress: (collectionId: string) => void; // Added onCollectionPress prop
}

const screenWidth = Dimensions.get("window").width; // Get the screen width

const CollectionCarousel: React.FC<CollectionCarouselProps> = ({ collections, onCollectionPress }) => {
    const { theme } = useTheme();
    const [selectedTab, setSelectedTab] = useState<"collection" | "wishlist">("collection");
    const { t } = useTranslation();
    const { width } = useWindowDimensions();
    const navigation = useNavigation();

    const filteredCollections = collections.filter((collection) => collection.type === selectedTab);

    const renderCollectionItem = ({ item }: { item: Collection }) => (
        <TouchableOpacity
            style={[styles.collectionItem, { backgroundColor: Colors[theme].backgroundSoft }]}
            onPress={() => onCollectionPress(item.id)} // Use the onCollectionPress prop to navigate to the collection details
        >
            <Text
                style={[
                    styles.collectionName,
                    item.type === "collection" ? { color: Colors[theme].info } : { color: Colors[theme].success },
                ]}
            >
                {item.name.length > 20 ? `${item.name.slice(0, 20)}...` : item.name}
            </Text>
            <Text style={[styles.collectionDescription, { color: Colors[theme].textSoft }]}>
                {item.description.length > 30 ? `${item.description.slice(0, 30)}...` : item.description}
            </Text>
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, { backgroundColor: Colors[theme].TabBarBackground, width: width * 0.95  }]}>
            <View style={[styles.tabContainer, { backgroundColor: Colors[theme].background }]}>
                <TouchableOpacity
                    style={[
                        styles.tabButton,
                        selectedTab === "collection" && { backgroundColor: Colors[theme].TabBarBackground, opacity: 1 },
                        { borderBottomRightRadius: 0, borderBottomLeftRadius: 0 }, // Remove bottom-right radius for "Collection"
                    ]}
                    onPress={() => setSelectedTab("collection")}
                >
                    <Text style={[styles.tabText, { color: Colors[theme].text }]}>{t("collections")}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[
                        styles.tabButton,
                        selectedTab === "wishlist" && { backgroundColor: Colors[theme].TabBarBackground, opacity: 1 },
                        { borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }, // Remove bottom-left radius for "Wishlist"
                    ]}
                    onPress={() => setSelectedTab("wishlist")}
                >
                    <Text style={[styles.tabText, { color: Colors[theme].text }]}>{t("wishlists")}</Text>
                </TouchableOpacity>
            </View>
            <View style={styles.contentWrapper}>
                {filteredCollections.length > 0 ? (
                    <FlatList
                        data={filteredCollections}
                        renderItem={renderCollectionItem}
                        keyExtractor={(item) => item.id}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.carousel}
                    />
                ) : (
                    <View style={styles.emptyState}>
                        <Text style={[styles.placeholder, { color: Colors[theme].text }]}>{t("no_collections")}</Text>
                    </View>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: screenWidth * 1, // Set the container width to 90% of the screen width
        paddingVertical: 15,
        borderRadius: 10,
        alignItems: "center",
        marginVertical: 12,
        marginTop: 20, // Add margin to the top for spacing
    },
    contentWrapper: {
        width: "100%", // Ensures consistent width
        justifyContent: "center",
        alignItems: "center",
    },
    emptyState: {
        width: "100%", // Ensures the empty state spans the full width
        // minHeight: 150, // Matches the minimum height of the contentWrapper
        justifyContent: "center", // Centers the text vertically
        alignItems: "center", // Centers the text horizontally
    },
    tabContainer: {
        flexDirection: "row",
        position: "absolute",
        top: -20, // Make the tabs protrude above the FlatList
        zIndex: 1, // Ensure tabs are above the FlatList
        width: "100%", // Ensure the container spans the full width
    },
    tabButton: {
        flex: 1, // Ensure each tab occupies equal space
        paddingVertical: 10,
        paddingHorizontal: 15,
        alignItems: "center",
        borderRadius: 10,
        opacity: 0.5,
    },
    tabText: {
        fontSize: 17,
        fontWeight: "bold",
        letterSpacing: 0.7,
    },
    carousel: {
        paddingHorizontal: 10,
        marginTop: 20, // Add margin to account for the protruding tabs
        width: "100%", // Ensures the FlatList spans the full width
    },
    collectionItem: {
        paddingHorizontal: 20,
        paddingVertical: 15, // Increased padding for better spacing
        borderRadius: 10, // Slightly more rounded corners
        marginHorizontal: 8, // Increased margin for better spacing between items
        alignItems: "flex-start",
        justifyContent: "center",
        gap: 8, // Increased gap between name and description
        shadowColor: "#000", // Add shadow for depth
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3, // Shadow for Android
    },
    collectionName: {
        fontSize: 16, // Slightly larger font size
        fontWeight: "bold",
    },
    collectionDescription: {
        fontSize: 13, // Slightly larger font size
        textAlign: "left", // Align text to the left for better readability
    },
    placeholder: {
        fontSize: 16,
        fontWeight: "bold",
        textAlign: "center",
        marginTop: 20,
        paddingVertical: 25,
    },
});

export default CollectionCarousel;
