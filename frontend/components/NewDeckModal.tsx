import React, { useState, useEffect } from "react";
import { View, TextInput, StyleSheet, Modal, TouchableOpacity, Text, FlatList, ActivityIndicator } from "react-native";
import { Colors } from "@/constants/Colors";
import { useTheme } from "@/hooks/ThemeContext";
import useApi from "@/hooks/useApi";
import { Image } from "expo-image";
import { useAuth } from "@/contexts/AuthContext";
import FlashMessage, { showMessage } from "react-native-flash-message";
import { useTranslation } from "react-i18next";

interface NewDeckModalProps {
    visible: boolean;
    onClose: () => void;
    onCreate: (leader: string, name: string, description: string) => void;
}

interface Card {
    id: string;
    images_small: string;
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
            // Aquí ahora usamos directamente selectedColors como array de colores.
            const colorsArray = selectedColors; 
            const response = await api.post("/decks", {
                userId: session?.user.id, // Obtén el user-id del contexto de autenticación
                name,
                description,
                colors: colorsArray,
                leaderCardId: leader?.id, // Añadir el ID de la carta LEADER seleccionada
            });

            if (response.status === 201) {
                onCreate(leader?.id || "", name, description);
                handleClose();
                showMessage({
                    message: t("create_deck_success"),
                    type: "success",
                });
            } else {
                console.error("Error al crear el mazo:", response.data);
                showMessage({
                    message: t("create_deck_error"),
                    type: "danger",
                });
            }
        } catch (error) {
            console.error("Error al crear el mazo:", error);
            showMessage({
                message: t("create_deck_error"),
                type: "danger",
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

    const handleColorSelect = (color: string) => {
        setSelectedColors((prevColors) => {
            if (prevColors.includes(color)) {
                return prevColors.filter((c) => c !== color); // Elimina el color si ya está seleccionado
            } else {
                return [...prevColors, color]; // Agrega el color sin límite
            }
        });
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
                    <View style={[styles.centeredView]}>
                        <View style={[styles.modalView, { backgroundColor: Colors[theme].background }]} >
                            <TouchableOpacity
                                onPress={() => setLeaderModalVisible(true)}
                                style={leader ? null : styles.leaderButton}
                            >
                                {leader ? (
                                    <Image source={{ uri: leader.images_small }} style={styles.leaderImage} />
                                ) : (
                                    <Text style={[styles.leaderButtonText, { color: Colors[theme].text }]}>
                                        {t("select_leader")}
                                    </Text>
                                )}
                            </TouchableOpacity>
                            <TextInput
                                style={[styles.input, { color: Colors[theme].text }]}
                                placeholder={t("deck_name")}
                                placeholderTextColor={Colors[theme].icon}
                                value={name}
                                onChangeText={(text) => setName(text.slice(0, 9))}
                            />
                            <TextInput
                                style={[styles.input, { color: Colors[theme].text }]}
                                placeholder={t("description_optional")}
                                placeholderTextColor={Colors[theme].icon}
                                value={description}
                                onChangeText={setDescription}
                            />
                            <TouchableOpacity style={styles.button} onPress={handleCreate}>
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
                        <View style={[styles.modalViewImages, { backgroundColor: Colors[theme].background }]}>
                            {loading ? (
                                <ActivityIndicator size="large" color={Colors[theme].text} />
                            ) : (
                                <>
                                    <View style={styles.colorFilters}>
                                        {["blue", "red", "green", "yellow", "purple", "black"].map((color) => (
                                            <TouchableOpacity
                                                key={color}
                                                style={[
                                                    styles.colorCircle,
                                                    { backgroundColor: color },
                                                    selectedColors.includes(color) && styles.selectedColorCircle,
                                                ]}
                                                onPress={() => handleColorSelect(color)}
                                            />
                                        ))}
                                    </View>
                                    <FlatList
                                        data={leaders}
                                        keyExtractor={(item) => item.id}
                                        renderItem={({ item }) => (
                                            <TouchableOpacity onPress={() => handleLeaderSelect(item)}>
                                                <Image
                                                    source={item.images_small}
                                                    style={styles.leaderImage}
                                                    contentFit="contain"
                                                    cachePolicy="memory-disk"
                                                />
                                            </TouchableOpacity>
                                        )}
                                        numColumns={3}
                                        contentContainerStyle={styles.leaderList}
                                        columnWrapperStyle={{ gap: 10 }}
                                    />
                                </>
                            )}
                        </View>
                    </View>
                </View>
            </Modal>
            <FlashMessage position="top" />
        </>
    );
}

const styles = StyleSheet.create({
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(0, 0, 0, 0.4)",
    },
    overlayTouchable: {
        ...StyleSheet.absoluteFillObject,
    },
    centeredView: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        marginTop: 22,
    },
    modalView: {
        margin: 20,
        borderRadius: 20,
        padding: 35,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    modalViewImages: {
        marginHorizontal: 0,
        marginVertical: 30,
        borderRadius: 20,
        padding: 15,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    input: {
        width: 250,
        height: 40,
        borderColor: Colors.light.icon,
        borderWidth: 1,
        borderRadius: 10,
        paddingHorizontal: 10,
        marginBottom: 15,
    },
    button: {
        backgroundColor: Colors.light.tint,
        borderRadius: 10,
        padding: 10,
        elevation: 2,
    },
    buttonText: {
        color: "white",
        fontWeight: "bold",
        textAlign: "center",
    },
    leaderButton: {
        width: 250,
        height: 40,
        borderColor: Colors.light.icon,
        borderWidth: 1,
        borderRadius: 10,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 15,
    },
    leaderButtonText: {
        fontSize: 16,
    },
    leaderImage: {
        width: 100,
        height: 145,
        borderRadius: 5,
        marginBottom: 10,
    },
    leaderList: {
        justifyContent: "center",
        alignItems: "center",
        gap: 10,
    },
    colorFilters: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 10,
    },
    colorCircle: {
        width: 30,
        height: 30,
        borderRadius: 15,
        marginHorizontal: 5,
    },
    selectedColorCircle: {
        borderWidth: 2,
        borderColor: "#fff",
    },
});
