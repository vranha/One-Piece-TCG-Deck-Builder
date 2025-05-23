import { Tabs, useRouter } from "expo-router";
import React, { useState, useRef } from "react";
import { Platform, View, StyleSheet, Animated, ActivityIndicator } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Modalize } from "react-native-modalize";
import { TouchableOpacity } from "react-native-gesture-handler";

import { HapticTab } from "@/components/HapticTab";
import TabBarBackground from "@/components/ui/TabBarBackground";
import { Colors } from "@/constants/Colors";
import { useTheme } from "@/hooks/ThemeContext";
import Header from "@/components/Header";
import TabBarButton from "@/components/TabBarButton";
import Bubbles from "@/components/Bubbles";
import ChatModal from "@/components/ChatModal";
import { IconSymbol } from "@/components/ui/IconSymbol";
import NewDeckModal from "@/components/NewDeckModal";
import ImportDeckModal from "@/components/ImportDeckModal";
import NewCollectionModal from "@/components/NewCollectionModal"; // Importa el nuevo modal
import { Portal } from "react-native-paper";
import useApi from "@/hooks/useApi";
import Toast from "react-native-toast-message";
import { useAuth } from "@/contexts/AuthContext";
import useStore from "@/store/useStore";
import { ThemedText } from "@/components/ThemedText";
import { useTranslation } from "react-i18next";

