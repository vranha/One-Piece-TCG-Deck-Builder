import React, { useState, useEffect, useRef } from "react";
import {
    View,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    Keyboard,
    FlatList,
    LogBox,
    Modal,
    TouchableWithoutFeedback,
    Pressable,
    Animated,
    Easing,
    Vibration,
} from "react-native";
import { Modalize } from "react-native-modalize";
import { ThemedText } from "@/components/ThemedText";
import { Colors } from "@/constants/Colors";
import { useTheme } from "@/hooks/ThemeContext";
import { useTranslation } from "react-i18next";
import { ActivityIndicator } from "react-native";
import useApi from "@/hooks/useApi";
import { useAuth } from "@/contexts/AuthContext";
import { Image } from "expo-image";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { supabase } from "../supabaseClient";
import useStore from "@/store/useStore";
import { FlashList } from "@shopify/flash-list";
import { useLocalSearchParams, useRouter } from "expo-router";
import DeckSelectModal from "./DeckSelectModal";
import CollectionSelectModal from "./CollectionSelectModal";
import IconCard from '@/assets/icons/IconCardFill.svg';
import IconCards from '@/assets/icons/IconCards.svg';
import IconPeople from '@/assets/icons/IconPeople.svg';

// Utilidad para obtener el ref real de Modalize
function getModalizeRef(modalizeRef: any) {
    if (modalizeRef && typeof modalizeRef !== "function" && "current" in modalizeRef) {
        return modalizeRef.current;
    }
    return null;
}

// Utilidad para mapear color string a color real
const colorMap: Record<string, string> = {
    red: "#e74c3c",
    blue: "#3498db",
    green: "#27ae60",
    yellow: "#f1c40f",
    purple: "#9b59b6",
    black: "#222",
    white: "#fff",
    // Agrega más si tu juego tiene más colores
};

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
    last_message_type?: string;
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
    type?: string;
    ref_id?: string;
    deck?: any;
    card?: any;
}

interface ChatModalProps {
    onAttachCard?: () => void;
    onAttachDeck?: () => void;
    // ...otros props si existen...
}

