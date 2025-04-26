import React, { useEffect, useState, useRef } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput } from "react-native";
import { useRoute, RouteProp } from "@react-navigation/native";
import useApi from "@/hooks/useApi"; // Import the useApi hook
import { supabase } from "@/supabaseClient";
import { Modalize } from "react-native-modalize"; // Import Modalize
import { MaterialIcons } from "@expo/vector-icons"; // Import MaterialIcons
import { useNavigation } from "expo-router"; // Import useNavigation
import { Colors } from "@/constants/Colors"; // Import Colors
import Toast from "react-native-toast-message"; // Import Toast
import { useRouter } from "expo-router"; // Import useRouter
import { useTheme } from "@/hooks/ThemeContext";
import { useTranslation } from "react-i18next";
import { Image as ExpoImage } from "expo-image";

const CollectionDetails = () => {
    const route = useRoute<RouteProp<{ params: { collectionId: string } }, "params">>();
    const { collectionId } = route.params;
    const api = useApi(); // Initialize the API instance
    const navigation = useNavigation();
    const router = useRouter();
    const modalizeRef = useRef<Modalize>(null); // Ref for Modalize
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false); // State for edit mode
    const [editedName, setEditedName] = useState(""); // State for edited name
    const [editedDescription, setEditedDescription] = useState(""); // State for edited description
    const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false); // State for delete modal visibility
    const { theme } = useTheme() as { theme: keyof typeof Colors };
    const { t } = useTranslation();

    interface Collection {
        name: string;
        description: string;
        collection_cards: { card_id: string }[];
        cards: { id: string; code: string; name: string; color: string[]; rarity: string }[];
    }

    const [collection, setCollection] = useState<Collection | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState(""); // State for search query
    const [filteredCards, setFilteredCards] = useState<Collection["cards"]>([]); // State for filtered cards
    const [cardSizeOption, setCardSizeOption] = useState(0); // 0: small, 1: large, 2: detailed

    const getCardDimensions = () => {
        switch (cardSizeOption) {
            case 0:
                return { height: 137, imageStyle: styles.smallCard };
            case 1:
                return { height: 191, imageStyle: styles.largeCard };
            case 2:
                return { height: 137, imageStyle: styles.smallCard };
            default:
                return { height: 137, imageStyle: styles.smallCard };
        }
    };

    const getQuantityControlsStyle = () => {
        switch (cardSizeOption) {
            case 0: // Small card
                return { bottom: 0, padding: 8 };
            case 1: // Large card
                return { bottom: 2, paddingHorizontal: 38 };
            case 2: // Detailed card
                return { bottom: 0, padding: 3, left: 10 };
            default:
                return { bottom: 4, padding: 4 };
        }
    };

    const toggleCardSize = () => {
        setCardSizeOption((prevOption) => (prevOption + 1) % 3);
    };

    const { height, imageStyle } = getCardDimensions();

    useEffect(() => {
        const fetchCollection = async () => {
            try {
                const { data: session, error } = await supabase.auth.getSession();
                if (error || !session?.session?.access_token) {
                    throw new Error("No se pudo obtener el token de sesión");
                }

                const token = session.session.access_token;

                const response = await api.get(`/collection/${collectionId}`, {
                    headers: {
                        Authorization: `Bearer ${token}`, // Usar el token obtenido dinámicamente
                    },
                });
                console.log("Collection response:", response.data); // Debugging line
                setCollection(response.data.data);
            } catch (error) {
                console.error("Error fetching collection:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchCollection();
    }, [collectionId]);

    useEffect(() => {
        navigation.setOptions({
            headerShown: true,
            headerLeft: () => (
                <TouchableOpacity
                    onPress={() => {
                        router.back();
                        modalizeRef.current?.close();
                    }}
                    style={{ marginLeft: 12 }}
                >
                    <MaterialIcons name="arrow-back" size={24} color={Colors[theme].text} />
                </TouchableOpacity>
            ),
            headerTitle: () => null,
            headerRight: () => (
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <TouchableOpacity
                        onPress={() => {
                            setIsModalOpen(true);
                            modalizeRef.current?.open();
                        }}
                        style={{
                            backgroundColor: Colors[theme].success,
                            paddingVertical: 5,
                            paddingHorizontal: 10,
                            borderRadius: 5,
                            marginRight: 10,
                        }}
                    >
                        <Text style={{ color: Colors[theme].background, fontWeight: "bold" }}>{t("cards")}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={{
                            backgroundColor: Colors[theme].highlight,
                            paddingVertical: 5,
                            paddingHorizontal: 5,
                            borderRadius: 5,
                            marginRight: 10,
                        }}
                        onPress={() => setIsEditing(!isEditing)}
                    >
                        <MaterialIcons name="edit" size={24} color={Colors[theme].background} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => setIsDeleteModalVisible(true)}
                        style={{
                            backgroundColor: Colors[theme].error,
                            paddingVertical: 5,
                            paddingHorizontal: 5,
                            borderRadius: 5,
                        }}
                    >
                        <MaterialIcons name="delete" size={24} color={Colors[theme].background} />
                    </TouchableOpacity>
                </View>
            ),
        });
    }, [isEditing]);

    const handleDeleteCollection = async () => {
        try {
            await api.delete(`/collections/${collectionId}`);
            Toast.show({
                type: "success",
                text1: "Collection deleted",
                text2: "The collection has been successfully deleted.",
                position: "bottom",
            });
            router.replace("/"); // Navigate back to the main screen
        } catch (error) {
            console.error("Error deleting collection:", error);
            Toast.show({
                type: "error",
                text1: "Error",
                text2: "Failed to delete the collection.",
                position: "bottom",
            });
        }
    };

    const handleEditCollection = async () => {
        try {
            const updatedName = editedName.trim(); // Ensure no leading/trailing spaces
            const updatedDescription = editedDescription.trim(); // Ensure no leading/trailing spaces

            await api.put(`/collection/${collectionId}`, {
                name: updatedName,
                description: updatedDescription,
            });

            setCollection((prev) => ({
                ...prev!,
                name: updatedName,
                description: updatedDescription,
            }));

            setIsEditing(!isEditing); // Close edit mode

            Toast.show({
                type: "success",
                text1: "Collection updated",
                text2: "The collection has been successfully updated.",
                position: "bottom",
            });
        } catch (error) {
            console.error("Error editing collection:", error);
            Toast.show({
                type: "error",
                text1: "Error",
                text2: "Failed to update the collection.",
                position: "bottom",
            });
        }
    };

    const handleAddCardToCollection = async (cardId: string) => {
        try {
            await api.post(`/collection/${collectionId}/add-card`, { cardId });
            Toast.show({
                type: "success",
                text1: "Card added",
                text2: "The card has been successfully added to the collection.",
                position: "bottom",
            });
            modalizeRef.current?.close(); // Close the modal after adding the card
        } catch (error) {
            console.error("Error adding card to collection:", error);
            Toast.show({
                type: "error",
                text1: "Error",
                text2: "Failed to add the card to the collection.",
                position: "bottom",
            });
        }
    };

    const fetchFilteredCards = async () => {
        try {
            const response = await api.get(`/cards?search=${searchQuery}`);
            setFilteredCards(response.data.data);
        } catch (error) {
            console.error("Error fetching filtered cards:", error);
        }
    };

    useEffect(() => {
        fetchFilteredCards();
    }, [searchQuery]);

    useEffect(() => {
        if (collection) {
            setEditedName(collection.name);
            setEditedDescription(collection.description || "");
        }
    }, [collection]);

    if (loading) {
        return (
            <View style={styles.container}>
                <Text>Loading...</Text>
            </View>
        );
    }

    if (!collection) {
        return (
            <View style={styles.container}>
                <Text>Collection not found</Text>
            </View>
        );
    }

    const renderCardItem = ({ item }: { item: { code: string; name: string; color: string[]; rarity: string } }) => (
        <View style={[styles.cardContainer, { backgroundColor: Colors[theme].backgroundSoft }]}>
            <View style={styles.cardDetails}>
                <Text style={[styles.cardCode, { color: Colors[theme].text }]}>{item.code}</Text>
                <Text style={[styles.cardName, { color: Colors[theme].textSoft }]}>
                    {item.name.length > 25 ? `${item.name.slice(0, 25)}...` : item.name}
                </Text>
            </View>
            <Text style={[styles.cardRarity, { color: Colors[theme].tint }]}>{item.rarity}</Text>
            <View style={styles.cardColors}>
                {item.color.map((color, index) => (
                    <View key={index} style={[styles.colorCircle, { backgroundColor: color.toLowerCase() }]} />
                ))}
            </View>
        </View>
    );

    return (
        <>
            <View style={[styles.container, { backgroundColor: Colors[theme].background }]}>
                {isEditing ? (
                    <View style={styles.editContainer}>
                        <TextInput
                            style={[
                                styles.editInput,
                                { color: Colors[theme].text, backgroundColor: Colors[theme].TabBarBackground },
                            ]}
                            value={editedName}
                            onChangeText={setEditedName}
                            numberOfLines={1}
                        />
                        <TextInput
                            style={[
                                styles.editTextarea,
                                { color: Colors[theme].text, backgroundColor: Colors[theme].TabBarBackground },
                            ]}
                            value={editedDescription}
                            onChangeText={setEditedDescription}
                            multiline
                        />
                        <TouchableOpacity
                            style={[styles.tickButton, { backgroundColor: Colors[theme].success }]}
                            onPress={handleEditCollection}
                        >
                            <MaterialIcons name="check" size={24} color={Colors[theme].background} />
                        </TouchableOpacity>
                    </View>
                ) : (
                    <>
                        <Text style={[styles.title, { color: Colors[theme].text }]}>{collection.name}</Text>
                        <Text style={[styles.description, { color: Colors[theme].tabIconDefault }]}>
                            {collection.description}
                        </Text>
                    </>
                )}
                <FlatList
                    data={collection.cards}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) =>
                        renderCardItem({
                            item: {
                                code: item.code,
                                name: item.name, // Replace with actual card name
                                color: item.color, // Replace with actual card colors
                                rarity: item.rarity, // Replace with actual card rarity
                            },
                        })
                    }
                />
            </View>
            <Modalize
                ref={modalizeRef}
                onClose={() => setIsModalOpen(false)}
                modalStyle={{ backgroundColor: Colors[theme].backgroundSoft }}
            >
                <View style={styles.modalizeContainer}>
                    <TextInput
                        style={[
                            styles.searchInput,
                            { borderColor: Colors[theme].TabBarBackground, color: Colors[theme].text },
                        ]}
                        placeholder="Search cards"
                        placeholderTextColor={Colors[theme].disabled}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    <TouchableOpacity
                        onPress={toggleCardSize}
                        style={styles.viewModeButton}
                        delayPressIn={0} // Reduce delay
                    >
                        <MaterialIcons
                            name={
                                cardSizeOption === 0
                                    ? "view-module"
                                    : cardSizeOption === 1
                                    ? "view-agenda"
                                    : "view-list"
                            }
                            size={24}
                            color={Colors[theme].text}
                        />
                    </TouchableOpacity>
                    <FlatList
                        data={filteredCards}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item }) => (
                            <TouchableOpacity onPress={() => handleAddCardToCollection(item.id)}>
                                <View
                                    style={[
                                        styles.cardContainerModalize,
                                        { backgroundColor: Colors[theme].TabBarBackground },
                                    ]}
                                >
                                    <ExpoImage
                                        source={{ uri: item.images_small }}
                                        style={[styles.cardImage, imageStyle]}
                                        contentFit="contain"
                                    />
                                    <Text style={[styles.cardNameModalize, { color: Colors[theme].text }]}>
                                        {item.name}
                                    </Text>
                                    <Text style={[styles.cardCodeModalize, { color: Colors[theme].textSoft }]}>
                                        {item.code}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        )}
                    />
                </View>
            </Modalize>
            <Modal
                visible={isDeleteModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setIsDeleteModalVisible(false)}
            >
                <TouchableOpacity
                    style={{
                        flex: 1,
                        justifyContent: "center",
                        alignItems: "center",
                        backgroundColor: "rgba(0, 0, 0, 0.5)",
                    }}
                    activeOpacity={1}
                    onPressOut={() => setIsDeleteModalVisible(false)}
                >
                    <View
                        style={{
                            width: "80%",
                            borderRadius: 10,
                            padding: 20,
                            backgroundColor: Colors[theme].backgroundSoft,
                            alignItems: "center",
                        }}
                    >
                        <Text style={{ fontSize: 18, marginBottom: 10, textAlign: "center" }}>
                            Are you sure you want to delete this collection?
                        </Text>
                        <View style={{ flexDirection: "row", justifyContent: "space-between", width: "100%" }}>
                            <TouchableOpacity
                                style={{
                                    flex: 1,
                                    marginHorizontal: 5,
                                    paddingVertical: 10,
                                    borderRadius: 5,
                                    alignItems: "center",
                                    backgroundColor: Colors[theme].error,
                                }}
                                onPress={() => setIsDeleteModalVisible(false)}
                            >
                                <Text style={{ color: Colors[theme].text }}>No</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={{
                                    flex: 1,
                                    marginHorizontal: 5,
                                    paddingVertical: 10,
                                    borderRadius: 5,
                                    alignItems: "center",
                                    backgroundColor: Colors[theme].success,
                                }}
                                onPress={() => {
                                    handleDeleteCollection();
                                    setIsDeleteModalVisible(false);
                                }}
                            >
                                <Text style={{ color: Colors[theme].text }}>Yes</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </TouchableOpacity>
            </Modal>
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        paddingBottom: 100,
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        marginBottom: 8,
        textAlign: "center", // Center the title theme color for text
    },
    description: {
        fontSize: 16,
        marginBottom: 16,
        textAlign: "center", // Center the descriptionse theme color for soft text
    },
    cardContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        padding: 10,
        marginVertical: 5,
        borderRadius: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 }, // Slightly deeper shadow
        shadowOpacity: 0.15, // Increase shadow opacity
        shadowRadius: 6, // Increase shadow radius
        elevation: 3, // Enhance elevation for Android
    },
    cardDetails: {
        flex: 1,
    },
    cardCode: {
        fontSize: 14,
        fontWeight: "bold",
    },
    cardName: {
        fontSize: 12,
    },
    cardColors: {
        flexDirection: "row",
        marginHorizontal: 10,
    },
    colorCircle: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginHorizontal: 2,
    },
    cardRarity: {
        fontSize: 12,
        fontWeight: "bold",
    },
    editContainer: {
        width: "100%",
        paddingHorizontal: 10,
        alignItems: "center",
        paddingTop: 20,
    },
    editInput: {
        fontSize: 24,
        fontWeight: "bold",
        textAlign: "center",
        marginBottom: 20,
        borderWidth: 1,
        borderColor: "#ccc",
        paddingVertical: 8,
        paddingHorizontal: 10,
        width: "90%",
        maxWidth: 500,
        borderRadius: 5,
    },
    editTextarea: {
        fontSize: 16,
        textAlignVertical: "top", // Key for multiline
        marginBottom: 20,
        borderWidth: 1,
        borderColor: "#ccc",
        padding: 10,
        borderRadius: 5,
        width: "90%",
        maxWidth: 500,
        height: 120,
    },
    tickButton: {
        position: "absolute",
        bottom: 10,
        right: 10,
        padding: 10,
        borderRadius: 5,
        justifyContent: "center",
        alignItems: "center",
    },
    modalizeContainer: {
        padding: 16,
    },
    searchInput: {
        height: 40,
        borderWidth: 1,
        paddingHorizontal: 8,
        borderRadius: 4,
        marginBottom: 16,
    },
    viewModeButton: {
        marginLeft: 10,
    },
    smallCard: {
        width: 97,
        height: 137,
    },
    largeCard: {
        width: 134,
        height: 191,
    },
    cardContainerModalize: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        padding: 10,
        marginVertical: 5,
        borderRadius: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    cardNameModalize: {
        fontSize: 16,
        fontWeight: "bold",
    },
    cardCodeModalize: {
        fontSize: 14,
    },
    cardImage: {
        width: 100,
        height: 140,
        borderRadius: 5,
    },
});

export default CollectionDetails;
