import React from "react";
import { Modal, View, TouchableWithoutFeedback, Animated, TouchableOpacity, FlatList, ActivityIndicator, TextInput } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/Colors";
import { ThemedText } from "@/components/ThemedText";
import { Image } from "expo-image";

type DeckSelectModalProps = {
    visible: boolean;
    onClose: () => void;
    userDecks: any[];
    loadingDecks: boolean;
    selectedDeck: any;
    setSelectedDeck: (deck: any) => void;
    deckMessageInput: string;
    setDeckMessageInput: (msg: string) => void;
    handleSendDeckMessage: () => void;
    theme: keyof typeof Colors;
    t: any;
};

const DeckSelectModal: React.FC<DeckSelectModalProps> = ({
    visible,
    onClose,
    userDecks,
    loadingDecks,
    selectedDeck,
    setSelectedDeck,
    deckMessageInput,
    setDeckMessageInput,
    handleSendDeckMessage,
    theme,
    t,
}) => {
    const decksAnim = React.useRef(new Animated.Value(1)).current;
React.useEffect(() => {
    if (visible) {
        Animated.timing(decksAnim, {
            toValue: 1,
            duration: 180,
            useNativeDriver: true,
        }).start();
    } else {
        decksAnim.setValue(0);
    }
}, [visible]);

    return (
        <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
            <View
                style={{
                    flex: 1,
                    backgroundColor: "rgba(0,0,0,0.7)",
                    justifyContent: "center",
                    alignItems: "center",
                }}
            >
                <TouchableWithoutFeedback onPress={onClose}>
                    <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }} />
                </TouchableWithoutFeedback>
                <Animated.View
                    style={{
                        width: "90%",
                        maxHeight: 500,
                        backgroundColor: Colors[theme].background,
                        borderRadius: 16,
                        padding: 20,
                        alignItems: "center",
                        opacity: decksAnim,
                        transform: [
                            { scale: decksAnim.interpolate({ inputRange: [0, 1], outputRange: [0.98, 1] }) },
                        ],
                    }}
                    pointerEvents="box-none"
                >
                    <View
                        style={{
                            width: "100%",
                            alignItems: "center",
                            marginBottom: 16,
                            flexDirection: "row",
                            gap: 12,
                            position: "relative",
                            justifyContent: "center",
                        }}
                    >
                        {selectedDeck && (
                            <TouchableOpacity
                                onPress={() => setSelectedDeck(null)}
                                style={{
                                    position: "absolute",
                                    left: 0,
                                    zIndex: 2,
                                    padding: 4,
                                    borderRadius: 100,
                                }}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            >
                                <Ionicons name="arrow-back" size={22} color={Colors[theme].tint} />
                            </TouchableOpacity>
                        )}
                        <ThemedText
                            style={{
                                fontWeight: "bold",
                                fontSize: 20,
                                color: Colors[theme].tint,
                                textAlign: "center",
                                flex: 1,
                            }}
                        >
                            {selectedDeck ? t("send_deck") : t("select_deck")}
                        </ThemedText>
                    </View>

                    {loadingDecks && (
                        <View
                            style={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                backgroundColor: Colors[theme].background + "CC",
                                zIndex: 10,
                                justifyContent: "center",
                                alignItems: "center",
                                borderRadius: 16,
                            }}
                        >
                            <ActivityIndicator size="large" color={Colors[theme].tint} />
                        </View>
                    )}
                    {!loadingDecks && userDecks.length === 0 && !selectedDeck && (
                        <ThemedText style={{ color: Colors[theme].text }}>{t("no_decks_available")}</ThemedText>
                    )}
                    {!loadingDecks && userDecks.length > 0 && !selectedDeck && (
                        <FlatList
                            data={userDecks}
                            keyExtractor={(item) => item.id}
                            horizontal={false}
                            showsVerticalScrollIndicator={true}
                            style={{ marginBottom: 16, maxHeight: 300, width: "100%" }}
                            contentContainerStyle={{ gap: 8, paddingBottom: 8 }}
                            renderItem={({ item }) => {
                                const leader =
                                    item.leader || item.deck_cards?.find((c: any) => c.is_leader === true);
                                return (
                                    <TouchableOpacity
                                        onPress={() => setSelectedDeck(item)}
                                        style={{
                                            borderWidth: 2,
                                            borderColor: "transparent",
                                            borderRadius: 10,
                                            marginHorizontal: 0,
                                            marginVertical: 2,
                                            padding: 4,
                                            backgroundColor: Colors[theme].backgroundSoft,
                                            alignItems: "center",
                                            flexDirection: "row",
                                            gap: 12,
                                        }}
                                    >
                                        <Image
                                            source={leader?.cards?.images_small}
                                            style={{ width: 60, height: 85, borderRadius: 8, marginRight: 12 }}
                                            contentFit="cover"
                                            cachePolicy="memory-disk"
                                        />
                                        <ThemedText
                                            style={{
                                                color: Colors[theme].text,
                                                fontWeight: "bold",
                                                fontSize: 15,
                                                textAlign: "left",
                                                flexShrink: 1,
                                            }}
                                            numberOfLines={1}
                                        >
                                            {item.name}
                                        </ThemedText>
                                    </TouchableOpacity>
                                );
                            }}
                        />
                    )}
                    {selectedDeck && !loadingDecks && (
                        <View style={{ width: "100%", alignItems: "center" }}>
                            <View
                                style={{
                                    borderWidth: 2,
                                    borderColor: Colors[theme].backgroundSoft,
                                    borderRadius: 10,
                                    padding: 8,
                                    backgroundColor: Colors[theme].backgroundSoft,
                                    alignItems: "center",
                                    flexDirection: "row",
                                    gap: 0,
                                    marginBottom: 12,
                                }}
                            >
                                <Image
                                    source={
                                        (
                                            selectedDeck.leader?.cards?.images_small ||
                                            selectedDeck.deck_cards?.find((c: any) => c.is_leader === true)
                                        )?.cards?.images_small
                                    }
                                    style={{ width: 70, height: 100, borderRadius: 8, marginRight: 16 }}
                                    contentFit="cover"
                                    cachePolicy="memory-disk"
                                />
                                <View style={{ flex: 1, alignItems: "flex-start" }}>
                                    <ThemedText
                                        style={{ color: Colors[theme].text, fontWeight: "bold", fontSize: 17 }}
                                    >
                                        {selectedDeck.name}
                                    </ThemedText>
                                    <ThemedText
                                        style={{
                                            color: Colors[theme].tabIconDefault,
                                            fontSize: 14,
                                            marginTop: 2,
                                            fontWeight: "500",
                                        }}
                                    >
                                        {t("cards_count", { count: selectedDeck?.totalCards || 0 })}
                                    </ThemedText>
                                    {selectedDeck.description ? (
                                        <ThemedText
                                            style={{ color: Colors[theme].text + "BB", fontSize: 13, marginTop: 4 }}
                                        >
                                            {selectedDeck.description}
                                        </ThemedText>
                                    ) : null}
                                </View>
                            </View>
                            <TextInput
                                style={{
                                    width: "100%",
                                    borderRadius: 8,
                                    borderWidth: 1,
                                    borderColor: Colors[theme].tint,
                                    padding: 10,
                                    marginBottom: 10,
                                    color: Colors[theme].text,
                                    backgroundColor: Colors[theme].backgroundSoft,
                                }}
                                placeholder={t("add_a_message")}
                                placeholderTextColor={Colors[theme].tabIconDefault}
                                value={deckMessageInput}
                                onChangeText={setDeckMessageInput}
                            />
                            <TouchableOpacity
                                style={{
                                    backgroundColor: Colors[theme].success,
                                    borderRadius: 8,
                                    paddingVertical: 10,
                                    paddingHorizontal: 30,
                                    alignItems: "center",
                                    marginBottom: 8,
                                }}
                                onPress={handleSendDeckMessage}
                            >
                                <ThemedText
                                    style={{ color: Colors[theme].background, fontWeight: "bold", fontSize: 16 }}
                                >
                                    {t("send")}
                                </ThemedText>
                            </TouchableOpacity>
                        </View>
                    )}
                </Animated.View>
            </View>
        </Modal>
    );
};

export default DeckSelectModal;