const ChatModal = React.forwardRef<unknown, ChatModalProps>((props, ref) => {
    const { theme } = useTheme() as { theme: keyof typeof Colors };
    const { t } = useTranslation();
    const api = useApi();
    const { session } = useAuth();
    const setHasUnreadChats = useStore((state) => state.setHasUnreadChats || (() => {}));
    const router = useRouter();

    // Estados principales
    const [view, setView] = useState<"chats" | "search" | "messages">("chats");
    const [chats, setChats] = useState<Chat[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<User[]>([]);
    const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [messagesLoading, setMessagesLoading] = useState(false);
    const [pendingUser, setPendingUser] = useState<User | null>(null); // Nuevo estado para chat vacío
    const [justOpenedChat, setJustOpenedChat] = useState(false);
    const [attachModalVisible, setAttachModalVisible] = React.useState(false);
    const flashListRef = useRef<any>(null); // Añadido para scroll automático
    // --- ANIMACIÓN MENÚ DE ADJUNTOS ---
    const [showAttachMenu, setShowAttachMenu] = React.useState(false);
    const attachMenuAnim = React.useRef(new Animated.Value(0)).current;

    const [forwardMode, setForwardMode] = useState(false);
    const [messagesToForward, setMessagesToForward] = useState<Message[]>([]);

    function openAttachMenu() {
        setShowAttachMenu(true);
        Animated.timing(attachMenuAnim, {
            toValue: 1,
            duration: 220,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
        }).start();
    }
    function closeAttachMenu() {
        Animated.timing(attachMenuAnim, {
            toValue: 0,
            duration: 180,
            easing: Easing.in(Easing.ease),
            useNativeDriver: true,
        }).start(() => setShowAttachMenu(false));
    }

    // Ref para Modalize (asegura acceso correcto)
    const modalizeRef = (ref as React.RefObject<Modalize>) || useRef<Modalize>(null);

    // Oculta el warning de SyntheticEvent/NOBRIDGE si aparece
    useEffect(() => {
        // Oculta cualquier warning que contenga 'SyntheticEvent' o 'NOBRIDGE' (más robusto)
        LogBox.ignoreLogs([/SyntheticEvent/i, /NOBRIDGE/i, /nativeEvent/i]);
    }, []);

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

    // Type guard para User (ajustado a la nueva estructura)
    function isUser(obj: any): obj is User {
        return (
            (obj as User).username !== undefined &&
            (obj as User).id !== undefined &&
            (obj as Chat).user1_id === undefined
        );
    }

    const openChat = async (chatOrUser: Chat | User) => {
        setLoading(true);
        // Limpiar mensajes y chat seleccionado antes de cargar el nuevo chat
        setMessages([]);
        setSelectedChat(null);
        try {
            let chat: Chat | null = null;
            if (isUser(chatOrUser)) {
                // Buscar si ya existe un chat con ese usuario
                const existingChat = chats.find(
                    (c) =>
                        (c.user1_id === session?.user.id && c.user2_id === chatOrUser.id) ||
                        (c.user2_id === session?.user.id && c.user1_id === chatOrUser.id)
                );
                if (existingChat) {
                    // Si ya existe, abrir ese chat
                    chat = existingChat;
                } else {
                    // No crear chat aún, solo abrir UI vacía
                    setPendingUser(chatOrUser);
                    setSelectedChat(null);
                    setMessages([]);
                    setView("messages");
                    setJustOpenedChat(true); // <-- Scroll al abrir chat nuevo
                    setLoading(false);
                    return;
                }
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
            setJustOpenedChat(true);
            if (chat) {
                setMessagesLoading(true);
                fetchMessages(chat.id);
            }
            // Quitar el rojo del icono si ya no hay chats no leídos
            setHasUnreadChats(false);
        } catch (e) {
            setSelectedChat(null);
            setPendingUser(null);
        } finally {
            setLoading(false);
        }
    };

    const fetchMessages = async (chatId: string, showLoading = true) => {
        if (showLoading) setMessagesLoading(true);
        try {
            const res = await api.get(`/chats/${chatId}/messages`);
            setMessages(res.data);
        } catch (e) {
            setMessages([]);
        } finally {
            if (showLoading) setMessagesLoading(false);
        }
    };

    const handleSendMessage = async () => {
        if (!newMessage.trim() || (!selectedChat && !pendingUser) || !session?.user.id) return;

        // Si estamos editando un mensaje, editarlo en vez de enviar uno nuevo
        if (editingMessageId) {
            try {
                await api.put("/chats/messages/edit", {
                    messageId: editingMessageId,
                    userId: session.user.id,
                    newContent: newMessage,
                });
                setEditingMessageId(null);
                setNewMessage("");
                if (selectedChat?.id) fetchMessages(selectedChat.id, false);
            } catch (e) {
                // Puedes mostrar un toast de error aquí si quieres
            }
            return;
        }

        // Envío normal de mensaje
        try {
            let chatId = selectedChat?.id;
            if (!chatId && pendingUser) {
                const res = await api.post("/chats", { userId: session.user.id, otherUserId: pendingUser.id });
                const chat = res.data;
                chat.other_user = {
                    id: pendingUser.id,
                    username: pendingUser.username,
                    avatar_url: pendingUser.avatar_url,
                };
                setSelectedChat(chat);
                setPendingUser(null);
                chatId = chat.id;
                await new Promise((resolve) => setTimeout(resolve, 100));
            }
            if (!chatId) return;
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
                async (payload) => {
                    // Asegura que el payload tiene la forma de Message
                    const newMsg = payload.new as Message;
                    setMessages((prev) => {
                        if (prev.some((m) => m.id === newMsg.id)) return prev;
                        return [...prev, newMsg];
                    });
                    // Marcar como leído automáticamente si estamos en el chat
                    try {
                        await api.post(`/chats/${selectedChat.id}/read`, { userId: session?.user.id });
                    } catch (e) {
                        // No bloquear la UI si falla
                    }
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
                    flashListRef.current?.scrollToEnd({ animated: false });
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

    // Header para la lista de chats
    const ChatsHeader = (
        <View style={styles.headerRowChats}>
            {forwardMode ? (
                <>
                    <TouchableOpacity
                        onPress={() => {
                            setForwardMode(false);
                            setMessagesToForward([]);
                            setView("messages");
                        }}
                        style={{ marginRight: 10, padding: 6, borderRadius: 100 }}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <Ionicons name="close" size={24} color={Colors[theme].tint} />
                    </TouchableOpacity>
                    <ThemedText type="subtitle" style={[styles.text, { color: Colors[theme].text }]}>
                        {t("send_to")}
                    </ThemedText>
                </>
            ) : (
                <>
                    <ThemedText type="subtitle" style={[styles.text, { color: Colors[theme].text }]}>
                        {t("your_chats")}
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
                </>
            )}
        </View>
    );

    // Header para la búsqueda de usuarios
    const SearchHeader = (
        <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => setView("chats")}>
                <Ionicons name="arrow-back" size={24} color={Colors[theme].tint} />
            </TouchableOpacity>
            <TextInput
                style={[styles.inputSearch, { color: Colors[theme].text, borderColor: Colors[theme].tint }]}
                placeholder={t("Buscar usuario")}
                placeholderTextColor={Colors[theme].text + "80"}
                value={searchQuery}
                onChangeText={(text) => {
                    setSearchQuery(text);
                    searchUsers(text);
                }}
            />
        </View>
    );

    // Helper to render deleted message (place near the top of the component, after hooks)
    const renderDeletedMessage = (item: any) => (
        <View
            style={[
                styles.messageRow,
                {
                    alignSelf: item.sender_id === session?.user?.id ? "flex-end" : "flex-start",
                    backgroundColor: Colors[theme].backgroundSoft,
                    borderStyle: "dashed",
                    borderWidth: 1,
                    borderColor: Colors[theme].tabIconDefault,
                    opacity: 0.7,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                },
            ]}
        >
            <Ionicons
                name="chatbubbles-outline"
                size={18}
                color={Colors[theme].tabIconDefault}
                style={{ marginRight: 6 }}
            />
            <ThemedText style={{ color: Colors[theme].tabIconDefault, fontStyle: "italic", textAlign: "center" }}>
                {t("deleted_message")}
            </ThemedText>
        </View>
    );

    // Renderizado condicional
    const renderChats = () => (
        <View style={styles.container}>
            {/* Header eliminado, ahora va en HeaderComponent */}
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
                                onPress={async () => {
                                    if (forwardMode && messagesToForward.length > 0) {
                                        // Prepara los mensajes a reenviar
                                        const bulkMessages = messagesToForward.map((msg) => ({
                                            content: `//**Reenviado**// ${msg.content}`,
                                            type: msg.type,
                                            ref_id: msg.ref_id,
                                        }));
                                        await api.post(`/chats/${item.id}/messages/bulk`, {
                                            messages: bulkMessages,
                                            sender_id: session?.user.id,
                                        });
                                        setForwardMode(false);
                                        setMessagesToForward([]);
                                        setView("messages");
                                        setSelectedChat(item);
                                        fetchMessages(item.id, false);
                                    } else {
                                        openChat(item);
                                    }
                                }}
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

                                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                                        {item.last_message_type === "deck" && (
<IconCards style={{ color: Colors[theme].deckBar, width: 18, height: 18, opacity: 0.2 }} />
                                        )}
                                        {item.last_message_type === "card" && (
                                            // <MaterialIcons
                                            //     name="style"
                                            //     size={18}
                                            //     color={Colors[theme].cardBar}
                                            //     styles={{ opacity: 0.2 }}
                                            // />
                                            <IconCard style={{ color: Colors[theme].cardBar, width: 18, height: 18, opacity: 0.2 }} />
                                        )}
                                        {item.last_message_type === "collection" && (
                                            <Ionicons
                                                name="albums"
                                                size={18}
                                                color={Colors[theme].info}
                                                styles={{ opacity: 0.2 }}
                                            />
                                        )}
                                        <ThemedText
                                            style={[
                                                styles.lastMessage,
                                                isUnread
                                                    ? { color: Colors[theme].tint, fontWeight: "bold" }
                                                    : { color: Colors[theme].tabIconDefault, fontWeight: "bold" },
                                            ]}
                                            numberOfLines={1}
                                        >
                                            {item.last_message === "//**Eliminado**//" ? (
                                                <View style={{ flexDirection: "row", alignItems: "center" }}>
                                                    <Ionicons
                                                        name="trash-outline"
                                                        size={16}
                                                        color={Colors[theme].tabIconDefault}
                                                        style={{ marginRight: 6, opacity: 0.5 }}
                                                    />
                                                    <ThemedText
                                                        style={{
                                                            fontStyle: "italic",
                                                            opacity: 0.6,
                                                            color: Colors[theme].tabIconDefault,
                                                        }}
                                                    >
                                                        {t("deleted_message")}
                                                    </ThemedText>
                                                </View>
                                            ) : item.last_message?.startsWith("//**Reenviado**//") ? (
                                                <>
                                                    <Ionicons
                                                        name="repeat"
                                                        size={18}
                                                        color={Colors[theme].tabIconDefault}
                                                        style={{ marginRight: 6, opacity: 0.7 }}
                                                    />
                                                    {item.last_message.replace(/^\/\/\*\*Reenviado\*\*\/\/\s?/, "")}
                                                </>
                                            ) : (
                                                item.last_message
                                            )}
                                        </ThemedText>
                                    </View>
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
            {/* Header eliminado, ahora va en HeaderComponent */}
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
                            <TouchableOpacity
                                style={[styles.userCard, { backgroundColor: Colors[theme].background }]}
                                onPress={() => openChat(item)}
                            >
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
                                    <View style={[styles.friendBadge, { backgroundColor: Colors[theme].tint }]}>
                                        <IconPeople style={{ color: Colors[theme].background, width: 20, height: 20 }} />
                                    </View>
                                )}
                            </TouchableOpacity>
                        );
                    }}
                    contentContainerStyle={{ paddingBottom: 20 }}
                    estimatedItemSize={60}
                    ListEmptyComponent={
                        searchQuery.length > 1 ? (
                            <View
                                style={{
                                    flex: 1,
                                    alignItems: "center",
                                    justifyContent: "center",
                                    paddingVertical: 60,
                                }}
                            >
                                <Ionicons
                                    name="skull"
                                    size={48}
                                    color={Colors[theme].tint}
                                    style={{ marginBottom: 12 }}
                                />
                                <ThemedText
                                    style={{
                                        color: Colors[theme].text,
                                        fontWeight: "bold",
                                        fontSize: 18,
                                        textAlign: "center",
                                        marginBottom: 6,
                                    }}
                                >
                                    {t("no_results_found_users")}
                                </ThemedText>
                                <ThemedText
                                    style={{
                                        color: Colors[theme].text + "80",
                                        fontSize: 15,
                                        textAlign: "center",
                                        maxWidth: 260,
                                    }}
                                >
                                    {t("try_searching_another_username")}
                                </ThemedText>
                            </View>
                        ) : null
                    }
                />
            )}
        </View>
    );

    // --- ESTADO Y LÓGICA PARA MODAL DE SELECCIÓN DE DECK ---
    const [showDeckSelectModal, setShowDeckSelectModal] = useState(false);
    const [userDecks, setUserDecks] = useState<any[]>([]);
    const [selectedDeck, setSelectedDeck] = useState<any>(null);
    const [deckMessageInput, setDeckMessageInput] = useState("");
    const [loadingDecks, setLoadingDecks] = useState(false);

    // --- ESTADO Y LÓGICA PARA MODAL DE SELECCIÓN DE COLECCIÓN ---
    const [showCollectionSelectModal, setShowCollectionSelectModal] = useState(false);
    const [userCollections, setUserCollections] = useState<any[]>([]);
    const [selectedCollection, setSelectedCollection] = useState<any>(null);
    const [collectionMessageInput, setCollectionMessageInput] = useState("");
    const [loadingCollections, setLoadingCollections] = useState(false);

    // Fetch mazos del usuario cuando se abre el modal
    useEffect(() => {
        if (showDeckSelectModal && session?.user.id) {
            setLoadingDecks(true);
            api.get(`/decks/${session.user.id}`)
                .then((res) => setUserDecks(res.data.data))
                .catch(() => setUserDecks([]))
                .finally(() => setLoadingDecks(false));
        } else if (!showDeckSelectModal) {
            setUserDecks([]);
            // NO limpiar selectedDeck ni deckMessageInput aquí
        }
    }, [showDeckSelectModal, session?.user.id]);

    // Limpiar selectedDeck y deckMessageInput SOLO al cerrar el modal (cuando showDeckSelectModal pasa de true a false)
    useEffect(() => {
        if (!showDeckSelectModal) {
            setSelectedDeck(null);
            setDeckMessageInput("");
        }
        // No dependas de userDecks ni de session
    }, [showDeckSelectModal]);

    // Fetch colecciones del usuario cuando se abre el modal
    useEffect(() => {
        const fetchCollections = async () => {
            if (showCollectionSelectModal && session?.user.id) {
                setLoadingCollections(true);
                try {
                    const res = await api.get(`/collections/${session.user.id}`);
                    setUserCollections(res.data.data);
                } catch {
                    setUserCollections([]);
                } finally {
                    setLoadingCollections(false);
                }
            } else if (!showCollectionSelectModal) {
                setUserCollections([]);
            }
        };
        fetchCollections();
    }, [showCollectionSelectModal, session?.user.id]);

    // Limpiar selectedCollection y collectionMessageInput SOLO al cerrar el modal
    useEffect(() => {
        if (!showCollectionSelectModal) {
            setSelectedCollection(null);
            setCollectionMessageInput("");
        }
    }, [showCollectionSelectModal]);

    const params = useLocalSearchParams();
    const [hasHandledOpenModalize, setHasHandledOpenModalize] = useState(false);

    useEffect(() => {
        // Si viene de adjuntar carta, abrir el modal y el chat correspondiente SOLO una vez
        if (
            params.openModalize === "1" &&
            params.chatId &&
            !hasHandledOpenModalize &&
            chats.length > 0 // Espera a que los chats estén cargados
        ) {
            const chatToOpen = chats.find((c) => c.id === params.chatId);
            if (chatToOpen) {
                openChat(chatToOpen);
            }
            const modalRefObj = getModalizeRef(modalizeRef);
            if (modalRefObj && modalRefObj.open) {
                modalRefObj.open();
            }
            setHasHandledOpenModalize(true);
            // Limpiar los params de la URL para evitar reapertura en futuras navegaciones
            router.replace("/(tabs)/index");
        }
    }, [params.openModalize, params.chatId, chats, hasHandledOpenModalize]);

    // --- HANDLER PARA ENVIAR DECK COMO MENSAJE ---
    const handleSendDeckMessage = async () => {
        if (!selectedDeck || !selectedChat?.id || !session?.user.id) return;
        try {
            await api.post(`/chats/${selectedChat.id}/messages`, {
                content: deckMessageInput,
                sender_id: session?.user.id,
                chat_id: selectedChat.id,
                type: "deck",
                ref_id: selectedDeck.id,
            });
            setShowDeckSelectModal(false);
            setSelectedDeck(null);
            setDeckMessageInput("");
            fetchMessages(selectedChat.id, false);
        } catch (e) {
            // Puedes mostrar un toast de error aquí si quieres
        }
    };

    // --- HANDLER PARA ENVIAR COLECCIÓN COMO MENSAJE ---
    const handleSendCollectionMessage = async () => {
        if (!selectedCollection || !selectedChat?.id || !session?.user.id) return;
        try {
            await api.post(`/chats/${selectedChat.id}/messages`, {
                type: "collection",
                ref_id: selectedCollection.id,
                content: collectionMessageInput,
                sender_id: session.user.id,
                chat_id: selectedChat.id,
            });
            setShowCollectionSelectModal(false);
            setSelectedCollection(null);
            setCollectionMessageInput("");
            fetchMessages(selectedChat.id, false);
        } catch (e) {
            // Manejar error
        }
    };

    const [selectedMessageIds, setSelectedMessageIds] = useState<string[]>([]);
    const showCopyButton = selectedMessageIds.length > 0;

    // Handler para copiar mensajes seleccionados
    const handleCopyMessage = async () => {
        const selectedContents = messages
            .filter((m) => selectedMessageIds.includes(m.id))
            .map((m) => m.content)
            .filter(Boolean)
            .join("\n");
        if (selectedContents) {
            await navigator.clipboard.writeText(selectedContents);
            setSelectedMessageIds([]);
        }
    };

    // Handler para eliminar mensajes seleccionados (soft delete)
    const handleDeleteMessages = async () => {
        if (!selectedChat || selectedMessageIds.length === 0 || !session?.user?.id) return;
        try {
            await api.put("/chats/messages/delete", {
                messageIds: selectedMessageIds,
                userId: session.user.id,
            });
            // Refresca mensajes tras eliminar
            fetchMessages(selectedChat.id, false);
            setSelectedMessageIds([]);
        } catch (e) {
            // Puedes mostrar un toast de error aquí si quieres
        }
    };

    // Determina si todos los mensajes seleccionados son míos
    const allSelectedAreMine =
        selectedMessageIds.length > 0 &&
        selectedMessageIds.every((id) => messages.find((m) => m.id === id)?.sender_id === session?.user?.id);

    // Determina si se puede editar (solo un mensaje seleccionado y es mío)
    const showEditButton =
        selectedMessageIds.length === 1 &&
        messages.find((m) => m.id === selectedMessageIds[0])?.sender_id === session?.user?.id;

    const [editingMessageId, setEditingMessageId] = useState<string | null>(null);

    // Handler para editar mensaje
    const handleEditMessage = () => {
        if (selectedMessageIds.length === 1) {
            const msg = messages.find((m) => m.id === selectedMessageIds[0]);
            if (msg && msg.sender_id === session?.user?.id) {
                setEditingMessageId(msg.id);
                setNewMessage(msg.content);
                setSelectedMessageIds([]);
            }
        }
    };

    // --- Abrir chat con usuario desde el store global (Zustand) ---
    const openChatUser = useStore((state) => state.openChatUser);
    const setOpenChatUser = useStore((state) => state.setOpenChatUser);
    useEffect(() => {
        if (openChatUser) {
            // Abre el modal y el chat con ese usuario
            if (
                typeof modalizeRef !== "function" &&
                modalizeRef &&
                "current" in modalizeRef &&
                modalizeRef.current &&
                modalizeRef.current.open
            ) {
                modalizeRef.current.open();
            }
            // Llama a openChat con el usuario
            openChat(openChatUser);
            // Limpia el estado para evitar reaperturas
            setTimeout(() => setOpenChatUser(null), 500);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [openChatUser]);

    if (view === "messages") {
        return (
            <>
                <Modalize
                    ref={modalizeRef}
                    adjustToContentHeight={false}
                    modalHeight={600}
                    disableScrollIfPossible={true}
                    modalStyle={{ backgroundColor: Colors[theme].TabBarBackground }}
                    onOpen={handleModalOpen}
                    onClose={() => setView("chats")}
                    HeaderComponent={
                        <View
                            style={{
                                flexDirection: "row",
                                justifyContent: "space-between",
                                alignItems: "center",
                                paddingHorizontal: 16,
                                paddingVertical: 12,
                                backgroundColor: Colors[theme].TabBarBackground,
                                borderBottomWidth: 1,
                                borderBottomColor: Colors[theme].backgroundSoft ?? Colors[theme].text + "10",
                                gap: 12,
                            }}
                        >
                            <View
                                style={{
                                    flexDirection: "row",
                                    justifyContent: "flex-start",
                                    alignItems: "center",
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
                            <View style={{ flexDirection: "row", alignItems: "center" }}>
                                {selectedMessageIds.length > 0 && (
                                    <>
                                        <TouchableOpacity
                                            onPress={() => {
                                                setMessagesToForward(
                                                    messages.filter((m) => selectedMessageIds.includes(m.id))
                                                );
                                                setForwardMode(true);
                                                setView("chats");
                                                setSelectedMessageIds([]);
                                            }}
                                            style={{
                                                marginLeft: 12,
                                                padding: 6,
                                                borderRadius: 100,
                                                backgroundColor: Colors[theme].info,
                                                opacity: selectedMessageIds.length > 0 ? 1 : 0.4,
                                            }}
                                            disabled={selectedMessageIds.length === 0}
                                        >
                                            <Ionicons name="arrow-redo" size={22} color={Colors[theme].background} />
                                        </TouchableOpacity>
                                        {/* Botón copiar */}
                                        <TouchableOpacity
                                            onPress={handleCopyMessage}
                                            disabled={!showCopyButton}
                                            style={{
                                                marginLeft: 12,
                                                padding: 6,
                                                borderRadius: 100,
                                                backgroundColor: Colors[theme].tint,
                                                opacity: showCopyButton ? 1 : 0.4,
                                            }}
                                        >
                                            <Ionicons name="copy" size={22} color={Colors[theme].background} />
                                        </TouchableOpacity>
                                        {/* Botón editar */}
                                        <TouchableOpacity
                                            onPress={handleEditMessage}
                                            disabled={!showEditButton}
                                            style={{
                                                marginLeft: 12,
                                                padding: 6,
                                                borderRadius: 100,
                                                backgroundColor: Colors[theme].info,
                                                opacity: showEditButton ? 1 : 0.4,
                                            }}
                                        >
                                            <Ionicons
                                                name="create-outline"
                                                size={22}
                                                color={Colors[theme].background}
                                            />
                                        </TouchableOpacity>
                                        {/* Botón eliminar */}
                                        <TouchableOpacity
                                            onPress={handleDeleteMessages}
                                            disabled={!allSelectedAreMine}
                                            style={{
                                                marginLeft: 12,
                                                padding: 6,
                                                borderRadius: 100,
                                                backgroundColor: "#e74c3c",
                                                opacity: allSelectedAreMine ? 1 : 0.4,
                                            }}
                                        >
                                            <Ionicons name="trash" size={22} color={Colors[theme].background} />
                                        </TouchableOpacity>
                                    </>
                                )}
                            </View>
                        </View>
                    }
                    FooterComponent={
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
                                position: "relative",
                            }}
                        >
                            <TouchableOpacity
                                onPress={() => {
                                    if (!showAttachMenu) openAttachMenu();
                                    else closeAttachMenu();
                                }}
                                style={{
                                    backgroundColor: showAttachMenu ? Colors[theme].tint : Colors[theme].background,
                                    padding: 10,
                                    borderRadius: 20,
                                    justifyContent: "center",
                                    alignItems: "center",
                                    marginRight: 2,
                                    shadowColor: "#000",
                                    shadowOffset: { width: 0, height: 2 },
                                    shadowOpacity: 0.18,
                                    shadowRadius: 4,
                                }}
                            >
                                <Ionicons
                                    name={showAttachMenu ? "close" : "add-circle-outline"}
                                    size={24}
                                    color={showAttachMenu ? Colors[theme].background : Colors[theme].tint}
                                />
                            </TouchableOpacity>

                            <View style={{ flex: 1, position: "relative" }}>
                                <TextInput
                                    style={{
                                        backgroundColor: Colors[theme].background,
                                        borderRadius: 24,
                                        paddingVertical: 10,
                                        paddingHorizontal: 16,
                                        fontSize: 16,
                                        color: Colors[theme].text,
                                        borderWidth: 1,
                                        borderColor: Colors[theme].text + "22",
                                        paddingRight: editingMessageId ? 70 : 16, // más espacio para dos iconos
                                    }}
                                    placeholder={`${t("message")}...`}
                                    placeholderTextColor={Colors[theme].text + "66"}
                                    value={newMessage}
                                    onChangeText={setNewMessage}
                                    onSubmitEditing={handleSendMessage}
                                    returnKeyType="send"
                                    contextMenuHidden={false}
                                    selectTextOnFocus={false}
                                    editable={true}
                                />
                                {editingMessageId && (
                                    <View
                                        style={{
                                            position: "absolute",
                                            right: 12,
                                            top: 0,
                                            bottom: 0,
                                            flexDirection: "row",
                                            alignItems: "center",
                                            pointerEvents: "box-none",
                                        }}
                                    >
                                        <Ionicons
                                            name="create-outline"
                                            size={20}
                                            color={Colors[theme].info}
                                            style={{ marginRight: 12 }}
                                        />
                                        <TouchableOpacity
                                            onPress={() => {
                                                setEditingMessageId(null);
                                                setNewMessage("");
                                            }}
                                            style={{
                                                padding: 4,
                                                borderRadius: 100,
                                                backgroundColor: Colors[theme].backgroundSoft,
                                            }}
                                        >
                                            <Ionicons name="close" size={18} color={Colors[theme].tabIconDefault} />
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>
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
                            {/* Menú de adjuntos animado, SIEMPRE visible cuando showAttachMenu */}
                            {showAttachMenu && (
                                <Pressable
                                    style={{
                                        position: "absolute",
                                        left: 0,
                                        bottom: 70,
                                        alignItems: "center",
                                        zIndex: 100,
                                        width: "100%",
                                    }}
                                    onPress={closeAttachMenu}
                                >
                                    <Animated.View
                                        style={{
                                            width: "100%",
                                            flexDirection: "row",
                                            gap: 20,
                                            backgroundColor: Colors[theme].TabBarBackground,
                                            borderWidth: 1,
                                            borderBottomWidth: 0,
                                            borderColor: Colors[theme].backgroundSoft ?? Colors[theme].text + "10",
                                            borderTopRightRadius: 12,
                                            paddingVertical: 15,
                                            paddingHorizontal: 20,
                                            alignItems: "center",
                                            justifyContent: "flex-start",
                                            opacity: attachMenuAnim,
                                            transform: [
                                                {
                                                    translateY: attachMenuAnim.interpolate({
                                                        inputRange: [-2, 1],
                                                        outputRange: [40, 0],
                                                    }),
                                                },
                                            ],
                                        }}
                                    >
                                        <View style={{ alignItems: "center" }}>
                                            <TouchableOpacity
                                                style={{
                                                    borderColor: Colors[theme].tint,
                                                    borderWidth: 1,
                                                    flexDirection: "row",
                                                    alignItems: "center",
                                                    padding: 14,
                                                    borderRadius: 12,
                                                    gap: 5,
                                                    backgroundColor: Colors[theme].background,
                                                    justifyContent: "flex-start",
                                                }}
                                                onPress={() => {
                                                    closeAttachMenu();
                                                    // Cerrar el modal de chat si está abierto
                                                    const modalRefObj = getModalizeRef(modalizeRef);
                                                    if (modalRefObj && modalRefObj.close) {
                                                        modalRefObj.close();
                                                    }
                                                    router.push({
                                                        pathname: "/search",
                                                        params: {
                                                            mode: "attachCard",
                                                            chatId: selectedChat?.id, // o pendingUser?.id si es chat nuevo
                                                            openModalize: "1",
                                                        },
                                                    });
                                                }}
                                                activeOpacity={0.8}
                                            >
                                                {/* <MaterialIcons name="style" size={28} color={Colors[theme].tint} /> */}
                                                <IconCard style={{ color: Colors[theme].tint, width: 30, height: 30 }} />
                                            </TouchableOpacity>
                                            <ThemedText
                                                style={{
                                                    fontSize: 17,
                                                    color: Colors[theme].tabIconDefault,
                                                    fontWeight: "500",
                                                }}
                                            >
                                                {t("card")}
                                            </ThemedText>
                                        </View>
                                        <View style={{ alignItems: "center" }}>
                                            <TouchableOpacity
                                                style={{
                                                    borderColor: Colors[theme].tint,
                                                    borderWidth: 1,
                                                    flexDirection: "row",
                                                    alignItems: "center",
                                                    padding: 9,
                                                    borderRadius: 12,
                                                    gap: 5,
                                                    backgroundColor: Colors[theme].background,
                                                    justifyContent: "flex-start",
                                                }}
                                                onPress={() => {
                                                    closeAttachMenu();
                                                    setShowDeckSelectModal(true);
                                                }}
                                                activeOpacity={0.8}
                                            >
                                                <IconCards style={{ color: Colors[theme].tint, width: 40, height: 40 }} />
                                            </TouchableOpacity>
                                            <ThemedText
                                                style={{
                                                    fontSize: 17,
                                                    color: Colors[theme].tabIconDefault,
                                                    fontWeight: "500",
                                                }}
                                            >
                                                {t("deck")}
                                            </ThemedText>
                                        </View>
                                        <View style={{ alignItems: "center", marginLeft:-9 }}>
                                            <TouchableOpacity
                                                style={{
                                                    borderColor: Colors[theme].tint,
                                                    borderWidth: 1,
                                                    flexDirection: "row",
                                                    alignItems: "center",
                                                    padding: 14,
                                                    borderRadius: 12,
                                                    gap: 5,
                                                    backgroundColor: Colors[theme].background,
                                                    justifyContent: "flex-start",
                                                }}
                                                onPress={() => {
                                                    closeAttachMenu();
                                                    setShowCollectionSelectModal(true);
                                                }}
                                                activeOpacity={0.8}
                                            >
                                                <Ionicons name="albums" size={28} color={Colors[theme].tint} />
                                            </TouchableOpacity>
                                            <ThemedText
                                                style={{
                                                    fontSize: 17,
                                                    color: Colors[theme].tabIconDefault,
                                                    fontWeight: "500",
                                                }}
                                            >
                                                {t("collection")}
                                            </ThemedText>
                                        </View>
                                    </Animated.View>
                                </Pressable>
                            )}
                        </View>
                    }
                    keyboardAvoidingBehavior="padding"
                    keyboardAvoidingOffset={80}
                    panGestureEnabled={false}
                    closeOnOverlayTap={true}
                    flatListProps={{
                        data: Array.isArray(messages)
                            ? messages.filter((m) => m && typeof m === "object" && m.id && m.sender_id).reverse()
                            : [],
                        keyExtractor: (item: any) => item.id?.toString?.() || Math.random().toString(),
                        renderItem: ({ item }: any) => {
                            // Renderizado especial para mensajes de tipo deck/card/collection
                            if (item.type === "deck" && item.deck) {
                                if (item.content === "//**Eliminado**//") {
                                    return renderDeletedMessage(item);
                                }
                                const leader = item.deck.cards.find((c: any) => c.type === "LEADER");
                                const isMine = item.sender_id === session?.user.id;
                                const isSelected = selectedMessageIds.includes(item.id);
                                return (
                                    <TouchableOpacity
                                        onLongPress={() => {
                                            Vibration.vibrate(10); // Vibración corta al mantener pulsado
                                            if (!isSelected) setSelectedMessageIds((prev) => [...prev, item.id]);
                                        }}
                                        onPress={() => {
                                            if (selectedMessageIds.length > 0) {
                                                // En modo selección: alternar selección
                                                if (isSelected) {
                                                    setSelectedMessageIds((prev) =>
                                                        prev.filter((id) => id !== item.id)
                                                    );
                                                } else {
                                                    setSelectedMessageIds((prev) => [...prev, item.id]);
                                                }
                                            } else {
                                                // Solo navegar si no hay selección
                                                const modalRefObj = getModalizeRef(modalizeRef);
                                                if (modalRefObj && modalRefObj.close) modalRefObj.close();
                                                setTimeout(() => {
                                                    router.push({
                                                        pathname: "/(tabs)/deck/[deckId]",
                                                        params: { deckId: item.deck.id, cardName: item.deck.name },
                                                    });
                                                }, 200);
                                            }
                                        }}
                                        activeOpacity={0.8}
                                        style={{ position: "relative" }}
                                    >
                                        {isSelected && (
                                            <View
                                                style={{
                                                    position: "absolute",
                                                    left: -6,
                                                    right: -6,
                                                    top: 0,
                                                    bottom: 0,
                                                    borderRadius: 12,
                                                    backgroundColor: Colors[theme].highlight + "33",
                                                    zIndex: 1,
                                                }}
                                            />
                                        )}
                                        <View
                                            style={[
                                                styles.messageRow,
                                                {
                                                    backgroundColor: isMine
                                                        ? Colors[theme].ownMessageBackground
                                                        : Colors[theme].receivedMessageBackground,
                                                    alignSelf: isMine ? "flex-end" : "flex-start",
                                                    borderRightWidth: isMine ? 4 : 0,
                                                    borderLeftWidth: !isMine ? 4 : 0,
                                                    borderRightColor: isMine ? Colors[theme].deckBar : undefined,
                                                    borderLeftColor: !isMine ? Colors[theme].deckBar : undefined,
                                                    paddingTop: 18,
                                                },
                                            ]}
                                        >
                                            <TouchableOpacity
                                                activeOpacity={0.8}
                                                onPress={() => {
                                                    const modalRefObj = getModalizeRef(modalizeRef);
                                                    if (modalRefObj && modalRefObj.close) {
                                                        modalRefObj.close();
                                                    }
                                                    setTimeout(() => {
                                                        router.push({
                                                            pathname: "/(tabs)/deck/[deckId]",
                                                            params: { deckId: item.deck.id, cardName: item.deck.name },
                                                        });
                                                    }, 200);
                                                }}
                                                style={{ flexDirection: "column", gap: 4 }}
                                            >
                                                <ThemedText
                                                    style={{
                                                        fontWeight: "bold",
                                                        color: Colors[theme].deckBar,
                                                        marginBottom: 5,
                                                        position: "relative",
                                                        fontSize: 20,
                                                        textAlign: isMine ? "right" : "left",
                                                    }}
                                                >
                                                    {t("deck").toUpperCase()}
                                                </ThemedText>
                                                <View style={{ flexDirection: "row", gap: 4 }}>
                                                    <Image
                                                        source={leader.images_thumb || item.deck.cards[0]?.images_thumb}
                                                        style={{
                                                            width: 60,
                                                            height: 80,
                                                            borderRadius: 3,
                                                            borderWidth: 2,
                                                            borderColor: Colors[theme].tabIconDefault,
                                                        }}
                                                        contentFit="cover"
                                                        cachePolicy="memory-disk"
                                                    />
                                                    <View
                                                        style={{
                                                            flexDirection: "column",
                                                            gap: 0,
                                                            justifyContent: "flex-start",
                                                        }}
                                                    >
                                                        <ThemedText
                                                            style={{ fontWeight: "bold", color: Colors[theme].info }}
                                                        >
                                                            {item.deck.name}
                                                        </ThemedText>
                                                        <View
                                                            style={{
                                                                flexDirection: "row",
                                                                alignItems: "center",
                                                                gap: 4,
                                                                marginTop: 2,
                                                            }}
                                                        >
                                                            <ThemedText
                                                                style={{
                                                                    fontWeight: "bold",
                                                                    color:
                                                                        item.sender_id === session?.user.id
                                                                            ? Colors[theme].ownMessageText
                                                                            : Colors[theme].receivedMessageText,
                                                                }}
                                                            >
                                                                {leader.name}
                                                            </ThemedText>
                                                            {Array.isArray(item.deck.cards) &&
                                                                item.deck.cards
                                                                    .filter((c: any) => c.type === "LEADER")
                                                                    .flatMap((c: any) =>
                                                                        Array.isArray(c.color) ? c.color : []
                                                                    )
                                                                    .map((color: string, idx: number) => (
                                                                        <View
                                                                            key={color + idx}
                                                                            style={{
                                                                                width: 14,
                                                                                height: 14,
                                                                                borderRadius: 7,
                                                                                backgroundColor:
                                                                                    colorMap[color.toLowerCase()] ||
                                                                                    color,
                                                                                borderWidth: 1,
                                                                                borderColor:
                                                                                    Colors[theme].tabIconDefault,
                                                                                marginLeft: 2,
                                                                            }}
                                                                        />
                                                                    ))}
                                                        </View>
                                                        <ThemedText
                                                            style={{
                                                                fontSize: 13,
                                                                color: Colors[theme].text + "BB",
                                                                marginTop: 2,
                                                            }}
                                                        >
                                                            {/* {item.card.rarity} */}
                                                        </ThemedText>
                                                    </View>
                                                </View>
                                            </TouchableOpacity>
                                            {item.content && item.content?.startsWith("//**Reenviado**//") ? (
                                                <>
                                                    <ThemedText
                                                        style={{
                                                            position: "absolute",
                                                            top: -2,
                                                            left: 10,
                                                            fontSize: 12,
                                                            color: Colors[theme].tabIconDefault,
                                                            fontStyle: "italic",
                                                            opacity: 0.8,
                                                        }}
                                                    >
                                                        {t("forwarded")}
                                                    </ThemedText>
                                                    <ThemedText
                                                        style={{
                                                            marginTop: 18,
                                                            color:
                                                                item.sender_id === session?.user.id
                                                                    ? Colors[theme].ownMessageText
                                                                    : Colors[theme].receivedMessageText,
                                                            fontSize: 15,
                                                            minWidth: 60,
                                                        }}
                                                    >
                                                        {item.content.replace(/^\/\/\*\*Reenviado\*\*\/\/\s?/, "")}
                                                    </ThemedText>
                                                </>
                                            ) : (
                                                <ThemedText
                                                    style={{
                                                        color:
                                                            item.sender_id === session?.user.id
                                                                ? Colors[theme].ownMessageText
                                                                : Colors[theme].receivedMessageText,
                                                        fontSize: 15,
                                                    }}
                                                >
                                                    {item.content}
                                                </ThemedText>
                                            )}
                                        </View>
                                    </TouchableOpacity>
                                );
                            }
                            if (item.type === "card" && item.card) {
                                if (item.content === "//**Eliminado**//") {
                                    return renderDeletedMessage(item);
                                }
                                const isMine = item.sender_id === session?.user.id;
                                const isSelected = selectedMessageIds.includes(item.id);
                                return (
                                    <TouchableOpacity
                                        onLongPress={() => {
                                            Vibration.vibrate(10); // Vibración corta al mantener pulsado
                                            if (!isSelected) setSelectedMessageIds((prev) => [...prev, item.id]);
                                        }}
                                        onPress={() => {
                                            if (selectedMessageIds.length > 0) {
                                                if (isSelected) {
                                                    setSelectedMessageIds((prev) =>
                                                        prev.filter((id) => id !== item.id)
                                                    );
                                                } else {
                                                    setSelectedMessageIds((prev) => [...prev, item.id]);
                                                }
                                            } else {
                                                const modalRefObj = getModalizeRef(modalizeRef);
                                                if (modalRefObj && modalRefObj.close) modalRefObj.close();
                                                setTimeout(() => {
                                                    router.push({
                                                        pathname: "/(tabs)/[cardId]",
                                                        params: { cardId: item.card.id, cardName: item.card.name },
                                                    });
                                                }, 200);
                                            }
                                        }}
                                        activeOpacity={0.8}
                                        style={{ position: "relative" }}
                                    >
                                        {isSelected && (
                                            <View
                                                style={{
                                                    position: "absolute",
                                                    left: -6,
                                                    right: -6,
                                                    top: 0,
                                                    bottom: 0,
                                                    borderRadius: 12,
                                                    backgroundColor: Colors[theme].highlight + "33",
                                                    zIndex: 1,
                                                }}
                                            />
                                        )}
                                        <View
                                            style={[
                                                styles.messageRow,
                                                {
                                                    backgroundColor: isMine
                                                        ? Colors[theme].ownMessageBackground
                                                        : Colors[theme].receivedMessageBackground,
                                                    alignSelf: isMine ? "flex-end" : "flex-start",
                                                    borderRightWidth: isMine ? 4 : 0,
                                                    borderLeftWidth: !isMine ? 4 : 0,
                                                    borderRightColor: isMine ? Colors[theme].cardBar : undefined,
                                                    borderLeftColor: !isMine ? Colors[theme].cardBar : undefined,
                                                    paddingTop: 18,
                                                },
                                            ]}
                                        >
                                            <TouchableOpacity
                                                activeOpacity={0.8}
                                                onPress={() => {
                                                    const modalRefObj = getModalizeRef(modalizeRef);
                                                    if (modalRefObj && modalRefObj.close) {
                                                        modalRefObj.close();
                                                    }
                                                    setTimeout(() => {
                                                        router.push({
                                                            pathname: "/(tabs)/[cardId]",
                                                            params: { cardId: item.card.id, cardName: item.card.name },
                                                        });
                                                    }, 200);
                                                }}
                                                style={{ flexDirection: "column", gap: 4 }}
                                            >
                                                <ThemedText
                                                    style={{
                                                        fontWeight: "bold",
                                                        color: Colors[theme].cardBar,
                                                        marginBottom: 5,
                                                        position: "relative",
                                                        fontSize: 20,
                                                        textAlign: isMine ? "right" : "left",
                                                    }}
                                                >
                                                    {t("card").toUpperCase()}
                                                </ThemedText>
                                                <View style={{ flexDirection: "row", gap: 4 }}>
                                                    <Image
                                                        source={item.card.images_thumb}
                                                        style={{
                                                            width: 60,
                                                            height: 80,
                                                            borderRadius: 3,
                                                            borderWidth: 2,
                                                            borderColor: Colors[theme].tabIconDefault,
                                                        }}
                                                        contentFit="cover"
                                                        cachePolicy="memory-disk"
                                                    />
                                                    <View
                                                        style={{
                                                            flexDirection: "column",
                                                            gap: 0,
                                                            justifyContent: "flex-start",
                                                        }}
                                                    >
                                                        <ThemedText
                                                            style={{ fontWeight: "bold", color: Colors[theme].text }}
                                                        >
                                                            {item.card.name}
                                                        </ThemedText>
                                                        <View
                                                            style={{
                                                                flexDirection: "row",
                                                                alignItems: "center",
                                                                gap: 4,
                                                                marginTop: 2,
                                                            }}
                                                        >
                                                            <ThemedText
                                                                style={{
                                                                    fontWeight: "bold",
                                                                    color: Colors[theme].disabled,
                                                                }}
                                                            >
                                                                {item.card.code}
                                                            </ThemedText>
                                                            {Array.isArray(item.card.color) &&
                                                                item.card.color.map((color: string, idx: number) => (
                                                                    <View
                                                                        key={color + idx}
                                                                        style={{
                                                                            width: 14,
                                                                            height: 14,
                                                                            borderRadius: 7,
                                                                            backgroundColor:
                                                                                colorMap[color.toLowerCase()] || color,
                                                                            borderWidth: 1,
                                                                            borderColor: Colors[theme].tabIconDefault,
                                                                            marginLeft: 2,
                                                                        }}
                                                                    />
                                                                ))}
                                                        </View>
                                                        <ThemedText
                                                            style={{
                                                                fontSize: 14,
                                                                fontWeight: "500",
                                                                color: Colors[theme].disabled,
                                                                marginTop: 2,
                                                            }}
                                                        >
                                                            {item.card.rarity}
                                                        </ThemedText>
                                                    </View>
                                                </View>
                                            </TouchableOpacity>
                                            {item.content && item.content?.startsWith("//**Reenviado**//") ? (
                                                <>
                                                    <ThemedText
                                                        style={{
                                                            position: "absolute",
                                                            top: -2,
                                                            left: 10,
                                                            fontSize: 12,
                                                            color: Colors[theme].tabIconDefault,
                                                            fontStyle: "italic",
                                                            opacity: 0.8,
                                                        }}
                                                    >
                                                        {t("forwarded")}
                                                    </ThemedText>
                                                    <ThemedText
                                                        style={{
                                                            marginTop: 18,
                                                            color:
                                                                item.sender_id === session?.user.id
                                                                    ? Colors[theme].ownMessageText
                                                                    : Colors[theme].receivedMessageText,
                                                            fontSize: 15,
                                                            minWidth: 60,
                                                        }}
                                                    >
                                                        {item.content.replace(/^\/\/\*\*Reenviado\*\*\/\/\s?/, "")}
                                                    </ThemedText>
                                                </>
                                            ) : (
                                                <ThemedText
                                                    style={{
                                                        color:
                                                            item.sender_id === session?.user.id
                                                                ? Colors[theme].ownMessageText
                                                                : Colors[theme].receivedMessageText,
                                                        fontSize: 15,
                                                    }}
                                                >
                                                    {item.content}
                                                </ThemedText>
                                            )}
                                        </View>
                                    </TouchableOpacity>
                                );
                            }
                            if (item.type === "collection" && item.collection) {
                                if (item.content === "//**Eliminado**//") {
                                    return renderDeletedMessage(item);
                                }
                                const isMine = item.sender_id === session?.user.id;
                                const isSelected = selectedMessageIds.includes(item.id);
                                const iconName = item.collection.type === "collection" ? "bookmark" : "heart";
                                const iconColor =
                                    item.collection.type === "collection" ? Colors[theme].info : Colors[theme].success;
                                return (
                                    <TouchableOpacity
                                        onLongPress={() => {
                                            Vibration.vibrate(10); // Vibración corta al mantener pulsado
                                            if (!isSelected) setSelectedMessageIds((prev) => [...prev, item.id]);
                                        }}
                                        onPress={() => {
                                            if (selectedMessageIds.length > 0) {
                                                if (isSelected) {
                                                    setSelectedMessageIds((prev) =>
                                                        prev.filter((id) => id !== item.id)
                                                    );
                                                } else {
                                                    setSelectedMessageIds((prev) => [...prev, item.id]);
                                                }
                                            } else {
                                                const modalRefObj = getModalizeRef(modalizeRef);
                                                if (modalRefObj && modalRefObj.close) modalRefObj.close();
                                                setTimeout(() => {
                                                    router.push({
                                                        pathname: "/(tabs)/collection/[collectionId]",
                                                        params: {
                                                            collectionId: item.collection.id,
                                                            collectionName: item.collection.name,
                                                        },
                                                    });
                                                }, 200);
                                            }
                                        }}
                                        activeOpacity={0.8}
                                        style={{ position: "relative" }}
                                    >
                                        {isSelected && (
                                            <View
                                                style={{
                                                    position: "absolute",
                                                    left: -6,
                                                    right: -6,
                                                    top: 0,
                                                    bottom: 0,
                                                    borderRadius: 12,
                                                    backgroundColor: Colors[theme].highlight + "33",
                                                    zIndex: 1,
                                                }}
                                            />
                                        )}
                                        <View
                                            style={[
                                                styles.messageRow,
                                                {
                                                    backgroundColor: isMine
                                                        ? Colors[theme].ownMessageBackground
                                                        : Colors[theme].receivedMessageBackground,
                                                    alignSelf: isMine ? "flex-end" : "flex-start",
                                                    minWidth: 220,
                                                    maxWidth: 320,
                                                    borderRightWidth: isMine ? 4 : 0,
                                                    borderLeftWidth: !isMine ? 4 : 0,
                                                    borderRightColor: isMine ? iconColor + "80" : undefined,
                                                    borderLeftColor: !isMine ? iconColor + "80" : undefined,
                                                    paddingTop: 15,
                                                },
                                            ]}
                                        >
                                            <TouchableOpacity
                                                activeOpacity={0.8}
                                                onPress={() => {
                                                    const modalRefObj = getModalizeRef(modalizeRef);
                                                    if (modalRefObj && modalRefObj.close) {
                                                        modalRefObj.close();
                                                    }
                                                    setTimeout(() => {
                                                        router.push({
                                                            pathname: "/(tabs)/collection/[collectionId]",
                                                            params: {
                                                                collectionId: item.collection.id,
                                                                collectionName: item.collection.name,
                                                            },
                                                        });
                                                    }, 200);
                                                }}
                                                style={{ flexDirection: "column", gap: 0 }}
                                            >
                                                <View
                                                    style={{
                                                        flexDirection: "row",
                                                        alignItems: "center",
                                                        gap: 5,
                                                        marginBottom: 2,
                                                    }}
                                                >
                                                    <Ionicons name={iconName} size={22} color={iconColor} />
                                                    <ThemedText
                                                        style={{
                                                            fontWeight: "bold",
                                                            color: Colors[theme].text,
                                                            fontSize: 17,
                                                        }}
                                                    >
                                                        {item.collection.name}
                                                    </ThemedText>
                                                </View>
                                                <ThemedText
                                                    style={{
                                                        color: Colors[theme].tabIconDefault + "BB",
                                                        fontSize: 15,
                                                        marginBottom: 2,
                                                        alignSelf: "flex-end",
                                                    }}
                                                >
                                                    {item.collection.description}
                                                </ThemedText>
                                                <ThemedText
                                                    style={{
                                                        color: Colors[theme].tint,
                                                        fontSize: 14,
                                                        fontWeight: "bold",
                                                        alignSelf: "flex-end",
                                                    }}
                                                >
                                                    {t("cards")}:{" "}
                                                    {Array.isArray(item.collection.cards)
                                                        ? item.collection.cards.length
                                                        : 0}
                                                </ThemedText>
                                                {item.content && item.content?.startsWith("//**Reenviado**//") ? (
                                                    <>
                                                        <ThemedText
                                                            style={{
                                                                position: "absolute",
                                                                top: -19,
                                                                left: 0,
                                                                fontSize: 12,
                                                                color: Colors[theme].tabIconDefault,
                                                                fontStyle: "italic",
                                                                opacity: 0.8,
                                                            }}
                                                        >
                                                            {t("forwarded")}
                                                        </ThemedText>
                                                        <ThemedText
                                                            style={{
                                                                marginTop: 18,
                                                                color:
                                                                    item.sender_id === session?.user.id
                                                                        ? Colors[theme].ownMessageText
                                                                        : Colors[theme].receivedMessageText,
                                                                fontSize: 15,
                                                                minWidth: 60,
                                                            }}
                                                        >
                                                            {item.content.replace(/^\/\/\*\*Reenviado\*\*\/\/\s?/, "")}
                                                        </ThemedText>
                                                    </>
                                                ) : (
                                                    <ThemedText
                                                        style={{
                                                            color:
                                                                item.sender_id === session?.user.id
                                                                    ? Colors[theme].ownMessageText
                                                                    : Colors[theme].receivedMessageText,
                                                            fontSize: 15,
                                                        }}
                                                    >
                                                        {item.content}
                                                    </ThemedText>
                                                )}
                                            </TouchableOpacity>
                                        </View>
                                    </TouchableOpacity>
                                );
                            }

                            // Mensaje normal
                            const isSelected = selectedMessageIds.includes(item.id);
                            if (item.content === "//**Eliminado**//") {
                                return renderDeletedMessage(item);
                            }

                            return (
                                <TouchableOpacity
                                    onLongPress={() => {
                                        Vibration.vibrate(10); // Vibración corta al mantener pulsado
                                        if (!isSelected) setSelectedMessageIds((prev) => [...prev, item.id]);
                                    }}
                                    onPress={() => {
                                        if (isSelected) {
                                            setSelectedMessageIds((prev) => prev.filter((id) => id !== item.id));
                                        } else if (selectedMessageIds.length > 0) {
                                            setSelectedMessageIds((prev) => [...prev, item.id]);
                                        } else {
                                            // Si no hay ninguno seleccionado, deselecciona todo
                                            setSelectedMessageIds([]);
                                        }
                                    }}
                                    activeOpacity={0.8}
                                    style={{ position: "relative" }}
                                >
                                    {isSelected && (
                                        <View
                                            style={{
                                                position: "absolute",
                                                left: -6,
                                                right: -6,
                                                top: 0,
                                                bottom: 0,
                                                borderRadius: 12,
                                                backgroundColor: Colors[theme].highlight + "33",
                                                zIndex: 1,
                                            }}
                                        />
                                    )}
                                    <View
                                        style={[
                                            styles.messageRow,
                                            {
                                                alignSelf:
                                                    item.sender_id === session?.user.id ? "flex-end" : "flex-start",
                                                backgroundColor:
                                                    item.sender_id === session?.user.id
                                                        ? Colors[theme].ownMessageBackground
                                                        : Colors[theme].receivedMessageBackground,
                                            },
                                        ]}
                                    >
                                        {item.content?.startsWith("//**Reenviado**//") ? (
                                            <>
                                                <ThemedText
                                                    style={{
                                                        position: "absolute",
                                                        top: 6,
                                                        left: 10,
                                                        fontSize: 12,
                                                        color: Colors[theme].tabIconDefault,
                                                        fontStyle: "italic",
                                                        opacity: 0.8,
                                                    }}
                                                >
                                                    {t("forwarded")}
                                                </ThemedText>
                                                <ThemedText
                                                    style={{
                                                        marginTop: 18,
                                                        color:
                                                            item.sender_id === session?.user.id
                                                                ? Colors[theme].ownMessageText
                                                                : Colors[theme].receivedMessageText,
                                                        fontSize: 15,
                                                        minWidth: 60,
                                                    }}
                                                >
                                                    {item.content.replace(/^\/\/\*\*Reenviado\*\*\/\/\s?/, "")}
                                                </ThemedText>
                                            </>
                                        ) : (
                                            <ThemedText
                                                style={{
                                                    color:
                                                        item.sender_id === session?.user.id
                                                            ? Colors[theme].ownMessageText
                                                            : Colors[theme].receivedMessageText,
                                                    fontSize: 15,
                                                }}
                                            >
                                                {item.content}
                                            </ThemedText>
                                        )}
                                    </View>
                                </TouchableOpacity>
                            );
                        },
                        contentContainerStyle: {
                            paddingHorizontal: 12,
                            paddingBottom: 16,
                            paddingTop: 8,
                        },
                        ListEmptyComponent:
                            !messagesLoading && (!messages || messages.length === 0) ? (
                                <View
                                    style={{
                                        flex: 1,
                                        alignItems: "center",
                                        justifyContent: "center",
                                        paddingVertical: 60,
                                    }}
                                >
                                    <Ionicons
                                        name="skull"
                                        size={48}
                                        color={Colors[theme].tint}
                                        style={{ marginBottom: 12 }}
                                    />
                                    <ThemedText
                                        style={{
                                            color: Colors[theme].text,
                                            fontWeight: "bold",
                                            fontSize: 18,
                                            textAlign: "center",
                                            marginBottom: 6,
                                        }}
                                    >
                                        {t("¡Todavía no hay mensajes en esta aventura!")}
                                    </ThemedText>
                                    <ThemedText
                                        style={{
                                            color: Colors[theme].text + "80",
                                            fontSize: 15,
                                            textAlign: "center",
                                            maxWidth: 260,
                                        }}
                                    >
                                        {t("Envía el primer mensaje y comienza tu viaje pirata.")}
                                    </ThemedText>
                                </View>
                            ) : null,
                        keyboardShouldPersistTaps: "handled",
                        scrollEnabled: true,
                        inverted: true,
                    }}
                />
                <DeckSelectModal
                    visible={showDeckSelectModal}
                    onClose={() => setShowDeckSelectModal(false)}
                    userDecks={userDecks}
                    loadingDecks={loadingDecks}
                    selectedDeck={selectedDeck}
                    setSelectedDeck={setSelectedDeck}
                    deckMessageInput={deckMessageInput}
                    setDeckMessageInput={setDeckMessageInput}
                    handleSendDeckMessage={handleSendDeckMessage}
                    theme={theme}
                    t={t}
                />
                <CollectionSelectModal
                    visible={showCollectionSelectModal}
                    onClose={() => setShowCollectionSelectModal(false)}
                    userCollections={userCollections}
                    loadingCollections={loadingCollections}
                    selectedCollection={selectedCollection}
                    setSelectedCollection={setSelectedCollection}
                    collectionMessageInput={collectionMessageInput}
                    setCollectionMessageInput={setCollectionMessageInput}
                    handleSendCollectionMessage={handleSendCollectionMessage}
                    theme={theme}
                    t={t}
                />
            </>
        );
    }

    // Para chats/search:
    return (
        <Modalize
            ref={modalizeRef}
            adjustToContentHeight={false}
            modalHeight={600}
            disableScrollIfPossible={true}
            modalStyle={{ backgroundColor: Colors[theme].TabBarBackground }}
            onOpen={handleModalOpen}
            onClose={() => setView("chats")}
            keyboardAvoidingBehavior="padding"
            keyboardAvoidingOffset={80}
            panGestureEnabled={false}
            closeOnOverlayTap={true}
            HeaderComponent={view === "chats" ? ChatsHeader : view === "search" ? SearchHeader : null}
            FooterComponent={null}
        >
            {view === "chats" && <View style={{ flex: 1, minHeight: 600 }}>{renderChats()}</View>}
            {view === "search" && <View style={{ flex: 1, minHeight: 600 }}>{renderSearch()}</View>}
        </Modalize>
    );
});

const styles = StyleSheet.create({
    container: {
        padding: 10,
        paddingTop: 0,
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
        padding: 20,
        paddingBottom: 10,
    },
    headerRowChats: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 10,
        padding: 20,
        paddingBottom: 10,
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
        marginLeft: 4,
    },
    userCard: {
        flexDirection: "row",
        alignItems: "center",
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
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 5,
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
