import React, { useEffect, useRef } from "react";
import {
    Modal,
    View,
    TouchableOpacity,
    TextInput,
    FlatList,
    ActivityIndicator,
    Animated,
    TouchableWithoutFeedback,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ThemedText } from "./ThemedText";
import { Colors } from "@/constants/Colors";
import { Image } from "expo-image";

type CollectionSelectModalProps = {
    visible: boolean;
    onClose: () => void;
    userCollections: any[];
    loadingCollections: boolean;
    selectedCollection: any;
    setSelectedCollection: (collection: any) => void;
    collectionMessageInput: string;
    setCollectionMessageInput: (msg: string) => void;
    handleSendCollectionMessage: () => void;
    theme: keyof typeof Colors;
    t: any;
};

const CollectionSelectModal: React.FC<CollectionSelectModalProps> = ({
    visible,
    onClose,
    userCollections,
    loadingCollections,
    selectedCollection,
    setSelectedCollection,
    collectionMessageInput,
    setCollectionMessageInput,
    handleSendCollectionMessage,
    theme,
    t,
}) => {
    const anim = useRef(new Animated.Value(1)).current;
    useEffect(() => {
        if (visible) {
            Animated.timing(anim, {
                toValue: 1,
                duration: 180,
                useNativeDriver: true,
            }).start();
        } else {
            anim.setValue(0);
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
                        opacity: anim,
                        transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.98, 1] }) }],
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
                        {selectedCollection && (
                            <TouchableOpacity
                                onPress={() => setSelectedCollection(null)}
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
                            {selectedCollection ? t("send_collection") : t("select_collection")}
                        </ThemedText>
                    </View>

                    {loadingCollections && (
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
                    {!loadingCollections && userCollections.length === 0 && !selectedCollection && (
                        <ThemedText style={{ color: Colors[theme].text }}>{t("no_collections_available")}</ThemedText>
                    )}
                    {!loadingCollections && userCollections.length > 0 && !selectedCollection && (
                        <FlatList
                            data={userCollections}
                            keyExtractor={(item) => item.id}
                            horizontal={false}
                            showsVerticalScrollIndicator={true}
                            style={{ marginBottom: 16, maxHeight: 300, width: "100%" }}
                            contentContainerStyle={{ gap: 8, paddingBottom: 8 }}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    onPress={() => setSelectedCollection(item)}
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
                                    <Ionicons
                                        name="folder"
                                        size={40}
                                        color={Colors[theme].tint}
                                        style={{ marginRight: 12 }}
                                    />
                                    <ThemedText style={{ color: Colors[theme].text, fontWeight: "bold", fontSize: 18 }}>
                                        {item.name}
                                    </ThemedText>
                                </TouchableOpacity>
                            )}
                        />
                    )}
                    {selectedCollection && !loadingCollections && (
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
                                <Ionicons
                                    name="folder"
                                    size={50}
                                    color={Colors[theme].tint}
                                    style={{ marginRight: 16 }}
                                />
                                <ThemedText style={{ color: Colors[theme].text, fontWeight: "bold", fontSize: 20 }}>
                                    {selectedCollection.name}
                                </ThemedText>
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
                                value={collectionMessageInput}
                                onChangeText={setCollectionMessageInput}
                            />
                            <TouchableOpacity
                                style={{
                                    backgroundColor: Colors[theme].tint,
                                    borderRadius: 8,
                                    paddingVertical: 10,
                                    paddingHorizontal: 30,
                                    alignItems: "center",
                                    marginBottom: 8,
                                }}
                                onPress={handleSendCollectionMessage}
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

export default CollectionSelectModal;
