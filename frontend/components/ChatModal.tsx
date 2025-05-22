import React, { useState, useEffect } from "react";
import { View, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from "react-native";
import { Modalize } from "react-native-modalize";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/ThemeContext";
import { Colors } from "@/constants/Colors";
import { useTranslation } from "react-i18next";
import { ActivityIndicator } from "react-native";
import useApi from "@/hooks/useApi";
import { useAuth } from "@/contexts/AuthContext";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";

// Tipos mínimos para chats, usuarios y mensajes
interface User {
    id: string;
    username: string;
    avatar_url?: string;
}

interface Chat {
    id: string;
    user1_id: string;
    user2_id: string;
    last_message?: string;
    last_sender_id?: string;
    // Añadimos el usuario del otro participante (rellenado en el service)
    other_user?: {
        id: string;
        username: string;
        avatar_url?: string;
    };
}

interface Message {
    id: string;
    chat_id: string;
    sender_id: string;
    content: string;
    created_at: string;
}

const ChatModal = React.forwardRef((props, ref) => {
    const { theme } = useTheme();
    const { t } = useTranslation();
    const api = useApi();
    const { session } = useAuth();

    // Estados principales
    const [view, setView] = useState<"chats" | "search" | "messages">("chats");
    const [chats, setChats] = useState<Chat[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<User[]>([]);
    const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(false);

    // Obtener chats al abrir modal
    useEffect(() => {
        if (view === "chats" && session?.user.id) fetchChats();
    }, [view, session?.user.id]);

    const fetchChats = async () => {
        setLoading(true);
        try {
            // El backend debe devolver other_user con username y avatar_url
            const res = await api.get(`/chats/${session?.user.id}`);
            setChats(res.data);
        } catch (e) {
            setChats([]);
        } finally {
            setLoading(false);
        }
    };

    const searchUsers = async (query: string) => {
        setLoading(true);
        try {
            const res = await api.get(`/users/search?query=${encodeURIComponent(query)}`);
            setSearchResults(res.data);
        } catch (e) {
            setSearchResults([]);
        } finally {
            setLoading(false);
        }
    };

    const openChat = async (chatOrUser: Chat | User) => {
        setLoading(true);
        try {
            let chat: Chat;
            if (isUser(chatOrUser)) {
                // Es un usuario, crear o buscar chat
                const res = await api.post("/chats", { otherUserId: chatOrUser.id });
                chat = res.data;
            } else {
                chat = chatOrUser;
            }
            setSelectedChat(chat);
            setView("messages");
            fetchMessages(chat.id);
        } catch (e) {
            setSelectedChat(null);
        } finally {
            setLoading(false);
        }
    };

    // Type guard para User (ajustado a la nueva estructura)
    function isUser(obj: any): obj is User {
        return (
            (obj as User).username !== undefined &&
            (obj as User).id !== undefined &&
            (obj as Chat).user1_id === undefined
        );
    }

    const fetchMessages = async (chatId: string) => {
        setLoading(true);
        try {
            const res = await api.get(`/chats/${chatId}/messages`);
            setMessages(res.data);
        } catch (e) {
            setMessages([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !selectedChat) return;
        setLoading(true);
        try {
            await api.post(`/chats/${selectedChat.id}/messages`, { content: newMessage });
            setNewMessage("");
            fetchMessages(selectedChat.id);
        } catch (e) {}
        setLoading(false);
    };

    // Renderizado condicional
    const renderChats = () => (
        <View style={styles.container}>
            <View style={styles.headerRowChats}>
                <ThemedText type="subtitle" style={[styles.text, { color: Colors[theme].text }]}>
                    {t("Tus chats")}
                </ThemedText>
                <TouchableOpacity
                    onPress={() => {
                        setView("search");
                        setSearchQuery("");
                        setSearchResults([]);
                    }}
                >
                    <Ionicons name="search" size={24} color={Colors[theme].tint} />
                </TouchableOpacity>
            </View>
            {loading ? (
                <ActivityIndicator color={Colors[theme].tint} />
            ) : (
                <FlatList
                    data={chats}
                    keyExtractor={(item) => item.id?.toString()}
                    renderItem={({ item }) => {
                        // El backend debe devolver item.other_user
                        const isMine = item.last_sender_id === session?.user.id;
                        return (
                            <TouchableOpacity style={[styles.chatItem, {borderColor: Colors[theme].backgroundSoft}]} onPress={() => openChat(item)}>
                                <View style={styles.avatarContainer}>
                                    {item.other_user?.avatar_url ? (
                                        <View style={styles.avatarWrapper}>
                                            <Image
                                                source={item.other_user.avatar_url}
                                                style={{ width: 40, height: 40, borderRadius: 20 }}
                                                contentFit="cover"
                                                cachePolicy="memory-disk"
                                            />
                                        </View>
                                    ) : (
                                        <View
                                            style={[
                                                styles.avatarWrapper,
                                                { backgroundColor: Colors[theme].backgroundSoft },
                                            ]}
                                        />
                                    )}
                                </View>
                                <View style={{ flex: 1 }}>
                                    <ThemedText style={{ color: Colors[theme].text, fontWeight: "bold", fontSize: 16 }}>
                                        {item.other_user?.username || t("Usuario")}
                                    </ThemedText>
                                    <ThemedText style={{ color: Colors[theme].tabIconDefault, fontSize: 13 }} numberOfLines={1}>
                                        {isMine ? (
                                            <>
                                                <ThemedText style={{ color: Colors[theme].success, fontSize: 13, fontWeight:'bold' }}>{t("you")}:</ThemedText>
                                                {` ${item.last_message}`}
                                            </>
                                        ) : (
                                            item.last_message
                                        )}
                                    </ThemedText>
                                </View>
                            </TouchableOpacity>
                        );
                    }}
                    ListEmptyComponent={
                        <ThemedText style={{ color: Colors[theme].text }}>{t("No tienes chats abiertos")}</ThemedText>
                    }
                />
            )}
        </View>
    );

    const renderSearch = () => (
        <View style={styles.container}>
            <View style={styles.headerRow}>
                <TouchableOpacity onPress={() => setView("chats")}>
                    <Ionicons name="arrow-back" size={24} color={Colors[theme].tint} />
                </TouchableOpacity>
                <TextInput
                    style={[styles.inputSearch, { color: Colors[theme].text, borderColor: Colors[theme].tint}]}
                    placeholder={t("Buscar usuario")}
                    placeholderTextColor={Colors[theme].text + "99"}
                    value={searchQuery}
                    onChangeText={(text) => {
                        setSearchQuery(text);
                        if (text.length > 1) searchUsers(text);
                        else setSearchResults([]);
                    }}
                    autoFocus
                />
            </View>
            {loading ? (
                <ActivityIndicator color={Colors[theme].tint} />
            ) : (
                <FlatList
                    data={searchResults}
                    keyExtractor={(item) => item.id?.toString()}
                    renderItem={({ item }) => (
                        <TouchableOpacity style={[styles.chatItem, {borderColor: Colors[theme].tint}]} onPress={() => openChat(item)}>
                            <ThemedText style={{ color: Colors[theme].text }}>{item.username}</ThemedText>
                        </TouchableOpacity>
                    )}
                    ListEmptyComponent={
                        searchQuery.length > 1 ? (
                            <ThemedText style={{ color: Colors[theme].text }}>
                                {t("No se encontraron usuarios")}
                            </ThemedText>
                        ) : null
                    }
                />
            )}
        </View>
    );

    const renderMessages = () => (
        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
            <View style={styles.headerRow}>
                <TouchableOpacity onPress={() => setView("chats")}>
                    <Ionicons name="arrow-back" size={24} color={Colors[theme].tint} />
                </TouchableOpacity>
                <ThemedText type="subtitle" style={[styles.text, { color: Colors[theme].text }]}>
                    {selectedChat?.other_user?.username || t("Usuario")}
                </ThemedText>
            </View>
            {loading ? (
                <ActivityIndicator color={Colors[theme].tint} />
            ) : (
                <FlatList
                    data={messages}
                    keyExtractor={(item) => item.id?.toString()}
                    renderItem={({ item }) => (
                        <View
                            style={[
                                styles.messageRow,
                                {
                                    alignSelf: item.sender_id === session?.user.id ? "flex-end" : "flex-start",
                                    backgroundColor:
                                        item.sender_id === session?.user.id
                                            ? Colors[theme].ownMessageBackground
                                            : Colors[theme].receivedMessageBackground,
                                },
                            ]}
                        >
                            <ThemedText
                                style={{ color: item.sender_id === session?.user.id ? Colors[theme].ownMessageText : Colors[theme].receivedMessageText }}
                            >
                                {item.content}
                            </ThemedText>
                        </View>
                    )}
                    contentContainerStyle={{ flexGrow: 1, justifyContent: "flex-end" }}
                    ListEmptyComponent={
                        <ThemedText style={{ color: Colors[theme].text }}>{t("No hay mensajes")}</ThemedText>
                    }
                />
            )}
            <View style={styles.inputRow}>
                <TextInput
                    style={[styles.input, { color: Colors[theme].text, borderColor: Colors[theme].tint, flex: 1 }]}
                    placeholder={t("Escribe un mensaje...")}
                    placeholderTextColor={Colors[theme].text + "99"}
                    value={newMessage}
                    onChangeText={setNewMessage}
                    onSubmitEditing={handleSendMessage}
                    returnKeyType="send"
                />
                <TouchableOpacity onPress={handleSendMessage} style={[styles.sendButton, { backgroundColor: Colors[theme].tint }]}>
                    <ThemedText style={{ color: "#fff" }}>{t("Enviar")}</ThemedText>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );

    return (
        <Modalize
            ref={ref}
            modalStyle={{ backgroundColor: Colors[theme].TabBarBackground }}
            adjustToContentHeight
            childrenStyle={{ height: 500 }}
        >
            {view === "chats" && renderChats()}
            {view === "search" && renderSearch()}
            {view === "messages" && renderMessages()}
        </Modalize>
    );
});

const styles = StyleSheet.create({
    container: {
        padding: 20,
        flex: 1,
    },
    text: {
        fontSize: 18,
    },
    headerRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "flex-start",
        gap: 10,
        marginBottom: 16,
    },
    headerRowChats: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 10,
        marginBottom: 16,
    },
    avatarContainer: {
        marginRight: 12,
        justifyContent: "center",
        alignItems: "center",
    },
    avatarWrapper: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "#ccc",
        overflow: "hidden",
    },
    chatItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 14,
        borderBottomWidth: 1,
    },
    input: {
        borderWidth: 1,
        borderRadius: 8,
        padding: 10,
        fontSize: 16,
    },
    inputSearch: {
        // borderWidth: 1,
        borderRadius: 8,
        padding: 10,
        fontSize: 16,
        marginLeft: 10,
    },
    inputRow: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 20,
    },
    sendButton: {
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
        marginLeft: 8,
    },
    messageRow: {
        marginVertical: 4,
        padding: 10,
        borderRadius: 10,
        maxWidth: "80%",
    },
});

export default ChatModal;
