import React from "react";
import { Modal, Pressable, View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Image as ExpoImage } from "expo-image";
import { Colors } from "@/constants/Colors";

interface ImageModalProps {
    isVisible: boolean;
    onClose: () => void;
    imageUri: string | null;
    theme: keyof typeof Colors;
}

const ImageModal: React.FC<ImageModalProps> = ({ isVisible, onClose, imageUri, theme }) => {
    return (
        <Modal visible={isVisible} animationType="fade" transparent>
            <Pressable onPress={onClose} style={styles.modalOverlay}>
                <View style={[styles.modalContent, { backgroundColor: Colors[theme].TabBarBackground }]}>
                    {imageUri && (
                        <ExpoImage source={{ uri: imageUri }} style={styles.largeImage} contentFit="contain" />
                    )}
                    <TouchableOpacity
                        onPress={onClose}
                        style={[styles.closeButton, { backgroundColor: Colors[theme].tabIconDefault }]}
                    >
                        <Text style={[styles.closeButtonText, { color: Colors[theme].background }]}>Close</Text>
                    </TouchableOpacity>
                </View>
            </Pressable>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.815)",
        justifyContent: "center",
        alignItems: "center",
    },
    modalContent: {
        width: "90%",
        maxHeight: "80%",
        borderRadius: 10,
        padding: 20,
        alignItems: "center",
        justifyContent: "center",
    },
    largeImage: {
        width: "100%",
        height: "80%",
        borderRadius: 10,
    },
    closeButton: {
        marginTop: 20,
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 5,
    },
    closeButtonText: {
        fontWeight: "bold",
    },
});

export default ImageModal;
