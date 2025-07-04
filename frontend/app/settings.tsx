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
    Modal,
    Button,
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
import useStore from "@/store/useStore";
import { Accordion } from "@/components/Accordion";
import { useLocalSearchParams } from "expo-router";

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
    const [lang, setLang] = useState("en");
    const [isAdmin, setIsAdmin] = useState("user");
    const [presetAvatars, setPresetAvatars] = useState<string[]>([]);
    const modalizeRef = React.useRef<Modalize>(null);
    const [isImportModalVisible, setIsImportModalVisible] = useState(false);
    const [htmlContent, setHtmlContent] = useState("");
    const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
    const [expansion, setExpansion] = useState(""); // New state for expansion name
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    // Estado para mostrar/ocultar contraseñas
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const setAvatarUrl = useStore((state) => state.setAvatarUrl);
    const params = useLocalSearchParams();
    // Inicializar el estado solo en el primer render según el parámetro
    const [isAccordionOpen, setIsAccordionOpen] = useState(() => params?.openAccordion === "true");
    const { theme, toggleTheme } = useTheme();

    useEffect(() => {
        navigation.setOptions({
            header: () => (
                <View
                    style={{
                        backgroundColor: Colors[theme].background,
                        height: 98,
                        flexDirection: "row",
                        alignItems: "flex-end",
                        paddingBottom: 16,
                        paddingHorizontal: 8,
                        elevation: 4,
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.25,
                        shadowRadius: 8,
                        borderBottomWidth: 0.5,
                        borderBottomColor: Colors[theme].TabBarBackground,
                    }}
                >
                    <TouchableOpacity onPress={() => navigation.goBack()} style={{ paddingLeft: 10, paddingBottom: 2 }}>
                        <Ionicons name="arrow-back" size={28} color={Colors[theme].text} />
                    </TouchableOpacity>
                    <ThemedText style={{ fontWeight: "bold", fontSize: 20, marginLeft: 16, color: Colors[theme].text }}>
                        {t("settings")}
                    </ThemedText>
                </View>
            ),
        });
    }, [navigation, theme, t]);

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
                    const { username, bio, location, region, avatar_url, lang, role } = response.data;
                    setUsername(username || "");
                    setBio(bio || "");
                    setLocation(location || "");
                    setRegion(region || "West");
                    setAvatar(avatar_url || "West");
                    setLang(lang || "en");
                    setIsAdmin(role || "user");
                    setAvatarUrl(avatar_url || ""); // Sincroniza global Zustand
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

    useEffect(() => {
        const channel = supabase
            .channel("import_progress_updates")
            .on("postgres_changes", { event: "INSERT", schema: "public", table: "import_progress" }, (payload) => {
                setImportProgress({
                    current: payload.new.current,
                    total: payload.new.total,
                });
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

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

    const handleLanguageChange = async (language: string) => {
        i18n.changeLanguage(language);
        setLang(language); // Update local state

        try {
            setIsLoading(true);
            const {
                data: { session },
            } = await supabase.auth.getSession();
            if (session && session.user) {
                await api.put(`/users/update-details?id=${session.user.id}`, {
                    lang: language,
                });
                Toast.show({
                    type: "success",
                    text1: t("language_update_success_title"),
                    text2: t("language_update_success_message"),
                    position: "bottom",
                    visibilityTime: 4000,
                    autoHide: true,
                });
            } else {
                Toast.show({
                    type: "error",
                    text1: t("language_update_error_title"),
                    text2: t("user_session_not_found"),
                    position: "bottom",
                    visibilityTime: 4000,
                    autoHide: true,
                });
            }
        } catch (error: any) {
            Toast.show({
                type: "error",
                text1: t("language_update_error_title"),
                text2: t("language_update_error_message"),
                position: "bottom",
                visibilityTime: 4000,
                autoHide: true,
            });
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
        setAvatarUrl(url); // Sincroniza global Zustand
        modalizeRef.current?.close();
    };

    const handleImportCards = async () => {
        try {
            setIsLoading(true);
            const response = await api.post("/import-cards-from-html", { html: htmlContent, expansion });
            Toast.show({
                type: "success",
                text1: t("import_success_title"),
                text2: `${response.data.message}`,
                position: "bottom",
                visibilityTime: 4000,
                autoHide: true,
            });
        } catch (error: any) {
            Toast.show({
                type: "error",
                text1: t("import_error_title"),
                text2: t("import_error_message"),
                position: "bottom",
                visibilityTime: 4000,
                autoHide: true,
            });
        } finally {
            setIsLoading(false);
            setIsImportModalVisible(false);
        }
    };

    // Cambiar contraseña con Supabase
    const handleChangePassword = async () => {
        if (!currentPassword || !newPassword || !confirmPassword) {
            Toast.show({
                type: "error",
                text1: t("password_change_error_title"),
                text2: t("password_fields_required"),
                position: "bottom",
                visibilityTime: 4000,
                autoHide: true,
            });
            return;
        }
        if (newPassword !== confirmPassword) {
            Toast.show({
                type: "error",
                text1: t("password_change_error_title"),
                text2: t("passwords_do_not_match"),
                position: "bottom",
                visibilityTime: 4000,
                autoHide: true,
            });
            return;
        }
        try {
            setIsLoading(true);
            // Supabase no requiere la contraseña actual, pero puedes verificar sesión si lo deseas
            const { error } = await supabase.auth.updateUser({ password: newPassword });
            if (error) {
                let errorMsg = error.message;
                if (errorMsg && errorMsg.toLowerCase().includes("at least one character of each")) {
                    errorMsg = t("password_policy_error");
                }
                Toast.show({
                    type: "error",
                    text1: t("password_change_error_title"),
                    text2: errorMsg,
                    position: "bottom",
                    visibilityTime: 4000,
                    autoHide: true,
                });
            } else {
                Toast.show({
                    type: "success",
                    text1: t("password_change_success_title"),
                    text2: t("password_change_success_message"),
                    position: "bottom",
                    visibilityTime: 4000,
                    autoHide: true,
                });
                setCurrentPassword("");
                setNewPassword("");
                setConfirmPassword("");
            }
        } catch (e) {
            Toast.show({
                type: "error",
                text1: t("password_change_error_title"),
                text2: t("password_change_error_message"),
                position: "bottom",
                visibilityTime: 4000,
                autoHide: true,
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            {/* Fake header para Settings, igual que SearchMenu */}
            <View
                style={{
                    backgroundColor: Colors[theme].background,
                    height: 98,
                    flexDirection: "row",
                    alignItems: "flex-end",
                    paddingBottom: 16,
                    paddingHorizontal: 8,
                    elevation: 4,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.25,
                    shadowRadius: 8,
                    borderBottomWidth: 0.5,
                    borderBottomColor: Colors[theme].TabBarBackground,
                    zIndex: 10,
                }}
            >
                <TouchableOpacity onPress={() => navigation.goBack()} style={{ paddingLeft: 10, paddingBottom: 2 }}>
                    <Ionicons name="arrow-back" size={28} color={Colors[theme].text} />
                </TouchableOpacity>
                <ThemedText style={{ fontWeight: "bold", fontSize: 20, marginLeft: 16, color: Colors[theme].text }}>
                    {t("settings")}
                </ThemedText>
            </View>
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
                        isOpen={isAccordionOpen}
                        setIsOpen={setIsAccordionOpen}
                    />

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
                        <Switch
                            value={isDarkMode}
                            onValueChange={toggleTheme}
                            thumbColor={isDarkMode ? Colors[theme].info : Colors[theme].highlight}
                        />
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

                    {/* Cambiar contraseña (Accordion) */}
                    <Accordion
                        title={
                            <View style={{ flexDirection: "row", alignItems: "center" }}>
                                <Ionicons
                                    name="lock-closed-outline"
                                    size={24}
                                    color={Colors[theme].icon}
                                    style={{ marginRight: 10, marginLeft: 0 }}
                                />
                                <ThemedText style={{ color: Colors[theme].text }}>{t("change_password")}</ThemedText>
                            </View>
                        }
                    >
                        <View
                            style={{
                                flexGrow: 1,
                                minHeight: 280,
                                width: "100%",
                                padding: 10,
                                backgroundColor: Colors[theme].TabBarBackground,
                                borderRadius: 12,
                                justifyContent: "center",
                            }}
                        >
                            {/* Input contraseña actual */}
                            <View style={{ position: "relative", marginBottom: 30 }}>
                                <TextInput
                                    style={[
                                        styles.input,
                                        {
                                            color: Colors[theme].text,
                                            borderColor: Colors[theme].backgroundSoft,
                                            backgroundColor: Colors[theme].background,
                                            width: "100%",
                                            minHeight: 44,
                                            paddingRight: 40,
                                        },
                                    ]}
                                    placeholder={t("current_password")}
                                    placeholderTextColor={theme === "dark" ? "#aaa" : "#888"}
                                    secureTextEntry={!showCurrentPassword}
                                    value={currentPassword}
                                    onChangeText={setCurrentPassword}
                                    autoCapitalize="none"
                                />
                                <TouchableOpacity
                                    style={{ position: "absolute", right: 10, top: 10 }}
                                    onPress={() => setShowCurrentPassword((v) => !v)}
                                >
                                    <Ionicons
                                        name={showCurrentPassword ? "eye-off" : "eye"}
                                        size={22}
                                        color={Colors[theme].icon}
                                    />
                                </TouchableOpacity>
                            </View>
                            {/* Input nueva contraseña */}
                            <View style={{ marginBottom: 10 }}>
                                <TextInput
                                    style={[
                                        styles.input,
                                        {
                                            color: Colors[theme].text,
                                            borderColor: Colors[theme].backgroundSoft,
                                            backgroundColor: Colors[theme].background,
                                            width: "100%",
                                            minHeight: 44,
                                            paddingRight: 40,
                                        },
                                    ]}
                                    placeholder={t("new_password")}
                                    placeholderTextColor={theme === "dark" ? "#aaa" : "#888"}
                                    secureTextEntry={!showNewPassword}
                                    value={newPassword}
                                    onChangeText={setNewPassword}
                                    autoCapitalize="none"
                                />
                                <TouchableOpacity
                                    style={{ position: "absolute", right: 10, top: 10 }}
                                    onPress={() => setShowNewPassword((v) => !v)}
                                >
                                    <Ionicons
                                        name={showNewPassword ? "eye-off" : "eye"}
                                        size={22}
                                        color={Colors[theme].icon}
                                    />
                                </TouchableOpacity>
                            </View>
                            {/* Input confirmar contraseña */}
                            <View style={{ marginBottom: 10 }}>
                                <TextInput
                                    style={[
                                        styles.input,
                                        {
                                            color: Colors[theme].text,
                                            borderColor: Colors[theme].backgroundSoft,
                                            backgroundColor: Colors[theme].background,
                                            width: "100%",
                                            minHeight: 44,
                                            paddingRight: 40,
                                        },
                                    ]}
                                    placeholder={t("confirm_new_password")}
                                    placeholderTextColor={theme === "dark" ? "#aaa" : "#888"}
                                    secureTextEntry={!showConfirmPassword}
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                    autoCapitalize="none"
                                />
                                <TouchableOpacity
                                    style={{ position: "absolute", right: 10, top: 10 }}
                                    onPress={() => setShowConfirmPassword((v) => !v)}
                                >
                                    <Ionicons
                                        name={showConfirmPassword ? "eye-off" : "eye"}
                                        size={22}
                                        color={Colors[theme].icon}
                                    />
                                </TouchableOpacity>
                            </View>
                            <TouchableOpacity
                                style={[
                                    styles.button,
                                    {
                                        backgroundColor: Colors[theme].info,
                                        marginTop: 5,
                                        marginBottom: 15,
                                        width: "100%",
                                        minHeight: 44,
                                    },
                                ]}
                                onPress={handleChangePassword}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <ActivityIndicator color={Colors[theme].tint} />
                                ) : (
                                    <ThemedText
                                        style={[
                                            styles.buttonText,
                                            { color: Colors[theme].background, fontWeight: "bold" },
                                        ]}
                                    >
                                        {t("change_password")}
                                    </ThemedText>
                                )}
                            </TouchableOpacity>
                        </View>
                    </Accordion>

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
                    {isAdmin === "admin" && (
                        <TouchableOpacity
                            style={[styles.importButton, { backgroundColor: Colors[theme].info }]}
                            onPress={() => setIsImportModalVisible(true)}
                        >
                            <Ionicons name="cloud-upload-outline" size={20} color="#FFF" />
                            <ThemedText style={styles.importText}>{t("import_cards")}</ThemedText>
                        </TouchableOpacity>
                    )}

                    <Modal
                        visible={isImportModalVisible}
                        animationType="fade"
                        transparent={true}
                        onRequestClose={() => setIsImportModalVisible(false)}
                    >
                        <View style={styles.modalContainer}>
                            <View style={[styles.modalContent, { backgroundColor: Colors[theme].background }]}>
                                <ThemedText style={[styles.modalTitle, { color: Colors[theme].text }]}>
                                    {t("paste_html_here")}
                                </ThemedText>
                                {isLoading ? (
                                    <ActivityIndicator size="large" color={Colors[theme].info} />
                                ) : (
                                    <>
                                        <TextInput
                                            style={[
                                                styles.textArea,
                                                {
                                                    borderColor: Colors[theme].tabIconDefault,
                                                    color: Colors[theme].text,
                                                },
                                            ]}
                                            multiline
                                            value={htmlContent}
                                            onChangeText={setHtmlContent}
                                            placeholder={t("html_placeholder")}
                                            placeholderTextColor={Colors[theme].tabIconDefault}
                                        />
                                        <TextInput
                                            style={[
                                                styles.textInput,
                                                {
                                                    borderColor: Colors[theme].tabIconDefault,
                                                    color: Colors[theme].text,
                                                },
                                            ]} // New TextInput for expansion
                                            value={expansion}
                                            onChangeText={setExpansion}
                                            placeholder={t("expansion_placeholder")}
                                            placeholderTextColor={Colors[theme].tabIconDefault}
                                        />
                                    </>
                                )}
                                <View style={styles.modalButtons}>
                                    <TouchableOpacity
                                        style={[styles.button, { backgroundColor: Colors[theme].error }]}
                                        onPress={() => setIsImportModalVisible(false)}
                                    >
                                        <ThemedText style={styles.buttonText}>{t("cancel")}</ThemedText>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.button, { backgroundColor: Colors[theme].info }]}
                                        onPress={handleImportCards}
                                    >
                                        <ThemedText style={styles.buttonText}>{t("import")}</ThemedText>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    </Modal>
                </View>
                {/* About Section */}
                <View style={{ alignItems: "center", marginTop: 30, marginBottom: 20, width: "100%" }}>
                    <Ionicons
                        name="information-circle-outline"
                        size={32}
                        color={Colors[theme].info}
                        style={{ marginBottom: 6 }}
                    />
                    <ThemedText
                        style={{ fontWeight: "bold", fontSize: 18, color: Colors[theme].info, marginBottom: 2 }}
                    >
                        OP-DeckBuilder
                    </ThemedText>
                    <ThemedText style={{ color: Colors[theme].textSoft, fontSize: 14, marginBottom: 2 }}>
                        v1.0.0
                    </ThemedText>
                    <ThemedText
                        style={{ color: Colors[theme].text, fontSize: 14, textAlign: "center", marginBottom: 6 }}
                    >
                        {t(
                            "about_description",
                            "Una app para gestionar y compartir tus decks de One Piece Card Game. Desarrollada por Uri."
                        )}
                    </ThemedText>
                    <TouchableOpacity
                        onPress={() => {
                            // Abre la web oficial
                            if (typeof window !== "undefined") window.open("https://oplab.app", "_blank");
                        }}
                    >
                        <ThemedText
                            style={{ color: Colors[theme].info, textDecorationLine: "underline", fontSize: 14 }}
                        >
                            oplab.app
                        </ThemedText>
                    </TouchableOpacity>
                    <ThemedText style={{ color: Colors[theme].textSoft, fontSize: 12, marginTop: 8 }}>
                        © 2025 Uri. One Piece Card Game es propiedad de Bandai.
                    </ThemedText>
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
        marginBottom: 0,
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
    buttonText: {
        fontSize: 16,
        color: "#FFF",
        fontWeight: "bold",
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
    },
    optionText: {
        fontSize: 16,
        marginLeft: 10,
    },
    button: {
        padding: 10,
        borderRadius: 8,
        alignItems: "center",
        justifyContent: "center",
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
        marginTop: 0,
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
    modalContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
    },
    modalContent: {
        width: "90%",
        padding: 20,
        borderRadius: 10,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 10,
    },
    textArea: {
        height: 150,
        borderWidth: 1,
        borderRadius: 8,
        padding: 10,
        textAlignVertical: "top",
        marginBottom: 20,
    },
    textInput: {
        height: 50,
        borderWidth: 1,
        borderRadius: 8,
        padding: 10,
        textAlignVertical: "top",
        marginBottom: 20,
    },
    modalButtons: {
        flexDirection: "row",
        justifyContent: "space-between",
    },
    progressContainer: {
        marginTop: 20,
        alignItems: "center",
    },
    progressText: {
        fontSize: 16,
    },
});
