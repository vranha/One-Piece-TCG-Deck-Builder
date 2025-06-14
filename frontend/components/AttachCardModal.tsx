import React from "react";
import { Modal, View, TextInput, TouchableOpacity } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { Colors } from "@/constants/Colors";
import { Image } from "expo-image";

type AttachCardModalProps = {
    visible: boolean;
    onClose: () => void;
    card: any;
    message: string;
    setMessage: (msg: string) => void;
    onSend: () => void;
    theme: keyof typeof Colors;
};

const AttachCardModal: React.FC<AttachCardModalProps> = ({
    visible,
    onClose,
    card,
    message,
    setMessage,
    onSend,
    theme,
}) => {
    return (
        <Modal
            visible={visible}
            animationType="fade"
            transparent
            onRequestClose={onClose}
        >
            <View
                style={{
                    flex: 1,
                    backgroundColor: "rgba(0,0,0,0.7)",
                    justifyContent: "center",
                    alignItems: "center",
                }}
            >
                <TouchableOpacity
                    style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
                    onPress={onClose}
                    activeOpacity={1}
                />
                <View
                    style={{
                        width: "90%",
                        backgroundColor: Colors[theme].background,
                        borderRadius: 16,
                        padding: 20,
                        alignItems: "center",
                    }}
                >
                    {card && (
                        <>
                            <Image
                                source={card.images_thumb}
                                style={{ width: 120, height: 170, borderRadius: 8, marginBottom: 16 }}
                                contentFit="cover"
                                cachePolicy="memory-disk"
                            />
                            <ThemedText style={{ fontWeight: "bold", fontSize: 18, marginBottom: 8, color: Colors[theme].text }}>
                                {card.name}
                            </ThemedText>
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
                                placeholder="Añade un mensaje (opcional)"
                                placeholderTextColor={Colors[theme].tabIconDefault}
                                value={message}
                                onChangeText={setMessage}
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
                                onPress={onSend}
                            >
                                <ThemedText style={{ color: Colors[theme].background, fontWeight: "bold", fontSize: 16 }}>
                                    Enviar
                                </ThemedText>
                            </TouchableOpacity>
                        </>
                    )}
                </View>
            </View>
        </Modal>
    );
};

export default AttachCardModal;