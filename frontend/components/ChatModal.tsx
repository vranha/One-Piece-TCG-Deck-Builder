import React, { useState, useEffect, useRef } from "react";
import { View, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Keyboard } from "react-native";
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
import { supabase } from "../supabaseClient";
import useStore from "@/store/useStore";
import { FlashList } from "@shopify/flash-list";

// Tipos mínimos para chats, usuarios y mensajes
interface User {
    id: string;
    username: string;
    avatar_url?: string;
    isFriend?: boolean; // <-- Añadido para soporte de badge
}

interface Chat {
    id: string;
    user1_id: string;
    user2_id: string;
    last_message?: string;
    last_sender_id?: string;
    user1_read?: boolean;
    user2_read?: boolean;
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
    const setHasUnreadChats = useStore((state) => state.setHasUnreadChats || (() => {}));

    // Estados principales
    const [view, setView] = useState<"chats" | "search" | "messages">("chats");
    const [chats, setChats] = useState<Chat[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<User[]>([]);
    const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [pendingUser, setPendingUser] = useState<User | null>(null); // Nuevo estado para chat vacío
    const [justOpenedChat, setJustOpenedChat] = useState(false);
    const flashListRef = useRef<FlashList<Message>>(null);
    // Ref para Modalize (asegura acceso correcto)
    const modalizeRef = ref || useRef(null);

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
            // Pasar el userId en la ruta
            const res = await api.get(`/users/search/${session?.user.id}?query=${encodeURIComponent(query)}`);
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
            let chat: Chat | null = null;
            if (isUser(chatOrUser)) {
                // No crear chat aún, solo abrir UI vacía
                setPendingUser(chatOrUser);
                setSelectedChat(null);
                setMessages([]);
                setView("messages");
                setJustOpenedChat(true); // <-- Scroll al abrir chat nuevo
                setLoading(false);
                return;
            } else {
                chat = chatOrUser;
            }
            // Marcar como leído si es un chat existente, pero nunca bloquear la apertura
            if (chat) {
                try {
                    await api.post(`/chats/${chat.id}/read`, { userId: session?.user.id });
                } catch (e) {
                    // No bloquear la apertura del chat si hay error
                    console.error("Error marcando chat como leído:", e);
                }
            }
            setSelectedChat(chat);
            setPendingUser(null);
            setView("messages");
            setJustOpenedChat(true); // <-- Scroll al abrir chat existente
            fetchMessages(chat.id);
            // Quitar el rojo del icono si ya no hay chats no leídos
            setHasUnreadChats(false);
        } catch (e) {
            setSelectedChat(null);
            setPendingUser(null);
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

    const fetchMessages = async (chatId: string, showLoading = true) => {
        if (showLoading) setLoading(true);
        try {
            const res = await api.get(`/chats/${chatId}/messages`);
            setMessages(res.data);
        } catch (e) {
            setMessages([]);
        } finally {
            if (showLoading) setLoading(false);
        }
    };

    const handleSendMessage = async () => {
        if (!newMessage.trim() || (!selectedChat && !pendingUser) || !session?.user.id) return;
        try {
            let chatId = selectedChat?.id;
            // Si es un chat nuevo (aún no existe), crearlo primero
            if (!chatId && pendingUser) {
                const res = await api.post("/chats", { userId: session.user.id, otherUserId: pendingUser.id });
                const chat = res.data;
                setSelectedChat(chat);
                setPendingUser(null);
                chatId = chat.id;
                await new Promise((resolve) => setTimeout(resolve, 100));
            }
            if (!chatId) return; // Fallback
            await api.post(`/chats/${chatId}/messages`, {
                content: newMessage,
                sender_id: session.user.id,
                chat_id: chatId,
            });
            setNewMessage("");
            fetchMessages(chatId, false);
        } catch (e) {
            // Puedes mostrar un toast de error aquí si quieres
        }
    };

    // Suscripción realtime a nuevos mensajes
    useEffect(() => {
        if (view !== "messages" || !selectedChat) return;
        // Suscribirse solo a mensajes nuevos de este chat
        const channel = supabase
            .channel(`chat-messages-${selectedChat.id}`)
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "messages",
                    filter: `chat_id=eq.${selectedChat.id}`,
                },
                (payload) => {
                    // Asegura que el payload tiene la forma de Message
                    const newMsg = payload.new as Message;
                    setMessages((prev) => {
                        if (prev.some((m) => m.id === newMsg.id)) return prev;
                        return [...prev, newMsg];
                    });
                }
            )
            .subscribe();
        return () => {
            supabase.removeChannel(channel);
        };
    }, [view, selectedChat]);

    // Suscripción realtime a cambios en la tabla de chats (para previews y último mensaje)
    useEffect(() => {
        if (view !== "chats" || !session?.user.id) return;
        // Suscribirse a INSERT y UPDATE en la tabla chats donde el usuario es user1 o user2
        const channel = supabase
            .channel(`user-chats-${session.user.id}`)
            .on(
                "postgres_changes",
                {
                    event: "*", // INSERT y UPDATE
                    schema: "public",
                    table: "chats",
                    filter: `user1_id=eq.${session.user.id}`,
                },
                (payload) => {
                    fetchChats();
                }
            )
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "chats",
                    filter: `user2_id=eq.${session.user.id}`,
                },
                (payload) => {
                    fetchChats();
                }
            )
            .subscribe();
        return () => {
            supabase.removeChannel(channel);
        };
    }, [view, session?.user.id]);

    // Actualiza el estado global de chats sin leer cada vez que se actualizan los chats
    useEffect(() => {
        if (!session?.user.id) return;
        // Considera como no leído si hay algún chat con user1_read/user2_read en false para el usuario actual
        const hasUnread = chats.some(
            (chat) =>
                (chat.user1_id === session.user.id && chat.user1_read === false) ||
                (chat.user2_id === session.user.id && chat.user2_read === false)
        );
        setHasUnreadChats(hasUnread);
    }, [chats, setHasUnreadChats, session?.user.id]);

    // Scroll automático SOLO al abrir el chat
    useEffect(() => {
        if (view === "messages" && justOpenedChat && messages.length > 0) {
            setTimeout(() => {
                try {
                    flashListRef.current?.scrollToIndex({
                        index: messages.length - 1,
                        animated: false,
                    });
                } catch (e) {}
                setJustOpenedChat(false);
            }, 100);
        }
    }, [view, messages, justOpenedChat]);

    // Lanzar búsqueda de usuarios al entrar en la vista de búsqueda
    useEffect(() => {
        if (view === "search") {
            searchUsers("");
        }
    }, [view]);

    // Efecto para restaurar el alto del modal al cerrar el teclado o al abrir el modal
    useEffect(() => {
        const setHeight = () => {
            const modalRefObj = modalizeRef as React.MutableRefObject<any>;
            if (modalRefObj && modalRefObj.current && modalRefObj.current.setModalHeight) {
                modalRefObj.current.setModalHeight(600); // Ajusta si usas otro alto
            }
        };
        const sub = Keyboard.addListener("keyboardDidHide", setHeight);
        return () => sub.remove();
    }, []);

    // Forzar altura al abrir el modal
    const handleModalOpen = () => {
        const modalRefObj = modalizeRef as React.MutableRefObject<any>;
        if (modalRefObj && modalRefObj.current && modalRefObj.current.setModalHeight) {
            modalRefObj.current.setModalHeight(600);
        }
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
                <View style={{ flex: 1, justifyContent: "center", alignItems: "center", minHeight: 500 }}>
                    <ActivityIndicator size="large" color={Colors[theme].tint} />
                </View>
            ) : (
                <FlashList
                    data={chats}
                    keyExtractor={(item) => item.id?.toString()}
                    renderItem={({ item }) => {
                        // El backend debe devolver item.other_user
                        const isMine = item.last_sender_id === session?.user.id;
                        // Determina si el chat está leído para el usuario actual
                        const isUnread =
                            (item.user1_id === session?.user.id && item.user1_read === false) ||
                            (item.user2_id === session?.user.id && item.user2_read === false);
                        return (
                            <TouchableOpacity
                                style={[styles.chatItem, { borderColor: Colors[theme].backgroundSoft }]}
                                onPress={() => openChat(item)}
                            >
                                <View style={styles.avatarContainer}>
                                    {item.other_user?.avatar_url ? (
                                        <Image
                                            source={item.other_user.avatar_url}
                                            style={{ width: 40, height: 40, borderRadius: 20 }}
                                            contentFit="cover"
                                            cachePolicy="memory-disk"
                                        />
                                    ) : (
                                        <View style={styles.avatarWrapper} />
                                    )}
                                </View>
                                <View style={{ flex: 1 }}>
                                    <ThemedText style={{ fontWeight: "bold", color: Colors[theme].text }}>
                                        {item.other_user?.username || "Usuario"}
                                    </ThemedText>
                                    <ThemedText
                                        style={[
                                            styles.lastMessage,
                                            isUnread && { color: Colors[theme].tint, fontWeight: "bold" },
                                        ]}
                                        numberOfLines={1}
                                    >
                                        {item.last_message}
                                    </ThemedText>
                                </View>
                                {isUnread && (
                                    <View
                                        style={{
                                            width: 12,
                                            height: 12,
                                            borderRadius: 6,
                                            backgroundColor: Colors[theme].tint,
                                            marginLeft: 10,
                                        }}
                                    />
                                )}
                            </TouchableOpacity>
                        );
                    }}
                    contentContainerStyle={{ paddingBottom: 20 }}
                    estimatedItemSize={72}
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
                    style={[styles.inputSearch, { color: Colors[theme].text, borderColor: Colors[theme].tint }]}
                    placeholder={t("Buscar usuario")}
                    placeholderTextColor={Colors[theme].text + "99"}
                    value={searchQuery}
                    onChangeText={(text) => {
                        setSearchQuery(text);
                        searchUsers(text); // Siempre busca, aunque sea vacío o una letra
                    }}
                />
            </View>
            {loading ? (
                <View style={{ flex: 1, justifyContent: "center", alignItems: "center", minHeight: 500 }}>
                    <ActivityIndicator size="large" color={Colors[theme].tint} />
                </View>
            ) : (
                <FlashList
                    data={searchResults}
                    keyExtractor={(item) => item.id?.toString()}
                    renderItem={({ item }) => {
                        return (
                            <TouchableOpacity style={styles.userCard} onPress={() => openChat(item)}>
                                {item.avatar_url ? (
                                    <Image
                                        source={item.avatar_url}
                                        style={styles.userAvatar}
                                        contentFit="cover"
                                        cachePolicy="memory-disk"
                                    />
                                ) : (
                                    <View style={[styles.avatarWrapper, styles.userAvatar]} />
                                )}
                                <View style={styles.userInfoContainer}>
                                    <ThemedText style={styles.userName}>{item.username}</ThemedText>
                                </View>
                                {item.isFriend && (
                                    <View style={styles.friendBadge}>
                                        <ThemedText style={styles.friendBadgeText}>Amigo</ThemedText>
                                    </View>
                                )}
                            </TouchableOpacity>
                        );
                    }}
                    contentContainerStyle={{ paddingBottom: 20 }}
                    estimatedItemSize={60}
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

    // Renderizado condicional para la vista de mensajes
    const renderMessages = () => {
        // Si pendingUser está definido, es un chat vacío
        if (pendingUser) {
            return <View style={{ flex: 1, minHeight: 0, flexGrow: 1, flexShrink: 1 }} />;
        }

        // Filtrar mensajes undefined/null para evitar errores
        const safeMessages = Array.isArray(messages)
            ? messages.filter((m) => m && typeof m === "object" && m.id && m.content && m.sender_id)
            : [];

        // Si no hay chat seleccionado y no hay pendingUser, no renderizar FlashList
        if (!selectedChat && !pendingUser) {
            return (
                <View
                    style={{
                        flex: 1,
                        minHeight: 0,
                        flexGrow: 1,
                        flexShrink: 1,
                        justifyContent: "center",
                        alignItems: "center",
                    }}
                >
                    <ThemedText style={{ color: Colors[theme].text }}>{t("No hay chat seleccionado")}</ThemedText>
                </View>
            );
        }

        // Siempre pasar un array a FlashList y asegurar flex: 1 y minHeight: 0
        return (
            <View style={{ flex: 1, minHeight: 0, flexGrow: 1, flexShrink: 1 }}>
                <FlashList
                    ref={flashListRef}
                    data={safeMessages}
                    keyExtractor={(item) => item.id?.toString?.() || Math.random().toString()}
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
                                style={{
                                    color:
                                        item.sender_id === session?.user.id
                                            ? Colors[theme].ownMessageText
                                            : Colors[theme].receivedMessageText,
                                }}
                            >
                                {item.content}
                            </ThemedText>
                        </View>
                    )}
                    contentContainerStyle={{
                        paddingHorizontal: 12,
                        paddingBottom: 16,
                        paddingTop: 8,
                    }}
                    ListEmptyComponent={
                        <ThemedText style={{ color: Colors[theme].text }}>{t("No hay mensajes")}</ThemedText>
                    }
                    keyboardShouldPersistTaps="handled"
                    estimatedItemSize={80}
                    scrollEnabled={true}
                    onLayout={() => {
                        // Forzar scroll al final solo al abrir el chat
                        if (justOpenedChat && safeMessages.length > 0) {
                            setTimeout(() => {
                                try {
                                    if (flashListRef.current && flashListRef.current.scrollToIndex) {
                                        flashListRef.current.scrollToIndex({
                                            index: safeMessages.length - 1,
                                            animated: false,
                                        });
                                    }
                                } catch (e) {}
                                setJustOpenedChat(false);
                            }, 0);
                        }
                    }}
                />
            </View>
        );
    };

    return (
        <Modalize
            ref={modalizeRef}
            adjustToContentHeight={false}
            modalHeight={600}
            disableScrollIfPossible={true}
            modalStyle={{ backgroundColor: Colors[theme].TabBarBackground }}
            onOpen={handleModalOpen}
            onClose={() => setView("chats")}
            HeaderComponent={
                view === "messages" && (
                    <View
                        style={{
                            flexDirection: "row",
                            alignItems: "center",
                            paddingHorizontal: 16,
                            paddingVertical: 12,
                            backgroundColor: Colors[theme].TabBarBackground,
                            borderBottomWidth: 1,
                            borderBottomColor: Colors[theme].backgroundSoft ?? Colors[theme].text + "10",
                            gap: 12,
                        }}
                    >
                        <TouchableOpacity
                            onPress={() => setView("chats")}
                            style={{
                                padding: 6,
                                borderRadius: 100,
                            }}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <Ionicons name="arrow-back" size={24} color={Colors[theme].tint} />
                        </TouchableOpacity>
                        {selectedChat?.other_user?.avatar_url || pendingUser?.avatar_url ? (
                            <Image
                                source={selectedChat?.other_user?.avatar_url || pendingUser?.avatar_url}
                                style={{ width: 36, height: 36, borderRadius: 18 }}
                                contentFit="cover"
                                cachePolicy="memory-disk"
                            />
                        ) : (
                            <View
                                style={{
                                    width: 36,
                                    height: 36,
                                    borderRadius: 18,
                                    backgroundColor: Colors[theme].backgroundSoft,
                                }}
                            />
                        )}
                        <ThemedText
                            type="subtitle"
                            style={{
                                fontSize: 18,
                                fontWeight: "600",
                                color: Colors[theme].text,
                                flexShrink: 1,
                            }}
                            numberOfLines={1}
                            ellipsizeMode="tail"
                        >
                            {selectedChat?.other_user?.username || pendingUser?.username || t("Usuario")}
                        </ThemedText>
                    </View>
                )
            }
            FooterComponent={
                view === "messages" && (
                    <View
                        style={{
                            paddingHorizontal: 16,
                            paddingVertical: 12,
                            backgroundColor: Colors[theme].TabBarBackground,
                            flexDirection: "row",
                            alignItems: "center",
                            borderTopWidth: 1,
                            borderTopColor: Colors[theme].backgroundSoft ?? Colors[theme].text + "10",
                            gap: 8,
                        }}
                    >
                        <TextInput
                            style={{
                                flex: 1,
                                backgroundColor: Colors[theme].background,
                                borderRadius: 24,
                                paddingVertical: 10,
                                paddingHorizontal: 16,
                                fontSize: 16,
                                color: Colors[theme].text,
                                borderWidth: 1,
                                borderColor: Colors[theme].text + "22",
                            }}
                            placeholder={`${t("message")}...`}
                            placeholderTextColor={Colors[theme].text + "66"}
                            value={newMessage}
                            onChangeText={setNewMessage}
                            onSubmitEditing={handleSendMessage}
                            returnKeyType="send"
                        />
                        <TouchableOpacity
                            onPress={handleSendMessage}
                            style={{
                                backgroundColor: Colors[theme].tint,
                                padding: 10,
                                borderRadius: 20,
                                justifyContent: "center",
                                alignItems: "center",
                            }}
                        >
                            <Ionicons name="send" size={20} color={Colors[theme].background} />
                        </TouchableOpacity>
                    </View>
                )
            }
            keyboardAvoidingBehavior="padding"
            keyboardAvoidingOffset={80}
            panGestureEnabled={false}
            closeOnOverlayTap={true}
        >
            {/* Solo renderizar children si NO estamos en mensajes */}
            {view === "chats" && <View style={{ flex: 1, minHeight: 600 }}>{renderChats()}</View>}
            {view === "search" && <View style={{ flex: 1, minHeight: 600 }}>{renderSearch()}</View>}
            {view === "messages" && (
                <View style={{ flex: 1, minHeight: 0, flexGrow: 1, flexShrink: 1, paddingBottom: 20 }}>
                    {loading ? (
                        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", minHeight: 500 }}>
                            <ActivityIndicator size="large" color={Colors[theme].tint} />
                        </View>
                    ) : (
                        renderMessages()
                    )}
                </View>
            )}
        </Modalize>
    );
});

const styles = StyleSheet.create({
    container: {
        padding: 20,
        // flex: 1,
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
    headerRowMessages: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        marginBottom: 16,
        paddingHorizontal: 10,
        paddingTop: 10,
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
    chatItemSearch: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 14,
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
    lastMessage: {
        fontSize: 16,
        color: "#333",
    },
    userCard: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#f5f5f5",
        borderRadius: 12,
        marginBottom: 10,
        paddingVertical: 10,
        paddingHorizontal: 14,
        shadowColor: "#000",
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 2,
        minHeight: 60,
    },
    userAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 14,
        backgroundColor: "#ccc",
    },
    userInfoContainer: {
        flex: 1,
        justifyContent: "center",
    },
    userName: {
        color: "#222",
        fontWeight: "bold",
        fontSize: 16,
        textAlign: "left",
    },
    friendBadge: {
        backgroundColor: "#e74c3c",
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 3,
        marginLeft: 10,
        alignSelf: "center",
    },
    friendBadgeText: {
        color: "#fff",
        fontSize: 12,
        fontWeight: "bold",
    },
});

export default ChatModal;