export default function TabLayout() {
    const { theme } = useTheme();
    const router = useRouter();
    const { session } = useAuth();
    const { t } = useTranslation();
    const [showBubbles, setShowBubbles] = useState(false);
    const blurAnim = useRef(new Animated.Value(0)).current;
    const bubbleAnim = useRef(new Animated.Value(0)).current;
    const bubbleRefs = useRef([
        new Animated.Value(0),
        new Animated.Value(0),
        new Animated.Value(0),
        new Animated.Value(0),
    ]);
    const modalizeRef = useRef<Modalize>(null);
    const [isNewDeckModalVisible, setIsNewDeckModalVisible] = useState(false);
    const [isImportDeckModalVisible, setIsImportDeckModalVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isNewCollectionModalVisible, setIsNewCollectionModalVisible] = useState(false);
    const [collectionType, setCollectionType] = useState<"collection" | "wishlist">("collection");
    const [newCollectionName, setNewCollectionName] = useState("");
    const [newCollectionDescription, setNewCollectionDescription] = useState("");
    const setRefreshCollections = useStore((state) => state.setRefreshCollections);
    const api = useApi();
    const hasUnreadChats = useStore((state) => state.hasUnreadChats);

    const toggleBubbles = () => {
        if (showBubbles) {
            Animated.timing(bubbleAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start(() =>
                setShowBubbles(false)
            );
            bubbleRefs.current.forEach((anim) =>
                Animated.timing(anim, { toValue: 0, duration: 300, useNativeDriver: true }).start()
            );
            Animated.timing(blurAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start();
        } else {
            setShowBubbles(true);
            const animations = bubbleRefs.current.map((anim, index) =>
                Animated.sequence([
                    Animated.delay(index * 100),
                    Animated.spring(anim, { toValue: 1, friction: 5, useNativeDriver: true }),
                ])
            );
            Animated.parallel(animations).start();
            Animated.spring(bubbleAnim, { toValue: 1, friction: 5, useNativeDriver: true }).start();
            Animated.timing(blurAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
        }
    };

    const handleBubblePress = (index: number) => {
        if (index === 0) {
            // Index for "Import Deck"
            setIsImportDeckModalVisible(true);
            toggleBubbles();
        }
        if (index === 3) {
            // Index for "Nuevo Mazo"
            setIsNewDeckModalVisible(true);
            toggleBubbles();
        }
        if (index === 2) {
            // Bubble para crear colección/wishlist
            setIsNewCollectionModalVisible(true);
            setCollectionType("collection");
            setNewCollectionName("");
            setNewCollectionDescription("");
            toggleBubbles();
        }
    };

    const handleCreateDeck = (leader: string, name: string, description: string) => {
        // Logic to create a new deck
        useStore.getState().setRefreshDecks(true); // Notificar al DeckCarousel
        console.log("Creating deck:", leader, name, description);
    };

    const openModal = (event: any) => {
        event.persist(); // Persistir el evento
        event.preventDefault();
        modalizeRef.current?.open();
    };

    const handleImportDeck = async (
        parsedCards: { code: string; quantity: number; color: string[]; name: string }[]
    ) => {
        setIsImportDeckModalVisible(false); // Close the modal first
        setIsLoading(true); // Show the loading indicator
        try {
            const [leaderCard, ...otherCards] = parsedCards;
            console.log("LEADER", leaderCard, "OTHERS", otherCards);

            // Create the deck with the leader card
            const { data: newDeck } = await api.post("/decks", {
                userId: session?.user.id, // Replace with actual user ID
                name: `Imported ${leaderCard.name} Deck`,
                description: "Deck imported from clipboard",
                colors: leaderCard.color,
                leaderCardId: leaderCard.code,
            });

            // Add the rest of the cards
            await api.post("/decks/cards/multiple", {
                deckId: newDeck.id,
                cards: otherCards.map((card: { code: string; quantity: number }) => ({
                    cardId: card.code,
                    quantity: card.quantity,
                })),
            });

            Toast.show({
                type: "success",
                text1: "Deck Imported",
                text2: "The deck has been successfully imported.",
            });
            useStore.getState().setRefreshDecks(true); // Notificar al DeckCarousel
        } catch (error) {
            console.error("Error importing deck:", error);
            Toast.show({
                type: "error",
                text1: "Import Failed",
                text2: "There was an error importing the deck.",
            });
        } finally {
            setIsLoading(false); // Hide the loading indicator
        }
    };

    const handleCreateCollection = async (name: string, description: string, type: "collection" | "wishlist") => {
        if (!name.trim()) return;
        try {
            setIsLoading(true);
            await api.post(`/collections/${session?.user.id}`, {
                name,
                description,
                type,
            });
            Toast.show({
                type: "success",
                text1: t("collection_created_successfully"),
            });
            setIsNewCollectionModalVisible(false);
            setNewCollectionName("");
            setNewCollectionDescription("");
            setRefreshCollections(true);
        } catch (error) {
            Toast.show({
                type: "error",
                text1: t("error_creating_collection"),
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <View style={{ flex: 1 }}>
                <Tabs
                    screenOptions={{
                        tabBarActiveTintColor: Colors[theme].text,
                        headerShown: false,
                        tabBarButton: HapticTab,
                        tabBarBackground: TabBarBackground,
                        tabBarStyle: [
                            {
                                backgroundColor: Colors[theme].TabBarBackground,
                                height: 65,
                                position: "absolute",
                            },
                            Platform.select({
                                ios: { position: "absolute" },
                                default: {},
                            }),
                        ],
                    }}
                >
                    <Tabs.Screen
                        name="index"
                        options={{
                            tabBarShowLabel: false,
                            title: "OP Lab",
                            tabBarButton: (props) => <TabBarButton {...props} name="house.fill" />, // sin badge
                            headerShown: true,
                            headerTitleAlign: "center",
                            headerTitle: () => <Header title="OP Lab" />,
                            headerLeft: () => (
                                <>
                                    <Header.LeftButton />
                                    <Header.LeftButtonNotifications onPress={() => router.push("/notifications")} />
                                </>
                            ),
                            headerRight: () => (
                                <>
                                    <Header.RightButtonDeckSearcher onPress={() => router.push("/deckSearcher")} />
                                    <Header.RightButtonSearch onPress={() => router.push("/search")} />
                                    <Header.RightButton onPress={() => router.push("/settings")} />
                                </>
                            ),
                            tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
                        }}
                    />
                    <Tabs.Screen
                        name="chat"
                        options={{
                            title: "Chat",
                            tabBarButton: (props) => (
                                <TabBarButton
                                    {...props}
                                    name="forum.fill"
                                    isChatButton
                                    onPress={openModal}
                                    hasUnread={hasUnreadChats}
                                />
                            ),
                        }}
                    />
                    <Tabs.Screen
                        name="plus"
                        options={{
                            title: "",
                            tabBarButton: (props) => (
                                <TabBarButton {...props} name="plus.circle.fill" onPress={toggleBubbles} />
                            ),
                        }}
                    />
                    <Tabs.Screen
                        name="[cardId]"
                        options={{
                            href: null,
                        }}
                    />
                    <Tabs.Screen
                        name="deck"
                        options={{
                            href: null,
                        }}
                    />
                    <Tabs.Screen
                        name="user"
                        options={{
                            href: null,
                        }}
                    />
                    <Tabs.Screen
                        name="collection"
                        options={{
                            href: null,
                        }}
                    />
                </Tabs>

                {showBubbles && (
                    <Bubbles
                        blurAnim={blurAnim}
                        bubbleAnim={bubbleAnim}
                        bubbleRefs={bubbleRefs}
                        toggleBubbles={toggleBubbles}
                        onBubblePress={handleBubblePress}
                    />
                )}
                <ChatModal ref={modalizeRef} />
                <Portal>
                    {isLoading && (
                        <View style={[styles.loadingOverlay, { justifyContent: "center", alignItems: "center" }]}>
                            <ActivityIndicator size="large" color={Colors[theme].tint} />
                        </View>
                    )}
                    <NewDeckModal
                        visible={isNewDeckModalVisible}
                        onClose={() => setIsNewDeckModalVisible(false)}
                        onCreate={handleCreateDeck}
                    />
                </Portal>
                <Portal>
                    <ImportDeckModal
                        visible={isImportDeckModalVisible}
                        onClose={() => setIsImportDeckModalVisible(false)}
                        onImport={handleImportDeck}
                    />
                </Portal>
                <Portal>
                    <NewCollectionModal
                        visible={isNewCollectionModalVisible}
                        onClose={() => setIsNewCollectionModalVisible(false)}
                        type={collectionType}
                        setType={setCollectionType}
                        name={newCollectionName}
                        setName={setNewCollectionName}
                        description={newCollectionDescription}
                        setDescription={setNewCollectionDescription}
                        onCreate={handleCreateCollection}
                    />
                </Portal>
            </View>
        </GestureHandlerRootView>
    );
}

const styles = StyleSheet.create({
    overlay: {
        ...StyleSheet.absoluteFillObject,
        position: "absolute",
        backgroundColor: "rgba(0, 0, 0, 0.4)",
    },
    overlayTouchable: {
        ...StyleSheet.absoluteFillObject,
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        zIndex: 1000,
    },
    modalOverlay: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0,0,0,0.5)",
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
        elevation: 5,
    },
    typeSwitchRow: {
        flexDirection: "row",
        width: "100%",
        marginBottom: 15,
        gap: 10,
    },
    typeSwitchButton: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 10,
        alignItems: "center",
        marginHorizontal: 2,
        backgroundColor: "transparent",
        borderWidth: 1,
        borderColor: "#ccc",
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
});
