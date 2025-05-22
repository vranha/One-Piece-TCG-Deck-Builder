import React from "react";
import { Modal, View, TouchableOpacity, StyleSheet, TextInput, Pressable } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { Colors } from "@/constants/Colors";
import { useTheme } from "@/hooks/ThemeContext";
import { useTranslation } from "react-i18next";

interface Props {
    visible: boolean;
    onClose: () => void;
    type: "collection" | "wishlist";
    setType: (type: "collection" | "wishlist") => void;
    name: string;
    setName: (name: string) => void;
    description: string;
    setDescription: (desc: string) => void;
    onCreate: (name: string, description: string, type: "collection" | "wishlist") => void;
}

export default function NewCollectionModal({
    visible,
    onClose,
    type,
    setType,
    name,
    setName,
    description,
    setDescription,
    onCreate,
}: Props) {
    const { theme } = useTheme();
    const { t } = useTranslation();

    // Solución: Evita que el modal reciba nuevos props mientras está abierto para no resetear los estados
    // Usamos refs para mantener los valores locales mientras el modal está abierto
    const [localName, setLocalName] = React.useState(name);
    const [localDescription, setLocalDescription] = React.useState(description);
    const [localType, setLocalType] = React.useState(type);

    // Cuando el modal se abre, sincroniza los valores locales con los props
    React.useEffect(() => {
        if (visible) {
            setLocalName(name);
            setLocalDescription(description);
            setLocalType(type);
        }
    }, [visible, name, description, type]);

    // Recibe una prop opcional para refrescar el carousel si se la pasan
    const refreshCollections = (typeof window !== "undefined" && (window as any).refreshCollections) || undefined;

    // Cuando se pulsa crear, propaga los valores locales
    const handleCreate = () => {
        onCreate(localName, localDescription, localType);
        // Si hay una función global para refrescar, la llamamos (esto es solo si CollectionCarousel la expone globalmente)
        if (typeof refreshCollections === "function") {
            refreshCollections();
        }
    };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <Pressable style={styles.modalOverlay} onPress={onClose}>
                <View
                    style={[styles.modalContent, { backgroundColor: Colors[theme].background }]}
                    onStartShouldSetResponder={() => true}
                >
                    <View style={styles.typeSwitchRow}>
                        <TouchableOpacity
                            style={[
                                styles.typeSwitchButton,
                                localType === "collection" && { backgroundColor: Colors[theme].info },
                            ]}
                            onPress={() => setLocalType("collection")}
                        >
                            <ThemedText
                                type="defaultSemiBold"
                                style={{
                                    color: localType === "collection" ? Colors[theme].background : Colors[theme].text,
                                }}
                            >
                                {t("collection")}
                            </ThemedText>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                styles.typeSwitchButton,
                                localType === "wishlist" && { backgroundColor: Colors[theme].success },
                            ]}
                            onPress={() => setLocalType("wishlist")}
                        >
                            <ThemedText
                                type="defaultSemiBold"
                                style={{
                                    color: localType === "wishlist" ? Colors[theme].background : Colors[theme].text,
                                }}
                            >
                                {t("wishlist")}
                            </ThemedText>
                        </TouchableOpacity>
                    </View>
                    <ThemedText type="title" style={{ marginBottom: 15, color: Colors[theme].text }}>
                        {localType === "collection" ? t("new_collection") : t("new_wishlist")}
                    </ThemedText>
                    <View style={{ width: "100%" }}>
                        <View style={{ marginBottom: 15 }}>
                            <ThemedText type="default" style={{ color: Colors[theme].text, marginBottom: 5 }}>
                                {t("name")}
                            </ThemedText>
                            <View
                                style={{
                                    borderWidth: 1,
                                    borderColor: Colors[theme].background,
                                    borderRadius: 10,
                                    backgroundColor: Colors[theme].backgroundSoft,
                                }}
                            >
                                <TextInput
                                    style={{
                                        color: Colors[theme].text,
                                        padding: 12,
                                        fontSize: 16,
                                    }}
                                    placeholder={t("name")}
                                    placeholderTextColor={Colors[theme].tabIconDefault}
                                    value={localName}
                                    onChangeText={setLocalName}
                                />
                            </View>
                        </View>
                        <View style={{ marginBottom: 15 }}>
                            <ThemedText type="default" style={{ color: Colors[theme].text, marginBottom: 5 }}>
                                {t("description")}
                            </ThemedText>
                            <View
                                style={{
                                    borderWidth: 1,
                                    borderColor: Colors[theme].background,
                                    borderRadius: 10,
                                    backgroundColor: Colors[theme].backgroundSoft,
                                }}
                            >
                                <TextInput
                                    style={{
                                        color: Colors[theme].text,
                                        padding: 12,
                                        fontSize: 16,
                                        minHeight: 40,
                                    }}
                                    placeholder={t("description")}
                                    placeholderTextColor={Colors[theme].tabIconDefault}
                                    value={localDescription}
                                    onChangeText={setLocalDescription}
                                    multiline
                                />
                            </View>
                        </View>
                    </View>
                    <View style={styles.modalButtons}>
                        <TouchableOpacity
                            style={[styles.modalButton, { backgroundColor: Colors[theme].error }]}
                            onPress={onClose}
                        >
                            <ThemedText type="defaultSemiBold" style={{ color: Colors[theme].background }}>
                                {t("cancel")}
                            </ThemedText>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.modalButton, { backgroundColor: Colors[theme].success }]}
                            onPress={handleCreate}
                        >
                            <ThemedText type="defaultSemiBold" style={{ color: Colors[theme].background }}>
                                {t("create")}
                            </ThemedText>
                        </TouchableOpacity>
                    </View>
                </View>
            </Pressable>
        </Modal>
    );
}

const styles = StyleSheet.create({
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
        marginBottom: 25,
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
