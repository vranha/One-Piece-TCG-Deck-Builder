import React, { useEffect } from "react";
import {
    View,
    Switch,
    StyleSheet,
    Alert,
    TouchableOpacity,
    Image,
    ActivityIndicator,
    TextInput,
    ScrollView,
    FlatList,
    Platform,
    Dimensions,
} from "react-native";
import { useTheme } from "@/hooks/ThemeContext";
import { ThemedText } from "@/components/ThemedText";
import { Colors } from "@/constants/Colors";
import { supabase } from "@/supabaseClient";
import { useNavigation, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import useApi from "@/hooks/useApi";
import { useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import FeedbackModal from "@/components/FeedbackModal"; // Import the new modal component
import Toast from "react-native-toast-message";
import UserDetailsAccordion from "@/components/UserDetailsAccordion"; // Import the new component
import { Modalize } from "react-native-modalize";

export default function SettingsScreen() {
    const navigation = useNavigation();
    const { t, i18n } = useTranslation();
    const api = useApi();
    const [isLoading, setIsLoading] = useState(false);
    const [isEmailEnabled, setIsEmailEnabled] = useState(true);
    const [isNotificationsEnabled, setIsNotificationsEnabled] = useState(true); // Estado para notificaciones
    const [isFeedbackModalVisible, setIsFeedbackModalVisible] = useState(false); // State for modal visibility
    const [username, setUsername] = useState("");
    const [avatar, setAvatar] = useState("");
    const [bio, setBio] = useState("");
    const [location, setLocation] = useState("");
    const [region, setRegion] = useState("West");
    const [isAccordionOpen, setIsAccordionOpen] = useState(true); // State to control accordion visibility
    const [presetAvatars, setPresetAvatars] = useState<string[]>([]);
    const modalizeRef = React.useRef<Modalize>(null);

    useEffect(() => {
        navigation.setOptions({ headerShown: true, title: t("settings") });
    }, [navigation, t]);

    useEffect(() => {
        const fetchEmailPreference = async () => {
            const emailPreference = await AsyncStorage.getItem("emailPreference");
            setIsEmailEnabled(emailPreference === null || emailPreference === "true"); // Default to true
        };

        fetchEmailPreference();
    }, []);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                setIsLoading(true);
                const {
                    data: { session },
                } = await supabase.auth.getSession();
                if (session && session.user) {
                    const response = await api.get(`/me?id=${session.user.id}`);
                    const { username, bio, location, region, avatar_url } = response.data;
                    setUsername(username || "");
                    setBio(bio || "");
                    setLocation(location || "");
                    setRegion(region || "West");
                    setAvatar(avatar_url || "West");
                }
            } catch (error: any) {
                Alert.alert("Error", error.response?.data?.error || "Failed to fetch user data.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchUserData();
        // Ensure this effect runs only once
    }, []);

    useEffect(() => {
        const fetchAvatars = async () => {
            const { data, error } = await supabase.storage.from("avatars").list("presets", {
                limit: 100,
                offset: 0,
                sortBy: { column: "name", order: "asc" },
            });

            if (error) {
                console.error("Error fetching avatars:", error.message);
            } else if (!data || data.length === 0) {
                console.warn("No avatars found in the 'presets' folder.");
            } else {
                const urls = data.map(
                    (file) => supabase.storage.from("avatars").getPublicUrl(`presets/${file.name}`).data.publicUrl
                );
                setPresetAvatars(urls);
            }
        };
        fetchAvatars();
    }, []);

    const { theme, toggleTheme } = useTheme();
    const isDarkMode = theme === "dark";
    const router = useRouter();

    const handleLogout = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            Alert.alert("Error", error.message);
        } else {
            router.replace("/login");
        }
    };

    const handleLanguageChange = (language: string) => {
        i18n.changeLanguage(language);
    };

    const handleImportCards = async () => {
        setIsLoading(true);
        try {
            const response = await api.post("/import-cards");
            Alert.alert("Éxito", response.data.message);
        } catch (error: any) {
            Alert.alert("Error", error.response?.data?.error || "Error al importar cartas.");
        } finally {
            setIsLoading(false);
        }
    };

    const toggleEmailPreference = async () => {
        const newValue = !isEmailEnabled;
        setIsEmailEnabled(newValue);
        await AsyncStorage.setItem("emailPreference", newValue.toString());
    };

    const toggleNotifications = async () => {
        const newValue = !isNotificationsEnabled;
        setIsNotificationsEnabled(newValue);
        await AsyncStorage.setItem("notificationsPreference", newValue.toString());
    };

    const handleFeedback = () => {
        setIsFeedbackModalVisible(true); // Open the modal
    };

    const handleFeedbackToast = (type: "success" | "error", title: string, message: string) => {
        Toast.show({
            type,
            text1: title,
            text2: message,
            position: "bottom", // Asegúrate de que la posición sea válida
            visibilityTime: 4000, // Tiempo de visibilidad del Toast
            autoHide: true, // Asegúrate de que el Toast se oculta automáticamente
        });
    };

    const handleUpdateUserDetails = async (): Promise<boolean> => {
        try {
            setIsLoading(true);
            const {
                data: { session },
            } = await supabase.auth.getSession();
            if (session && session.user) {
                const response = await api.put(`/users/update-details?id=${session.user.id}`, {
                    username,
                    bio,
                    location,
                    region,
                    avatar_url: avatar,
                });
                Toast.show({
                    type: "success",
                    text1: t("user_details_update_success_title"),
                    text2: t("user_details_update_success_message"),
                    position: "bottom",
                    visibilityTime: 4000,
                    autoHide: true,
                });
                setIsAccordionOpen(false); // Close the accordion after success
                return true; // Indicate success
            } else {
                Toast.show({
                    type: "error",
                    text1: t("user_details_update_error_title"),
                    text2: t("user_session_not_found"),
                    position: "bottom",
                    visibilityTime: 4000,
                    autoHide: true,
                });
                return false; // Indicate failure
            }
        } catch (error: any) {
            Toast.show({
                type: "error",
                text1: t("user_details_update_error_title"),
                text2: t("user_details_update_error_message"),
                position: "bottom",
                visibilityTime: 4000,
                autoHide: true,
            });
            return false; // Indicate failure
        } finally {
            setIsLoading(false);
        }
    };

    const openAvatarModal = () => {
        modalizeRef.current?.open();
    };

    const selectAvatar = (url: string) => {
        setAvatar(url);
        modalizeRef.current?.close();
    };

    return (
        <>
            <ScrollView contentContainerStyle={{ flexGrow: 1, backgroundColor: Colors[theme].background }}>
                <View style={[styles.container, { backgroundColor: Colors[theme].background }]}>
                    {/* User Details Accordion */}
                    <UserDetailsAccordion
                        username={username}
                        setUsername={setUsername}
                        bio={bio}
                        setBio={setBio}
                        location={location}
                        setLocation={setLocation}
                        region={region}
                        setRegion={setRegion}
                        avatar={avatar}
                        setAvatar={setAvatar}
                        handleUpdateUserDetails={handleUpdateUserDetails}
                        theme={theme}
                        t={t}
                        openAvatarModal={openAvatarModal} // Pass the new prop
                    />

                    {/* Selección de Idioma */}
                    <View style={[styles.card, { backgroundColor: Colors[theme].TabBarBackground }]}>
                        <View style={styles.row}>
                            <Ionicons name="language" size={24} color={Colors[theme].icon} />
                            <ThemedText style={[styles.optionText, { color: Colors[theme].text }]}>
                                {t("language")}
                            </ThemedText>
                        </View>
                        <View style={styles.languageContainer}>
                            <TouchableOpacity
                                style={[
                                    styles.languageOption,
                                    i18n.language === "en" ? styles.activeLanguage : styles.inactiveLanguage,
                                ]}
                                onPress={() => handleLanguageChange("en")}
                            >
                                <Image source={require("../assets/flags/en.png")} style={styles.flag} />
                                <ThemedText style={styles.languageText}>English</ThemedText>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[
                                    styles.languageOption,
                                    i18n.language === "es" ? styles.activeLanguage : styles.inactiveLanguage,
                                ]}
                                onPress={() => handleLanguageChange("es")}
                            >
                                <Image source={require("../assets/flags/es.png")} style={styles.flag} />
                                <ThemedText style={styles.languageText}>Español</ThemedText>
                            </TouchableOpacity>
                        </View>
                    </View>
                    {/* Modo Oscuro */}
                    <View style={[styles.card, { backgroundColor: Colors[theme].TabBarBackground }]}>
                        <View style={styles.row}>
                            <Ionicons name={isDarkMode ? "moon" : "sunny"} size={24} color={Colors[theme].icon} />
                            <ThemedText style={[styles.optionText, { color: Colors[theme].text }]}>
                                {t("light/dark_mode")}
                            </ThemedText>
                        </View>
                        <Switch value={isDarkMode} onValueChange={toggleTheme} thumbColor={isDarkMode ? Colors[theme].info : Colors[theme].highlight}/>
                        
                    </View>

                    {/* Preferencia de Email */}
                    <View style={[styles.card, { backgroundColor: Colors[theme].TabBarBackground }]}>
                        <View style={styles.row}>
                            <Ionicons name="mail-outline" size={24} color={Colors[theme].icon} />
                            <ThemedText style={[styles.optionText, { color: Colors[theme].text }]}>
                                {t("send_email_on_copy")}
                            </ThemedText>
                        </View>
                        <Switch
                            value={isEmailEnabled}
                            onValueChange={toggleEmailPreference}
                            thumbColor={isEmailEnabled ? Colors[theme].info : Colors[theme].disabled}
                        />
                    </View>
                    {/* Gestión de Notificaciones */}
                    <View style={[styles.card, { backgroundColor: Colors[theme].TabBarBackground }]}>
                        <View style={styles.row}>
                            <Ionicons name="notifications-outline" size={24} color={Colors[theme].icon} />
                            <ThemedText style={[styles.optionText, { color: Colors[theme].text }]}>
                                {t("notifications")}
                            </ThemedText>
                        </View>
                        <Switch
                            value={isNotificationsEnabled}
                            onValueChange={toggleNotifications}
                            thumbColor={isNotificationsEnabled ? Colors[theme].info : Colors[theme].disabled}
                        />
                    </View>

                    {/* Botón de Soporte y Feedback */}
                    <TouchableOpacity
                        style={[styles.feedbackButton, { backgroundColor: Colors[theme].TabBarBackground }]}
                        onPress={handleFeedback}
                    >
                        <Ionicons name="chatbox-ellipses-outline" size={30} color={Colors[theme].info} />
                        <ThemedText style={[styles.feedbackText, { color: Colors[theme].text }]}>
                            {t("send_feedback")}
                        </ThemedText>
                    </TouchableOpacity>

                    {/* Botón de Logout */}
                    <TouchableOpacity
                        style={[styles.logoutButton, { backgroundColor: Colors[theme].error }]}
                        onPress={handleLogout}
                    >
                        <Ionicons name="log-out-outline" size={20} color={Colors[theme].text} />
                        <ThemedText style={styles.logoutText}>{t("logout")}</ThemedText>
                    </TouchableOpacity>

                    <FeedbackModal
                        visible={isFeedbackModalVisible}
                        onClose={() => setIsFeedbackModalVisible(false)} // Close the modal
                        t={t} // Pass the translation function to the modal
                        showToast={handleFeedbackToast} // Pass the Toast handler to the modal
                    />
                </View>
            </ScrollView>
            <Modalize
                ref={modalizeRef}
                modalHeight={
                    Platform.OS === "ios"
                        ? 0.75 * Dimensions.get("screen").height
                        : 0.75 * Dimensions.get("window").height
                }
                avoidKeyboardLikeIOS={true}
                keyboardAvoidingBehavior={Platform.OS === "ios" ? undefined : "height"}
                handleStyle={{
                    backgroundColor: Colors[theme].backgroundSoft,
                    height: 6,
                    width: 60,
                    borderRadius: 3,
                    alignSelf: "center",
                    marginVertical: 10,
                }}
                modalStyle={{
                    backgroundColor: Colors[theme].background,
                    borderTopLeftRadius: 20,
                    borderTopRightRadius: 20,
                    padding: 15,
                }}
                flatListProps={{
                    data: presetAvatars,
                    keyExtractor: (item, index) => index.toString(),
                    numColumns: 3,
                    renderItem: ({ item }) => (
                        <TouchableOpacity onPress={() => selectAvatar(item)} style={{ margin: 10 }}>
                            <Image source={{ uri: item }} style={styles.presetAvatar} />
                        </TouchableOpacity>
                    ),
                    contentContainerStyle: { paddingBottom: 20, alignItems: "center" },
                }}
            ></Modalize>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 50,
    },
    card: {
        width: "100%",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 15,
        borderRadius: 12,
        marginBottom: 20,
        elevation: 2,
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
    },
    optionText: {
        fontSize: 16,
        marginLeft: 10,
    },
    languageContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    languageOption: {
        alignItems: "center",
        marginHorizontal: 10,
    },
    activeLanguage: {
        opacity: 1,
    },
    inactiveLanguage: {
        opacity: 0.5,
    },
    flag: {
        width: 40,
        height: 30,
        marginBottom: 5,
    },
    languageText: {
        fontSize: 14,
    },
    importButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        padding: 15,
        borderRadius: 12,
        marginTop: 20,
    },
    importText: {
        color: "#FFF",
        fontSize: 16,
        marginLeft: 10,
    },
    logoutButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        padding: 15,
        borderRadius: 12,
        marginTop: 20,
        marginBottom: 50,
    },
    logoutText: {
        color: "#FFF",
        fontSize: 16,
        marginLeft: 10,
    },
    feedbackButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        width: "70%",
        padding: 15,
        borderRadius: 12,
        marginTop: 20,
    },
    feedbackText: {
        fontSize: 16,
        marginLeft: 10,
    },
    inputContainer: {
        marginBottom: 15,
    },
    label: {
        fontSize: 14,
        fontWeight: "bold",
        marginBottom: 5,
    },
    input: {
        borderWidth: 1,
        borderRadius: 8,
        padding: 10,
        fontWeight: "bold",
    },
    presetAvatar: {
        width: 80,
        height: 80,
        margin: 5,
        borderRadius: 40,
    },
});
