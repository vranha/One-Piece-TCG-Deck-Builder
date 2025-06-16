import React, { useState } from "react";
import {
    StyleSheet,
    View,
    Text,
    FlatList,
    TouchableOpacity,
    Dimensions,
    useWindowDimensions,
    ScrollView,
    Modal, // Import Modal
    TextInput, // Import TextInput
    Button, // Import Button
} from "react-native";
import Toast from "react-native-toast-message"; // Import Toast
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/ThemeContext";
import { Colors } from "@/constants/Colors";
import { useTranslation } from "react-i18next";
import { useNavigation } from "@react-navigation/native";
import useApi from "@/hooks/useApi"; // Import useApi

interface Collection {
    id: string;
    name: string;
    description: string;
    type: string;
    is_public: boolean; // Added is_public property
    // collection_cards?: { card_id: string }[]; // Added optional collection_cards property
}

interface CollectionCarouselProps {
    collections: Collection[];
    userId: string | null; // Add userId as a prop
    onCollectionPress: (collectionId: string) => void;
    isOwnProfile?: boolean; // Add isOwnProfile prop
}

const screenWidth = Dimensions.get("window").width; // Get the screen width

const CollectionCarousel: React.FC<CollectionCarouselProps> = ({
    collections,
    userId,
    onCollectionPress,
    isOwnProfile = true,
}) => {
    const { theme } = useTheme();
    const api = useApi(); // Initialize useApi hook
    const [selectedTab, setSelectedTab] = useState<"collection" | "wishlist">("collection");
    const [isModalVisible, setIsModalVisible] = useState(false); // State for modal visibility
    const [newCollectionName, setNewCollectionName] = useState(""); // State for collection name
    const [newCollectionDescription, setNewCollectionDescription] = useState(""); // State for collection description
    const { t } = useTranslation();
    const { width } = useWindowDimensions();
    const navigation = useNavigation();

    const filteredCollections = collections.filter((collection) => collection.type === selectedTab);

    const handleCreateCollection = async () => {
        const newCollection = {
            name: newCollectionName,
            description: newCollectionDescription,
            type: selectedTab, // Set type based on the selected tab
        };

        try {
            await api.post(`/collections/${userId}`, newCollection); // Use userId in the route
            Toast.show({
                type: "success",
                text1: t("collection_created_successfully"),
            }); // Success toast
            setIsModalVisible(false); // Close the modal
            setNewCollectionName(""); // Reset the name field
            setNewCollectionDescription(""); // Reset the description field
            onCollectionPress(""); // Trigger a refresh of the carousel
        } catch (error) {
            console.error("Error creating collection:", error);
            Toast.show({
                type: "error",
                text1: t("error_creating_collection"),
            }); // Error toast
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: Colors[theme].TabBarBackground, width: width * 0.95 }]}>
            <View style={[styles.tabContainer, { backgroundColor: Colors[theme].background }]}>
                <TouchableOpacity
                    style={[
                        styles.tabButton,
                        selectedTab === "collection" && { backgroundColor: Colors[theme].TabBarBackground, opacity: 1 },
                        { borderBottomRightRadius: 0, borderBottomLeftRadius: 0 }, // Remove bottom-right radius for "Collection"
                    ]}
                    onPress={() => setSelectedTab("collection")}
                >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                        <Ionicons
                            name="bookmark"
                            size={24}
                            color={selectedTab === "collection" ? Colors[theme].info : Colors[theme].tabIconDefault}
                        />
                        <Text style={[styles.tabText, { color: Colors[theme].text }]}>{t("collections")}</Text>
                    </View>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[
                        styles.tabButton,
                        selectedTab === "wishlist" && { backgroundColor: Colors[theme].TabBarBackground, opacity: 1 },
                        { borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }, // Remove bottom-left radius for "Wishlist"
                    ]}
                    onPress={() => setSelectedTab("wishlist")}
                >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                        <Ionicons
                            name="heart"
                            size={24}
                            color={selectedTab === "wishlist" ? Colors[theme].success : Colors[theme].tabIconDefault}
                        />
                        <Text style={[styles.tabText, { color: Colors[theme].text }]}>{t("wishlists")}</Text>
                    </View>
                </TouchableOpacity>
            </View>
            <View style={styles.contentWrapper}>
                {filteredCollections.length > 0 ? (
                    <ScrollView
                        horizontal // Enable horizontal scrolling
                        showsHorizontalScrollIndicator={false} // Show horizontal scroll indicator
                        contentContainerStyle={[styles.carousel, { paddingVertical: 10 }]} // Add vertical padding to prevent cutting
                    >
                        {filteredCollections.map((collection) => (
                            <TouchableOpacity
                                key={collection.id}
                                style={[styles.collectionItem, { backgroundColor: Colors[theme].backgroundSoft }]}
                                onPress={() => onCollectionPress(collection.id)} // Pass collection.id correctly
                            >
                                <Text
                                    style={[
                                        styles.collectionName,
                                        collection.type === "collection"
                                            ? { color: Colors[theme].info }
                                            : { color: Colors[theme].success },
                                    ]}
                                >
                                    {collection.name.length > 20
                                        ? `${collection.name.slice(0, 20)}...`
                                        : collection.name}
                                </Text>
                                <Text style={[styles.collectionDescription, { color: Colors[theme].textSoft }]}>
                                    {collection.description.length > 30
                                        ? `${collection.description.slice(0, 30)}...`
                                        : collection.description}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                ) : isOwnProfile ? (
                    <View style={styles.emptyState}>
                        <View style={styles.emptyStateContent}>
                            <Text style={[styles.placeholder, { color: Colors[theme].text }]}>
                                {selectedTab === "collection"
                                    ? t("create_your_first_collection")
                                    : t("create_your_first_wishlist")}
                            </Text>
                            <TouchableOpacity onPress={() => setIsModalVisible(true)}>
                                <Ionicons
                                    name="add-circle"
                                    size={30}
                                    color={selectedTab === "collection" ? Colors[theme].info : Colors[theme].success}
                                />
                            </TouchableOpacity>
                        </View>
                    </View>
                ) : (
                    <View style={styles.emptyState}>
                        <View style={styles.emptyStateContent}>
                            <Text style={[styles.placeholder, { color: Colors[theme].text }]}>
                                {selectedTab === "collection" ? t("no_collections_other") : t("no_wishlists_other")}
                            </Text>
                        </View>
                    </View>
                )}
            </View>

            {/* Modal for creating a new collection */}
            <Modal visible={isModalVisible} transparent animationType="fade">
                <TouchableOpacity
                    style={styles.modalContainer}
                    activeOpacity={1}
                    onPressOut={() => setIsModalVisible(false)} // Close modal when clicking outside
                >
                    <View style={[styles.modalContent, { backgroundColor: Colors[theme].background }]}>
                        <Text style={[styles.modalTitle, { color: Colors[theme].text }]}>
                            {selectedTab === "collection" ? t("new_collection") : t("new_wishlist")}
                        </Text>
                        <TextInput
                            style={[
                                styles.input,
                                {
                                    borderColor: Colors[theme].background,
                                    color: Colors[theme].text,
                                    backgroundColor: Colors[theme].backgroundSoft,
                                },
                            ]}
                            placeholder={t("name")}
                            placeholderTextColor={Colors[theme].tabIconDefault}
                            value={newCollectionName}
                            onChangeText={setNewCollectionName}
                        />
                        <TextInput
                            style={[
                                styles.input,
                                {
                                    borderColor: Colors[theme].background,
                                    color: Colors[theme].text,
                                    backgroundColor: Colors[theme].backgroundSoft,
                                },
                            ]}
                            placeholder={t("description")}
                            placeholderTextColor={Colors[theme].tabIconDefault}
                            value={newCollectionDescription}
                            onChangeText={setNewCollectionDescription}
                            multiline
                        />
                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButton, { backgroundColor: Colors[theme].error }]}
                                onPress={() => setIsModalVisible(false)}
                            >
                                <Text style={[styles.modalButtonText, { color: Colors[theme].background }]}>
                                    {t("cancel")}
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, { backgroundColor: Colors[theme].success }]}
                                onPress={handleCreateCollection}
                            >
                                <Text style={[styles.modalButtonText, { color: Colors[theme].background }]}>
                                    {t("create")}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </TouchableOpacity>
            </Modal>
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
        paddingVertical: 20, // Add padding to the empty state
    },
    emptyStateContent: {
        flexDirection: "row",
        alignItems: "center", // Center icon vertically with text
        justifyContent: "center",
        gap: 10, // Add spacing between text and icon
        marginTop: 20, // Add margin to the top for spacing
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
        paddingVertical: 10, // Add vertical padding to prevent cutting
    },
    collectionItem: {
        paddingHorizontal: 20,
        paddingVertical: 20, // Adjust padding for better spacing
        borderRadius: 10, // Slightly more rounded corners
        marginHorizontal: 8, // Increased margin for better spacing between items
        alignItems: "flex-start",
        justifyContent: "center",
        gap: 8, // Increased gap between name and description
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
        paddingVertical: 25,
    },
    modalContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0, 0, 0, 0.5)", // Semi-transparent background
    },
    modalContent: {
        width: "85%",
        padding: 20,
        borderRadius: 15,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5, // Add shadow for Android
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: "bold",
        marginBottom: 15,
        textAlign: "center",
    },
    input: {
        width: "100%",
        borderWidth: 1,
        borderRadius: 10,
        padding: 12,
        marginBottom: 15,
        fontSize: 16,
    },
    modalButtons: {
        flexDirection: "row",
        justifyContent: "space-between",
        width: "100%",
        marginTop: 10,
    },
    modalButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: "center",
        marginHorizontal: 5,
    },
    modalButtonText: {
        fontSize: 16,
        fontWeight: "bold",
    },
});

export default CollectionCarousel;
