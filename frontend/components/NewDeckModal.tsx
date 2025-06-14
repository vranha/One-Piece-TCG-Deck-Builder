import React, { useState, useEffect } from "react";
import { View, TextInput, StyleSheet, Modal, TouchableOpacity, Text, FlatList, ActivityIndicator } from "react-native";
import { Colors } from "@/constants/Colors";
import { useTheme } from "@/hooks/ThemeContext";
import useApi from "@/hooks/useApi";
import { Image } from "expo-image";
import { useAuth } from "@/contexts/AuthContext";
import Toast from "react-native-toast-message";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";

interface NewDeckModalProps {
    visible: boolean;
    onClose: () => void;
    onCreate: (leader: string, name: string, description: string) => void;
}

interface Card {
    id: string;
    images_small: string;
    images_thumb: string;
    name: string;
    color: string;
}

export default function NewDeckModal({ visible, onClose, onCreate }: NewDeckModalProps) {
    const { theme } = useTheme();
    const api = useApi();
    const { session } = useAuth();
    const { t } = useTranslation();
    const [leader, setLeader] = useState<Card | null>(null);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [leaderModalVisible, setLeaderModalVisible] = useState(false);
    const [leaders, setLeaders] = useState<Card[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedColors, setSelectedColors] = useState<string[]>([]);

    const handleCreate = async () => {
        try {
            console.log("Selected Colors:", selectedColors); // Verifica los colores seleccionados
            console.log("Leader:", leader); // Verifica el líder seleccionado
            // Aquí ahora usamos directamente selectedColors como array de colores.
            const colorsArray = selectedColors;
            const response = await api.post("/decks", {
                userId: session?.user.id, // Obtén el user-id del contexto de autenticación
                name,
                description,
                colors: leader?.color,
                leaderCardId: leader?.id, // Añadir el ID de la carta LEADER seleccionada
            });

            if (response.status === 201) {
                onCreate(leader?.id || "", name, description);
                handleClose();
                Toast.show({
                    type: "success",
                    text1: t("create_deck_success"),
                });
            } else {
                console.error("Error al crear el mazo:", response.data);
                Toast.show({
                    type: "error",
                    text1: t("create_deck_error"),
                });
            }
        } catch (error) {
            console.error("Error al crear el mazo:", error);
            Toast.show({
                type: "error",
                text1: t("create_deck_error"),
            });
        }
    };

    const handleClose = () => {
        setLeader(null);
        setName("");
        setDescription("");
        setSelectedColors([]);
        onClose();
    };

    const fetchLeaders = async (colors: string[]) => {
        setLoading(true);
        try {
            // Si hay colores seleccionados, construir la query
            let colorQuery = "";
            if (colors.length === 1) {
                // Si solo hay un color, usarlo directamente en la query
                colorQuery = `color=${colors[0]}`;
            } else if (colors.length > 1) {
                // Si hay más de un color, incluirlos todos en la query
                colorQuery = `colors=${colors.join(",")}`;
            }

            const response = await api.get(`/cards?type=LEADER&limit=1000&${colorQuery}`);
            setLeaders(response.data.data);
        } catch (error: any) {
            console.error("Error fetching leaders:", error.response?.data || error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (leaderModalVisible) {
            fetchLeaders(selectedColors);
        }
    }, [leaderModalVisible, selectedColors]);

    const handleLeaderSelect = (selectedLeader: Card) => {
        setLeader(selectedLeader);
        setLeaderModalVisible(false);
    };

    const handleLeaderDeselect = () => {
        setLeader(null);
    };

    const handleColorSelect = (color: string) => {
        setSelectedColors([color]); // Replace the previous color with the new one
    };

    const capitalizeFirstLetter = (string: string) => {
        return string.charAt(0).toUpperCase() + string.slice(1);
    };

    return (
        <>
            <Modal
                presentationStyle="overFullScreen"
                animationType="fade"
                transparent={true}
                visible={visible}
                onRequestClose={handleClose}
            >
                <View style={styles.overlay}>
                    <TouchableOpacity style={styles.overlayTouchable} activeOpacity={1} onPress={handleClose} />
                    <View style={[styles.centeredView]} pointerEvents="box-none">
                        <View style={[styles.modalView, { backgroundColor: Colors[theme].TabBarBackground }]}>
                            <TouchableOpacity
                                onPress={() => setLeaderModalVisible(true)}
                                style={
                                    leader
                                        ? styles.leaderSelectedContainer
                                        : [styles.leaderButton, { borderColor: Colors[theme].icon }]
                                }
                            >
                                {leader ? (
                                    <View style={styles.leaderSelected}>
                                        <Image source={{ uri: leader.images_thumb }} style={styles.leaderImage} />
                                        <TouchableOpacity
                                            onPress={handleLeaderDeselect}
                                            style={[
                                                styles.deselectButton,
                                                { backgroundColor: Colors[theme].TabBarBackground },
                                            ]}
                                        >
                                            <Ionicons name="close-circle" size={28} color={Colors[theme].tint} />
                                        </TouchableOpacity>
                                    </View>
                                ) : (
                                    <Text style={[styles.leaderButtonText, { color: Colors[theme].text }]}>
                                        {t("select_leader")}
                                    </Text>
                                )}
                            </TouchableOpacity>
                            <TextInput
                                style={[
                                    styles.input,
                                    {
                                        color: Colors[theme].text,
                                        borderColor: Colors[theme].background,
                                        backgroundColor: Colors[theme].backgroundSoft,
                                    },
                                ]}
                                placeholder={t("deck_name")}
                                placeholderTextColor={Colors[theme].tabIconDefault}
                                value={name}
                                onChangeText={(text) => setName(text.slice(0, 15))}
                            />
                            <TextInput
                                style={[
                                    styles.input,
                                    {
                                        color: Colors[theme].text,
                                        borderColor: Colors[theme].background,
                                        backgroundColor: Colors[theme].backgroundSoft,
                                    },
                                ]}
                                placeholder={t("description_optional")}
                                placeholderTextColor={Colors[theme].tabIconDefault}
                                value={description}
                                onChangeText={setDescription}
                            />
                            <TouchableOpacity
                                style={[styles.button, { backgroundColor: Colors[theme].info }]}
                                onPress={handleCreate}
                            >
                                <Text style={styles.buttonText}>{t("create_deck")}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            <Modal
                animationType="fade"
                transparent={true}
                visible={leaderModalVisible}
                onRequestClose={() => setLeaderModalVisible(false)}
            >
                <View style={styles.overlay}>
                    <TouchableOpacity
                        style={styles.overlayTouchable}
                        activeOpacity={1}
                        onPress={() => setLeaderModalVisible(false)}
                    />
                    <View style={[styles.centeredView]}>
                        <View
                            style={[
                                styles.modalViewImages,
                                { backgroundColor: Colors[theme].background, maxHeight: "80%" },
                            ]}
                        >
                            <View style={{ height: "100%", justifyContent: "center", alignItems: "center" }}>
                                {loading ? (
                                    <ActivityIndicator size="large" color={Colors[theme].text} />
                                ) : (
                                    <>
                                        <View style={styles.colorFilters}>
                                            {["blue", "red", "green", "yellow", "purple", "black"].map((color) => (
                                                <TouchableOpacity
                                                    key={color}
                                                    style={[
                                                        styles.colorCircleContainer,
                                                        { borderColor: Colors[theme].backgroundSoft },
                                                        selectedColors.includes(color)
                                                            ? [
                                                                  styles.selectedColorCircle,
                                                                  { borderColor: Colors[theme].text },
                                                              ]
                                                            : "",
                                                    ]}
                                                    onPress={() => handleColorSelect(color)}
                                                >
                                                    <View style={[styles.colorCircle, { backgroundColor: color }]} />
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                        <FlatList
                                            data={leaders}
                                            keyExtractor={(item) => item.id}
                                            renderItem={({ item }) => (
                                                <TouchableOpacity onPress={() => handleLeaderSelect(item)}>
                                                    <Image
                                                        source={item.images_thumb}
                                                        style={styles.leaderImage}
                                                        contentFit="contain"
                                                        cachePolicy="memory-disk"
                                                    />
                                                </TouchableOpacity>
                                            )}
                                            numColumns={3}
                                            contentContainerStyle={styles.leaderList}
                                            columnWrapperStyle={{ justifyContent: "space-between", gap: 10 }}
                                        />
                                    </>
                                )}
                            </View>
                        </View>
                    </View>
                </View>
            </Modal>
            <Toast />
        </>
    );
}

const styles = StyleSheet.create({
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(0, 0, 0, 0.6)", // Fondo más oscuro para mayor contraste
    },
    overlayTouchable: {
        ...StyleSheet.absoluteFillObject,
    },
    centeredView: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 20, // Espaciado adicional para evitar bordes
    },
    modalView: {
        width: "90%",
        borderRadius: 20,
        padding: 25,
        alignItems: "center",
        backgroundColor: Colors.light.background,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 8,
    },
    modalViewImages: {
        width: "90%",
        borderRadius: 20,
        padding: 20,
        alignItems: "center",
        backgroundColor: Colors.light.backgroundSoft,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 8,
    },
    input: {
        width: "100%",
        height: 50,

        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 15,
        marginBottom: 20,

        fontSize: 16,
        color: Colors.light.text,
    },
    button: {
        width: "100%",
        borderRadius: 12,
        paddingVertical: 12,
        alignItems: "center",
        elevation: 3,
    },
    buttonText: {
        color: "#fff",
        fontWeight: "bold",
        fontSize: 16,
    },
    leaderButton: {
        width: "100%",
        height: 50,
        borderWidth: 1,
        borderRadius: 12,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 20,
    },
    leaderButtonText: {
        fontSize: 16,
        fontWeight: "bold",
    },
    leaderList: {
        justifyContent: "center",
        alignItems: "center",
        gap: 15,
        paddingBottom: 10, // Added padding for better spacing
    },
    colorFilters: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 15,
    },
    colorCircle: {
        width: 24,
        height: 24,
        borderRadius: 15,
    },
    colorCircleContainer: {
        padding: 2,
        borderWidth: 2,
        borderRadius: 25,
        marginHorizontal: 5,
    },
    selectedColorCircle: {
        borderWidth: 2,
    },
    leaderSelectedContainer: {
        marginVertical: 20,
    },
    leaderSelected: {
        position: "relative", // Contenedor relativo para posicionar el botón
        alignItems: "center",
        justifyContent: "center",
    },
    leaderImage: {
        width: 80, // Adjusted width for better fit
        height: 110, // Adjusted height for better fit
        borderRadius: 10,
    },
    deselectButton: {
        position: "absolute", // Superpone el botón sobre la imagen
        top: -10, // Ajusta la posición vertical
        right: -10, // Ajusta la posición horizontal
        borderRadius: 50,
        padding: 0,
    },
});
